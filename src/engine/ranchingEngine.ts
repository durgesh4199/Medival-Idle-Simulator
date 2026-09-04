/**
 * Ranching's pen mechanics — pure functions, the same role
 * farmingEngine.ts plays for a plot. The difference is the production
 * shape: a Farming plot resolves once and goes empty; a Ranch pen's animal
 * keeps producing on a recurring cycle once mature, so "how much is ready"
 * is a division, not a boolean — `stockpiledBatches` divides elapsed time
 * by `produceIntervalMs`, capped at `maxStockpile`. Still no tick loop:
 * everything here is computed lazily off timestamps, the same
 * offline-friendly-with-no-cap shape Farming already established.
 */

import type { RanchAnimal } from '../data/types'

export interface RanchPenState {
  animalId: string | null
  placedAt: number | null
  /** When production last "reset" — either when the animal matured (never
   *  collected yet) or the last collection. Advances only on collect. */
  lastCollectedAt: number | null
}

export function emptyPen(): RanchPenState {
  return { animalId: null, placedAt: null, lastCollectedAt: null }
}

export function isMature(
  pen: RanchPenState,
  animal: RanchAnimal | undefined,
  now: number,
): boolean {
  if (!pen.animalId || pen.placedAt == null || !animal) return false
  return now >= pen.placedAt + animal.raiseDurationMs
}

/** 0-100 — how far through raising an immature pen's animal is. Returns
 *  100 once mature, so callers don't need a separate `isMature` check just
 *  to draw a full bar. */
export function maturityProgress(
  pen: RanchPenState,
  animal: RanchAnimal | undefined,
  now: number,
): number {
  if (!pen.animalId || pen.placedAt == null || !animal) return 0
  return Math.max(0, Math.min(100, ((now - pen.placedAt) / animal.raiseDurationMs) * 100))
}

/** How many produce batches are currently stockpiled in a mature pen,
 *  capped at `animal.maxStockpile` — 0 for an immature or empty pen. */
export function stockpiledBatches(
  pen: RanchPenState,
  animal: RanchAnimal | undefined,
  now: number,
): number {
  if (!isMature(pen, animal, now) || !animal) return 0
  const matureAt = pen.placedAt! + animal.raiseDurationMs
  const since = pen.lastCollectedAt ?? matureAt
  const rawBatches = Math.floor((now - since) / animal.produceIntervalMs)
  return Math.max(0, Math.min(animal.maxStockpile, rawBatches))
}

/** 0-100 progress toward the *next* batch beyond whatever's already
 *  stockpiled — 0 once the stockpile is capped, since further waiting
 *  produces nothing more until some is collected. */
export function nextBatchProgress(
  pen: RanchPenState,
  animal: RanchAnimal | undefined,
  now: number,
): number {
  if (!isMature(pen, animal, now) || !animal) return 0
  const matureAt = pen.placedAt! + animal.raiseDurationMs
  const since = pen.lastCollectedAt ?? matureAt
  const elapsed = now - since
  const batches = Math.floor(elapsed / animal.produceIntervalMs)
  if (batches >= animal.maxStockpile) return 0
  const intoCurrent = elapsed - batches * animal.produceIntervalMs
  return Math.max(0, Math.min(100, (intoCurrent / animal.produceIntervalMs) * 100))
}

/** Collects whatever's stockpiled, returning the batch count and the pen's
 *  next state. If the stockpile was capped (production was being wasted
 *  while full), `lastCollectedAt` resets to `now` — there's no partial
 *  progress worth preserving past a full pen. Otherwise it advances by
 *  exactly the time actually converted into batches, so any leftover
 *  partial-cycle progress carries forward instead of being discarded. */
export function collectBatches(
  pen: RanchPenState,
  animal: RanchAnimal | undefined,
  now: number,
): { batches: number; nextPen: RanchPenState } {
  if (!isMature(pen, animal, now) || !animal) return { batches: 0, nextPen: pen }
  const matureAt = pen.placedAt! + animal.raiseDurationMs
  const since = pen.lastCollectedAt ?? matureAt
  const rawBatches = Math.floor((now - since) / animal.produceIntervalMs)
  const capped = rawBatches > animal.maxStockpile
  const batches = Math.max(0, Math.min(animal.maxStockpile, rawBatches))
  const lastCollectedAt = capped ? now : since + batches * animal.produceIntervalMs
  return { batches, nextPen: { ...pen, lastCollectedAt } }
}
