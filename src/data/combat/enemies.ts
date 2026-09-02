import type { Enemy } from '../types'

// Stats here are hand-tuned for a level-1-20ish player, same spirit as the
// early skill actions — not a reverse-engineered Melvor drop table. See
// docs/design-document.md §6 for the shape this is modeling
// (accuracy/evasion/max hit/attack speed), and its §16 note that exact
// formulas and drop tables are reconstructed, not confirmed.
export const enemies: Enemy[] = [
  {
    id: 'giant_rat',
    name: 'Giant Rat',
    icon: '🐀',
    hp: 20,
    accuracy: 20,
    maxHit: 2,
    attackSpeedMs: 3000,
    evasion: 15,
    xpReward: 30,
    goldDrop: [1, 5],
    loot: [{ itemId: 'rat_tail', chance: 0.5, qty: 1 }],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    icon: '👹',
    hp: 45,
    accuracy: 35,
    maxHit: 4,
    attackSpeedMs: 2800,
    evasion: 30,
    xpReward: 60,
    goldDrop: [5, 15],
    loot: [
      { itemId: 'bones', chance: 1, qty: 1 },
      { itemId: 'goblin_ear', chance: 0.4, qty: 1 },
    ],
  },
  {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    icon: '💀',
    hp: 70,
    accuracy: 50,
    maxHit: 6,
    attackSpeedMs: 3200,
    evasion: 45,
    xpReward: 100,
    goldDrop: [10, 25],
    loot: [
      { itemId: 'bones', chance: 1, qty: 1 },
      // Ties back into Mining's item, and a rare high-value flavor drop.
      { itemId: 'iron_ore', chance: 0.15, qty: 1 },
      { itemId: 'ancient_coin', chance: 0.02, qty: 1 },
    ],
  },
]
