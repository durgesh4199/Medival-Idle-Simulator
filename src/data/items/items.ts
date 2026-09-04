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

  // Mining -> ores feed Smithing's furnace.
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', icon: '🟠', value: 3, category: 'resource' },
  tin_ore: { id: 'tin_ore', name: 'Tin Ore', icon: '⚪', value: 3, category: 'resource' },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', icon: '🔘', value: 8, category: 'resource' },
  coal: { id: 'coal', name: 'Coal', icon: '⚫', value: 6, category: 'resource' },

  // Smithing: furnace output (bars) feeds the anvil.
  bronze_bar: { id: 'bronze_bar', name: 'Bronze Bar', icon: '🟫', value: 12, category: 'resource' },
  iron_bar: { id: 'iron_bar', name: 'Iron Bar', icon: '⬜', value: 25, category: 'resource' },

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

  // Mining -> Rune Essence feeds Runecrafting, same "Mining -> X -> next
  // skill" shape as ore feeding Smithing.
  rune_essence: { id: 'rune_essence', name: 'Rune Essence', icon: '💠', value: 10, category: 'resource' },

  // Runecrafting output — fuel for the (not yet built) Magic/Combat systems.
  air_rune: { id: 'air_rune', name: 'Air Rune', icon: '🌀', value: 5, category: 'resource' },
  water_rune: { id: 'water_rune', name: 'Water Rune', icon: '💧', value: 5, category: 'resource' },
  fire_rune: { id: 'fire_rune', name: 'Fire Rune', icon: '🔺', value: 8, category: 'resource' },
  chaos_rune: { id: 'chaos_rune', name: 'Chaos Rune', icon: '🌪️', value: 25, category: 'resource' },
  death_rune: { id: 'death_rune', name: 'Death Rune', icon: '💀', value: 60, category: 'resource' },

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
}

export function getItem(id: string): Item {
  const item = items[id]
  if (!item) throw new Error(`Unknown item id: ${id}`)
  return item
}
