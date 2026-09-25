import type { AuthFieldProps } from '../../types/ui'
import styles from './AuthField.module.css'
export function AuthField({
  label,
  error,
  trailing,
  id,
  className = '',
  ...props
}: AuthFieldProps) {
  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.control}>
        <input
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {trailing}
      </div>
      {error && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
