import type { Action, Location, Skill } from '../types'

export const cookingSkill: Skill = {
  id: 'cooking',
  name: 'Cooking',
  icon: '🍳',
  description: 'Cook raw fish into food. A failed roll burns the food instead.',
}

export const cookingLocations: Location[] = [
  {
    id: 'cooking_fire',
    skillId: 'cooking',
    name: 'Cooking Fire',
    requiredLevel: 1,
    actionIds: ['cook_herring', 'cook_trout'],
  },
]

export const cookingActions: Action[] = [
  {
    id: 'cook_herring',
    skillId: 'cooking',
    locationId: 'cooking_fire',
    name: 'Cook Herring',
    durationMs: [2500, 4000],
    xp: 15,
    requiredLevel: 1,
    inputs: [{ itemId: 'raw_herring', qty: 1 }],
    // Static burn chance for now — Melvor scales this down with level, which
    // is a natural follow-up once per-action level-scaled odds are needed
    // elsewhere too (worth generalizing rather than special-casing here).
    outputs: [
      { itemId: 'cooked_herring', chance: 0.8, qty: 1 },
      { itemId: 'burnt_food', chance: 0.2, qty: 1 },
    ],
  },
  {
    id: 'cook_trout',
    skillId: 'cooking',
    locationId: 'cooking_fire',
    name: 'Cook Trout',
    durationMs: [3000, 4500],
    xp: 20,
    requiredLevel: 10,
    inputs: [{ itemId: 'raw_trout', qty: 1 }],
    outputs: [
      { itemId: 'cooked_trout', chance: 0.75, qty: 1 },
      { itemId: 'burnt_food', chance: 0.25, qty: 1 },
    ],
  },
]
