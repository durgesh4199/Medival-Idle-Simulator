/**
 * A curated list of what the General Store stocks. Nothing rare or
 * equipment-tier is buyable — the shop is a convenience for staples you'd
 * otherwise have to gather, not a shortcut past progression.
 */
export const shopBuyableItemIds: string[] = [
  'cooked_herring',
  'cooked_trout',
  'logs',
  'bronze_bar',
  // Farming seeds — there's no separate seed-gathering step, so the Shop is
  // the one source for them, same "staples, not a progression shortcut"
  // role it already plays for the rest of this list.
  'barley_seed',
  'carrot_seed',
  'potato_seed',
  'pumpkin_seed',
  'golden_wheat_seed',
]
