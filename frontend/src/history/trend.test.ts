import { describe, expect, it } from 'vitest'
import type { HistoryItem, ScoreStatus } from '../api/client'
import { changeSinceLast, formatPercent, scoredItems, sinceLastHeadline } from './trend'

function item(day: number, ratio: number, status: ScoreStatus = 'no_clear_change'): HistoryItem {
  return {
    timestamp: `2026-10-${String(day).padStart(2, '0')}T08:00:00Z`,
    shoulderToWaist: ratio,
    shoulderCheck: status === 'flagged' ? 'too_wide' : 'ok',
    methodVersion: '2026-10-edge-v1',
    isBaseline: status === 'baseline',
    score: { name: 'x', value: 0, status, formula: '', inputs: {}, explanation: '' },
  }
}

describe('scoredItems', () => {
  it('drops flagged check-ins and keeps order', () => {
    const items = [item(1, 1.7, 'baseline'), item(2, 2.5, 'flagged'), item(3, 1.75)]
    expect(scoredItems(items).map((i) => i.timestamp)).toEqual([items[0].timestamp, items[2].timestamp])
  })
})

describe('changeSinceLast', () => {
  it('is null with fewer than two scored check-ins', () => {
    expect(changeSinceLast([])).toBeNull()
    expect(changeSinceLast([item(1, 1.7, 'baseline')])).toBeNull()
    expect(changeSinceLast([item(1, 1.7, 'baseline'), item(2, 2.5, 'flagged')])).toBeNull()
  })

  it('compares the last two check-ins', () => {
    const since = changeSinceLast([item(1, 1.6, 'baseline'), item(2, 1.7), item(3, 1.785)])!
    expect(since.previous.shoulderToWaist).toBe(1.7)
    expect(since.latest.shoulderToWaist).toBe(1.785)
    expect(since.change).toBeCloseTo(0.05)
    expect(since.status).toBe('increased')
  })

  it('skips a flagged latest check-in and compares the two before it', () => {
    const since = changeSinceLast([item(1, 1.7, 'baseline'), item(2, 1.6), item(3, 2.9, 'flagged')])!
    expect(since.latest.timestamp).toBe(item(2, 0).timestamp)
    expect(since.status).toBe('decreased')
  })

  it('treats changes inside ±2% as no clear change, like the server score', () => {
    expect(changeSinceLast([item(1, 1.7, 'baseline'), item(2, 1.73)])!.status).toBe('no_clear_change') // +1.8%
    expect(changeSinceLast([item(1, 1.7, 'baseline'), item(2, 1.67)])!.status).toBe('no_clear_change') // -1.8%
    expect(changeSinceLast([item(1, 1.0, 'baseline'), item(2, 1.02)])!.status).toBe('increased') // exactly +2%
  })
})

describe('labels', () => {
  it('formats signed percentages to one decimal', () => {
    expect(formatPercent(0.031)).toBe('+3.1%')
    expect(formatPercent(-0.024)).toBe('-2.4%')
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('says "No clear change" inside the noise band and shows the number either way', () => {
    expect(sinceLastHeadline(changeSinceLast([item(1, 1.7, 'baseline'), item(2, 1.71)])!)).toBe('No clear change (+0.6%)')
    expect(sinceLastHeadline(changeSinceLast([item(1, 1.7, 'baseline'), item(2, 1.78)])!)).toBe('+4.7%')
  })
})
