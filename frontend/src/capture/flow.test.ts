import { describe, expect, it } from 'vitest'
import { cameraOn, COUNTDOWN_SECONDS, initialPhase, next, type CaptureEvent, type Phase } from './flow'

const photo = { width: 720, height: 1280 } as HTMLCanvasElement

function run(...events: CaptureEvent[]): Phase {
  return events.reduce(next, initialPhase)
}

describe('capture flow', () => {
  it('starts on the setup tips', () => {
    expect(initialPhase).toEqual({ kind: 'setup' })
  })

  it('goes camera -> live -> 10 s countdown -> review -> ready', () => {
    expect(run({ type: 'open' })).toEqual({ kind: 'opening' })
    expect(run({ type: 'open' }, { type: 'cameraReady' })).toEqual({ kind: 'live' })
    expect(run({ type: 'open' }, { type: 'cameraReady' }, { type: 'start' })).toEqual({
      kind: 'countdown',
      secondsLeft: COUNTDOWN_SECONDS,
    })
    const review = run({ type: 'open' }, { type: 'cameraReady' }, { type: 'start' }, { type: 'tick', secondsLeft: 3 }, { type: 'captured', photo })
    expect(review).toEqual({ kind: 'review', photo, source: 'camera' })
    expect(next(review, { type: 'use' })).toEqual({ kind: 'ready', photo })
  })

  it('counts down with ticks', () => {
    expect(run({ type: 'open' }, { type: 'cameraReady' }, { type: 'start' }, { type: 'tick', secondsLeft: 4 })).toEqual({
      kind: 'countdown',
      secondsLeft: 4,
    })
  })

  it('reviews an uploaded photo without opening the camera', () => {
    expect(run({ type: 'uploaded', photo })).toEqual({ kind: 'review', photo, source: 'upload' })
  })

  it('returns to setup with the problem when the camera fails', () => {
    expect(run({ type: 'open' }, { type: 'failed', problem: 'denied' })).toEqual({ kind: 'setup', problem: 'denied' })
  })

  it('shows a bad upload as a problem on setup', () => {
    expect(run({ type: 'failed', problem: 'bad-file' })).toEqual({ kind: 'setup', problem: 'bad-file' })
  })

  it('cancelling a countdown goes back to the live camera; cancelling live goes to setup', () => {
    const counting = run({ type: 'open' }, { type: 'cameraReady' }, { type: 'start' })
    expect(next(counting, { type: 'cancel' })).toEqual({ kind: 'live' })
    expect(next({ kind: 'live' }, { type: 'cancel' })).toEqual({ kind: 'setup' })
  })

  it('retaking a camera photo reopens the camera; retaking an upload goes back to setup', () => {
    expect(next({ kind: 'review', photo, source: 'camera' }, { type: 'retake' })).toEqual({ kind: 'opening' })
    expect(next({ kind: 'review', photo, source: 'upload' }, { type: 'retake' })).toEqual({ kind: 'setup' })
  })

  it('starting over from ready clears the photo', () => {
    expect(next({ kind: 'ready', photo }, { type: 'restart' })).toEqual({ kind: 'setup' })
  })

  it('ignores events that do not fit the current phase', () => {
    expect(run({ type: 'start' })).toEqual({ kind: 'setup' })
    expect(run({ type: 'captured', photo })).toEqual({ kind: 'setup' })
    const live: Phase = { kind: 'live' }
    expect(next(live, { type: 'captured', photo })).toBe(live)
  })

  it('keeps the camera on only while opening, live or counting down', () => {
    expect(cameraOn({ kind: 'setup' })).toBe(false)
    expect(cameraOn({ kind: 'opening' })).toBe(true)
    expect(cameraOn({ kind: 'live' })).toBe(true)
    expect(cameraOn({ kind: 'countdown', secondsLeft: 5 })).toBe(true)
    expect(cameraOn({ kind: 'review', photo, source: 'camera' })).toBe(false)
    expect(cameraOn({ kind: 'ready', photo })).toBe(false)
  })
})
