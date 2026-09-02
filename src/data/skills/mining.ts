import type { Action, Location, Skill } from '../types'

export const miningSkill: Skill = {
  id: 'mining',
  name: 'Mining',
  icon: '⛏️',
  description: 'Mine ore and coal from rock veins. Feeds Smithing’s furnace.',
}

export const miningLocations: Location[] = [
  {
    id: 'quarry',
    skillId: 'mining',
    name: 'Quarry',
    requiredLevel: 1,
    actionIds: ['mine_copper', 'mine_tin', 'mine_iron', 'mine_coal', 'mine_rune_essence'],
  },
]

export const miningActions: Action[] = [
  {
    id: 'mine_copper',
    skillId: 'mining',
    locationId: 'quarry',
    name: 'Copper Rock',
    durationMs: [3000, 5000],
    xp: 10,
    requiredLevel: 1,
    outputs: [{ itemId: 'copper_ore', chance: 1, qty: 1 }],
  },
  {
    id: 'mine_tin',
    skillId: 'mining',
    locationId: 'quarry',
    name: 'Tin Rock',
    durationMs: [3000, 5000],
    xp: 10,
    requiredLevel: 1,
    outputs: [{ itemId: 'tin_ore', chance: 1, qty: 1 }],
  },
  {
    id: 'mine_iron',
    skillId: 'mining',
    locationId: 'quarry',
    name: 'Iron Rock',
    durationMs: [4500, 7000],
    xp: 25,
    requiredLevel: 15,
    outputs: [{ itemId: 'iron_ore', chance: 1, qty: 1 }],
  },
  {
    id: 'mine_coal',
    skillId: 'mining',
    locationId: 'quarry',
    name: 'Coal Rock',
    durationMs: [5000, 8000],
    xp: 30,
    requiredLevel: 20,
    outputs: [{ itemId: 'coal', chance: 1, qty: 1 }],
  },
  // Feeds Runecrafting, mirroring "Mining -> Rune Essence -> Runecrafting"
  // from the design doc's resource-chain list.
  {
    id: 'mine_rune_essence',
    skillId: 'mining',
    locationId: 'quarry',
    name: 'Rune Essence Rock',
    durationMs: [2500, 4000],
    xp: 8,
    requiredLevel: 1,
    outputs: [{ itemId: 'rune_essence', chance: 1, qty: 1 }],
  },
]
