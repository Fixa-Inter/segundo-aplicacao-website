import { ArrowUp, Paperclip, RotateCcw, X } from 'lucide-react'
import type { ManuViewProps } from '../../../types/manuComponents'
import styles from '../Manu.module.css'

export function ManuComposer({ chat }: ManuViewProps) {
  const {
    t,
    current,
    question,
    setQuestion,
    attachments,
    sending,
    closing,
    setError,
    fileInput,
    busy,
    pendingConfirmation,
    uploadAttachment,
    selectFiles,
    removeAttachment,
    send,
    configured,
    uploadConfigured,
  } = chat
  return (
    <>
      {!pendingConfirmation && (
        <form
          className={styles.composer}
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <label htmlFor="manu-question" className={styles.srOnly}>
            {t('Mensagem para a Manu')}
          </label>
          <textarea
            id="manu-question"
            maxLength={4000}
            disabled={busy || current?.closed || pendingConfirmation || !configured}
            placeholder={t(
              current?.closed
                ? 'Inicie uma nova conversa para continuar.'
                : 'Como posso te ajudar hoje?',
            )}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                void send()
              }
            }}
          />
          {!!attachments.length && (
            <ul className={styles.filePreviews}>
              {attachments.map((item) => (
                <li key={item.id}>
                  <img src={item.preview} alt="" width="64" height="64" />
                  <div>
                    <span>{item.file.name}</span>
                    <small role={item.status === 'error' ? 'alert' : 'status'}>
                      {t(
                        item.status === 'uploading'
                          ? 'Enviando imagem…'
                          : item.status === 'ready'
                            ? 'Imagem pronta'
                            : (item.error ?? 'Falha no envio'),
                      )}
                    </small>
                  </div>
                  {item.status === 'error' && (
                    <button
                      type="button"
                      aria-label={t('Tentar novamente')}
                      disabled={sending || closing}
                      onClick={() => void uploadAttachment(item)}
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={t('Remover imagem {number}', {
                      number: attachments.indexOf(item) + 1,
                    })}
                    disabled={sending || closing}
                    onClick={() => removeAttachment(item.id)}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.composerActions}>
            <input
              ref={fileInput}
              className={styles.fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={selectFiles}
            />
            <button
              type="button"
              aria-label={t('Anexar imagens')}
              disabled={
                busy ||
                current?.closed ||
                pendingConfirmation ||
                attachments.length >= 3 ||
                !configured
              }
              onClick={() => {
                if (!uploadConfigured)
                  setError(t('O envio de imagens está indisponível no momento.'))
                else fileInput.current?.click()
              }}
            >
              <Paperclip size={21} />
            </button>
            <small>{question.length}/4000</small>
            <button
              type="submit"
              className={styles.send}
              aria-label={t('Enviar mensagem')}
              disabled={
                busy ||
                !question.trim() ||
                current?.closed ||
                pendingConfirmation ||
                attachments.some((item) => item.status !== 'ready') ||
                !configured
              }
            >
              <ArrowUp size={22} />
            </button>
          </div>
        </form>
      )}
    </>
  )
}
