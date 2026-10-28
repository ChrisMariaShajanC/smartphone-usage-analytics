export type { UsageRecord } from './api'

export const ageGroup = (age: number) => {
  if (age < 18) return '12-17'
  if (age < 25) return '18-24'
  if (age < 35) return '25-34'
  if (age < 45) return '35-44'
  if (age < 55) return '45-54'
  return '55+'
}

export const mean = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

export const correlation = (a: number[], b: number[]) => {
  if (a.length < 2 || a.length !== b.length) return 0
  const ma = mean(a)
  const mb = mean(b)
  const numerator = a.reduce((sum, value, index) => sum + (value - ma) * (b[index] - mb), 0)
  const denominator = Math.sqrt(
    a.reduce((sum, value) => sum + (value - ma) ** 2, 0) *
      b.reduce((sum, value) => sum + (value - mb) ** 2, 0),
  )
  return denominator ? numerator / denominator : 0
}

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export const quantile = (values: number[], q: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base]
}
