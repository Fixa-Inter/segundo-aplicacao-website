export type RecoveryStep = 'email' | 'code' | 'password' | 'change' | 'success'
export interface RecoveryChallenge {
  email: string
  id: string
}
