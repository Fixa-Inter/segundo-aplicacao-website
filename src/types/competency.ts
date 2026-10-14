export type CompetencyId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface CompetencyDefinition {
  id: CompetencyId
  code: string
  name: string
}

export interface TechnicianCompetency extends CompetencyDefinition {
  rating: number | null
}

export interface CompetencyInput {
  competencyId: CompetencyId
  rating: number | null
}

export interface CompetenciesState {
  items: TechnicianCompetency[]
  loading: boolean
  error: string
  saving: boolean
}

export interface CompetenciesResult extends CompetenciesState {
  retry: () => void
  save: (input: CompetencyInput) => Promise<TechnicianCompetency>
}

export interface TechnicianCompetenciesProps {
  technicianId: string
  technicianName: string
}

export interface CompetencyEditor {
  competency: TechnicianCompetency
  value: string
  error: string
}
