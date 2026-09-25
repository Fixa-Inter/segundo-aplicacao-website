export type RecoveryStep = 'email' | 'code' | 'password' | 'success'
export interface RecoveryChallenge {
  email: string
  id: string
}
