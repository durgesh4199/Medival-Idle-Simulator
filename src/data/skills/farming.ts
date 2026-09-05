import type { FarmingCrop } from '../types'

/** Deliberately not a `Skill` registered in `data/index.ts`'s
 *  `skills`/`locations`/`actions` records the way the other 8 skills are —
 *  Farming has no Location/Action data at all, just this crop table,
 *  `FarmingPage`, and a handful of `gameStore` fields, the same "own
 *  system, own page" shape Combat/Dungeons already use rather than
 *  SkillPanel's generic one. */
export const farmingCrops: FarmingCrop[] = [
  {
    id: 'crop_barley',
    name: 'Barley',
    icon: '🌾',
    seedItemId: 'barley_seed',
    cropItemId: 'barley',
    growDurationMs: 2 * 60_000,
    xp: 25,
    requiredLevel: 1,
  },
  {
    id: 'crop_carrot',
    name: 'Carrot',
    icon: '🥕',
    seedItemId: 'carrot_seed',
    cropItemId: 'carrot',
    growDurationMs: 6 * 60_000,
    xp: 45,
    requiredLevel: 12,
  },
  {
    id: 'crop_potato',
    name: 'Potato',
    icon: '🥔',
    seedItemId: 'potato_seed',
    cropItemId: 'potato',
    growDurationMs: 15 * 60_000,
    xp: 75,
    requiredLevel: 24,
  },
  {
    id: 'crop_pumpkin',
    name: 'Pumpkin',
    icon: '🎃',
    seedItemId: 'pumpkin_seed',
    cropItemId: 'pumpkin',
    growDurationMs: 35 * 60_000,
    xp: 120,
    requiredLevel: 38,
  },
  {
    id: 'crop_golden_wheat',
    name: 'Golden Wheat',
    icon: '🌟',
    seedItemId: 'golden_wheat_seed',
    cropItemId: 'golden_wheat',
    growDurationMs: 90 * 60_000,
    xp: 200,
    requiredLevel: 55,
  },
]

export const farmingCropsById: Record<string, FarmingCrop> = Object.fromEntries(
  farmingCrops.map((c) => [c.id, c]),
)

/** Farming level required to unlock each plot, by index — the "no
 *  plot-unlock progression yet" gap the README flagged when Farming
 *  shipped. 6 plots instead of the original fixed 4: the first four track
 *  each crop tier (a new plot arriving alongside something new to grow in
 *  it), the last two are a late-game reward for training past Golden
 *  Wheat's level 55, since otherwise there'd be nothing left to reach for. */
export const farmingPlotUnlockLevels: number[] = [1, 10, 20, 32, 45, 60]
