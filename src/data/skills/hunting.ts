import type { Action, Location, Skill } from '../types'

export const huntingSkill: Skill = {
  id: 'hunting',
  name: 'Hunting',
  icon: '🪤',
  description: 'Trap animals for fur, feathers, and meat, with a chance at rare pelts.',
}

export const huntingLocations: Location[] = [
  {
    id: 'woodland_trail',
    skillId: 'hunting',
    name: 'Woodland Trail',
    requiredLevel: 1,
    actionIds: ['trap_rabbit', 'trap_pheasant', 'trap_fox'],
  },
]

export const huntingActions: Action[] = [
  {
    id: 'trap_rabbit',
    skillId: 'hunting',
    locationId: 'woodland_trail',
    name: 'Trap Rabbit',
    durationMs: [4000, 6000],
    xp: 12,
    requiredLevel: 1,
    outputs: [
      { itemId: 'fur', chance: 0.5, qty: 1 },
      { itemId: 'raw_meat', chance: 0.5, qty: 1 },
    ],
  },
  {
    id: 'trap_pheasant',
    skillId: 'hunting',
    locationId: 'woodland_trail',
    name: 'Trap Pheasant',
    durationMs: [5000, 7000],
    xp: 20,
    requiredLevel: 10,
    outputs: [
      { itemId: 'feathers', chance: 0.6, qty: 1 },
      { itemId: 'raw_meat', chance: 0.4, qty: 1 },
    ],
  },
  {
    id: 'trap_fox',
    skillId: 'hunting',
    locationId: 'woodland_trail',
    name: 'Trap Fox',
    durationMs: [6000, 9000],
    xp: 30,
    requiredLevel: 20,
    outputs: [
      { itemId: 'fur', chance: 0.7, qty: 1 },
      { itemId: 'raw_meat', chance: 0.3, qty: 1 },
    ],
    specialOutputs: [{ itemId: 'silver_fox_pelt', chance: 0.01, qty: 1 }],
  },
]
