import type { Pet, SkillId } from './types'

/** Small and flat — a pet is a rare find, not a build-defining bonus. Both
 *  combine additively with Mastery's own (capped-at-30%) speed bonus, so
 *  the worst case (max mastery + pet) still stays well under 1. */
const SKILL_PET_SPEED_BONUS = 0.02
const COMBAT_PET_XP_BONUS = 0.03

export const pets: Pet[] = [
  {
    id: 'pet_fishing',
    name: 'River Otter',
    icon: '🦦',
    description: 'A rare find while Fishing. +2% Fishing speed once found.',
    source: { type: 'skill', skillId: 'fishing' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_firemaking',
    name: 'Ember Salamander',
    icon: '🦎',
    description: 'A rare find while Firemaking. +2% Firemaking speed once found.',
    source: { type: 'skill', skillId: 'firemaking' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_woodcutting',
    name: 'Timber Squirrel',
    icon: '🐿️',
    description: 'A rare find while Woodcutting. +2% Woodcutting speed once found.',
    source: { type: 'skill', skillId: 'woodcutting' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_mining',
    name: 'Tunnel Badger',
    icon: '🦡',
    description: 'A rare find while Mining. +2% Mining speed once found.',
    source: { type: 'skill', skillId: 'mining' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_smithing',
    name: 'Forge Wyrmling',
    icon: '🐉',
    description: 'A rare find while Smithing. +2% Smithing speed once found.',
    source: { type: 'skill', skillId: 'smithing' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_cooking',
    name: 'Kitchen Chick',
    icon: '🐔',
    description: 'A rare find while Cooking. +2% Cooking speed once found.',
    source: { type: 'skill', skillId: 'cooking' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_hunting',
    name: 'Trail Fox',
    icon: '🦊',
    description: 'A rare find while Hunting. +2% Hunting speed once found.',
    source: { type: 'skill', skillId: 'hunting' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_runecrafting',
    name: 'Arcane Owl',
    icon: '🦉',
    description: 'A rare find while Runecrafting. +2% Runecrafting speed once found.',
    source: { type: 'skill', skillId: 'runecrafting' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_combat',
    name: 'Loyal Hound',
    icon: '🐕',
    description: 'A rare find from any kill. +3% XP from every kill once found.',
    source: { type: 'combat' },
    bonusPercent: COMBAT_PET_XP_BONUS,
  },
  {
    id: 'pet_farming',
    name: 'Garden Sprite',
    icon: '🧚',
    description: 'A rare find on harvest. +2% faster crop growth once found.',
    source: { type: 'farming' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
  {
    id: 'pet_ranching',
    name: 'Barnyard Cat',
    icon: '🐈',
    description: 'A rare find on collection. +2% faster animal raising once found.',
    source: { type: 'ranching' },
    bonusPercent: SKILL_PET_SPEED_BONUS,
  },
]

export const petsById: Record<string, Pet> = Object.fromEntries(pets.map((p) => [p.id, p]))

export const petBySkillId: Partial<Record<SkillId, Pet>> = Object.fromEntries(
  pets
    .filter((p): p is Pet & { source: { type: 'skill'; skillId: SkillId } } => p.source.type === 'skill')
    .map((p) => [p.source.skillId, p]),
)

export const combatPet: Pet = pets.find((p) => p.source.type === 'combat')!
export const farmingPet: Pet = pets.find((p) => p.source.type === 'farming')!
export const ranchingPet: Pet = pets.find((p) => p.source.type === 'ranching')!
