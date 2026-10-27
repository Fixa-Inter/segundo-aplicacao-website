export function check(errors: object): void {
  const first = Object.values(errors)[0]
  if (first) throw new Error(String(first))
}
