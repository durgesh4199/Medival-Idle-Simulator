/**
 * Slayer task assignment/progress — pure functions over the same
 * `killCounts` tracker Quests already introduced, same role `questEngine.ts`
 * plays for quests: nothing here mutates state.
 */

import { slayerTaskPool } from '../data/slayer'

export interface SlayerTaskState {
  enemyId: string
  targetKills: number
  /** killCounts[enemyId] at the moment this task was assigned. killCounts
   *  itself is lifetime, so task progress is the delta from this baseline,
   *  not the raw count. */
  killsAtAssignment: number
}

export function rollSlayerTask(killCounts: Record<string, number>): SlayerTaskState {
  const def = slayerTaskPool[Math.floor(Math.random() * slayerTaskPool.length)]
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
