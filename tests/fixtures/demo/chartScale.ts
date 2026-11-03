export function chartScale(maximum: number, integers = false) {
  if (!Number.isFinite(maximum) || maximum < 0) {
    throw new Error('O limite do gráfico deve ser finito e não negativo.')
  }
  const rawStep = (maximum || 1) / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const factor = [1, 2, 2.5, 5, 10].find((value) => value >= rawStep / magnitude) ?? 10
  const step = integers ? Math.max(1, Math.ceil(factor * magnitude)) : factor * magnitude
  const count = Math.max(1, Math.ceil(maximum / step))
  const ticks = Array.from({ length: count + 1 }, (_, index) =>
    Number((index * step).toPrecision(12)),
  )
  return { ticks, max: ticks[ticks.length - 1] }
}
