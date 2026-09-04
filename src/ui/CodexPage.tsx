import { useMemo, useState } from 'react'
import { combatAreas, dungeons, enemies, getItem, items } from '../data'
import type { Enemy, Item, ItemCategory } from '../data/types'

type Tab = 'bestiary' | 'items'

const ITEM_FILTERS: { value: ItemCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'food', label: 'Food' },
  { value: 'resource', label: 'Resources' },
]

function EnemyCard({ enemy }: { enemy: Enemy }) {
  const foundIn = [
    ...combatAreas.filter((a) => a.enemyIds.includes(enemy.id)).map((a) => a.name),
    ...dungeons.filter((d) => d.enemyIds.includes(enemy.id)).map((d) => `${d.name} (Dungeon)`),
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="flex items-center gap-2 border-b border-line bg-panel-soft px-3 py-2">
        <span className="text-2xl">{enemy.icon}</span>
        <span className="font-semibold text-neutral-100">{enemy.name}</span>
      </div>
      <div className="space-y-2 p-3 text-sm">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span>
            HP <span className="text-neutral-200">{enemy.hp}</span>
          </span>
          <span>
            Accuracy <span className="text-neutral-200">{enemy.accuracy}</span>
          </span>
          <span>
            Max Hit <span className="text-neutral-200">{enemy.maxHit}</span>
          </span>
          <span>
            Evasion <span className="text-neutral-200">{enemy.evasion}</span>
          </span>
          <span>
            Attack Speed <span className="text-neutral-200">{(enemy.attackSpeedMs / 1000).toFixed(1)}s</span>
          </span>
          <span>
            XP <span className="text-neutral-200">{enemy.xpReward}</span>
          </span>
        </div>
        <div className="text-xs text-neutral-400">
          Gold{' '}
          <span className="text-neutral-200">
            {enemy.goldDrop[0]}-{enemy.goldDrop[1]}
          </span>
        </div>
        {enemy.loot.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase text-neutral-500">Loot</div>
            <div className="space-y-0.5">
              {enemy.loot.map((drop) => {
                const item = getItem(drop.itemId)
                return (
                  <div key={drop.itemId} className="flex items-center justify-between text-xs">
                    <span>
                      {item.icon} {item.name}
                    </span>
                    <span className="text-neutral-500">{(drop.chance * 100).toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {foundIn.length > 0 && (
          <div className="text-[11px] text-neutral-600">Found in: {foundIn.join(', ')}</div>
        )}
      </div>
    </div>
  )
}

function ItemCard({ item }: { item: Item }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line bg-panel p-2 text-center">
      <span className="text-2xl">{item.icon}</span>
      <span className="truncate text-xs text-neutral-200">{item.name}</span>
      <span className="text-[11px] text-neutral-500">{item.value ? `${item.value}g` : 'No value'}</span>
      {item.equipment && (
        <div className="mt-1 space-y-0.5 border-t border-line pt-1 text-[10px] text-neutral-400">
          <div className="capitalize text-neutral-500">{item.equipment.slot}</div>
          {item.equipment.stats.accuracy !== undefined && <div>Accuracy +{item.equipment.stats.accuracy}</div>}
          {item.equipment.stats.strength !== undefined && <div>Strength +{item.equipment.stats.strength}</div>}
          {item.equipment.stats.defence !== undefined && <div>Defence +{item.equipment.stats.defence}</div>}
          {item.equipment.stats.attackSpeedMs !== undefined && (
            <div>Speed {(item.equipment.stats.attackSpeedMs / 1000).toFixed(1)}s</div>
          )}
        </div>
      )}
      {item.healAmount !== undefined && (
        <div className="mt-1 border-t border-line pt-1 text-[10px] text-neutral-400">
          +{item.healAmount} HP
        </div>
      )}
    </div>
  )
}

/**
 * Codex / Information (design doc §13's nav list — "confirmed publicly" per
 * §16 as a real MI2 feature, though its exact contents are reconstructed
 * here like everything else marked that way). Purely a reference: every
 * enemy and every item in the game, browsable regardless of whether it's
 * been encountered yet — useful for planning ("what does level 40 unlock")
 * rather than a discovery/collection mechanic, which would need its own new
 * `gameStore` tracking. Zero new engine code, same as `PetsPage`/`BankPage`
 * reading straight off `data/` — the one difference is this reads *all* of
 * it, not just what the player currently owns.
 */
export function CodexPage() {
  const [tab, setTab] = useState<Tab>('bestiary')
  const [search, setSearch] = useState('')
  const [itemFilter, setItemFilter] = useState<ItemCategory | 'all'>('all')

  const filteredEnemies = useMemo(
    () =>
      enemies
        .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.hp - b.hp),
    [search],
  )

  const filteredItems = useMemo(
    () =>
      Object.values(items)
        .filter((i) => itemFilter === 'all' || i.category === itemFilter)
        .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [search, itemFilter],
  )

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-rail p-1">
          {(['bestiary', 'items'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'bg-gold/15 text-gold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t === 'bestiary' ? `Bestiary (${enemies.length})` : `Items (${Object.keys(items).length})`}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === 'bestiary' ? 'Search enemies…' : 'Search items…'}
          className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
        />
        {tab === 'items' && (
          <div className="flex gap-1">
            {ITEM_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setItemFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  itemFilter === f.value
                    ? 'bg-gold/15 text-gold'
                    : 'bg-panel text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'bestiary' ? (
        filteredEnemies.length === 0 ? (
          <p className="text-sm text-neutral-500">No enemies match "{search}".</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {filteredEnemies.map((enemy) => (
              <EnemyCard key={enemy.id} enemy={enemy} />
            ))}
          </div>
        )
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-neutral-500">No items match "{search}".</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
