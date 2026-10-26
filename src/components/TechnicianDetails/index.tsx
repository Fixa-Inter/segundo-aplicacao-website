import { FigmaIcon } from '../FigmaIcon'
import { TechnicianCompetencies } from '../TechnicianCompetencies'
import { TechnicianPerformance } from '../TechnicianPerformance'
import { useUnsavedChanges } from '../../contexts/useUnsavedChanges'
import { usePreferences } from '../../contexts/usePreferences'
import { useAuth } from '../../contexts/useAuth'
import { useEffect, useRef } from 'react'
import type { TechnicianDetailsProps } from '../../types/ui'
import { BadgeCheck, Clock3, ShieldUser, BriefcaseBusiness } from 'lucide-react'
import { InformationItem } from '../InformationItem'
import { formatAddress, truncateText } from '../../utils/presentation'
import styles from './TechnicianDetails.module.css'

export function TechnicianDetails({ technician, onBack, onEdit }: TechnicianDetailsProps) {
  const { t, formatDate } = usePreferences()
  const { user } = useAuth()
  const { requestExit } = useUnsavedChanges()

  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])
  const address = formatAddress(technician)
  const technical = technician.accessType === 'TÉCNICO'
  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.back}
        onClick={() => requestExit(onBack)}
        aria-label={t('Voltar para equipe')}
      >
        <FigmaIcon name="back" />
      </button>
      <div className={styles.identity}>
        <span className={styles.avatar} aria-hidden="true">
          {technician.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')}
        </span>
        <div className={styles.identityText}>
          <h1 ref={headingRef} tabIndex={-1} title={technician.name} aria-label={technician.name}>
            {truncateText(technician.name)}
          </h1>
          <p>
            {technical ? (
              <>
                {t('Técnico ·')} {t(technician.assessedSpecialty ?? 'Sem notas')}
              </>
            ) : (
              t('Gestor')
            )}
          </p>
        </div>
        {onEdit && (
          <button type="button" className={styles.edit} onClick={() => requestExit(onEdit)}>
            {t('Editar técnico')}
          </button>
        )}
      </div>
      <section
        className={styles.information}
        aria-label={t(technical ? 'Informações do técnico' : 'Informações do gestor')}
      >
        <h2>{t('Informações')}</h2>
        <div>
          <InformationItem
            icon={<FigmaIcon name="mail" />}
            label={t('E-mail')}
            value={technician.email || t('Não informado')}
          />
          <InformationItem
            icon={<FigmaIcon name="profile-calendar" />}
            label={t('Data de nascimento')}
            value={
              technician.birthDate
                ? formatDate(technician.birthDate, { dateStyle: 'long' })
                : t('Não informado')
            }
          />
          <InformationItem
            icon={<FigmaIcon name="location" />}
            label={t('Localização')}
            value={
              address ||
              technician.unitName ||
              (user?.role === 'GESTOR'
                ? t('Unidade do CNPJ {cnpj}', { cnpj: user.cnpj })
                : t('Não informado'))
            }
          />
          <InformationItem
            icon={<BriefcaseBusiness />}
            label={t('Função')}
            value={technician.jobTitle || t('Não informado')}
          />
          <InformationItem
            icon={<ShieldUser />}
            label={t('Cargo')}
            value={t(technical ? 'Técnico' : 'Gestor')}
          />
          {technician.unitName && address && (
            <InformationItem
              icon={<FigmaIcon name="location" />}
              label={t('Unidade')}
              value={technician.unitName}
            />
          )}
          {technical && (
            <InformationItem
              icon={<Clock3 />}
              label={t('Turno')}
              value={technician.shift || t('Não informado')}
            />
          )}
          <InformationItem
            icon={<BadgeCheck />}
            label={t('Situação')}
            value={t(technician.status)}
          />
        </div>
      </section>
      {technical && (
        <>
          <TechnicianCompetencies key={technician.id} technicianId={technician.id} />
          <TechnicianPerformance key={technician.id} name={technician.name} />
        </>
      )}
    </div>
  )
}
