import { useEffect, useRef } from 'react'
import {
  actions,
  combatAreas,
  dungeons,
  enemies,
  farmingCrops,
  items,
  quests,
  ranchAnimals,
  shopBuyableItemIds,
  skills,
  spells,
} from '../data'
import { getBuyPrice } from '../engine/economyEngine'
import { useGameStore } from '../state/gameStore'
import { ItemLink } from './ItemLink'
import { useGameNavigation } from './gameNavigation'
import type { Destination } from './gameNavigation'
import { ArtIcon } from './ArtIcon'

export function ItemDetails({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const item = items[itemId]
  const { navigate } = useGameNavigation()
  const inventory = useGameStore((s) => s.inventory)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal()
  }, [])
  if (!item) return null
  const go = (destination: Destination) => {
    onClose()
    navigate(destination)
  }
  const sources = actions.filter((a) =>
    [...a.outputs, ...(a.specialOutputs ?? [])].some((o) => o.itemId === itemId),
  )
  const recipes = actions.filter((a) => a.inputs?.some((i) => i.itemId === itemId))
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="item-detail-title"
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-gold/40 bg-panel p-5 text-neutral-200 backdrop:bg-black/70"
    >
      <div className="mb-4 flex items-center gap-3">
        <ArtIcon name={item.id} className="h-12 w-12" />
        <div className="flex-1">
          <h2 id="item-detail-title" className="font-semibold text-gold">
            {item.name}
          </h2>
          <p className="text-xs text-neutral-400">
            Owned: {inventory[itemId] ?? 0} · Value: {item.value ?? 0} gold
          </p>
        </div>
        <button
          autoFocus
          type="button"
          aria-label="Close item details"
          onClick={onClose}
          className="rounded border border-line px-3 py-2"
        >
          Close
        </button>
      </div>
      <h3 className="mb-2 font-semibold">Where to obtain</h3>
      <div className="space-y-2 text-sm">
        {sources.map((a) => (
          <div key={a.id} className="rounded-lg bg-rail p-3">
            <button
              type="button"
              onClick={() => go({ view: 'skills', skillId: a.skillId, actionId: a.id })}
              className="text-gold underline"
            >
              {a.name}
            </button>
            <p className="text-xs text-neutral-400">
              {skills[a.skillId].name} level {a.requiredLevel} ·{' '}
              {(
                [...a.outputs, ...(a.specialOutputs ?? [])].find((o) => o.itemId === itemId)!
                  .chance * 100
              ).toFixed(1)}
              % per action
            </p>
            {a.inputs && (
              <p className="mt-1 text-xs">
                Requires{' '}
                {a.inputs.map((i, index) => (
                  <span key={i.itemId}>
                    {index > 0 && ', '}
                    <ItemLink itemId={i.itemId}>
                      {i.qty} {items[i.itemId].name}
                    </ItemLink>
                  </span>
                ))}
              </p>
            )}
          </div>
        ))}
        {shopBuyableItemIds.includes(itemId) && (
          <button
            type="button"
            onClick={() => go({ view: 'shop' })}
            className="block text-gold underline"
          >
            General Store · {getBuyPrice(item)} gold each
          </button>
        )}
        {enemies
          .filter((e) => e.loot.some((l) => l.itemId === itemId))
          .map((e) => (
            <button
              type="button"
              key={e.id}
              className="block text-gold underline"
              onClick={() =>
                go(
                  combatAreas.some((a) => a.enemyIds.includes(e.id))
                    ? { view: 'combat', enemyId: e.id }
                    : {
                        view: 'dungeons',
                        dungeonId: dungeons.find((d) => d.enemyIds.includes(e.id))?.id,
                      },
                )
              }
            >
              Loot: {e.name} · {(e.loot.find((l) => l.itemId === itemId)!.chance * 100).toFixed(1)}%
            </button>
          ))}
        {farmingCrops
          .filter((c) => c.cropItemId === itemId)
          .map((c) => (
            <button
              type="button"
              key={c.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'farming' })}
            >
              Grow {c.name} · Farming level {c.requiredLevel}
            </button>
          ))}
        {ranchAnimals
          .filter((a) => a.produceItemId === itemId)
          .map((a) => (
            <button
              type="button"
              key={a.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'ranching' })}
            >
              Raise {a.name} · Ranching level {a.requiredLevel}
            </button>
          ))}
        {quests
          .filter((q) => q.rewards.items?.some((i) => i.itemId === itemId))
          .map((q) => (
            <button
              type="button"
              key={q.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'quests' })}
            >
              Quest reward: {q.name}
            </button>
          ))}
        {dungeons
          .filter((d) => d.completionReward.items?.some((i) => i.itemId === itemId))
          .map((d) => (
            <button
              type="button"
              key={d.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'dungeons', dungeonId: d.id })}
            >
              Dungeon reward: {d.name}
            </button>
          ))}
      </div>
      <h3 className="mb-2 mt-5 font-semibold">Used in</h3>
      <div className="space-y-2 text-sm">
        {recipes.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => go({ view: 'skills', skillId: a.skillId, actionId: a.id })}
            className="block text-gold underline"
          >
            {a.name} · {skills[a.skillId].name} level {a.requiredLevel}
          </button>
        ))}
        {farmingCrops
          .filter((c) => c.seedItemId === itemId)
          .map((c) => (
            <button
              type="button"
              key={c.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'farming' })}
            >
              Plant {c.name}
            </button>
          ))}
        {ranchAnimals
          .filter((a) => a.animalItemId === itemId)
          .map((a) => (
            <button
              type="button"
              key={a.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'ranching' })}
            >
              Place {a.name}
            </button>
          ))}
        {quests
          .filter((q) => q.requirements.some((r) => r.type === 'itemCount' && r.itemId === itemId))
          .map((q) => (
            <button
              type="button"
              key={q.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'quests' })}
            >
              {q.name}
            </button>
          ))}
        {spells
          .filter((s) => s.cost.some((c) => c.itemId === itemId))
          .map((s) => (
            <button
              type="button"
              key={s.id}
              className="block text-gold underline"
              onClick={() => go({ view: 'combat' })}
            >
              Cast {s.name}
            </button>
          ))}
        {item.equipment && (
          <button
            type="button"
            className="block text-gold underline"
            onClick={() => go({ view: 'bank' })}
          >
            Equip in the {item.equipment.slot} slot
          </button>
        )}
        {item.healAmount && (
          <button
            type="button"
            className="block text-gold underline"
            onClick={() => go({ view: 'combat' })}
          >
            Combat food · restores {item.healAmount} HP
          </button>
        )}
        {!recipes.length && !item.equipment && !item.healAmount && (
          <p className="text-xs text-neutral-400">Check the quests and sell surplus at the Shop.</p>
        )}
      </div>
    </dialog>
  )
}
