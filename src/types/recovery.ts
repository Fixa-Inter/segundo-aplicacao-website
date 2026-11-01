export type RecoveryStep = 'email' | 'code' | 'password' | 'change' | 'success'
export interface RecoveryChallenge {
  email: string
  id: string
}

export interface RecoveryForm {
  email: string
  code: string
  password: string
  confirmation: string
  current: string
}

export type RecoveryErrors = Partial<Record<keyof RecoveryForm, string>>
