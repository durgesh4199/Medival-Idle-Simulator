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
]
