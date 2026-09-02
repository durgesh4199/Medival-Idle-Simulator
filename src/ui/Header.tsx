import { skills } from '../data'
import type { SkillId } from '../data/types'
import { xpProgress } from '../engine/xp'
import { useGameStore } from '../state/gameStore'

interface Props {
  selected: SkillId
}

export function Header({ selected }: Props) {
  const gold = useGameStore((s) => s.gold)
  const xp = useGameStore((s) => s.skillXp[selected] ?? 0)
  const skill = skills[selected]
  const progress = xpProgress(xp)

  return (
    <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{skill?.icon}</span>
        <span className="font-semibold">{skill?.name}</span>
      </div>

      <div className="flex flex-1 items-center gap-3 px-6">
        <span className="text-xs text-neutral-400">Skill XP</span>
        <div className="h-2 w-64 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-teal-400"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-teal-300">
          {progress.level}
        </span>
        <span className="text-xs text-neutral-500">
          {Math.floor(progress.xpIntoLevel).toLocaleString()} /{' '}
          {Math.floor(progress.xpForNextLevel).toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-sm">
        <span>🪙</span>
        <span className="font-medium">{gold.toLocaleString()}</span>
      </div>
    </header>
  )
}
