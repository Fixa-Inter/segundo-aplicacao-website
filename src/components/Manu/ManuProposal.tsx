import type { ManuChatController } from '../../hooks/useManuChat'
import styles from './Manu.module.css'

export function ManuProposal({ chat }: { chat: ManuChatController }) {
  const { t, correcting, setCorrecting, correction, setCorrection, busy, send } = chat
  return (
    <>
      <div className={styles.proposalActions}>
        <p>{t('Você confirma as informações acima?')}</p>
        <div className={styles.decisionButtons}>
          <button
            type="button"
            disabled={busy}
            aria-expanded={correcting}
            onClick={() => setCorrecting(true)}
          >
            {t('Não')}
          </button>
          <button
            type="button"
            className={styles.acceptProposal}
            disabled={busy || correcting}
            onClick={() => void send('sim', 'confirmation')}
          >
            {t('Sim')}
          </button>
        </div>
        {correcting && (
          <form
            className={styles.correction}
            onSubmit={(event) => {
              event.preventDefault()
              if (correction.trim())
                void send(
                  `Antes de confirmar, corrija as seguintes informações: ${correction.trim()}`,
                  'correction',
                )
            }}
          >
            <label htmlFor="manu-correction">{t('O que precisa ser corrigido?')}</label>
            <textarea
              id="manu-correction"
              value={correction}
              maxLength={3900}
              disabled={busy}
              onChange={(event) => setCorrection(event.target.value)}
              placeholder={t('Indique a informação incorreta e como ela deve ficar.')}
            />
            <div className={styles.decisionButtons}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setCorrecting(false)
                  setCorrection('')
                }}
              >
                {t('Voltar à proposta')}
              </button>
              <button
                type="submit"
                className={styles.acceptProposal}
                disabled={busy || !correction.trim()}
              >
                {t('Enviar correção')}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
