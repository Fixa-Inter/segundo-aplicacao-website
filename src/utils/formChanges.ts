export function hasFormChanges<T extends object>(current: T, initial: T): boolean {
  const keys = Object.keys({ ...initial, ...current }) as (keyof T)[]
  return keys.some((key) => {
    const value = current[key]
    const original = initial[key]
    // A ordem de seleção dos mesmos turnos não altera os dados do cadastro.
    if (Array.isArray(value) && Array.isArray(original)) {
      const selected = [...value].sort()
      const saved = [...original].sort()
      return (
        selected.length !== saved.length || selected.some((item, index) => item !== saved[index])
      )
    }
    return value !== original
  })
}
