/**
 * Core content types.
 *
 * Everything the game "knows about" — skills, locations, actions, items — is
 * described here as plain data. The engine (src/engine) contains no
 * skill-specific logic; it only knows how to run whatever an Action
 * describes. Adding new content should never require touching the engine.
 */

export type SkillId =
  | 'fishing'
  | 'firemaking'
  | 'woodcutting'
  | 'mining'
  | 'smithing'
  | 'cooking'
  | 'hunting'
  | 'runecrafting'

export type EquipmentSlot =
  | 'helmet'
  | 'body'
  | 'legs'
  | 'boots'
  | 'gloves'
  | 'ring'
  | 'amulet'
  | 'weapon'
  | 'shield'

/**
 * Combat stat bonuses an equipped item grants. `attackSpeedMs` only matters
 * on a weapon — it's here rather than on a separate weapon-only type so
 * `EquipmentStats` stays one shape for every slot.
 */
export interface EquipmentStats {
  accuracy?: number
  strength?: number
  defence?: number
  attackSpeedMs?: number
}

/** Broad grouping used to filter the Bank UI. Not used by any engine logic. */
export type ItemCategory = 'resource' | 'food' | 'equipment'

export interface Item {
  id: string
  name: string
  /** Emoji placeholder until real art exists. */
  icon: string
  /** Base gold value when sold, if any. */
  value?: number
  category?: ItemCategory
  /** Present only for items that can be worn/wielded. */
  equipment?: { slot: EquipmentSlot; stats: EquipmentStats }
  /** Present only for food — HP restored when eaten in combat. */
  healAmount?: number
}

/** A possible reward from an action, rolled independently on each attempt. */
export interface ItemDrop {
  itemId: string
  /** 0-1 chance to receive this drop on a single action completion. */
  chance: number
  qty: number
}

export interface Action {
  id: string
  skillId: SkillId
  locationId: string
  name: string
  /** Action duration range in milliseconds; a random value is rolled between them. */
  durationMs: [min: number, max: number]
  xp: number
  requiredLevel: number
  /** Items consumed on each attempt. The action cannot start without them. */
  inputs?: { itemId: string; qty: number }[]
  /** Guaranteed-table drops, one is chosen per completion (weighted by chance). */
  outputs: ItemDrop[]
  /** Rare drops rolled independently and IN ADDITION to a normal output. */
  specialOutputs?: ItemDrop[]
}

export interface Location {
  id: string
  skillId: SkillId
  name: string
  requiredLevel: number
  actionIds: string[]
}

/**
 * Farming (design doc §12: "automated planting/harvesting/composting").
 * Deliberately not an `Action` — every other skill is "start it, it repeats
 * on a rolled duration while you watch or leave the tab open"; Farming is
 * "plant it, then genuinely don't come back for real minutes/hours,
 * whether the tab is open or not." `growDurationMs` is minutes, not the
 * few-second `durationMs` every other skill uses, and readiness is a plain
 * timestamp comparison rather than something a tick loop resolves — which
 * is what lets a crop planted right before closing the tab still be ready
 * exactly on schedule with zero offline-catchup code of its own, even past
 * the 24h cap every other system's offline progress is clamped to.
 */
export interface FarmingCrop {
  id: string
  name: string
  icon: string
  seedItemId: string
  cropItemId: string
  growDurationMs: number
  xp: number
  requiredLevel: number
}

/**
 * Ranching (design doc §12: "an additional passive-production style
 * skill," named right alongside Farming). Deliberately given a different
 * production shape rather than reskinning Farming's plot: a Farming plot
 * yields *one* harvest and goes empty; a Ranch pen's animal, once mature,
 * keeps producing on a recurring `produceIntervalMs` cycle indefinitely —
 * "passive production," not "one-shot" — capped at `maxStockpile` so an
 * animal left uncollected for a very long absence doesn't accumulate
 * without limit (the pen "fills up," same idea a real coop/pen has).
 */
export interface RanchAnimal {
  id: string
  name: string
  icon: string
  /** Consumed from inventory to place this animal in a pen. */
  animalItemId: string
  /** Time from placing until the animal starts producing. */
  raiseDurationMs: number
  /** Once mature, one batch of `produceItemId` accumulates every this many
   *  ms, up to `maxStockpile`. */
  produceIntervalMs: number
  produceItemId: string
  maxStockpile: number
  xpPerCollection: number
  requiredLevel: number
}

export interface Skill {
  id: SkillId
  name: string
  icon: string
  description: string
}

/**
 * Combat is its own major layer in the design doc (§2, §6) — separate from
 * the production SKILLS above, not a variant of Action/Location. Attack,
 * Strength, Defence, and Hitpoints are trained only by fighting, so they're
 * plain string keys into the same `skillXp` map skills use, not part of
 * SkillId — nothing about them belongs in the Skills sidebar/SkillPanel.
 */
export const COMBAT_SKILL_IDS = ['attack', 'strength', 'defence', 'hitpoints'] as const
export type CombatSkillId = (typeof COMBAT_SKILL_IDS)[number]

export interface Enemy {
  id: string
  name: string
  icon: string
  hp: number
  accuracy: number
  maxHit: number
  attackSpeedMs: number
  evasion: number
  /** Bonus combat XP on kill, split evenly across the 4 combat skills. */
  xpReward: number
  goldDrop: [min: number, max: number]
  /** Each entry is rolled independently — unlike Action.outputs, a kill can
   *  drop several of these in the same event, not just one. */
  loot: ItemDrop[]
}

export interface CombatArea {
  id: string
  name: string
  icon: string
  /** Gated on Attack level, same as Dungeon.requiredLevel — a soft
   *  deterrent alongside the enemies' own difficulty, not a hard wall on
   *  any individual fight within an unlocked area. */
  requiredLevel: number
  enemyIds: string[]
}

/**
 * Quests (design doc §9): "A quest can require gathering, training,
 * crafting, defeating enemies, or completing a special activity" — those
 * four verbs are exactly the four requirement kinds below. `questComplete`
 * is the fifth, letting quests chain into each other.
 */
export type QuestRequirement =
  | { type: 'skillLevel'; skillId: string; level: number }
  | { type: 'itemCount'; itemId: string; qty: number }
  | { type: 'kills'; enemyId: string; count: number }
  | { type: 'questComplete'; questId: string }

export interface QuestReward {
  gold?: number
  /** Keyed by SkillId or CombatSkillId — same shape as skillXp. */
  xp?: Record<string, number>
  items?: { itemId: string; qty: number }[]
}

export interface Quest {
  id: string
  name: string
  icon: string
  description: string
  requirements: QuestRequirement[]
  rewards: QuestReward
}

/**
 * Achievements (design doc §9): "secondary objectives across otherwise
 * normal play." Deliberately a *subset* of Quest's requirement kinds —
 * skillLevel, kills, questComplete, plus a new dungeonCleared — every one
 * of which is monotonic (a level, a lifetime kill/clear count, or a
 * completed quest never becomes false again once true). Quest's
 * `itemCount` is left out on purpose: an achievement is a permanent
 * milestone, not a "do you currently hold X" check, so it should never be
 * able to un-complete itself by the player later selling/using the items.
 */
export type AchievementRequirement =
  | { type: 'skillLevel'; skillId: string; level: number }
  | { type: 'kills'; enemyId: string; count: number }
  | { type: 'questComplete'; questId: string }
  | { type: 'dungeonCleared'; dungeonId: string; count: number }

export interface AchievementReward {
  gold?: number
  /** Keyed by SkillId or CombatSkillId — same shape as skillXp. */
  xp?: Record<string, number>
}

export interface Achievement {
  id: string
  name: string
  icon: string
  description: string
  requirements: AchievementRequirement[]
  reward?: AchievementReward
}

/**
 * Pets (design doc §9): "rare collection rewards plus passive bonuses."
 * One pet per gathering/production skill (a small permanent speed bonus on
 * that skill once found) plus one Combat pet (a permanent bonus to all
 * combat-skill XP). Ownership is binary and permanent — ownedPetIds is a
 * collection tracker in the same spirit as completedQuestIds, not a
 * stacking buff: finding a pet again (if it were possible) wouldn't do
 * anything further.
 */
export type PetSource =
  | { type: 'skill'; skillId: SkillId }
  | { type: 'combat' }
  | { type: 'farming' }
  | { type: 'ranching' }

export interface Pet {
  id: string
  name: string
  icon: string
  description: string
  source: PetSource
  /** 0-1. A skill pet reduces that skill's action duration by this much;
   *  the Combat pet increases all combat-skill XP gained by this much. */
  bonusPercent: number
}
