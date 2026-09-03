import { actionsById, dungeonsById, enemiesById, locationsById, skills } from '../data'
import { xpProgress } from '../engine/xp'
import { useGameStore } from '../state/gameStore'
import { useNow } from './useNow'

/** Global bottom status bar — mirrors the reference UI's footer strip that
 *  always shows what's currently running, regardless of which page you're
 *  looking at. */
export function StatusBar() {
  const activeAction = useGameStore((s) => s.activeAction)
  const combat = useGameStore((s) => s.combat)
  const dungeonRun = useGameStore((s) => s.dungeonRun)
  const skillXp = useGameStore((s) => s.skillXp)
  const playerCombatStats = useGameStore((s) => s.playerCombatStats)
  const now = useNow(200)

  if (activeAction) {
    const action = actionsById[activeAction.actionId]
    const location = action ? locationsById[action.locationId] : undefined
    const skill = action ? skills[action.skillId] : undefined
    const elapsed = now - activeAction.startedAt
    const percent = Math.min(100, Math.max(0, (elapsed / activeAction.durationMs) * 100))
    const remainingS = Math.max(0, (activeAction.durationMs - elapsed) / 1000)
    const progress = skill ? xpProgress(skillXp[skill.id] ?? 0) : undefined

    return (
      <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-line bg-rail px-4 text-xs">
        <span className="flex shrink-0 items-center gap-1.5 font-medium text-neutral-200">
          <span aria-hidden>{skill?.icon}</span>
          <span>{action?.name ?? 'Working'}</span>
        </span>
        {location && <span className="shrink-0 text-neutral-500">{location.name}</span>}
        <div className="flex w-40 shrink-0 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-100 ease-linear"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="w-9 shrink-0 tabular-nums text-neutral-500">{remainingS.toFixed(1)}s</span>
        </div>
        {progress && (
          <span className="shrink-0 tabular-nums text-neutral-500">
            Lv {progress.level} · {Math.floor(progress.xpIntoLevel).toLocaleString()}/
            {Math.floor(progress.xpForNextLevel).toLocaleString()} XP
          </span>
        )}
      </footer>
    )
  }

  if (combat) {
    const enemy = enemiesById[combat.enemyId]
    const player = playerCombatStats()
    const playerPercent = Math.max(0, Math.min(100, (combat.playerHp / player.maxHp) * 100))
    const enemyPercent = enemy ? Math.max(0, Math.min(100, (combat.enemyHp / enemy.hp) * 100)) : 0

    return (
      <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-line bg-rail px-4 text-xs">
        <span className="flex shrink-0 items-center gap-1.5 font-medium text-neutral-200">
          <span aria-hidden>⚔️</span>
          <span>Fighting {enemy?.name ?? 'enemy'}</span>
        </span>
        <div className="flex w-28 shrink-0 items-center gap-1.5">
          <span className="text-neutral-500">You</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
            <div className="h-full rounded-full bg-brand" style={{ width: `${playerPercent}%` }} />
          </div>
        </div>
        <div className="flex w-28 shrink-0 items-center gap-1.5">
          <span className="text-neutral-500">{enemy?.name ?? 'Enemy'}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
            <div className="h-full rounded-full bg-red-500" style={{ width: `${enemyPercent}%` }} />
          </div>
        </div>
        <span className="shrink-0 tabular-nums text-neutral-500">Kills: {combat.kills}</span>
      </footer>
    )
  }

  if (dungeonRun) {
    const dungeon = dungeonsById[dungeonRun.dungeonId]
    const enemy = enemiesById[dungeon?.enemyIds[dungeonRun.enemyIndex] ?? '']
    const player = playerCombatStats()
    const playerPercent = Math.max(0, Math.min(100, (dungeonRun.playerHp / player.maxHp) * 100))
    const enemyPercent = enemy
      ? Math.max(0, Math.min(100, (dungeonRun.enemyHp / enemy.hp) * 100))
      : 0

    return (
      <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-line bg-rail px-4 text-xs">
        <span className="flex shrink-0 items-center gap-1.5 font-medium text-neutral-200">
          <span aria-hidden>{dungeon?.icon ?? '🗝️'}</span>
          <span>{dungeon?.name ?? 'Dungeon'}</span>
        </span>
        <div className="flex w-28 shrink-0 items-center gap-1.5">
          <span className="text-neutral-500">You</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
            <div className="h-full rounded-full bg-brand" style={{ width: `${playerPercent}%` }} />
          </div>
        </div>
        <div className="flex w-28 shrink-0 items-center gap-1.5">
          <span className="text-neutral-500">{enemy?.name ?? 'Enemy'}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
            <div className="h-full rounded-full bg-red-500" style={{ width: `${enemyPercent}%` }} />
          </div>
        </div>
        <span className="shrink-0 tabular-nums text-neutral-500">
          Enemy {dungeonRun.enemyIndex + 1}/{dungeon?.enemyIds.length ?? '?'}
        </span>
      </footer>
    )
  }

  return (
    <footer className="flex h-9 shrink-0 items-center border-t border-line bg-rail px-4 text-xs text-neutral-600">
      Idle — select something to start training.
    </footer>
  )
}
