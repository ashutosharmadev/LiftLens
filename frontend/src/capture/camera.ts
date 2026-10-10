// Front camera access. Browser only, so it's exercised in the app; the error
// mapping is pure and unit-tested.
import type { CaptureProblem } from './flow'

/** Opens the front ("user") camera. Throws a CaptureProblem string if it can't. */
export async function openCamera(): Promise<MediaStream> {
  // mediaDevices only exists in a secure context: localhost or HTTPS.
  if (!navigator.mediaDevices?.getUserMedia) throw 'insecure' satisfies CaptureProblem
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    })
  } catch (err) {
    throw cameraProblem(err)
  }
}

/** Turns the camera off (the browser's camera light goes out). */
export function stopCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}

/** Maps getUserMedia's error names to a problem we can explain. */
export function cameraProblem(err: unknown): CaptureProblem {
  const name = err instanceof Error || err instanceof DOMException ? err.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'denied'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-camera'
    case 'NotReadableError':
    case 'AbortError':
      return 'in-use'
    default:
      return 'failed'
  }
}
