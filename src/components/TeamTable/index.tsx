import { Eye } from 'lucide-react'
import { FigmaIcon } from '../FigmaIcon'
import { usePreferences } from '../../contexts/usePreferences'
import type { TeamTableProps } from '../../types/ui'
import { truncateText } from '../../utils/presentation'
import common from '../../pages/management.module.css'
import styles from '../../pages/Team/Team.module.css'

export function TeamTable({
  members,
  institutional,
  technical,
  onDetails,
  onEdit,
}: TeamTableProps) {
  const { t } = usePreferences()
  return (
    <div className={common.tableWrap}>
      <table className={common.table}>
        <thead>
          <tr>
            <th>{t('Nome')}</th>
            {institutional && <th>{t('Unidade')}</th>}
            {technical && <th>{t('Turno')}</th>}
            {technical && <th>{t('Especialidade')}</th>}
            <th>{t('Ações')}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((item) => (
            <tr key={item.id}>
              <td data-label={t('Nome')}>
                <div className={styles.member}>
                  <span className={styles.initials} aria-hidden="true">
                    {item.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <span className={styles.memberText}>
                    <span className={styles.memberName} title={item.name}>
                      <span aria-hidden="true">{truncateText(item.name, 40)}</span>
                      <span className={styles.srOnly}>{item.name}</span>
                    </span>
                    <small>
                      {institutional && (
                        <>{t(item.accessType === 'TÉCNICO' ? 'Técnico' : 'Gestor')} · </>
                      )}
                      {t(item.status)}
                    </small>
                  </span>
                </div>
              </td>
              {institutional && (
                <td data-label={t('Unidade')} title={item.unitName}>
                  {truncateText(item.unitName || t('Não informado'), 28)}
                </td>
              )}
              {technical && (
                <>
                  <td data-label={t('Turno')}>{item.shift || t('Não informado')}</td>
                  <td data-label={t('Especialidade')}>
                    {t(item.assessedSpecialty ?? 'Sem notas')}
                  </td>
                </>
              )}
              <td data-label={t('Ações')}>
                <div className={common.actions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    id={`tech-details-${item.id}`}
                    aria-label={t('Ver detalhes de {name}', { name: item.name })}
                    onClick={() => onDetails(item)}
                  >
                    <Eye aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    id={`team-edit-${item.id}`}
                    aria-label={t('Editar {name}', { name: item.name })}
                    onClick={() => onEdit(item)}
                  >
                    <FigmaIcon name="edit" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
