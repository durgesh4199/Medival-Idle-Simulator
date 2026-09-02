/**
 * Mastery (design doc §8): a specialization layer on top of the same
 * Action-completion loop skillEngine already resolves — every completion
 * grants the same XP amount to two additional trackers besides skillXp:
 *
 *  - Per-action mastery XP (keyed by Action.id): rewards running the exact
 *    same action repeatedly with a small, capped speed bonus, the reward
 *    for specialization the design doc calls out.
 *  - Per-skill mastery pool XP (keyed by SkillId): every action in a skill
 *    feeds the same pool. Once full, that skill's actions get a flat
 *    chance to double a completion's output — the "permanent bonus from
 *    guild progression" the doc describes, without needing a full guild/
 *    task-list system to deliver something real.
 *
 * Reuses xp.ts's level curve rather than inventing a second one — mastery
 * levels use the same table skill levels do.
 */

import { levelForXp as masteryLevelForXp, xpForLevel } from './xp'

/** The pool's "100% full" mark — a milestone on the same curve as skill
 *  levels, not a disconnected magic number. */
export const MASTERY_POOL_CAP = xpForLevel(80)

const MAX_SPEED_BONUS = 0.3
const SPEED_BONUS_PER_LEVEL = 0.003
const POOL_BONUS_CHANCE = 0.1

/** Fractional reduction to apply to an action's rolled duration — 0.3% per
 *  mastery level, capped at 30% so no action ever approaches instant. */
export function masterySpeedBonus(masteryLevel: number): number {
  return Math.min(MAX_SPEED_BONUS, masteryLevel * SPEED_BONUS_PER_LEVEL)
}

export function isMasteryPoolFull(poolXp: number): boolean {
  return poolXp >= MASTERY_POOL_CAP
}

/** Once a skill's mastery pool is full, each completion has a flat chance
 *  of its rewards being doubled. */
export function rollMasteryPoolBonus(poolXp: number): boolean {
  return isMasteryPoolFull(poolXp) && Math.random() < POOL_BONUS_CHANCE
}

export { masteryLevelForXp }
