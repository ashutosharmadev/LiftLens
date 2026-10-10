// Countdown beeps made with Web Audio, so there are no sound files to ship.
// Create the beeper inside a tap handler: phones only allow sound after a tap.

export interface Beeper {
  tick(): void
  shutter(): void
  close(): void
}

const SILENT: Beeper = { tick() {}, shutter() {}, close() {} }

export function createBeeper(): Beeper {
  let ctx: AudioContext
  try {
    ctx = new AudioContext()
  } catch {
    return SILENT
  }

  function tone(frequency: number, startIn: number, seconds: number) {
    const start = ctx.currentTime + startIn
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.25, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + seconds)
  }

  return {
    tick: () => tone(880, 0, 0.12),
    shutter: () => {
      tone(1320, 0, 0.12)
      tone(1320, 0.18, 0.12)
    },
    close: () => void ctx.close(),
  }
}
