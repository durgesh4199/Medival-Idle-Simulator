import { actionsById } from '../data'
import { useGameStore } from '../state/gameStore'
import { useNow } from './useNow'

export function ProgressBar() {
  const activeAction = useGameStore((s) => s.activeAction)
  const now = useNow()

  if (!activeAction) {
    return <div className="h-2 w-full rounded-full bg-panel-soft" aria-hidden />
  }

  const elapsed = now - activeAction.startedAt
  const percent = Math.min(100, Math.max(0, (elapsed / activeAction.durationMs) * 100))
  const action = actionsById[activeAction.actionId]
  const remainingS = Math.max(0, (activeAction.durationMs - elapsed) / 1000)

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-soft">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-100 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-28 shrink-0 text-right text-xs tabular-nums text-neutral-400">
        {action ? `${remainingS.toFixed(1)}s` : null}
      </span>
    </div>
  )
}
