/**
 * Slayer task assignment/progress — pure functions over the same
 * `killCounts` tracker Quests already introduced, same role `questEngine.ts`
 * plays for quests: nothing here mutates state.
 */

import { combatAreas } from '../data/combat/areas'
import { slayerTaskPool } from '../data/slayer'

export interface SlayerTaskState {
  enemyId: string
  targetKills: number
  /** killCounts[enemyId] at the moment this task was assigned. killCounts
   *  itself is lifetime, so task progress is the delta from this baseline,
   *  not the raw count. */
  killsAtAssignment: number
}

/** Whether `enemyId`'s own `CombatArea` is unlocked at `attackLevel` — the
 *  same gate `CombatPage` already enforces before you can even select that
 *  enemy to fight normally. An enemy in no listed area (shouldn't happen,
 *  but the pool and the bestiary are maintained separately) is treated as
 *  always accessible rather than never assignable. */
function isEnemyAccessible(enemyId: string, attackLevel: number): boolean {
  const area = combatAreas.find((a) => a.enemyIds.includes(enemyId))
  return !area || attackLevel >= area.requiredLevel
}

/** Rolls a task from whichever part of `slayerTaskPool` is actually
 *  reachable at `attackLevel`, so a low-level player is never handed a task
 *  against an enemy three tiers above what they can currently fight — falls
 *  back to the whole pool only if somehow nothing qualifies (e.g. a
 *  corrupted/very old save with a negative level), so this never throws. */
export function rollSlayerTask(
  killCounts: Record<string, number>,
  attackLevel: number,
): SlayerTaskState {
  const accessiblePool = slayerTaskPool.filter((def) => isEnemyAccessible(def.enemyId, attackLevel))
  const pool = accessiblePool.length > 0 ? accessiblePool : slayerTaskPool
  const def = pool[Math.floor(Math.random() * pool.length)]
  const range = def.maxKills - def.minKills + 1
  return {
    enemyId: def.enemyId,
    targetKills: def.minKills + Math.floor(Math.random() * range),
    killsAtAssignment: killCounts[def.enemyId] ?? 0,
  }
}

export function slayerTaskProgress(
  task: SlayerTaskState,
  killCounts: Record<string, number>,
): number {
  return Math.max(0, (killCounts[task.enemyId] ?? 0) - task.killsAtAssignment)
}

export function isSlayerTaskComplete(
  task: SlayerTaskState,
  killCounts: Record<string, number>,
): boolean {
  return slayerTaskProgress(task, killCounts) >= task.targetKills
}
