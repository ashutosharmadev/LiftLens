import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startCountdown } from './countdown'

describe('startCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('ticks once a second down to 1, then finishes at 0', () => {
    const ticks: number[] = []
    const onDone = vi.fn()
    startCountdown(3, (left) => ticks.push(left), onDone)

    vi.advanceTimersByTime(1000)
    expect(ticks).toEqual([2])
    vi.advanceTimersByTime(1000)
    expect(ticks).toEqual([2, 1])
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(onDone).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(5000)
    expect(ticks).toEqual([2, 1])
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('takes the full 10 seconds before finishing', () => {
    const onDone = vi.fn()
    startCountdown(10, () => {}, onDone)
    vi.advanceTimersByTime(9999)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('does nothing more once cancelled', () => {
    const onTick = vi.fn()
    const onDone = vi.fn()
    const cancel = startCountdown(10, onTick, onDone)
    vi.advanceTimersByTime(2000)
    cancel()
    vi.advanceTimersByTime(20000)
    expect(onTick).toHaveBeenCalledTimes(2)
    expect(onDone).not.toHaveBeenCalled()
  })
})
