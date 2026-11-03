import { Eye } from 'lucide-react'
import { FigmaIcon } from '../FigmaIcon'
import { usePreferences } from '../../contexts/usePreferences'
import type { InstitutionTableProps } from '../../types/institution'
import { locationTypes } from '../../utils/institution'
import common from '../../pages/management.module.css'
import tableStyles from '../../pages/Team/Team.module.css'
import styles from '../../pages/Institution/Institution.module.css'

export function InstitutionTable({
  entries,
  units,
  local,
  onDetails,
  onEdit,
}: InstitutionTableProps) {
  const { t } = usePreferences()
  const showUnits = units.length > 1
  return (
    <div className={common.tableWrap}>
      <table className={common.table}>
        <thead>
          <tr>
            <th scope="col">{t('Nome')}</th>
            {showUnits && <th scope="col">{t('Unidade')}</th>}
            <th scope="col">{t(local ? 'Tipo de local' : 'Horário')}</th>
            <th scope="col">{t('Situação')}</th>
            <th scope="col">{t('Ações')}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((item) => (
            <tr key={item.id}>
              <td data-label={t('Nome')}>
                <span className={styles.entryName}>{item.name}</span>
              </td>
              {showUnits && (
                <td data-label={t('Unidade')}>
                  {units.find((unit) => unit.id === item.unitId)?.name}
                </td>
              )}
              <td data-label={t(local ? 'Tipo de local' : 'Horário')}>
                {local ? (
                  t(
                    locationTypes.find((type) => type.value === item.locationType)?.label ??
                      'Não informado',
                  )
                ) : (
                  <>
                    {item.startTime} – {item.endTime}
                    {item.endTime && item.startTime && item.endTime < item.startTime && (
                      <small className={styles.nextDay}>{t('Término no dia seguinte')}</small>
                    )}
                  </>
                )}
              </td>
              <td data-label={t('Situação')}>{t(item.active ? 'Ativo' : 'Inativo')}</td>
              <td data-label={t('Ações')}>
                <div className={common.actions}>
                  <button
                    className={tableStyles.iconButton}
                    type="button"
                    aria-label={t('Ver detalhes de {name}', { name: item.name })}
                    onClick={() => onDetails(item)}
                  >
                    <Eye aria-hidden="true" />
                  </button>
                  <button
                    className={tableStyles.iconButton}
                    type="button"
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
