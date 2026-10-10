import { describe, expect, it } from 'vitest'
import { REGIONS } from './regions'

describe('body map regions', () => {
  it('marks only shoulders and waist as measured (V1 measures shoulder-to-waist only)', () => {
    expect(REGIONS.filter((r) => r.measured).map((r) => r.id)).toEqual(['shoulders', 'waist'])
  })

  it('marks no back part as measured: V1 takes a front photo only', () => {
    const backParts = REGIONS.filter((r) => r.view === 'back')
    expect(backParts).toHaveLength(8)
    expect(backParts.every((r) => !r.measured)).toBe(true)
    expect(backParts.every((r) => r.detail.includes('front photo only'))).toBe(true)
  })

  it('has one entry per region, each with a label and detail', () => {
    expect(new Set(REGIONS.map((r) => r.id)).size).toBe(REGIONS.length)
    for (const r of REGIONS) {
      expect(r.label).not.toBe('')
      expect(r.detail).not.toBe('')
    }
  })

  it('says unmeasured parts are not measured, so nothing reads as a rating', () => {
    for (const r of REGIONS.filter((r) => !r.measured)) {
      expect(r.detail).toMatch(/^Not measured/)
    }
  })
})
