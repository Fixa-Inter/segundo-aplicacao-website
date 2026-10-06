import { Modal } from '@mantine/core'
import { useId } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import type { ConfirmDialogProps } from '../../types/ui'
import styles from './ConfirmDialog.module.css'

export function ConfirmDialog({
  opened,
  question,
  subject,
  confirmLabel,
  busy = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = usePreferences()
  const subjectId = useId()
  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered
      size={700}
      radius={50}
      padding={0}
      closeOnClickOutside={!busy}
      closeOnEscape={!busy}
    >
      <Modal.Overlay />
      <Modal.Content
        className={styles.content}
        aria-label={t(question)}
        aria-describedby={subject ? subjectId : undefined}
      >
        <Modal.Body>
          <div className={styles.body} aria-busy={busy}>
            <h2>{t(question)}</h2>
            {subject && (
              <p id={subjectId} className={styles.srOnly}>
                {subject}
              </p>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.cancel} disabled={busy} onClick={onClose}>
                {t('Cancelar')}
              </button>
              <button type="button" className={styles.confirm} disabled={busy} onClick={onConfirm}>
                {t(busy ? 'Excluindo…' : confirmLabel)}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
