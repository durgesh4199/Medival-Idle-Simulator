import type { Action, Location, Skill } from '../types'

export const firemakingSkill: Skill = {
  id: 'firemaking',
  name: 'Firemaking',
  icon: '🔥',
  description: 'Burn logs gathered from Woodcutting for XP, Ash, and Charcoal.',
}

// Firemaking has one "location" (the campfire) with a spot per log tier.
export const firemakingLocations: Location[] = [
  {
    id: 'campfire',
    skillId: 'firemaking',
    name: 'Campfire',
    requiredLevel: 1,
    actionIds: ['burn_logs', 'burn_oak_logs', 'burn_willow_logs', 'burn_yew_logs'],
  },
]

export const firemakingActions: Action[] = [
  {
    id: 'burn_logs',
    skillId: 'firemaking',
    locationId: 'campfire',
    name: 'Burn Logs',
    durationMs: [3000, 5000],
    xp: 20,
    requiredLevel: 1,
    inputs: [{ itemId: 'logs', qty: 1 }],
    outputs: [
      { itemId: 'ash', chance: 0.7, qty: 1 },
      { itemId: 'charcoal', chance: 0.3, qty: 1 },
    ],
  },
  {
    id: 'burn_oak_logs',
    skillId: 'firemaking',
    locationId: 'campfire',
    name: 'Burn Oak Logs',
    durationMs: [3500, 5500],
    xp: 32,
    requiredLevel: 10,
    inputs: [{ itemId: 'oak_logs', qty: 1 }],
    outputs: [
      { itemId: 'ash', chance: 0.6, qty: 1 },
      { itemId: 'charcoal', chance: 0.4, qty: 1 },
    ],
  },
  {
    id: 'burn_willow_logs',
    skillId: 'firemaking',
    locationId: 'campfire',
    name: 'Burn Willow Logs',
    durationMs: [4500, 6500],
    xp: 45,
    requiredLevel: 30,
    inputs: [{ itemId: 'willow_logs', qty: 1 }],
    outputs: [
      { itemId: 'ash', chance: 0.5, qty: 1 },
      { itemId: 'charcoal', chance: 0.5, qty: 1 },
    ],
  },
  {
    id: 'burn_yew_logs',
    skillId: 'firemaking',
    locationId: 'campfire',
    name: 'Burn Yew Logs',
    durationMs: [5500, 7500],
    xp: 70,
    requiredLevel: 50,
    inputs: [{ itemId: 'yew_logs', qty: 1 }],
    outputs: [
      { itemId: 'ash', chance: 0.4, qty: 1 },
      { itemId: 'charcoal', chance: 0.6, qty: 1 },
    ],
  },
]
