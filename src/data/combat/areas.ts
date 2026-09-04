import type { CombatArea } from '../types'

export const combatAreas: CombatArea[] = [
  {
    id: 'training_grounds',
    name: 'Training Grounds',
    icon: '⚔️',
    requiredLevel: 1,
    enemyIds: ['giant_rat', 'goblin', 'skeleton_warrior'],
  },
  {
    id: 'shadowfen_marsh',
    name: 'Shadowfen Marsh',
    icon: '🌫️',
    requiredLevel: 25,
    enemyIds: ['bog_troll', 'dark_cultist', 'wraith'],
  },
  {
    id: 'frostfang_highlands',
    name: 'Frostfang Highlands',
    icon: '🐺',
    requiredLevel: 45,
    enemyIds: ['frost_wolf', 'highland_raider', 'stone_giant'],
  },
]
