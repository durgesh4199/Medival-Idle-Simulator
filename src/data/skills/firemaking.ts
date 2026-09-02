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
    actionIds: ['burn_logs'],
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
]
