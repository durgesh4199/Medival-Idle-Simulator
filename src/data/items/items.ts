import type { Item } from '../types'

export const items: Record<string, Item> = {
  raw_herring: { id: 'raw_herring', name: 'Raw Herring', icon: '🐟', value: 4 },
  raw_trout: { id: 'raw_trout', name: 'Raw Trout', icon: '🐠', value: 6 },
  junk: { id: 'junk', name: 'Junk', icon: '🥾', value: 0 },
  rusty_ancient_dagger: {
    id: 'rusty_ancient_dagger',
    name: 'Rusty Ancient Dagger',
    icon: '🗡️',
    value: 500,
  },
  logs: { id: 'logs', name: 'Logs', icon: '🪵', value: 2 },
  oak_logs: { id: 'oak_logs', name: 'Oak Logs', icon: '🪵', value: 5 },
  ash: { id: 'ash', name: 'Ash', icon: '⚪', value: 1 },
  charcoal: { id: 'charcoal', name: 'Charcoal', icon: '⚫', value: 3 },

  // Mining -> ores feed Smithing's furnace.
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', icon: '🟠', value: 3 },
  tin_ore: { id: 'tin_ore', name: 'Tin Ore', icon: '⚪', value: 3 },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', icon: '🔘', value: 8 },
  coal: { id: 'coal', name: 'Coal', icon: '⚫', value: 6 },

  // Smithing: furnace output (bars) feeds the anvil.
  bronze_bar: { id: 'bronze_bar', name: 'Bronze Bar', icon: '🟫', value: 12 },
  iron_bar: { id: 'iron_bar', name: 'Iron Bar', icon: '⬜', value: 25 },

  // Smithing: anvil output. No combat stats yet — that lands with the
  // Equipment system; these exist now so the resource chain is real.
  bronze_sword: { id: 'bronze_sword', name: 'Bronze Sword', icon: '🗡️', value: 40 },
  bronze_helmet: { id: 'bronze_helmet', name: 'Bronze Helmet', icon: '⛑️', value: 45 },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', icon: '⚔️', value: 90 },

  // Cooking output. Burning is a shared failure item, same as Melvor.
  cooked_herring: { id: 'cooked_herring', name: 'Cooked Herring', icon: '🍤', value: 8 },
  cooked_trout: { id: 'cooked_trout', name: 'Cooked Trout', icon: '🐟', value: 12 },
  burnt_food: { id: 'burnt_food', name: 'Burnt Food', icon: '🔥', value: 0 },

  // Hunting: trapped animals drop materials, plus a rare pelt.
  fur: { id: 'fur', name: 'Fur', icon: '🦫', value: 5 },
  feathers: { id: 'feathers', name: 'Feathers', icon: '🪶', value: 3 },
  raw_meat: { id: 'raw_meat', name: 'Raw Meat', icon: '🥩', value: 6 },
  silver_fox_pelt: { id: 'silver_fox_pelt', name: 'Silver Fox Pelt', icon: '🦊', value: 300 },

  // Mining -> Rune Essence feeds Runecrafting, same "Mining -> X -> next
  // skill" shape as ore feeding Smithing.
  rune_essence: { id: 'rune_essence', name: 'Rune Essence', icon: '💠', value: 10 },

  // Runecrafting output — fuel for the (not yet built) Magic/Combat systems.
  air_rune: { id: 'air_rune', name: 'Air Rune', icon: '🌀', value: 5 },
  water_rune: { id: 'water_rune', name: 'Water Rune', icon: '💧', value: 5 },
  fire_rune: { id: 'fire_rune', name: 'Fire Rune', icon: '🔺', value: 8 },
  chaos_rune: { id: 'chaos_rune', name: 'Chaos Rune', icon: '🌪️', value: 25 },
  death_rune: { id: 'death_rune', name: 'Death Rune', icon: '💀', value: 60 },
}

export function getItem(id: string): Item {
  const item = items[id]
  if (!item) throw new Error(`Unknown item id: ${id}`)
  return item
}
