import { items, shopBuyableItemIds } from '../data'
import { getBuyPrice, getSellPrice, isSellable } from '../engine/economyEngine'
import { useGameStore } from '../state/gameStore'

export function ShopPage() {
  const gold = useGameStore((s) => s.gold)
  const inventory = useGameStore((s) => s.inventory)
  const sellItem = useGameStore((s) => s.sellItem)
  const buyItem = useGameStore((s) => s.buyItem)

  const sellableRows = Object.entries(inventory)
    .filter(([itemId, qty]) => qty > 0 && items[itemId] && isSellable(items[itemId]))
    .map(([itemId, qty]) => ({ item: items[itemId], qty }))
    .sort((a, b) => a.item.name.localeCompare(b.item.name))

  return (
    <div className="flex flex-1 gap-4 overflow-y-auto p-4">
      <section className="w-96 shrink-0">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          General Store
        </h2>
        <p className="mb-3 text-xs text-neutral-500">
          A convenience for staples, not a shortcut past progression — nothing rare or
          equipment-tier is stocked here.
        </p>
        <div className="space-y-2">
          {shopBuyableItemIds.map((itemId) => {
            const item = items[itemId]
            if (!item) return null
            const price = getBuyPrice(item)
            const canAfford = gold >= price
            return (
              <div
                key={itemId}
                data-buy-item-id={itemId}
                className="flex items-center gap-3 rounded-lg border border-line bg-panel p-2"
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm text-neutral-200">{item.name}</div>
                  <div className="text-xs text-neutral-500">
                    You have {inventory[itemId] ?? 0} · 🪙 {price} each
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => buyItem(itemId, 1)}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-brand-dim disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-neutral-500"
                >
                  Buy 1
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex-1">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Sell Items
        </h2>
        {sellableRows.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing sellable in your Bank yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
            {sellableRows.map(({ item, qty }) => {
              const unitPrice = getSellPrice(item)
              return (
                <div
                  key={item.id}
                  data-sell-item-id={item.id}
                  className="flex flex-col gap-1 rounded-lg border border-line bg-panel p-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-neutral-200">{item.name}</div>
                      <div className="text-[11px] text-neutral-500">
                        x{qty} · 🪙 {unitPrice} each
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => sellItem(item.id, 1)}
                      className="flex-1 rounded bg-panel-soft py-1 text-[11px] font-semibold text-neutral-200 hover:bg-neutral-700"
                    >
                      Sell 1
                    </button>
                    <button
                      type="button"
                      onClick={() => sellItem(item.id, qty)}
                      className="flex-1 rounded bg-amber-600/80 py-1 text-[11px] font-semibold text-neutral-950 hover:bg-amber-500"
                    >
                      Sell All ({qty * unitPrice}g)
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
