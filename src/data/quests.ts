import type { Quest } from './types'

/**
 * A short starter chain that deliberately walks through every requirement
 * kind and touches most of the systems already built — gather (Fishing),
 * craft (Cooking, then Smithing), fight (Combat), and a level gate —
 * exactly the "Gather -> Process -> Craft/Equip -> Combat" content graph
 * from design doc §11.
 */
export const quests: Quest[] = [
  {
    id: 'a_fishermans_start',
    name: "A Fisherman's Start",
    icon: '🎣',
    description: 'Every adventurer starts somewhere. Bring back some fresh catch.',
    requirements: [{ type: 'itemCount', itemId: 'raw_herring', qty: 5 }],
    rewards: { xp: { fishing: 50 }, gold: 20 },
  },
  {
    id: 'kitchen_basics',
    name: 'Kitchen Basics',
    icon: '🍳',
    description: "You'll need more than raw fish to survive out there. Learn to cook.",
    requirements: [
      { type: 'questComplete', questId: 'a_fishermans_start' },
      { type: 'itemCount', itemId: 'cooked_herring', qty: 3 },
    ],
    rewards: { xp: { cooking: 40 }, items: [{ itemId: 'bronze_sword', qty: 1 }] },
  },
  {
    id: 'smiths_apprentice',
    name: "Smith's Apprentice",
    icon: '🔨',
    description: 'The forge master will teach you a trick or two — if you bring bars.',
    requirements: [
      { type: 'questComplete', questId: 'a_fishermans_start' },
      { type: 'itemCount', itemId: 'bronze_bar', qty: 5 },
    ],
    rewards: { xp: { smithing: 60 }, items: [{ itemId: 'bronze_helmet', qty: 1 }] },
  },
  {
    id: 'blooded_blade',
    name: 'Blooded Blade',
    icon: '⚔️',
    description: 'A blade that has never drawn blood is just a decoration. Prove yours.',
    requirements: [
      { type: 'questComplete', questId: 'kitchen_basics' },
      { type: 'kills', enemyId: 'giant_rat', count: 3 },
    ],
    rewards: {
      gold: 30,
      xp: { attack: 25, strength: 25, defence: 25, hitpoints: 25 },
    },
  },
  {
    id: 'proven_adventurer',
    name: 'Proven Adventurer',
    icon: '🏆',
    description: 'The final trial: stand your ground and show what you have learned.',
    requirements: [
      { type: 'questComplete', questId: 'blooded_blade' },
      { type: 'questComplete', questId: 'smiths_apprentice' },
      { type: 'skillLevel', skillId: 'attack', level: 10 },
    ],
    rewards: {
      gold: 200,
      xp: { attack: 100, strength: 100, defence: 100, hitpoints: 100 },
      items: [{ itemId: 'iron_sword', qty: 1 }],
    },
  },
]

export const questsById: Record<string, Quest> = Object.fromEntries(quests.map((q) => [q.id, q]))
