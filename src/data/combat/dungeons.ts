/**
 * Dungeons (design doc §9): "package multiple automated encounters into a
 * larger risk/reward run." Structurally close to a CombatArea, but a fixed
 * sequence fought once through instead of a pick-one grind list, plus a
 * one-time completion reward — and real risk: dying partway through ends
 * the run with nothing, same as any other combat defeat.
 *
 * Only 3 enemies exist yet (see combat/enemies.ts), so this first dungeon
 * remixes them into an escalating run rather than needing new bestiary
 * data — more dungeons, or a bigger bestiary to draw from, are both just
 * more data, per README's "Extending the game".
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
]

export const dungeonsById: Record<string, Dungeon> = Object.fromEntries(
  dungeons.map((d) => [d.id, d]),
)
