// The check-in capture screen as a small state machine: setup -> live ->
// countdown -> review -> ready. Pure, so every transition is unit-tested;
// the camera and timers live in camera.ts, photo.ts and countdown.ts.

export const COUNTDOWN_SECONDS = 10

/** Why the camera or an upload couldn't give us a photo. */
export type CaptureProblem = 'denied' | 'no-camera' | 'in-use' | 'insecure' | 'failed' | 'bad-file'

export const PROBLEM_MESSAGE: Record<CaptureProblem, string> = {
  denied: "Camera access was blocked. Allow it in your browser's site settings, or upload a photo instead.",
  'no-camera': 'No camera was found on this device. Upload a photo instead.',
  'in-use': 'The camera is being used by another app. Close it and try again, or upload a photo instead.',
  insecure: 'The camera only works on localhost or over HTTPS. Upload a photo instead.',
  failed: "The camera couldn't start. Try again, or upload a photo instead.",
  'bad-file': "That file couldn't be opened as an image. Try a JPEG or PNG photo.",
}

export type Phase =
  | { kind: 'setup'; problem?: CaptureProblem }
  | { kind: 'opening' }
  | { kind: 'live' }
  | { kind: 'countdown'; secondsLeft: number }
  | { kind: 'review'; photo: HTMLCanvasElement; source: 'camera' | 'upload' }
  | { kind: 'ready'; photo: HTMLCanvasElement }

export type CaptureEvent =
  | { type: 'open' }
  | { type: 'cameraReady' }
  | { type: 'failed'; problem: CaptureProblem }
  | { type: 'start' }
  | { type: 'tick'; secondsLeft: number }
  | { type: 'captured'; photo: HTMLCanvasElement }
  | { type: 'uploaded'; photo: HTMLCanvasElement }
  | { type: 'cancel' }
  | { type: 'retake' }
  | { type: 'use' }
  | { type: 'restart' }

export const initialPhase: Phase = { kind: 'setup' }

/** Next phase for an event. Events that don't fit the current phase are ignored. */
export function next(phase: Phase, event: CaptureEvent): Phase {
  switch (phase.kind) {
    case 'setup':
      if (event.type === 'open') return { kind: 'opening' }
      if (event.type === 'uploaded') return { kind: 'review', photo: event.photo, source: 'upload' }
      if (event.type === 'failed') return { kind: 'setup', problem: event.problem }
      return phase
    case 'opening':
      if (event.type === 'cameraReady') return { kind: 'live' }
      if (event.type === 'failed') return { kind: 'setup', problem: event.problem }
      if (event.type === 'cancel') return { kind: 'setup' }
      return phase
    case 'live':
      if (event.type === 'start') return { kind: 'countdown', secondsLeft: COUNTDOWN_SECONDS }
      if (event.type === 'cancel') return { kind: 'setup' }
      if (event.type === 'failed') return { kind: 'setup', problem: event.problem }
      return phase
    case 'countdown':
      if (event.type === 'tick') return { kind: 'countdown', secondsLeft: event.secondsLeft }
      if (event.type === 'captured') return { kind: 'review', photo: event.photo, source: 'camera' }
      if (event.type === 'cancel') return { kind: 'live' }
      if (event.type === 'failed') return { kind: 'setup', problem: event.problem }
      return phase
    case 'review':
      // A camera retake reopens the camera straight away; an upload retake goes back to the choice.
      if (event.type === 'retake') return phase.source === 'camera' ? { kind: 'opening' } : { kind: 'setup' }
      if (event.type === 'use') return { kind: 'ready', photo: phase.photo }
      return phase
    case 'ready':
      if (event.type === 'restart') return { kind: 'setup' }
      return phase
  }
}

/** True while the camera should be running. Everywhere else it must be off. */
export function cameraOn(phase: Phase): boolean {
  return phase.kind === 'opening' || phase.kind === 'live' || phase.kind === 'countdown'
}
