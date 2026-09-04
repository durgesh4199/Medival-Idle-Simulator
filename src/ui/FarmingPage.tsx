import { farmingCrops, farmingCropsById, getItem } from '../data'
import { isPlotReady, plotProgress } from '../engine/farmingEngine'
import { isMasteryPoolFull, masteryLevelForXp } from '../engine/masteryEngine'
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

function PlotCard({ plotIndex }: { plotIndex: number }) {
  const farmingPlots = useGameStore((s) => s.farmingPlots)
  const levelOf = useGameStore((s) => s.levelOf)
  const inventory = useGameStore((s) => s.inventory)
  const masteryXp = useGameStore((s) => s.masteryXp)
  const masteryPoolXp = useGameStore((s) => s.masteryPoolXp)
  const canPlantCrop = useGameStore((s) => s.canPlantCrop)
  const plantCrop = useGameStore((s) => s.plantCrop)
  const harvestCrop = useGameStore((s) => s.harvestCrop)
  const now = useNow(1000)

  const plot = farmingPlots[plotIndex]
  const crop = plot.cropId ? farmingCropsById[plot.cropId] : undefined
  const ready = isPlotReady(plot, crop, now)
  const percent = plotProgress(plot, crop, now)

  if (crop && plot.plantedAt != null) {
    const remainingMs = plot.plantedAt + crop.growDurationMs - now
    const cropMasteryLevel = masteryLevelForXp(masteryXp[crop.id] ?? 0)
    const poolFull = isMasteryPoolFull(masteryPoolXp.farming ?? 0)
    return (
      <div
        className={`overflow-hidden rounded-xl border bg-panel ${
          ready ? 'border-gold' : 'border-line'
        }`}
      >
        <div className="border-b border-line bg-panel-soft px-3 py-2 text-center text-sm font-semibold text-neutral-300">
          Plot {plotIndex + 1}
        </div>
        <div className="flex flex-col items-center gap-2 p-4">
          <span className={`text-4xl ${ready ? '' : 'opacity-70'}`}>{crop.icon}</span>
          <span className="text-sm font-medium text-neutral-200">{crop.name}</span>
          <span className="text-[11px] text-neutral-500">
            🎖️ Mastery Lv {cropMasteryLevel}
            {poolFull && <span className="text-amber-400"> · Pool FULL</span>}
          </span>
          {ready ? (
            <span className="text-xs font-semibold text-gold">Ready to harvest!</span>
          ) : (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-soft">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-300 ease-linear"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-neutral-500">
                Ready in {formatRemaining(remainingMs)}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={() => harvestCrop(plotIndex)}
            disabled={!ready}
            className={`mt-1 w-full rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              ready
                ? 'bg-brand text-neutral-950 hover:bg-brand-dim'
                : 'cursor-not-allowed bg-panel-soft text-neutral-600'
            }`}
          >
            Harvest
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line border-dashed bg-panel">
      <div className="border-b border-line bg-panel-soft px-3 py-2 text-center text-sm font-semibold text-neutral-300">
        Plot {plotIndex + 1}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="mb-1 text-center text-xs text-neutral-500">Empty — plant a seed</div>
        {farmingCrops.map((c) => {
          const locked = levelOf('farming') < c.requiredLevel
          const seedQty = inventory[c.seedItemId] ?? 0
          const seedItem = getItem(c.seedItemId)
          const disabled = !canPlantCrop(plotIndex, c.id)
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              onClick={() => plantCrop(plotIndex, c.id)}
              title={locked ? `Requires Farming level ${c.requiredLevel}` : undefined}
              className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                disabled
                  ? 'cursor-not-allowed border-line bg-panel-soft text-neutral-600 opacity-60'
                  : 'border-line bg-panel-soft text-neutral-200 hover:border-line-soft'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </span>
              <span className="tabular-nums text-neutral-500">
                {locked ? `Lv ${c.requiredLevel}` : `${seedItem.icon} x${seedQty}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Farming's whole page: a plot grid, no Location/Action selectors — see
 * data/skills/farming.ts's header comment for why this isn't SkillPanel.
 * Plots grow independent of whatever else is running (`activeAction`/
 * `combat`/`dungeonRun`), so nothing here needs to stop or be stopped by
 * the rest of the game.
 */
export function FarmingPage() {
  const farmingPlots = useGameStore((s) => s.farmingPlots)

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="mb-4 text-sm text-neutral-400">
        Plant a seed, then come back once it's grown — crops keep growing whether you're
        training, fighting, or gone entirely. Seeds are bought at the Shop.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {farmingPlots.map((_, i) => (
          <PlotCard key={i} plotIndex={i} />
        ))}
      </div>
    </div>
  )
}
