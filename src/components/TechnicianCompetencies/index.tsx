import { Modal } from '@mantine/core'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { usePreferences } from '../../contexts/usePreferences'
import { useUnsavedForm } from '../../contexts/useUnsavedChanges'
import { useTechnicianCompetencies } from '../../hooks/useTechnicianCompetencies'
import type {
  CompetencyEditor,
  TechnicianCompetenciesProps,
  TechnicianCompetency,
} from '../../types/competency'
import { parseCompetencyRating } from '../../utils/competencies'
import { FigmaIcon } from '../FigmaIcon'
import styles from './TechnicianCompetencies.module.css'

export function TechnicianCompetencies({
  technicianId,
  technicianName,
}: TechnicianCompetenciesProps) {
  const { t, formatNumber } = usePreferences()
  const { items, loading, error, saving, retry, save } = useTechnicianCompetencies(technicianId)
  const [expanded, setExpanded] = useState(false)
  const [editor, setEditor] = useState<CompetencyEditor | null>(null)
  const [notice, setNotice] = useState('')
  const mounted = useRef(true)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const moreRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const original = editor?.competency.rating === null ? '' : String(editor?.competency.rating ?? '')
  const dirty = editor !== null && editor.value !== original
  const requestExit = useUnsavedForm(dirty, saving)
  const close = () => requestExit(() => setEditor(null))
  const ranked = [...items].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.id - b.id)
  const assessed = items.filter((item) => item.rating !== null).length
  const rating = (value: number | null) => (value === null ? '—' : formatNumber(value))

  function edit(competency: TechnicianCompetency, trigger: HTMLButtonElement) {
    triggerRef.current = trigger
    setNotice('')
    setEditor({
      competency,
      value: competency.rating === null ? '' : String(competency.rating),
      error: '',
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor || saving || !dirty) return
    const value = parseCompetencyRating(editor.value)
    if (value === undefined) {
      setEditor({ ...editor, error: 'Informe uma nota inteira de 0 a 10.' })
      event.currentTarget.querySelector<HTMLInputElement>('#competency-new')?.focus()
      return
    }
    try {
      await save({ competencyId: editor.competency.id, rating: value })
      if (mounted.current) {
        setEditor(null)
        setNotice(value === null ? 'Avaliação removida.' : 'Competência atualizada.')
      }
    } catch (reason) {
      if (mounted.current)
        setEditor((current) =>
          current
            ? {
                ...current,
                error:
                  reason instanceof Error
                    ? reason.message
                    : 'Não foi possível salvar a competência.',
              }
            : current,
        )
    }
  }

  return (
    <section className={styles.section} aria-labelledby="competencies-title">
      <div className={styles.header}>
        <div>
          <h2 id="competencies-title">{t('Competências')}</h2>
          <p>{t('{count} de 10 avaliadas', { count: formatNumber(assessed) })}</p>
        </div>
        {!loading && !error && (
          <button
            ref={moreRef}
            type="button"
            className={styles.more}
            aria-expanded={expanded}
            aria-controls="competencies-list"
            onClick={() => setExpanded((value) => !value)}
          >
            {t(expanded ? 'Ver resumo' : 'Ver todas')}
            <FigmaIcon name={expanded ? 'chevron-left' : 'chevron-right'} />
          </button>
        )}
      </div>
      {loading ? (
        <p role="status">{t('Carregando competências…')}</p>
      ) : error ? (
        <div role="alert">
          <p>{t(error)}</p>
          <button className={styles.more} type="button" onClick={retry}>
            {t('Tentar novamente')}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            {ranked.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(event) => edit(item, event.currentTarget)}
                className={styles.card}
                aria-label={t('Editar competência {name}', { name: t(item.name) })}
              >
                <span>{t(item.name)}</span>
                <strong>
                  {rating(item.rating)}
                  <small>/10</small>
                </strong>
                <span className={styles.cardFooter}>
                  {t(item.rating === null ? 'Sem avaliação' : 'Editar nota')}
                  <FigmaIcon name="edit" />
                </span>
              </button>
            ))}
          </div>
          <ul id="competencies-list" className={styles.list} hidden={!expanded}>
            {ranked.map((item) => (
              <li key={item.id}>
                <div>
                  <span className={styles.category}>{t(item.name)}</span>
                  <span className={styles.status}>
                    {t(item.rating === null ? 'Sem avaliação' : 'Nota atribuída')}
                  </span>
                </div>
                <strong>
                  {rating(item.rating)}
                  <small>/10</small>
                </strong>
                <button
                  type="button"
                  onClick={(event) => edit(item, event.currentTarget)}
                  className={styles.edit}
                  aria-label={t('Editar competência {name}', { name: t(item.name) })}
                >
                  <FigmaIcon name="edit" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {t(notice)}
        </p>
      )}
      <Modal.Root
        opened={editor !== null}
        onClose={close}
        centered
        size={420}
        radius={26}
        padding={28}
        closeOnEscape={!saving}
        closeOnClickOutside={!saving}
        returnFocus
        onExitTransitionEnd={() => {
          const target = triggerRef.current?.isConnected ? triggerRef.current : moreRef.current
          target?.focus()
        }}
      >
        <Modal.Overlay backgroundOpacity={0.35} />
        <Modal.Content classNames={{ content: styles.modal }}>
          <Modal.Body>
            <form onSubmit={submit} noValidate aria-busy={saving} className={styles.form}>
              <Modal.Title className={styles.title}>
                {t(editor?.competency.name ?? 'Competências')}
              </Modal.Title>
              <p className={styles.technician}>{technicianName}</p>
              <div className={styles.row}>
                <label htmlFor="competency-old">{t('Valor antigo')}</label>
                <output id="competency-old">{rating(editor?.competency.rating ?? null)}</output>
              </div>
              <div className={styles.row}>
                <label htmlFor="competency-new">{t('Novo valor')}</label>
                <input
                  id="competency-new"
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  inputMode="numeric"
                  data-autofocus
                  value={editor?.value ?? ''}
                  disabled={saving}
                  aria-invalid={Boolean(editor?.error)}
                  aria-describedby={
                    editor?.error ? 'competency-error competency-help' : 'competency-help'
                  }
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setEditor((current) => (current ? { ...current, value, error: '' } : current))
                  }}
                />
              </div>
              <p id="competency-help" className={styles.help}>
                {t('Use uma nota inteira de 0 a 10. Deixe em branco para remover a avaliação.')}
              </p>
              {editor?.error && (
                <p id="competency-error" className={styles.error} role="alert">
                  {t(editor.error)}
                </p>
              )}
              <div className={styles.actions}>
                <button type="button" onClick={close} disabled={saving}>
                  {t('Cancelar')}
                </button>
                <button type="submit" disabled={saving || !dirty}>
                  {t(saving ? 'Salvando…' : 'Salvar')}
                </button>
              </div>
            </form>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </section>
  )
}
