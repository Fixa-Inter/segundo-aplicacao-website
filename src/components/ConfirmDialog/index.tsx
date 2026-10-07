import { Modal } from '@mantine/core'
import { useId } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import type { ConfirmDialogProps } from '../../types/ui'
import styles from './ConfirmDialog.module.css'
import deleteArt from '../../assets/figma/confirm-delete.png'
import saveArt from '../../assets/figma/confirm-save.png'
import logoutArt from '../../assets/figma/confirm-logout.png'

const variants = {
  delete: {
    art: deleteArt,
    question: 'Deseja deletar esse registro?',
    subtitle: 'Essa ação não poderá ser desfeita.',
  },
  save: {
    art: saveArt,
    question: 'Salvar alterações?',
    subtitle: 'Essa ação não poderá ser desfeita.',
  },
  logout: { art: logoutArt, question: 'Sair da conta?', subtitle: 'Você poderá entrar novamente' },
}

export function ConfirmDialog({
  opened,
  variant,
  subject,
  confirmLabel,
  busy = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = usePreferences()
  const subjectId = useId()
  const { art, question, subtitle } = variants[variant]
  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered
      size={400}
      radius={30}
      padding={0}
      closeOnClickOutside={!busy}
      closeOnEscape={!busy}
    >
      <Modal.Overlay backgroundOpacity={0.35} />
      <Modal.Content
        classNames={{ content: styles.content }}
        aria-label={t(question)}
        aria-describedby={subject ? subjectId : undefined}
      >
        <Modal.Body>
          <div className={styles.body} aria-busy={busy}>
            <img className={styles.art} src={art} width="240" height="240" alt="" />
            <h2>{t(question)}</h2>
            <p className={styles.subtitle}>{t(subtitle)}</p>
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
                {t(busy ? 'Aguarde…' : confirmLabel)}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
