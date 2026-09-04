/**
 * Dungeons (design doc §9): "package multiple automated encounters into a
 * larger risk/reward run." Structurally close to a CombatArea, but a fixed
 * sequence fought once through instead of a pick-one grind list, plus a
 * one-time completion reward — and real risk: dying partway through ends
 * the run with nothing, same as any other combat defeat.
 *
 * Goblin Den remixes the Training Grounds' 3 enemies into an escalating
 * run; Sunken Crypt does the same with Shadowfen Marsh's tougher trio,
 * Frozen Bastion with Frostfang Highlands', and Emberfall Crucible with
 * Emberfall Wastes' — more dungeons, or a bigger bestiary to draw from,
 * are both just more data, per README's "Extending the game".
 */

export interface Dungeon {
  id: string
  name: string
  icon: string
  description: string
  /** Fought in this exact order, once each, unlike a CombatArea's
   *  pick-one-and-grind enemy list. */
  enemyIds: string[]
  requiredLevel: number
  completionReward: {
    gold?: number
    /** Keyed by CombatSkillId — same shape combat XP already uses. */
    xp?: Record<string, number>
    items?: { itemId: string; qty: number }[]
  }
}

export const dungeons: Dungeon[] = [
  {
    id: 'goblin_den',
    name: 'Goblin Den',
    icon: '🏚️',
    description:
      'A collapsed mine goblins have claimed as a warren. Clear it room by room — ' +
      'retreating loses the run.',
    enemyIds: ['giant_rat', 'giant_rat', 'goblin', 'goblin', 'skeleton_warrior'],
    requiredLevel: 5,
    completionReward: {
      gold: 150,
      xp: { attack: 120, strength: 120, defence: 120, hitpoints: 120 },
      items: [
        { itemId: 'iron_bar', qty: 3 },
        { itemId: 'bronze_shield', qty: 1 },
      ],
    },
  },
  {
    id: 'sunken_crypt',
    name: 'Sunken Crypt',
    icon: '⚰️',
    description:
      'A flooded tomb where Shadowfen Marsh buries what it drags under. Deeper, ' +
      'darker, and considerably less forgiving than the Goblin Den.',
    enemyIds: ['dark_cultist', 'dark_cultist', 'bog_troll', 'wraith', 'wraith'],
    requiredLevel: 30,
    completionReward: {
      gold: 400,
      xp: { attack: 250, strength: 250, defence: 250, hitpoints: 250 },
      items: [
        { itemId: 'iron_bar', qty: 5 },
        { itemId: 'wraith_essence', qty: 1 },
      ],
    },
  },
  {
    id: 'frozen_bastion',
    name: 'Frozen Bastion',
    icon: '🏔️',
    description:
      'A fortress carved into the Frostfang ice, held by raiders and worse. The ' +
      "toughest run yet — bring everything the Sunken Crypt taught you.",
    enemyIds: ['frost_wolf', 'frost_wolf', 'highland_raider', 'highland_raider', 'stone_giant'],
    requiredLevel: 55,
    completionReward: {
      gold: 800,
      xp: { attack: 400, strength: 400, defence: 400, hitpoints: 400 },
      items: [
        { itemId: 'mithril_bar', qty: 5 },
        { itemId: 'giant_core', qty: 1 },
      ],
    },
  },
  {
    id: 'emberfall_crucible',
    name: 'Emberfall Crucible',
    icon: '🌋',
    description:
      'A forge built into the volcano itself, where the Wastes send whatever the ' +
      'surface can no longer hold. The deepest run yet.',
    enemyIds: ['infernal_hound', 'infernal_hound', 'ash_wraith', 'ash_wraith', 'molten_golem'],
    requiredLevel: 80,
    completionReward: {
      gold: 1500,
      xp: { attack: 600, strength: 600, defence: 600, hitpoints: 600 },
      items: [
        { itemId: 'rune_bar', qty: 5 },
        { itemId: 'molten_core', qty: 1 },
      ],
    },
  },
]

export const dungeonsById: Record<string, Dungeon> = Object.fromEntries(
  dungeons.map((d) => [d.id, d]),
)
