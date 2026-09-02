/**
 * Pure quest-requirement checking. Nothing here mutates state — gameStore's
 * `completeQuest` reads these to decide whether a turn-in is valid, the same
 * way `canStartAction` reads `hasRequiredInputs`.
 */

import type { Quest, QuestRequirement } from '../data/types'

export interface QuestCheckContext {
  levelOf: (skillId: string) => number
  inventory: Record<string, number>
  killCounts: Record<string, number>
  completedQuestIds: Record<string, boolean>
}

export function isRequirementMet(req: QuestRequirement, ctx: QuestCheckContext): boolean {
  switch (req.type) {
    case 'skillLevel':
      return ctx.levelOf(req.skillId) >= req.level
    case 'itemCount':
      return (ctx.inventory[req.itemId] ?? 0) >= req.qty
    case 'kills':
      return (ctx.killCounts[req.enemyId] ?? 0) >= req.count
    case 'questComplete':
      return Boolean(ctx.completedQuestIds[req.questId])
  }
}

export function isQuestComplete(quest: Quest, ctx: QuestCheckContext): boolean {
  return Boolean(ctx.completedQuestIds[quest.id])
}

/** True once every requirement is met and the quest hasn't already been
 *  turned in — quests are one-time, like a real turn-in, not repeatable. */
export function canCompleteQuest(quest: Quest, ctx: QuestCheckContext): boolean {
  if (isQuestComplete(quest, ctx)) return false
  return quest.requirements.every((req) => isRequirementMet(req, ctx))
}
