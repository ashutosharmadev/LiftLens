// Display helpers for the History screen. All scoring (percent changes, the
// noise rule) happens on the server; these only select and format its results.
import type { HistoryItem, Score } from '../api/client'

/** Check-ins that count for trends: everything except flagged photos, oldest first. */
export function scoredItems(measurements: HistoryItem[]): HistoryItem[] {
  return measurements.filter((item) => item.score.status !== 'flagged')
}

/** The most recent check-in's change since the previous one, as scored by the server. */
export function latestSinceLast(measurements: HistoryItem[]): { item: HistoryItem; since: Score } | null {
  const latest = scoredItems(measurements).at(-1)
  return latest?.sinceLast ? { item: latest, since: latest.sinceLast } : null
}

/** "+3.1%" or "-2.4%" from a percent value, rounded for reading only. */
export function formatPercent(percent: number): string {
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`
}

/** Headline for a change score, in the same neutral words as its explanation. */
export function changeHeadline(score: Score): string {
  return score.status === 'no_clear_change' ? `No clear change (${formatPercent(score.value)})` : formatPercent(score.value)
}
