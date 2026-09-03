/**
 * Pet drop rolling + bonus application — pure functions, the same role
 * masteryEngine.ts plays for the Mastery pool bonus. gameStore's
 * tick/combatTick/dungeonTick/startAction call these; nothing here
 * mutates state.
 */

import { combatPet, petBySkillId } from '../data/pets'
import type { CombatSkillId, SkillId } from '../data/types'

/** Chance scales with the relevant level (mastery level for a skill pet,
 *  average combat level for the Combat pet) — a rare find that gets a
 *  little more likely with experience, capped well short of a sure thing. */
const BASE_PET_CHANCE = 0.0005
const PET_CHANCE_PER_LEVEL = 0.00007
const MAX_PET_CHANCE = 0.02

export function petDropChance(level: number): number {
  return Math.min(MAX_PET_CHANCE, BASE_PET_CHANCE + level * PET_CHANCE_PER_LEVEL)
}

export function rollPetDrop(level: number): boolean {
  return Math.random() < petDropChance(level)
}

/** The skill-speed bonus from owning that skill's pet — 0 if not owned or
 *  the skill has no pet. */
export function petSpeedBonus(ownedPetIds: Record<string, boolean>, skillId: SkillId): number {
  const pet = petBySkillId[skillId]
  if (!pet || !ownedPetIds[pet.id]) return 0
  return pet.bonusPercent
}

/** Applies the Combat pet's XP bonus (if owned) to a set of combat-skill XP
 *  gains — shared by combatTick and dungeonTick, since both grant combat
 *  XP through the same simulateCombat shape. Returns `xpGained` unchanged
 *  if the pet isn't owned. */
export function applyCombatPetBonus(
  xpGained: Record<CombatSkillId, number>,
  ownedPetIds: Record<string, boolean>,
): Record<CombatSkillId, number> {
  if (!ownedPetIds[combatPet.id]) return xpGained
  const boosted = {} as Record<CombatSkillId, number>
  for (const [skillId, xp] of Object.entries(xpGained)) {
    boosted[skillId as CombatSkillId] = xp * (1 + combatPet.bonusPercent)
  }
  return boosted
}
