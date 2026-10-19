/**
 * Lets store actions that reorder the dashboard ask the mounted dashboard to
 * record a Flip snapshot *before* state changes.
 */
let capturer: (() => void) | null = null

export const flipBus = {
  register(fn: () => void) {
    capturer = fn
    return () => {
      if (capturer === fn) capturer = null
    }
  },
  capture() {
    capturer?.()
  },
}
