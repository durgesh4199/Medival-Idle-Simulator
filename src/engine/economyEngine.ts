/**
 * Buying/selling math. Every item already carries a `value` (design doc
 * §7's "Item = Sources + Uses + Value + ..."), so the economy needed no new
 * data on items themselves — just these two pure functions and a curated
 * list of what a shop stocks (data/shop.ts).
 */

import type { Item } from '../data/types'

/** Shops buy at less than an item is nominally worth — the standard idle
 *  genre spread that keeps flipping items for profit from being free money. */
const SELL_PRICE_MULTIPLIER = 0.6
/** Shops sell stock at a markup over that same nominal value. */
const BUY_PRICE_MULTIPLIER = 1.5

export function getSellPrice(item: Item): number {
  return Math.floor((item.value ?? 0) * SELL_PRICE_MULTIPLIER)
}

/** Whether the shop will buy this item at all — worthless junk (value 0,
 *  like Junk or Burnt Food) isn't a sink, it's just clutter to discard. */
export function isSellable(item: Item): boolean {
  return getSellPrice(item) > 0
}

export function getBuyPrice(item: Item): number {
  return Math.max(1, Math.ceil((item.value ?? 0) * BUY_PRICE_MULTIPLIER))
}
