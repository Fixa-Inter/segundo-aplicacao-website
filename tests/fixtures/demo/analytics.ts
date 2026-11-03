export function summarizeHours(values: number[]) {
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('O tempo de atendimento deve ser finito e não negativo.')
  }
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  function quantile(part: number) {
    const position = (sorted.length - 1) * part
    const lower = Math.floor(position)
    const upper = Math.ceil(position)
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
  }
  return {
    min: sorted[0],
    q1: quantile(0.25),
    median: quantile(0.5),
    q3: quantile(0.75),
    max: sorted[sorted.length - 1],
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
  }
}

export function buildHistogram(values: number[]) {
  const summary = summarizeHours(values)
  if (!summary) return []
  const width = Math.max(1, Math.ceil(summary.max / 5))
  const bins = Array.from({ length: 5 }, (_, index) => ({
    from: index * width,
    to: (index + 1) * width,
    count: 0,
  }))
  for (const value of values) {
    bins[Math.min(4, Math.floor(value / width))].count += 1
  }
  return bins
}
