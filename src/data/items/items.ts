import type { Item } from '../types'

export const items: Record<string, Item> = {
  raw_herring: { id: 'raw_herring', name: 'Raw Herring', icon: '🐟', value: 4, category: 'resource' },
  raw_trout: { id: 'raw_trout', name: 'Raw Trout', icon: '🐠', value: 6, category: 'resource' },
  junk: { id: 'junk', name: 'Junk', icon: '🥾', value: 0, category: 'resource' },
  rusty_ancient_dagger: {
    id: 'rusty_ancient_dagger',
    name: 'Rusty Ancient Dagger',
    icon: '🗡️',
    value: 500,
    category: 'equipment',
    // A rare Fishing find punches above what its level would normally
    // craft — that's what makes it worth fishing for. Daggers are fast.
    equipment: { slot: 'weapon', stats: { accuracy: 12, strength: 10, attackSpeedMs: 1800 } },
  },
  logs: { id: 'logs', name: 'Logs', icon: '🪵', value: 2, category: 'resource' },
  oak_logs: { id: 'oak_logs', name: 'Oak Logs', icon: '🪵', value: 5, category: 'resource' },
  ash: { id: 'ash', name: 'Ash', icon: '⚪', value: 1, category: 'resource' },
  charcoal: { id: 'charcoal', name: 'Charcoal', icon: '⚫', value: 3, category: 'resource' },
  willow_logs: { id: 'willow_logs', name: 'Willow Logs', icon: '🪵', value: 9, category: 'resource' },
  yew_logs: { id: 'yew_logs', name: 'Yew Logs', icon: '🪵', value: 16, category: 'resource' },

  // Mining -> ores feed Smithing's furnace.
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', icon: '🟠', value: 3, category: 'resource' },
  tin_ore: { id: 'tin_ore', name: 'Tin Ore', icon: '⚪', value: 3, category: 'resource' },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', icon: '🔘', value: 8, category: 'resource' },
  coal: { id: 'coal', name: 'Coal', icon: '⚫', value: 6, category: 'resource' },
  // Steel/Mithril/Adamant push the Mining->Smithing chain past Iron, the
  // same "next tier of ore, next tier of bar, next tier of gear" shape
  // repeated three more times so the top of the chain reaches deep into the
  // 40-65 level range instead of stopping dead at level 20.
  mithril_ore: { id: 'mithril_ore', name: 'Mithril Ore', icon: '🔵', value: 18, category: 'resource' },
  adamant_ore: { id: 'adamant_ore', name: 'Adamant Ore', icon: '🟢', value: 32, category: 'resource' },
  // Rune pushes one tier past Adamant, into Emberfall Wastes' level-70ish
  // range — the same shape one tier further.
  rune_ore: { id: 'rune_ore', name: 'Rune Ore', icon: '🟣', value: 55, category: 'resource' },

  // Smithing: furnace output (bars) feeds the anvil.
  bronze_bar: { id: 'bronze_bar', name: 'Bronze Bar', icon: '🟫', value: 12, category: 'resource' },
  iron_bar: { id: 'iron_bar', name: 'Iron Bar', icon: '⬜', value: 25, category: 'resource' },
  steel_bar: { id: 'steel_bar', name: 'Steel Bar', icon: '⬛', value: 45, category: 'resource' },
  mithril_bar: { id: 'mithril_bar', name: 'Mithril Bar', icon: '🟦', value: 80, category: 'resource' },
  adamant_bar: { id: 'adamant_bar', name: 'Adamant Bar', icon: '🟩', value: 140, category: 'resource' },
  rune_bar: { id: 'rune_bar', name: 'Rune Bar', icon: '🟪', value: 220, category: 'resource' },

  // Smithing: anvil output. Stats are placeholders — real combat balance
  // arrives with the Combat system; these exist now so Equipment has real
  // items to equip and the resource chain is real.
  bronze_sword: {
    id: 'bronze_sword',
    name: 'Bronze Sword',
    icon: '🗡️',
    value: 40,
    category: 'equipment',
    equipment: { slot: 'weapon', stats: { accuracy: 5, strength: 4, attackSpeedMs: 2600 } },
  },
  bronze_helmet: {
    id: 'bronze_helmet',
    name: 'Bronze Helmet',
    icon: '⛑️',
    value: 45,
    category: 'equipment',
    equipment: { slot: 'helmet', stats: { defence: 3 } },
  },
  bronze_shield: {
    id: 'bronze_shield',
    name: 'Bronze Shield',
    icon: '🛡️',
    value: 50,
    category: 'equipment',
    equipment: { slot: 'shield', stats: { defence: 5 } },
  },
  bronze_boots: {
    id: 'bronze_boots',
    name: 'Bronze Boots',
    icon: '👢',
    value: 30,
    category: 'equipment',
    equipment: { slot: 'boots', stats: { defence: 2 } },
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    icon: '⚔️',
    value: 90,
    category: 'equipment',
    equipment: { slot: 'weapon', stats: { accuracy: 10, strength: 9, attackSpeedMs: 2400 } },
  },
  iron_helmet: {
    id: 'iron_helmet',
    name: 'Iron Helmet',
    icon: '⛑️',
    value: 95,
    category: 'equipment',
    equipment: { slot: 'helmet', stats: { defence: 6 } },
  },
  iron_shield: {
    id: 'iron_shield',
    name: 'Iron Shield',
    icon: '🛡️',
    value: 105,
    category: 'equipment',
    equipment: { slot: 'shield', stats: { defence: 10 } },
  },
  iron_boots: {
    id: 'iron_boots',
    name: 'Iron Boots',
    icon: '👢',
    value: 65,
    category: 'equipment',
    equipment: { slot: 'boots', stats: { defence: 4 } },
  },

  // Steel set — roughly double Iron's stats, same spacing Iron used over
  // Bronze.
  steel_sword: {
    id: 'steel_sword',
    name: 'Steel Sword',
    icon: '⚔️',
    value: 180,
    category: 'equipment',
    equipment: { slot: 'weapon', stats: { accuracy: 18, strength: 16, attackSpeedMs: 2200 } },
  },
  steel_helmet: {
    id: 'steel_helmet',
    name: 'Steel Helmet',
    icon: '⛑️',
    value: 190,
    category: 'equipment',
    equipment: { slot: 'helmet', stats: { defence: 11 } },
  },
  steel_shield: {
    id: 'steel_shield',
    name: 'Steel Shield',
    icon: '🛡️',
    value: 210,
    category: 'equipment',
    equipment: { slot: 'shield', stats: { defence: 18 } },
  },
  steel_boots: {
    id: 'steel_boots',
    name: 'Steel Boots',
    icon: '👢',
    value: 130,
    category: 'equipment',
    equipment: { slot: 'boots', stats: { defence: 7 } },
  },

  // Mithril set.
  mithril_sword: {
    id: 'mithril_sword',
    name: 'Mithril Sword',
    icon: '🗡️',
    value: 340,
    category: 'equipment',
    equipment: { slot: 'weapon', stats: { accuracy: 28, strength: 25, attackSpeedMs: 2000 } },
  },
  mithril_helmet: {
    id: 'mithril_helmet',
    name: 'Mithril Helmet',
    icon: '⛑️',
    value: 360,
    category: 'equipment',
    equipment: { slot: 'helmet', stats: { defence: 17 } },
  },
  mithril_shield: {
    id: 'mithril_shield',
    name: 'Mithril Shield',
    icon: '🛡️',
    value: 400,
    category: 'equipment',
    equipment: { slot: 'shield', stats: { defence: 27 } },
  },
  mithril_boots: {
    id: 'mithril_boots',
    name: 'Mithril Boots',
    icon: '👢',
    value: 250,
    category: 'equipment',
    equipment: { slot: 'boots', stats: { defence: 11 } },
  },

  // Adamant set — the top of the smithed-gear ladder, matching
  // Runecrafting's level-65 ceiling.
  adamant_sword: {
    id: 'adamant_sword',
    name: 'Adamant Sword',
    icon: '⚔️',
    value: 620,
    category: 'equipment',
    equipment: { slot: 'weapon', stats: { accuracy: 42, strength: 38, attackSpeedMs: 1800 } },
  },
  adamant_helmet: {
    id: 'adamant_helmet',
    name: 'Adamant Helmet',
    icon: '⛑️',
    value: 650,
    category: 'equipment',
    equipment: { slot: 'helmet', stats: { defence: 25 } },
  },
  adamant_shield: {
    id: 'adamant_shield',
    name: 'Adamant Shield',
    icon: '🛡️',
    value: 720,
    category: 'equipment',
    equipment: { slot: 'shield', stats: { defence: 40 } },
  },
  adamant_boots: {
    id: 'adamant_boots',
    name: 'Adamant Boots',
    icon: '👢',
    value: 450,
    category: 'equipment',
    equipment: { slot: 'boots', stats: { defence: 16 } },
  },

  // Rune set — the top of the smithed-gear ladder now, one tier past
  // Adamant, sized for Emberfall Wastes.
  rune_sword: {
    id: 'rune_sword',
    name: 'Rune Sword',
    icon: '⚔️',
    value: 1100,
    category: 'equipment',
    equipment: { slot: 'weapon', stats: { accuracy: 62, strength: 56, attackSpeedMs: 1700 } },
  },
  rune_helmet: {
    id: 'rune_helmet',
    name: 'Rune Helmet',
    icon: '⛑️',
    value: 1150,
    category: 'equipment',
    equipment: { slot: 'helmet', stats: { defence: 37 } },
  },
  rune_shield: {
    id: 'rune_shield',
    name: 'Rune Shield',
    icon: '🛡️',
    value: 1300,
    category: 'equipment',
    equipment: { slot: 'shield', stats: { defence: 58 } },
  },
  rune_boots: {
    id: 'rune_boots',
    name: 'Rune Boots',
    icon: '👢',
    value: 800,
    category: 'equipment',
    equipment: { slot: 'boots', stats: { defence: 24 } },
  },

  // Cooking output. Burning is a shared failure item, same as Melvor.
  // healAmount closes the doc's "Fishing -> Fish -> Cooking -> Food ->
  // Combat" chain — these are what Combat's food slot eats.
  cooked_herring: {
    id: 'cooked_herring',
    name: 'Cooked Herring',
    icon: '🍤',
    value: 8,
    category: 'food',
    healAmount: 30,
  },
  cooked_trout: {
    id: 'cooked_trout',
    name: 'Cooked Trout',
    icon: '🐟',
    value: 12,
    category: 'food',
    healAmount: 45,
  },
  raw_silverfin: { id: 'raw_silverfin', name: 'Raw Silverfin', icon: '🐡', value: 14, category: 'resource' },
  raw_eel: { id: 'raw_eel', name: 'Raw Eel', icon: '🐍', value: 22, category: 'resource' },
  cooked_silverfin: {
    id: 'cooked_silverfin',
    name: 'Cooked Silverfin',
    icon: '🍥',
    value: 20,
    category: 'food',
    healAmount: 65,
  },
  cooked_eel: {
    id: 'cooked_eel',
    name: 'Cooked Eel',
    icon: '🍢',
    value: 30,
    category: 'food',
    healAmount: 85,
  },
  burnt_food: { id: 'burnt_food', name: 'Burnt Food', icon: '🔥', value: 0, category: 'food' },

  // Hunting: trapped animals drop materials, plus a rare pelt.
  fur: { id: 'fur', name: 'Fur', icon: '🦫', value: 5, category: 'resource' },
  feathers: { id: 'feathers', name: 'Feathers', icon: '🪶', value: 3, category: 'resource' },
  raw_meat: { id: 'raw_meat', name: 'Raw Meat', icon: '🥩', value: 6, category: 'resource' },
  silver_fox_pelt: {
    id: 'silver_fox_pelt',
    name: 'Silver Fox Pelt',
    icon: '🦊',
    value: 300,
    category: 'resource',
  },
  boar_tusk: { id: 'boar_tusk', name: 'Boar Tusk', icon: '🦷', value: 12, category: 'resource' },
  stag_antler: { id: 'stag_antler', name: 'Stag Antler', icon: '🦌', value: 20, category: 'resource' },
  golden_stag_hide: {
    id: 'golden_stag_hide',
    name: 'Golden Stag Hide',
    icon: '✨',
    value: 550,
    category: 'resource',
  },

  // Mining -> Rune Essence feeds Runecrafting, same "Mining -> X -> next
  // skill" shape as ore feeding Smithing.
  rune_essence: { id: 'rune_essence', name: 'Rune Essence', icon: '💠', value: 10, category: 'resource' },

  // Runecrafting output — fuel for the (not yet built) Magic/Combat systems.
  air_rune: { id: 'air_rune', name: 'Air Rune', icon: '🌀', value: 5, category: 'resource' },
  water_rune: { id: 'water_rune', name: 'Water Rune', icon: '💧', value: 5, category: 'resource' },
  fire_rune: { id: 'fire_rune', name: 'Fire Rune', icon: '🔺', value: 8, category: 'resource' },
  chaos_rune: { id: 'chaos_rune', name: 'Chaos Rune', icon: '🌪️', value: 25, category: 'resource' },
  death_rune: { id: 'death_rune', name: 'Death Rune', icon: '💀', value: 60, category: 'resource' },
  blood_rune: { id: 'blood_rune', name: 'Blood Rune', icon: '🔴', value: 120, category: 'resource' },

  // Combat loot. Bones are a near-universal drop, currently just a sellable
  // — Prayer shipped as a flat Defence-gated modifier rather than something
  // trained with a resource, so this stayed flavor/gold rather than a
  // Prayer-training input.
  bones: { id: 'bones', name: 'Bones', icon: '🦴', value: 2, category: 'resource' },
  rat_tail: { id: 'rat_tail', name: 'Rat Tail', icon: '🐁', value: 3, category: 'resource' },
  goblin_ear: { id: 'goblin_ear', name: 'Goblin Ear', icon: '👂', value: 8, category: 'resource' },
  ancient_coin: { id: 'ancient_coin', name: 'Ancient Coin', icon: '🪙', value: 250, category: 'resource' },

  // Shadowfen Marsh loot.
  troll_hide: { id: 'troll_hide', name: 'Troll Hide', icon: '🟢', value: 30, category: 'resource' },
  wraith_essence: {
    id: 'wraith_essence',
    name: 'Wraith Essence',
    icon: '✨',
    value: 400,
    category: 'resource',
  },

  // Frostfang Highlands / Frozen Bastion loot — the third CombatArea/Dungeon
  // tier, sized for a level-45+ player the way Shadowfen's loot targets 25+.
  frost_wolf_pelt: {
    id: 'frost_wolf_pelt',
    name: 'Frost Wolf Pelt',
    icon: '🐺',
    value: 45,
    category: 'resource',
  },
  raider_emblem: { id: 'raider_emblem', name: 'Raider Emblem', icon: '🏵️', value: 60, category: 'resource' },
  giant_core: { id: 'giant_core', name: 'Giant Core', icon: '🔷', value: 500, category: 'resource' },
  frozen_crown: {
    id: 'frozen_crown',
    name: 'Frozen Crown',
    icon: '👑',
    value: 1500,
    category: 'resource',
  },

  // Emberfall Wastes / Emberfall Crucible loot — the fourth CombatArea/
  // Dungeon tier, sized for a level-68+ player the way Frostfang's loot
  // targets 45+.
  infernal_fang: { id: 'infernal_fang', name: 'Infernal Fang', icon: '🦷', value: 65, category: 'resource' },
  ash_wraith_essence: {
    id: 'ash_wraith_essence',
    name: 'Ash Wraith Essence',
    icon: '💨',
    value: 90,
    category: 'resource',
  },
  molten_core: { id: 'molten_core', name: 'Molten Core', icon: '🔥', value: 900, category: 'resource' },
  emberfall_crown: {
    id: 'emberfall_crown',
    name: 'Emberfall Crown',
    icon: '👑',
    value: 3000,
    category: 'resource',
  },

  // Farming: seeds (buyable from the Shop, since there's no separate
  // seed-gathering step) go into a plot, crops come out. barley additionally
  // feeds a Cooking recipe below, the same "a resource is more valuable when
  // it feeds multiple systems" principle every other crop chain here uses.
  barley_seed: { id: 'barley_seed', name: 'Barley Seed', icon: '🌱', value: 2, category: 'resource' },
  carrot_seed: { id: 'carrot_seed', name: 'Carrot Seed', icon: '🌱', value: 4, category: 'resource' },
  potato_seed: { id: 'potato_seed', name: 'Potato Seed', icon: '🌱', value: 8, category: 'resource' },
  pumpkin_seed: { id: 'pumpkin_seed', name: 'Pumpkin Seed', icon: '🌱', value: 15, category: 'resource' },
  golden_wheat_seed: {
    id: 'golden_wheat_seed',
    name: 'Golden Wheat Seed',
    icon: '🌱',
    value: 40,
    category: 'resource',
  },
  barley: { id: 'barley', name: 'Barley', icon: '🌾', value: 6, category: 'resource' },
  carrot: { id: 'carrot', name: 'Carrot', icon: '🥕', value: 10, category: 'resource' },
  potato: { id: 'potato', name: 'Potato', icon: '🥔', value: 16, category: 'resource' },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', icon: '🎃', value: 30, category: 'resource' },
  golden_wheat: { id: 'golden_wheat', name: 'Golden Wheat', icon: '🌟', value: 90, category: 'resource' },
  bread: {
    id: 'bread',
    name: 'Bread',
    icon: '🍞',
    value: 14,
    category: 'food',
    healAmount: 35,
  },

  // Ranching: animals (bought from the Shop, same as Farming's seeds) go
  // into a pen; once mature they keep producing on a recurring cycle
  // rather than a single harvest — see engine/ranchingEngine.ts.
  chicken: { id: 'chicken', name: 'Chicken', icon: '🐔', value: 15, category: 'resource' },
  goat: { id: 'goat', name: 'Goat', icon: '🐐', value: 45, category: 'resource' },
  sheep: { id: 'sheep', name: 'Sheep', icon: '🐑', value: 90, category: 'resource' },
  cow: { id: 'cow', name: 'Cow', icon: '🐄', value: 180, category: 'resource' },
  warhorse: { id: 'warhorse', name: 'Warhorse', icon: '🐎', value: 450, category: 'resource' },
  egg: { id: 'egg', name: 'Egg', icon: '🥚', value: 3, category: 'resource' },
  milk: { id: 'milk', name: 'Milk', icon: '🥛', value: 8, category: 'resource' },
  wool: { id: 'wool', name: 'Wool', icon: '🧶', value: 18, category: 'resource' },
  cowhide: { id: 'cowhide', name: 'Cowhide', icon: '🟤', value: 35, category: 'resource' },
  horseshoe: { id: 'horseshoe', name: 'Horseshoe', icon: '🧲', value: 70, category: 'resource' },
  cake: {
    id: 'cake',
    name: 'Cake',
    icon: '🍰',
    value: 24,
    category: 'food',
    healAmount: 55,
  },
}

export function getItem(id: string): Item {
  const item = items[id]
  if (!item) throw new Error(`Unknown item id: ${id}`)
  return item
}
