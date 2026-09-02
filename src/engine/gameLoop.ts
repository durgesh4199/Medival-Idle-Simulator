/**
 * Drives the simulation: loads any existing save (replaying offline
 * progress through the same `tick` used while online), then keeps ticking
 * and autosaving on a timer.
 *
 * Progress is timestamp-based, not frame-based — `tick(now)` resolves
 * however many actions completed between the last tick and `now`. That's
 * what makes "close the tab for 8 hours" and "the tab throttled in the
 * background" both just work with no special-case code.
 */

import { loadGame, saveGame } from './saveSystem'
import { useGameStore } from '../state/gameStore'

const TICK_INTERVAL_MS = 200
const AUTOSAVE_INTERVAL_MS = 10_000

let tickHandle: number | undefined
let autosaveHandle: number | undefined

function persist() {
  saveGame(useGameStore.getState().toSaveShape())
}

export function initGame(): void {
  const save = loadGame()
  if (save) {
    useGameStore.getState().loadFromSave(save)
  }

  if (tickHandle === undefined) {
    tickHandle = window.setInterval(() => {
      useGameStore.getState().tick(Date.now())
    }, TICK_INTERVAL_MS)
  }

  if (autosaveHandle === undefined) {
    autosaveHandle = window.setInterval(persist, AUTOSAVE_INTERVAL_MS)
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('beforeunload', persist)
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // Catch up instantly on refocus instead of waiting for the next tick —
    // background tabs get throttled by the browser to well under 5/sec.
    useGameStore.getState().tick(Date.now())
  }
}

export function stopGameLoop(): void {
  if (tickHandle !== undefined) window.clearInterval(tickHandle)
  if (autosaveHandle !== undefined) window.clearInterval(autosaveHandle)
  tickHandle = undefined
  autosaveHandle = undefined
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('beforeunload', persist)
}
