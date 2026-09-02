import type { Action, Location, Skill } from '../types'

export const woodcuttingSkill: Skill = {
  id: 'woodcutting',
  name: 'Woodcutting',
  icon: '🪓',
  description: 'Chop trees for Logs. Feeds Firemaking, and later Fletching/construction.',
}

export const woodcuttingLocations: Location[] = [
  {
    id: 'forest_edge',
    skillId: 'woodcutting',
    name: 'Forest Edge',
    requiredLevel: 1,
    actionIds: ['chop_normal_tree', 'chop_oak_tree'],
  },
]

export const woodcuttingActions: Action[] = [
  {
    id: 'chop_normal_tree',
    skillId: 'woodcutting',
    locationId: 'forest_edge',
    name: 'Normal Tree',
    durationMs: [3000, 5000],
    xp: 10,
    requiredLevel: 1,
    outputs: [{ itemId: 'logs', chance: 1, qty: 1 }],
  },
  {
    id: 'chop_oak_tree',
    skillId: 'woodcutting',
    locationId: 'forest_edge',
    name: 'Oak Tree',
    durationMs: [4000, 6500],
    xp: 18,
    requiredLevel: 10,
    outputs: [{ itemId: 'oak_logs', chance: 1, qty: 1 }],
  },
]
