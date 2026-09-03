/**
 * Prayers (design doc §6: "Combat Setup = Weapon + Armour + Food + Prayer +
 * Spell + ..."). The first real *modifier* on `computePlayerCombatStats`
 * rather than another gathering/reward system — everything built so far
 * (Mastery, Pets, equipment) adds flat stats or speed; a Prayer instead
 * scales a stat by a percentage, applied at combat-stat computation time.
 *
 * Deliberately one active Prayer at a time (mirrors `selectedFoodItemId`),
 * each boosting a *different* stat rather than one universal "best"
 * prayer — the design doc's "different builds for different enemy
 * profiles" made concrete: precision against an evasive enemy, protection
 * against a hard-hitting one, and so on. No Prayer Points/drain resource —
 * that would be a second economy layered on top of a feature whose whole
 * point here is demonstrating the modifier mechanism; the strategic choice
 * comes entirely from picking one stat to lean into, not from managing a
 * consumable.
 */

export interface PrayerModifiers {
  /** Percentage bonuses (0.1 = +10%), applied multiplicatively to the base
   *  stat in computePlayerCombatStats — field names match PlayerCombatStats
   *  directly so there's no ambiguity about what each one scales. */
  accuracyPercent?: number
  maxHitPercent?: number
  evasionPercent?: number
  maxHpPercent?: number
}

export interface Prayer {
  id: string
  name: string
  icon: string
  description: string
  /** Gated on Defence level — Prayer has no skill of its own yet, and
   *  Defence is the closest existing stand-in for "combat maturity". */
  requiredLevel: number
  modifiers: PrayerModifiers
}

export const prayers: Prayer[] = [
  {
    id: 'precision',
    name: 'Prayer of Precision',
    icon: '🎯',
    description: '+10% Accuracy.',
    requiredLevel: 1,
    modifiers: { accuracyPercent: 0.1 },
  },
  {
    id: 'might',
    name: 'Prayer of Might',
    icon: '💪',
    description: '+10% Max Hit.',
    requiredLevel: 5,
    modifiers: { maxHitPercent: 0.1 },
  },
  {
    id: 'protection',
    name: 'Prayer of Protection',
    icon: '🛡️',
    description: '+12% Evasion.',
    requiredLevel: 10,
    modifiers: { evasionPercent: 0.12 },
  },
  {
    id: 'vigor',
    name: 'Prayer of Vigor',
    icon: '❤️',
    description: '+15% Max HP.',
    requiredLevel: 15,
    modifiers: { maxHpPercent: 0.15 },
  },
]

export const prayersById: Record<string, Prayer> = Object.fromEntries(
  prayers.map((p) => [p.id, p]),
)
