import type { Action, Location, Skill } from '../types'

export const fishingSkill: Skill = {
  id: 'fishing',
  name: 'Fishing',
  icon: '🎣',
  description: 'Catch fish at various spots to sell, cook, or use in recipes.',
}

export const fishingLocations: Location[] = [
  {
    id: 'shallow_shores',
    skillId: 'fishing',
    name: 'Shallow Shores',
    requiredLevel: 1,
    actionIds: ['shallow_shores_quiet_bend'],
  },
  {
    id: 'shrapnel_river',
    skillId: 'fishing',
    name: 'Shrapnel River',
    requiredLevel: 20,
    actionIds: [
      'shrapnel_river_quiet_bend',
      'shrapnel_river_pebble_bank',
      'shrapnel_river_rapid_runs',
    ],
  },
]

export const fishingActions: Action[] = [
  {
    id: 'shallow_shores_quiet_bend',
    skillId: 'fishing',
    locationId: 'shallow_shores',
    name: 'Quiet Bend',
    durationMs: [6000, 10000],
    xp: 12,
    requiredLevel: 1,
    outputs: [
      { itemId: 'raw_herring', chance: 0.6, qty: 1 },
      { itemId: 'junk', chance: 0.4, qty: 1 },
    ],
  },
  {
    id: 'shrapnel_river_quiet_bend',
    skillId: 'fishing',
    locationId: 'shrapnel_river',
    name: 'Quiet Bend',
    durationMs: [7000, 11000],
    xp: 30,
    requiredLevel: 20,
    outputs: [
      { itemId: 'raw_herring', chance: 0.55, qty: 1 },
      { itemId: 'junk', chance: 0.45, qty: 1 },
    ],
  },
  // Matches the "Pebble Bank" spot shown in the reference screenshot:
  // 40% Raw Herring, 50% Raw Trout, 10% Junk, +38 XP, 8-13s, with a rare
  // 0.8% special drop rolled independently of the normal catch.
  {
    id: 'shrapnel_river_pebble_bank',
    skillId: 'fishing',
    locationId: 'shrapnel_river',
    name: 'Pebble Bank',
    durationMs: [8000, 13000],
    xp: 38,
    requiredLevel: 20,
    outputs: [
      { itemId: 'raw_herring', chance: 0.4, qty: 1 },
      { itemId: 'raw_trout', chance: 0.5, qty: 1 },
      { itemId: 'junk', chance: 0.1, qty: 1 },
    ],
    specialOutputs: [{ itemId: 'rusty_ancient_dagger', chance: 0.008, qty: 1 }],
  },
  {
    id: 'shrapnel_river_rapid_runs',
    skillId: 'fishing',
    locationId: 'shrapnel_river',
    name: 'Rapid Runs',
    durationMs: [9000, 14000],
    xp: 45,
    requiredLevel: 25,
    outputs: [
      { itemId: 'raw_trout', chance: 0.65, qty: 1 },
      { itemId: 'junk', chance: 0.35, qty: 1 },
    ],
  },
]
