import type { RanchAnimal } from '../types'

/** Deliberately not a `Skill` registered in `data/index.ts`'s
 *  `skills`/`locations`/`actions` records, same reasoning as
 *  `skills/farming.ts` — Ranching has no Location/Action data, just this
 *  animal table, `RanchingPage`, and a handful of `gameStore` fields. */
export const ranchAnimals: RanchAnimal[] = [
  {
    id: 'animal_chicken',
    name: 'Chicken',
    icon: '🐔',
    animalItemId: 'chicken',
    raiseDurationMs: 60_000,
    produceIntervalMs: 45_000,
    produceItemId: 'egg',
    maxStockpile: 8,
    xpPerCollection: 8,
    requiredLevel: 1,
  },
  {
    id: 'animal_goat',
    name: 'Goat',
    icon: '🐐',
    animalItemId: 'goat',
    raiseDurationMs: 3 * 60_000,
    produceIntervalMs: 90_000,
    produceItemId: 'milk',
    maxStockpile: 8,
    xpPerCollection: 16,
    requiredLevel: 15,
  },
  {
    id: 'animal_sheep',
    name: 'Sheep',
    icon: '🐑',
    animalItemId: 'sheep',
    raiseDurationMs: 6 * 60_000,
    produceIntervalMs: 3 * 60_000,
    produceItemId: 'wool',
    maxStockpile: 8,
    xpPerCollection: 28,
    requiredLevel: 28,
  },
  {
    id: 'animal_cow',
    name: 'Cow',
    icon: '🐄',
    animalItemId: 'cow',
    raiseDurationMs: 12 * 60_000,
    produceIntervalMs: 5 * 60_000,
    produceItemId: 'cowhide',
    maxStockpile: 6,
    xpPerCollection: 45,
    requiredLevel: 42,
  },
  {
    id: 'animal_warhorse',
    name: 'Warhorse',
    icon: '🐎',
    animalItemId: 'warhorse',
    raiseDurationMs: 30 * 60_000,
    produceIntervalMs: 10 * 60_000,
    produceItemId: 'horseshoe',
    maxStockpile: 5,
    xpPerCollection: 75,
    requiredLevel: 58,
  },
]

export const ranchAnimalsById: Record<string, RanchAnimal> = Object.fromEntries(
  ranchAnimals.map((a) => [a.id, a]),
)

/** Ranching level required to unlock each pen, by index — same fix as
 *  Farming's `farmingPlotUnlockLevels`, and the same reasoning: 6 pens
 *  instead of the original fixed 4, the first five roughly tracking each
 *  animal tier, the last one a late-game reward past the Warhorse's level
 *  58. */
export const ranchPenUnlockLevels: number[] = [1, 12, 24, 36, 50, 65]
