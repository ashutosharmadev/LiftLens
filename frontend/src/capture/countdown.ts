/**
 * Counts down once a second: onTick(seconds - 1) ... onTick(1), then onDone().
 * Returns a cancel function; after cancelling, nothing else is called.
 */
export function startCountdown(seconds: number, onTick: (secondsLeft: number) => void, onDone: () => void): () => void {
  let left = seconds
  const timer = setInterval(() => {
    left -= 1
    if (left > 0) {
      onTick(left)
      return
    }
    clearInterval(timer)
    onDone()
  }, 1000)
  return () => clearInterval(timer)
}
