/**
 * Pure equipment-stat math. Equip/unequip itself is instant player
 * configuration (not a timed Action), so it lives as store mutations in
 * gameStore.ts — this file only knows how to total up whatever's worn.
 */

import { items } from '../data/items/items'
import type { EquipmentSlot } from '../data/types'

/** The additive combat bonuses — everything in EquipmentStats except
 *  attackSpeedMs, which only makes sense read off the weapon slot alone
 *  (see getWeaponAttackSpeedMs), not summed across every slot. */
export interface AggregatedEquipmentStats {
  accuracy: number
  strength: number
  defence: number
}

export function aggregateEquipmentStats(
  equipment: Partial<Record<EquipmentSlot, string>>,
): AggregatedEquipmentStats {
  const total: AggregatedEquipmentStats = { accuracy: 0, strength: 0, defence: 0 }
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

/** The equipped weapon's attack speed, or undefined if unarmed / the
 *  weapon has no speed set — the caller decides the unarmed fallback. */
export function getWeaponAttackSpeedMs(
  equipment: Partial<Record<EquipmentSlot, string>>,
): number | undefined {
  const weaponId = equipment.weapon
  if (!weaponId) return undefined
  return items[weaponId]?.equipment?.stats.attackSpeedMs
}
