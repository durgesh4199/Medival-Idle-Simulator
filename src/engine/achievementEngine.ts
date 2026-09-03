/**
 * Pure achievement-requirement checking — the same role `questEngine.ts`
 * plays for Quests. Nothing here mutates state; `gameStore.completeAchievement`
 * reads these to decide whether a claim is valid.
 */

import type { Achievement, AchievementRequirement } from '../data/types'

export interface AchievementCheckContext {
  levelOf: (skillId: string) => number
  killCounts: Record<string, number>
  completedQuestIds: Record<string, boolean>
  /** Lifetime clears per dungeon, keyed by Dungeon.id. */
  dungeonClearCounts: Record<string, number>
  completedAchievementIds: Record<string, boolean>
}

export function isAchievementRequirementMet(
  req: AchievementRequirement,
  ctx: AchievementCheckContext,
): boolean {
  switch (req.type) {
    case 'skillLevel':
      return ctx.levelOf(req.skillId) >= req.level
    case 'kills':
      return (ctx.killCounts[req.enemyId] ?? 0) >= req.count
    case 'questComplete':
      return Boolean(ctx.completedQuestIds[req.questId])
    case 'dungeonCleared':
      return (ctx.dungeonClearCounts[req.dungeonId] ?? 0) >= req.count
  }
}

/** True once every requirement is met and it hasn't already been claimed —
 *  achievements are one-time, like a Quest turn-in. */
export function canCompleteAchievement(
  achievement: Achievement,
  ctx: AchievementCheckContext,
): boolean {
  if (ctx.completedAchievementIds[achievement.id]) return false
  return achievement.requirements.every((req) => isAchievementRequirementMet(req, ctx))
}
