/**
 * Farming's plot mechanics — pure functions, the same role skillEngine.ts
 * plays for a regular Action. Unlike every other skill, readiness is a
 * plain timestamp comparison rather than something a tick loop resolves:
 * `gameStore` never needs a `farmingTick`, and a plot planted right before
 * the tab closes is correctly ready (or not) on return, no matter how long
 * that was — there's no `MAX_OFFLINE_MS`-style cap to worry about here,
 * because nothing is being replayed forward in a loop.
 */

import type { FarmingCrop } from '../data/types'

export interface FarmingPlotState {
  cropId: string | null
  plantedAt: number | null
}

export function emptyPlot(): FarmingPlotState {
  return { cropId: null, plantedAt: null }
}

export function isPlotReady(
  plot: FarmingPlotState,
  crop: FarmingCrop | undefined,
  now: number,
): boolean {
  if (!plot.cropId || plot.plantedAt == null || !crop) return false
  return now >= plot.plantedAt + crop.growDurationMs
}

/** 0-100, clamped — how far through its grow timer a planted plot is. */
export function plotProgress(
  plot: FarmingPlotState,
  crop: FarmingCrop | undefined,
  now: number,
): number {
  if (!plot.cropId || plot.plantedAt == null || !crop) return 0
  return Math.max(0, Math.min(100, ((now - plot.plantedAt) / crop.growDurationMs) * 100))
}

/** A harvest yields a small random batch rather than a flat 1 — the one
 *  place in the game a single completion produces more than a couple of
 *  items at once, matching "tending a plot" rather than "picking one
 *  fish." */
export function rollHarvestYield(): number {
  return 2 + Math.floor(Math.random() * 3) // 2-4
}
