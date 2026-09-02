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
  ash: { id: 'ash', name: 'Ash', icon: '⚪', value: 1 },
  charcoal: { id: 'charcoal', name: 'Charcoal', icon: '⚫', value: 3 },
}

export function getItem(id: string): Item {
  const item = items[id]
  if (!item) throw new Error(`Unknown item id: ${id}`)
  return item
}
