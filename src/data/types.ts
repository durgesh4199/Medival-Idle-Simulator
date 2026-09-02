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

export interface Item {
  id: string
  name: string
  /** Emoji placeholder until real art exists. */
  icon: string
  /** Base gold value when sold, if any. */
  value?: number
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

export interface Skill {
  id: SkillId
  name: string
  icon: string
  description: string
}
