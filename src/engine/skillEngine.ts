/**
 * Generic action resolution. Nothing in this file knows what "Fishing" or
 * "Firemaking" is — it only operates on the shape described by data/types.ts.
 * This is what keeps adding a new skill a data-only change.
 */

import type { Action } from '../data/types'

/** Rolls a random duration within the action's [min, max] range. */
export function rollDurationMs(action: Action): number {
  const [min, max] = action.durationMs
  return min + Math.random() * (max - min)
}

export function averageDurationMs(action: Action): number {
  return (action.durationMs[0] + action.durationMs[1]) / 2
}

export function hasRequiredInputs(
  action: Action,
  inventory: Record<string, number>,
): boolean {
  return (action.inputs ?? []).every((input) => (inventory[input.itemId] ?? 0) >= input.qty)
}

/**
 * Resolves one completed action attempt: exactly one entry is chosen from
 * `outputs` (weighted by chance), then each `specialOutputs` entry is rolled
 * independently on top of it — matching the "Each Item is rolled
 * individually per catch attempt" special-items panel from Fishing.
 */
export function rollActionRewards(action: Action): Record<string, number> {
  const items: Record<string, number> = {}

  const totalWeight = action.outputs.reduce((sum, o) => sum + o.chance, 0)
  if (totalWeight > 0) {
    const roll = Math.random() * totalWeight
    let acc = 0
    for (const output of action.outputs) {
      acc += output.chance
      if (roll <= acc) {
        items[output.itemId] = (items[output.itemId] ?? 0) + output.qty
        break
      }
    }
  }

  for (const special of action.specialOutputs ?? []) {
    if (Math.random() < special.chance) {
      items[special.itemId] = (items[special.itemId] ?? 0) + special.qty
    }
  }

  return items
}
