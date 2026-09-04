import { getItem, ranchAnimals, ranchAnimalsById } from '../data'
import {
  isMature,
  maturityProgress,
  nextBatchProgress,
  stockpiledBatches,
} from '../engine/ranchingEngine'
import { useGameStore } from '../state/gameStore'
import { useNow } from './useNow'

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function PenCard({ penIndex }: { penIndex: number }) {
  const ranchPens = useGameStore((s) => s.ranchPens)
  const levelOf = useGameStore((s) => s.levelOf)
  const inventory = useGameStore((s) => s.inventory)
  const canPlaceAnimal = useGameStore((s) => s.canPlaceAnimal)
  const placeAnimal = useGameStore((s) => s.placeAnimal)
  const collectRanch = useGameStore((s) => s.collectRanch)
  const releasePen = useGameStore((s) => s.releasePen)
  const now = useNow(1000)

  const pen = ranchPens[penIndex]
  const animal = pen.animalId ? ranchAnimalsById[pen.animalId] : undefined

  if (animal && pen.placedAt != null) {
    const mature = isMature(pen, animal, now)
    const stockpile = stockpiledBatches(pen, animal, now)
    const full = stockpile >= animal.maxStockpile
    const produceItem = getItem(animal.produceItemId)

    return (
      <div
        className={`overflow-hidden rounded-xl border bg-panel ${
          stockpile > 0 ? 'border-gold' : 'border-line'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line bg-panel-soft px-3 py-2">
          <span className="text-sm font-semibold text-neutral-300">Pen {penIndex + 1}</span>
          <button
            type="button"
            onClick={() => releasePen(penIndex)}
            className="text-[11px] text-neutral-500 hover:text-red-400"
          >
            Release
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 p-4">
          <span className="text-4xl">{animal.icon}</span>
          <span className="text-sm font-medium text-neutral-200">{animal.name}</span>

          {!mature ? (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-soft">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-300 ease-linear"
                  style={{ width: `${maturityProgress(pen, animal, now)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-500">
                Maturing — ready in {formatRemaining(pen.placedAt + animal.raiseDurationMs - now)}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs tabular-nums text-neutral-300">
                {produceItem.icon} {stockpile} / {animal.maxStockpile} {produceItem.name}
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-soft">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-300 ease-linear"
                  style={{ width: `${full ? 100 : nextBatchProgress(pen, animal, now)}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {full ? 'Pen full — collect to keep production going' : 'Producing…'}
              </span>
            </>
          )}

          <button
            type="button"
            onClick={() => collectRanch(penIndex)}
            disabled={stockpile <= 0}
            className={`mt-1 w-full rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              stockpile > 0
                ? 'bg-brand text-neutral-950 hover:bg-brand-dim'
                : 'cursor-not-allowed bg-panel-soft text-neutral-600'
            }`}
          >
            Collect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line border-dashed bg-panel">
      <div className="border-b border-line bg-panel-soft px-3 py-2 text-center text-sm font-semibold text-neutral-300">
        Pen {penIndex + 1}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="mb-1 text-center text-xs text-neutral-500">Empty — place an animal</div>
        {ranchAnimals.map((a) => {
          const locked = levelOf('ranching') < a.requiredLevel
          const animalQty = inventory[a.animalItemId] ?? 0
          const animalItem = getItem(a.animalItemId)
          const disabled = !canPlaceAnimal(penIndex, a.id)
          return (
            <button
              key={a.id}
              type="button"
              disabled={disabled}
              onClick={() => placeAnimal(penIndex, a.id)}
              title={locked ? `Requires Ranching level ${a.requiredLevel}` : undefined}
              className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                disabled
                  ? 'cursor-not-allowed border-line bg-panel-soft text-neutral-600 opacity-60'
                  : 'border-line bg-panel-soft text-neutral-200 hover:border-line-soft'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{a.icon}</span>
                <span>{a.name}</span>
              </span>
              <span className="tabular-nums text-neutral-500">
                {locked ? `Lv ${a.requiredLevel}` : `${animalItem.icon} x${animalQty}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Ranching's whole page — same "no Location/Action selectors" shape
 * FarmingPage uses, and the same reasoning (see data/skills/ranching.ts).
 * The difference from Farming is on display here rather than in the
 * layout: a mature pen shows a stockpile count that keeps climbing (up to
 * its cap) instead of a single ready/not-ready state, and collecting
 * leaves the animal in place instead of emptying the pen.
 */
export function RanchingPage() {
  const ranchPens = useGameStore((s) => s.ranchPens)

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="mb-4 text-sm text-neutral-400">
        Place an animal, wait for it to mature, then collect its produce whenever you like —
        production keeps accumulating (up to a cap) whether you're around or not. Animals are
        bought at the Shop.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {ranchPens.map((_, i) => (
          <PenCard key={i} penIndex={i} />
        ))}
      </div>
    </div>
  )
}
