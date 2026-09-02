/**
 * Pure equipment-stat math. Equip/unequip itself is instant player
 * configuration (not a timed Action), so it lives as store mutations in
 * gameStore.ts — this file only knows how to total up whatever's worn.
 */

import { items } from '../data/items/items'
import type { EquipmentSlot, EquipmentStats } from '../data/types'

export function aggregateEquipmentStats(
  equipment: Partial<Record<EquipmentSlot, string>>,
): Required<EquipmentStats> {
  const total: Required<EquipmentStats> = { accuracy: 0, strength: 0, defence: 0 }
  for (const itemId of Object.values(equipment)) {
    if (!itemId) continue
    const stats = items[itemId]?.equipment?.stats
    if (!stats) continue
    total.accuracy += stats.accuracy ?? 0
    total.strength += stats.strength ?? 0
    total.defence += stats.defence ?? 0
  }
  return total
}
