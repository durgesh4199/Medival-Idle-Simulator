import { useMemo, useState } from 'react'
import { items } from '../data'
import type { EquipmentSlot, Item, ItemCategory } from '../data/types'
import { aggregateEquipmentStats } from '../engine/equipmentEngine'
import { useGameStore } from '../state/gameStore'

const SLOT_LAYOUT: { slot: EquipmentSlot; label: string; icon: string }[] = [
  { slot: 'helmet', label: 'Helmet', icon: '⛑️' },
  { slot: 'amulet', label: 'Amulet', icon: '📿' },
  { slot: 'body', label: 'Body', icon: '🧥' },
  { slot: 'weapon', label: 'Weapon', icon: '🗡️' },
  { slot: 'shield', label: 'Shield', icon: '🛡️' },
  { slot: 'legs', label: 'Legs', icon: '👖' },
  { slot: 'gloves', label: 'Gloves', icon: '🧤' },
  { slot: 'boots', label: 'Boots', icon: '👢' },
  { slot: 'ring', label: 'Ring', icon: '💍' },
]

const FILTERS: { value: ItemCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'food', label: 'Food' },
  { value: 'resource', label: 'Resources' },
]

function EquipmentSlotBox({ slot, label, icon }: { slot: EquipmentSlot; label: string; icon: string }) {
  const equippedId = useGameStore((s) => s.equipment[slot])
  const unequipItem = useGameStore((s) => s.unequipItem)
  const equipped = equippedId ? items[equippedId] : undefined

  return (
    <button
      type="button"
      data-slot={slot}
      disabled={!equipped}
      onClick={() => unequipItem(slot)}
      title={equipped ? `Unequip ${equipped.name}` : label}
      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-colors ${
        equipped
          ? 'border-gold bg-gold/10 hover:border-red-500/50 hover:bg-red-500/10'
          : 'border-dashed border-line bg-panel/50'
      }`}
    >
      <span className={`text-2xl ${equipped ? '' : 'opacity-30'}`}>{equipped?.icon ?? icon}</span>
      <span className="truncate text-[10px] text-neutral-400">{equipped?.name ?? label}</span>
    </button>
  )
}

function InventoryCard({ item, qty }: { item: Item; qty: number }) {
  const equipItem = useGameStore((s) => s.equipItem)

  return (
    <div
      data-item-id={item.id}
      className="flex flex-col items-center gap-1 rounded-lg border border-line bg-panel p-2 text-center"
    >
      <span className="text-2xl">{item.icon}</span>
      <span className="w-full truncate text-xs text-neutral-200">{item.name}</span>
      <span className="text-[11px] text-neutral-500">
        x{qty}
        {item.value ? ` · ${item.value}g` : ''}
      </span>
      {item.equipment && (
        <button
          type="button"
          onClick={() => equipItem(item.id)}
          className="mt-1 w-full rounded bg-brand py-1 text-[11px] font-semibold text-neutral-950 hover:bg-brand-dim"
        >
          Equip
        </button>
      )}
    </div>
  )
}

export function BankPage() {
  const inventory = useGameStore((s) => s.inventory)
  const equipment = useGameStore((s) => s.equipment)
  const [filter, setFilter] = useState<ItemCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => aggregateEquipmentStats(equipment), [equipment])

  const ownedItems = useMemo(() => {
    return Object.entries(inventory)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ item: items[itemId], qty }))
      .filter((row): row is { item: Item; qty: number } => Boolean(row.item))
      .filter(({ item }) => filter === 'all' || item.category === filter)
      .filter(({ item }) => item.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.item.name.localeCompare(b.item.name))
  }, [inventory, filter, search])

  return (
    <div className="flex flex-1 gap-4 overflow-y-auto p-4">
      <aside className="w-72 shrink-0">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Equipment
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {SLOT_LAYOUT.map(({ slot, label, icon }) => (
            <EquipmentSlotBox key={slot} slot={slot} label={label} icon={icon} />
          ))}
        </div>

        <h2 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Equipment Stats
        </h2>
        <div className="space-y-1 rounded-lg border border-line bg-panel p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Accuracy</span>
            <span>{stats.accuracy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Strength</span>
            <span>{stats.strength}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Defence</span>
            <span>{stats.defence}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
          />
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-gold/15 text-gold'
                    : 'bg-panel text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {ownedItems.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing here yet — go train a skill.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
            {ownedItems.map(({ item, qty }) => (
              <InventoryCard key={item.id} item={item} qty={qty} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
