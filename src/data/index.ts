import { combatAreas } from './combat/areas'
import { combatSkillDisplay, combatSkillOrder } from './combat/combatSkills'
import { enemies } from './combat/enemies'
import { cookingActions, cookingLocations, cookingSkill } from './skills/cooking'
import { fishingActions, fishingLocations, fishingSkill } from './skills/fishing'
import { firemakingActions, firemakingLocations, firemakingSkill } from './skills/firemaking'
import { huntingActions, huntingLocations, huntingSkill } from './skills/hunting'
import { miningActions, miningLocations, miningSkill } from './skills/mining'
import {
  runecraftingActions,
  runecraftingLocations,
  runecraftingSkill,
} from './skills/runecrafting'
import { questsById, quests } from './quests'
import { shopBuyableItemIds } from './shop'
import { smithingActions, smithingLocations, smithingSkill } from './skills/smithing'
import { woodcuttingActions, woodcuttingLocations, woodcuttingSkill } from './skills/woodcutting'
import type { Action, Location, Skill, SkillId } from './types'

export const skills: Record<SkillId, Skill> = {
  fishing: fishingSkill,
  firemaking: firemakingSkill,
  woodcutting: woodcuttingSkill,
  mining: miningSkill,
  smithing: smithingSkill,
  cooking: cookingSkill,
  hunting: huntingSkill,
  runecrafting: runecraftingSkill,
}

export const locations: Location[] = [
  ...fishingLocations,
  ...firemakingLocations,
  ...woodcuttingLocations,
  ...miningLocations,
  ...smithingLocations,
  ...cookingLocations,
  ...huntingLocations,
  ...runecraftingLocations,
]

export const actions: Action[] = [
  ...fishingActions,
  ...firemakingActions,
  ...woodcuttingActions,
  ...miningActions,
  ...smithingActions,
  ...cookingActions,
  ...huntingActions,
  ...runecraftingActions,
]

export const actionsById: Record<string, Action> = Object.fromEntries(
  actions.map((a) => [a.id, a]),
)

export const locationsById: Record<string, Location> = Object.fromEntries(
  locations.map((l) => [l.id, l]),
)

export function locationsForSkill(skillId: SkillId): Location[] {
  return locations.filter((l) => l.skillId === skillId)
}

export function actionsForLocation(locationId: string): Action[] {
  const loc = locationsById[locationId]
  if (!loc) return []
  return loc.actionIds.map((id) => actionsById[id])
}

export { combatAreas, combatSkillDisplay, combatSkillOrder, enemies, questsById, quests, shopBuyableItemIds }
export const enemiesById: Record<string, (typeof enemies)[number]> = Object.fromEntries(
  enemies.map((e) => [e.id, e]),
)

export * from './types'
export { getItem, items } from './items/items'
