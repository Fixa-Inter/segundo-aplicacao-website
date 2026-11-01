import type { AddRecordButtonProps } from '../../types/ui'
import { FigmaIcon } from '../FigmaIcon'
import styles from './AddRecordButton.module.css'

export function AddRecordButton({ label, ref, className = '', ...props }: AddRecordButtonProps) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={styles.button + ' ' + className}
    >
      <FigmaIcon name="plus" />
      <span className={styles.label}>{label}</span>
    </button>
  )
}
