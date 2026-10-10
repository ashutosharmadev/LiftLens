import { describe, expect, it } from 'vitest'
import { cameraProblem } from './camera'

describe('cameraProblem', () => {
  it.each([
    ['NotAllowedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'no-camera'],
    ['OverconstrainedError', 'no-camera'],
    ['NotReadableError', 'in-use'],
    ['AbortError', 'in-use'],
    ['TypeError', 'failed'],
  ])('maps %s to %s', (name, problem) => {
    expect(cameraProblem(new DOMException('x', name))).toBe(problem)
  })

  it('treats anything unexpected as a generic failure', () => {
    expect(cameraProblem('nope')).toBe('failed')
    expect(cameraProblem(undefined)).toBe('failed')
  })
})
