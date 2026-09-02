import { skills } from '../data'
import type { SkillId } from '../data/types'
import { xpProgress } from '../engine/xp'
import { useGameStore } from '../state/gameStore'

export type View = 'skills' | 'combat' | 'bank' | 'shop'

interface Props {
  view: View
  onChangeView: (view: View) => void
  selectedSkill: SkillId
}

const NAV_TABS: { view: View; label: string }[] = [
  { view: 'skills', label: 'Skills' },
  { view: 'combat', label: 'Combat' },
  { view: 'bank', label: 'Bank' },
  { view: 'shop', label: 'Shop' },
]

const VIEW_SUBTITLE: Record<Exclude<View, 'skills'>, string> = {
  combat: 'Automated combat — preparation matters more than the fight itself',
  bank: 'Equipment & Inventory',
  shop: 'Buy staples, sell what you don’t need',
}

export function Header({ view, onChangeView, selectedSkill }: Props) {
  const gold = useGameStore((s) => s.gold)
  const xp = useGameStore((s) => s.skillXp[selectedSkill] ?? 0)
  const skill = skills[selectedSkill]
  const progress = xpProgress(xp)

  return (
    <header className="flex items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950 px-4 py-2">
      <nav className="flex shrink-0 items-center gap-1">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.view}
            type="button"
            onClick={() => onChangeView(tab.view)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              view === tab.view
                ? 'bg-teal-500/15 text-teal-300'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {view === 'skills' ? (
        <div className="flex flex-1 items-center gap-3 overflow-hidden">
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-xl">{skill?.icon}</span>
            <span className="font-semibold">{skill?.name}</span>
          </span>
          <span className="text-xs text-neutral-400">Skill XP</span>
          <div className="h-2 w-64 shrink-0 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-teal-400"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-teal-300">
            {progress.level}
          </span>
          <span className="shrink-0 text-xs text-neutral-500">
            {Math.floor(progress.xpIntoLevel).toLocaleString()} /{' '}
            {Math.floor(progress.xpForNextLevel).toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="flex-1 truncate text-sm text-neutral-400">{VIEW_SUBTITLE[view]}</div>
      )}

      <div className="flex shrink-0 items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-sm">
        <span>🪙</span>
        <span className="font-medium">{gold.toLocaleString()}</span>
      </div>
    </header>
  )
}
