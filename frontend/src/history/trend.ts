// Trend maths for the History screen. Pure, so it's unit-tested.
import type { HistoryItem } from '../api/client'

/** Same noise band as the server's score. Keep equal to NOISE_THRESHOLD in backend/scoring/score.py. */
export const NOISE_THRESHOLD = 0.02

export type ChangeStatus = 'increased' | 'decreased' | 'no_clear_change'

export interface SinceLast {
  previous: HistoryItem
  latest: HistoryItem
  /** Fractional change, e.g. 0.031 for +3.1%. */
  change: number
  status: ChangeStatus
}

/** Check-ins that count for trends: everything except flagged photos, oldest first. */
export function scoredItems(measurements: HistoryItem[]): HistoryItem[] {
  return measurements.filter((item) => item.score.status !== 'flagged')
}

/** Change between the last two scored check-ins, or null if there are fewer than two. */
export function changeSinceLast(measurements: HistoryItem[]): SinceLast | null {
  const scored = scoredItems(measurements)
  if (scored.length < 2) return null
  const previous = scored[scored.length - 2]
  const latest = scored[scored.length - 1]
  const change = (latest.shoulderToWaist - previous.shoulderToWaist) / previous.shoulderToWaist
  const status: ChangeStatus =
    Math.abs(change) < NOISE_THRESHOLD ? 'no_clear_change' : change > 0 ? 'increased' : 'decreased'
  return { previous, latest, change, status }
}

/** "+3.1%" or "-2.4%", rounded for reading only. */
export function formatPercent(change: number): string {
  const percent = change * 100
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`
}

/** Headline for the change, in the same neutral words as the score. */
export function sinceLastHeadline(since: SinceLast): string {
  return since.status === 'no_clear_change'
    ? `No clear change (${formatPercent(since.change)})`
    : formatPercent(since.change)
}
