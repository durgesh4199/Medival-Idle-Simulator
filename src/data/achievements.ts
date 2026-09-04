import type { Achievement } from './types'

/**
 * Achievements (design doc §9): secondary objectives layered across every
 * system already built — skills, combat, Quests, Dungeons — rather than a
 * new track of their own. Claimed explicitly via `completeAchievement`,
 * same UX as a Quest turn-in, just with no `itemCount` requirements to
 * consume (see `AchievementRequirement`'s doc comment in `data/types.ts`).
 */
export const achievements: Achievement[] = [
  {
    id: 'first_catch',
    name: 'First Catch',
    icon: '🎣',
    description: 'Reach Fishing level 10.',
    requirements: [{ type: 'skillLevel', skillId: 'fishing', level: 10 }],
    reward: { gold: 50 },
  },
  {
    id: 'woodsman',
    name: 'Woodsman',
    icon: '🪓',
    description: 'Reach Woodcutting level 15.',
    requirements: [{ type: 'skillLevel', skillId: 'woodcutting', level: 15 }],
    reward: { gold: 60 },
  },
  {
    id: 'rat_catcher',
    name: 'Rat Catcher',
    icon: '🐀',
    description: 'Defeat 25 Giant Rats.',
    requirements: [{ type: 'kills', enemyId: 'giant_rat', count: 25 }],
    reward: { xp: { attack: 40, strength: 40, defence: 40, hitpoints: 40 } },
  },
  {
    id: 'proven_in_battle',
    name: 'Proven in Battle',
    icon: '🏆',
    description: 'Complete "Proven Adventurer" — the quest chain\'s final trial.',
    requirements: [{ type: 'questComplete', questId: 'proven_adventurer' }],
    reward: { gold: 300 },
  },
  {
    id: 'marsh_conqueror',
    name: 'Marsh Conqueror',
    icon: '👻',
    description: 'Complete "Shadow\'s Reckoning" — the second quest chain\'s final trial.',
    requirements: [{ type: 'questComplete', questId: 'shadows_reckoning' }],
    reward: { gold: 600 },
  },
  {
    id: 'den_cleared',
    name: 'Den Cleared',
    icon: '🗝️',
    description: 'Clear the Goblin Den once.',
    requirements: [{ type: 'dungeonCleared', dungeonId: 'goblin_den', count: 1 }],
    reward: { gold: 100, xp: { smithing: 50 } },
  },
  {
    id: 'den_master',
    name: 'Den Master',
    icon: '👑',
    description: 'Clear the Goblin Den 5 times.',
    requirements: [{ type: 'dungeonCleared', dungeonId: 'goblin_den', count: 5 }],
    reward: { gold: 500 },
  },
  {
    id: 'crypt_cleared',
    name: 'Crypt Cleared',
    icon: '⚰️',
    description: 'Clear the Sunken Crypt once.',
    requirements: [{ type: 'dungeonCleared', dungeonId: 'sunken_crypt', count: 1 }],
    reward: { gold: 250, xp: { smithing: 100 } },
  },
  {
    id: 'crypt_master',
    name: 'Crypt Master',
    icon: '👑',
    description: 'Clear the Sunken Crypt 5 times.',
    requirements: [{ type: 'dungeonCleared', dungeonId: 'sunken_crypt', count: 5 }],
    reward: { gold: 1200 },
  },
  {
    id: 'jack_of_all_trades',
    name: 'Jack of All Trades',
    icon: '🧭',
    description: 'Reach level 10 in every gathering/production skill.',
    requirements: [
      { type: 'skillLevel', skillId: 'fishing', level: 10 },
      { type: 'skillLevel', skillId: 'firemaking', level: 10 },
      { type: 'skillLevel', skillId: 'woodcutting', level: 10 },
      { type: 'skillLevel', skillId: 'mining', level: 10 },
      { type: 'skillLevel', skillId: 'smithing', level: 10 },
      { type: 'skillLevel', skillId: 'cooking', level: 10 },
      { type: 'skillLevel', skillId: 'hunting', level: 10 },
      { type: 'skillLevel', skillId: 'runecrafting', level: 10 },
    ],
    reward: { gold: 1000 },
  },
]

export const achievementsById: Record<string, Achievement> = Object.fromEntries(
  achievements.map((a) => [a.id, a]),
)
