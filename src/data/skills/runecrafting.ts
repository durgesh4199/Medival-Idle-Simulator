import type { Action, Location, Skill } from '../types'

export const runecraftingSkill: Skill = {
  id: 'runecrafting',
  name: 'Runecrafting',
  icon: '🔮',
  description: 'Craft Rune Essence into runes — fuel for Magic and Combat spells.',
}

export const runecraftingLocations: Location[] = [
  {
    id: 'runecrafting_altar',
    skillId: 'runecrafting',
    name: 'Runecrafting Altar',
    requiredLevel: 1,
    actionIds: [
      'craft_air_rune',
      'craft_water_rune',
      'craft_fire_rune',
      'craft_chaos_rune',
      'craft_death_rune',
      'craft_blood_rune',
    ],
  },
]

export const runecraftingActions: Action[] = [
  {
    id: 'craft_air_rune',
    skillId: 'runecrafting',
    locationId: 'runecrafting_altar',
    name: 'Air Rune',
    durationMs: [2000, 3000],
    xp: 8,
    requiredLevel: 1,
    inputs: [{ itemId: 'rune_essence', qty: 1 }],
    outputs: [{ itemId: 'air_rune', chance: 1, qty: 1 }],
  },
  {
    id: 'craft_water_rune',
    skillId: 'runecrafting',
    locationId: 'runecrafting_altar',
    name: 'Water Rune',
    durationMs: [2000, 3000],
    xp: 8,
    requiredLevel: 1,
    inputs: [{ itemId: 'rune_essence', qty: 1 }],
    outputs: [{ itemId: 'water_rune', chance: 1, qty: 1 }],
  },
  {
    id: 'craft_fire_rune',
    skillId: 'runecrafting',
    locationId: 'runecrafting_altar',
    name: 'Fire Rune',
    durationMs: [2500, 3500],
    xp: 14,
    requiredLevel: 15,
    inputs: [{ itemId: 'rune_essence', qty: 1 }],
    outputs: [{ itemId: 'fire_rune', chance: 1, qty: 1 }],
  },
  {
    id: 'craft_chaos_rune',
    skillId: 'runecrafting',
    locationId: 'runecrafting_altar',
    name: 'Chaos Rune',
    durationMs: [3000, 4500],
    xp: 45,
    requiredLevel: 35,
    inputs: [{ itemId: 'rune_essence', qty: 2 }],
    outputs: [{ itemId: 'chaos_rune', chance: 1, qty: 1 }],
  },
  {
    id: 'craft_death_rune',
    skillId: 'runecrafting',
    locationId: 'runecrafting_altar',
    name: 'Death Rune',
    durationMs: [4000, 6000],
    xp: 75,
    requiredLevel: 65,
    inputs: [{ itemId: 'rune_essence', qty: 3 }],
    outputs: [{ itemId: 'death_rune', chance: 1, qty: 1 }],
  },
  // The one skill pushed past the others' ~55-65 ceiling, matching how the
  // original Death Rune tier already outran everything but Smithing's new
  // Adamant tier — Runecrafting stays the "deepest" grind in the game.
  {
    id: 'craft_blood_rune',
    skillId: 'runecrafting',
    locationId: 'runecrafting_altar',
    name: 'Blood Rune',
    durationMs: [5000, 7000],
    xp: 110,
    requiredLevel: 80,
    inputs: [{ itemId: 'rune_essence', qty: 4 }],
    outputs: [{ itemId: 'blood_rune', chance: 1, qty: 1 }],
  },
]
