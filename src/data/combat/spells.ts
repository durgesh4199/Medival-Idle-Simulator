/**
 * Spells (design doc §6's Combat Setup: "... + Spell + Ammunition/Runes +
 * ..."; §5's resource chain: "Runecrafting -> Runes -> Magic -> Combat").
 * The chain README has called out as unclosed since Runecrafting shipped —
 * runes existed, but nothing in Combat consumed them. A Spell closes it:
 * an alternate attack that costs runes per cast in exchange for a flat
 * power roll that doesn't depend on Strength, instead of a percentage
 * modifier the way Prayer works.
 *
 * One active Spell at a time (mirrors `selectedPrayerId`/`selectedFoodItemId`),
 * gated on Attack level as a stand-in for "combat maturity" — same
 * reasoning as Prayer being gated on Defence, since neither has its own
 * skill yet. Casting an unaffordable spell (out of runes) silently falls
 * back to a normal physical swing rather than skipping the attack
 * entirely — running out mid-fight degrades gracefully instead of
 * stalling combat.
 */

export interface SpellCost {
  itemId: string
  qty: number
}

export interface Spell {
  id: string
  name: string
  icon: string
  description: string
  requiredLevel: number
  /** Consumed on every cast attempt, hit or miss — casting is what costs
   *  the reagent, not landing the hit. */
  cost: SpellCost[]
  /** Replaces the player's normal Strength-derived max hit while this
   *  spell successfully casts — rolled the same way (`rollDamage`), just
   *  from a different ceiling. */
  power: number
}

export const spells: Spell[] = [
  {
    id: 'air_bolt',
    name: 'Air Bolt',
    icon: '🌀',
    description: 'A quick bolt of wind. Costs 1 Air Rune per cast.',
    requiredLevel: 1,
    cost: [{ itemId: 'air_rune', qty: 1 }],
    power: 5,
  },
  {
    id: 'water_bolt',
    name: 'Water Bolt',
    icon: '💧',
    description: 'A denser bolt of water. Costs 1 Water Rune + 1 Air Rune per cast.',
    requiredLevel: 10,
    cost: [
      { itemId: 'water_rune', qty: 1 },
      { itemId: 'air_rune', qty: 1 },
    ],
    power: 9,
  },
  {
    id: 'fire_bolt',
    name: 'Fire Bolt',
    icon: '🔺',
    description: 'A searing bolt of flame. Costs 1 Fire Rune + 2 Air Runes per cast.',
    requiredLevel: 25,
    cost: [
      { itemId: 'fire_rune', qty: 1 },
      { itemId: 'air_rune', qty: 2 },
    ],
    power: 15,
  },
  {
    id: 'chaos_bolt',
    name: 'Chaos Bolt',
    icon: '🌪️',
    description: 'Raw chaotic force. Costs 1 Chaos Rune per cast.',
    requiredLevel: 45,
    cost: [{ itemId: 'chaos_rune', qty: 1 }],
    power: 24,
  },
  {
    id: 'death_bolt',
    name: 'Death Bolt',
    icon: '💀',
    description: 'A lance of pure entropy. Costs 1 Death Rune + 1 Chaos Rune per cast.',
    requiredLevel: 70,
    cost: [
      { itemId: 'death_rune', qty: 1 },
      { itemId: 'chaos_rune', qty: 1 },
    ],
    power: 38,
  },
]

export const spellsById: Record<string, Spell> = Object.fromEntries(
  spells.map((s) => [s.id, s]),
)
