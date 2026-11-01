import { useEffect, useId, useRef } from 'react'
import type { ManuViewProps } from '../../../types/manuComponents'
import styles from '../Manu.module.css'

export function ManuProposal({ chat }: ManuViewProps) {
  const { t, correcting, setCorrecting, correction, setCorrection, busy, send } = chat
  const correctionId = useId()
  const correctionField = useRef<HTMLTextAreaElement>(null)
  const rejectButton = useRef<HTMLButtonElement>(null)
  const wasCorrecting = useRef(false)
  useEffect(() => {
    if (correcting) correctionField.current?.focus()
    else if (wasCorrecting.current) rejectButton.current?.focus()
    wasCorrecting.current = correcting
  }, [correcting])
  return (
    <>
      <div className={styles.proposalActions}>
        <p>{t('Você confirma as informações acima?')}</p>
        <div className={styles.decisionButtons}>
          <button
            type="button"
            disabled={busy}
            ref={rejectButton}
            aria-expanded={correcting}
            aria-controls={correctionId}
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
            id={correctionId}
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
              ref={correctionField}
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
