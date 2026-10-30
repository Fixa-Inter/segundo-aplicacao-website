export class PartialSaveError extends Error {
  resourceId: string
  constructor(id: string, cause: unknown) {
    super(
      `O cadastro ${id} foi salvo, mas parte das alterações não foi concluída. Tente salvar novamente para completar. ${cause instanceof Error ? cause.message : ''}`,
    )
    this.resourceId = id
  }
}
