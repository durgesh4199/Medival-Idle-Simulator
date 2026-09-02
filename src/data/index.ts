import { fishingActions, fishingLocations, fishingSkill } from './skills/fishing'
import { firemakingActions, firemakingLocations, firemakingSkill } from './skills/firemaking'
import type { Action, Location, Skill, SkillId } from './types'

export const skills: Record<SkillId, Skill> = {
  fishing: fishingSkill,
  firemaking: firemakingSkill,
  // Remaining skills from the design doc (woodcutting, mining, smithing,
  // cooking, hunting, runecrafting) plug in the same way: add a
  // src/data/skills/<skill>.ts exporting a Skill + its Locations/Actions,
  // then register it here. No engine or UI code has to change.
} as Record<SkillId, Skill>

export const locations: Location[] = [...fishingLocations, ...firemakingLocations]

export const actions: Action[] = [...fishingActions, ...firemakingActions]

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

export * from './types'
export { getItem, items } from './items/items'
