import { COMBAT_SKILL_IDS, type CombatSkillId } from '../types'

/**
 * Display metadata for Attack/Strength/Defence/Hitpoints — the Combat page's
 * own stats panel, never the Skills sidebar (see CombatSkillId's doc
 * comment in data/types.ts for why these aren't SkillIds).
 */
export const combatSkillDisplay: Record<CombatSkillId, { label: string; icon: string }> = {
  attack: { label: 'Attack', icon: '🗡️' },
  strength: { label: 'Strength', icon: '💪' },
  defence: { label: 'Defence', icon: '🛡️' },
  hitpoints: { label: 'Hitpoints', icon: '❤️' },
}

export const combatSkillOrder: CombatSkillId[] = [...COMBAT_SKILL_IDS]
