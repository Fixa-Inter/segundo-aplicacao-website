export function hasFormChanges(
  current: Readonly<Record<string, string>>,
  initial: Readonly<Record<string, string>>,
): boolean {
  return Object.keys({ ...initial, ...current }).some((key) => current[key] !== initial[key])
}
