import type { Quest } from './types'

/**
 * Three chains. The first 5 are a short starter arc that deliberately walks
 * through every requirement kind and touches most of the systems already
 * built — gather (Fishing), craft (Cooking, then Smithing), fight
 * (Combat), and a level gate — exactly the "Gather -> Process ->
 * Craft/Equip -> Combat" content graph from design doc §11, ending with a
 * full Bronze-into-Iron-sword arc.
 *
 * The next 4 continue past it into Shadowfen Marsh/Sunken Crypt, handing
 * over the rest of the Iron set one piece per quest — narrative follow-
 * through for content that otherwise had no quest presence.
 *
 * The final 5 push into Frostfang Highlands/Frozen Bastion, the level-35+
 * tier built alongside Steel/Mithril/Adamant Smithing — same shape again,
 * gating on itemCount/kills/skillLevel and handing over Steel pieces along
 * the way.
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

  // A second chain picking up where the first leaves off, into Shadowfen
  // Marsh/Sunken Crypt — the higher-tier content had no quest presence at
  // all until now, same kind of gap CombatPage's hardcoded first-area bug
  // was on the systems side. Each quest hands over the next piece of the
  // Iron set (proven_adventurer already granted the sword), so finishing
  // the chain finishes the armor too.
  {
    id: 'marsh_rumors',
    name: 'Marsh Rumors',
    icon: '🌫️',
    description:
      "Tales speak of a cursed marsh east of town. Don't go looking for trouble " +
      'without five Iron Bars to show you can back it up.',
    requirements: [
      { type: 'questComplete', questId: 'proven_adventurer' },
      { type: 'itemCount', itemId: 'iron_bar', qty: 5 },
    ],
    rewards: { gold: 80, xp: { smithing: 50 }, items: [{ itemId: 'iron_boots', qty: 1 }] },
  },
  {
    id: 'bog_cull',
    name: 'Bog Cull',
    icon: '🧌',
    description: 'The trolls are dragging livestock into the bog. Thin them out.',
    requirements: [
      { type: 'questComplete', questId: 'marsh_rumors' },
      { type: 'kills', enemyId: 'bog_troll', count: 5 },
    ],
    rewards: {
      xp: { attack: 60, strength: 60, defence: 60, hitpoints: 60 },
      items: [{ itemId: 'iron_shield', qty: 1 }],
    },
  },
  {
    id: 'cultists_end',
    name: "Cultist's End",
    icon: '🧙',
    description: 'The cultists gathering at the marsh shrine are calling something up. Stop them.',
    requirements: [
      { type: 'questComplete', questId: 'bog_cull' },
      { type: 'kills', enemyId: 'dark_cultist', count: 5 },
    ],
    rewards: {
      gold: 120,
      xp: { attack: 60, strength: 60, defence: 60, hitpoints: 60 },
      items: [{ itemId: 'iron_helmet', qty: 1 }],
    },
  },
  {
    id: 'shadows_reckoning',
    name: "Shadow's Reckoning",
    icon: '👻',
    description:
      "Whatever the cultists summoned still walks the crypt. Put it down, and the marsh's " +
      'secrets are yours.',
    requirements: [
      { type: 'questComplete', questId: 'cultists_end' },
      { type: 'kills', enemyId: 'wraith', count: 3 },
    ],
    rewards: {
      gold: 400,
      xp: { attack: 150, strength: 150, defence: 150, hitpoints: 150 },
      items: [{ itemId: 'wraith_essence', qty: 1 }],
    },
  },

  // A third chain, picking up where the second leaves off, into Frostfang
  // Highlands/Frozen Bastion — the level-35+ tier built alongside
  // Steel/Mithril/Adamant Smithing. Same shape as the second chain: hand
  // over a piece of the next armor tier per quest, end on a dungeon-tier
  // boss kill and a unique trophy.
  {
    id: 'steel_resolve',
    name: 'Steel Resolve',
    icon: '🔩',
    description:
      "The marsh is behind you. The road north runs cold, and cold roads want steel, " +
      'not iron. Prove the forge master you can supply it.',
    requirements: [
      { type: 'questComplete', questId: 'shadows_reckoning' },
      { type: 'itemCount', itemId: 'steel_bar', qty: 5 },
    ],
    rewards: { gold: 100, xp: { smithing: 80 }, items: [{ itemId: 'steel_boots', qty: 1 }] },
  },
  {
    id: 'wolves_at_the_door',
    name: 'Wolves at the Door',
    icon: '🐺',
    description: 'Frost wolves have been raiding the northern camps. Drive them back.',
    requirements: [
      { type: 'questComplete', questId: 'steel_resolve' },
      { type: 'kills', enemyId: 'frost_wolf', count: 8 },
    ],
    rewards: {
      xp: { attack: 80, strength: 80, defence: 80, hitpoints: 80 },
      items: [{ itemId: 'steel_shield', qty: 1 }],
    },
  },
  {
    id: 'raiders_bane',
    name: "Raider's Bane",
    icon: '🏵️',
    description: 'Highland raiders have been picking off scouting parties. End it.',
    requirements: [
      { type: 'questComplete', questId: 'wolves_at_the_door' },
      { type: 'kills', enemyId: 'highland_raider', count: 6 },
    ],
    rewards: { gold: 250, xp: { smithing: 60 }, items: [{ itemId: 'steel_helmet', qty: 1 }] },
  },
  {
    id: 'the_giants_gauntlet',
    name: "The Giant's Gauntlet",
    icon: '🗿',
    description: 'Stone giants guard the pass into the Bastion. You need to be ready for them.',
    requirements: [
      { type: 'questComplete', questId: 'raiders_bane' },
      { type: 'skillLevel', skillId: 'attack', level: 45 },
    ],
    rewards: {
      xp: { attack: 150, strength: 150, defence: 150, hitpoints: 150 },
      items: [{ itemId: 'steel_sword', qty: 1 }],
    },
  },
  {
    id: 'frozen_bastion_reckoning',
    name: "Frozen Bastion's Reckoning",
    icon: '👑',
    description:
      'Whatever crowned itself lord of the Bastion sits behind three stone giants. Take ' +
      'the crown for yourself.',
    requirements: [
      { type: 'questComplete', questId: 'the_giants_gauntlet' },
      { type: 'kills', enemyId: 'stone_giant', count: 3 },
    ],
    rewards: {
      gold: 600,
      xp: { attack: 200, strength: 200, defence: 200, hitpoints: 200 },
      items: [{ itemId: 'frozen_crown', qty: 1 }],
    },
  },
]

export const questsById: Record<string, Quest> = Object.fromEntries(quests.map((q) => [q.id, q]))
