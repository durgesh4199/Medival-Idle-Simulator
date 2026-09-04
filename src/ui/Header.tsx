import { skills } from '../data'
import type { SkillId } from '../data/types'
import { xpProgress } from '../engine/xp'
import { useGameStore } from '../state/gameStore'

export type View =
  | 'skills'
  | 'combat'
  | 'dungeons'
  | 'farming'
  | 'ranching'
  | 'bank'
  | 'shop'
  | 'quests'
  | 'achievements'
  | 'pets'

interface Props {
  view: View
  selectedSkill: SkillId
}

const VIEW_META: Record<Exclude<View, 'skills'>, { icon: string; title: string; subtitle: string }> = {
  combat: {
    icon: '⚔️',
    title: 'Combat',
    subtitle: 'Automated combat — preparation matters more than the fight itself',
  },
  dungeons: {
    icon: '🗝️',
    title: 'Dungeons',
    subtitle: 'A fixed encounter sequence and a one-time reward — real risk, real reward',
  },
  farming: {
    icon: '🌾',
    title: 'Farming',
    subtitle: 'Plant a seed, then come back once it’s grown — keeps going while you’re away',
  },
  ranching: {
    icon: '🐄',
    title: 'Ranching',
    subtitle: 'Raise an animal once, then collect its produce again and again',
  },
  bank: { icon: '🎒', title: 'Bank', subtitle: 'Equipment & Inventory' },
  shop: { icon: '🛒', title: 'Shop', subtitle: 'Buy staples, sell what you don’t need' },
  quests: { icon: '📜', title: 'Quests', subtitle: 'Narrative direction and mechanical gates' },
  achievements: {
    icon: '🏆',
    title: 'Achievements',
    subtitle: 'Secondary objectives across everything you\'ve already built',
  },
  pets: {
    icon: '🐾',
    title: 'Pets',
    subtitle: 'Rare collection rewards with a small passive bonus once found',
  },
}

export function Header({ view, selectedSkill }: Props) {
  const gold = useGameStore((s) => s.gold)
  const xp = useGameStore((s) => s.skillXp[selectedSkill] ?? 0)
  const skill = skills[selectedSkill]
  const progress = xpProgress(xp)

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-rail px-4">
      <span className="hidden shrink-0 items-center gap-2 text-sm font-semibold tracking-wide text-neutral-300 sm:flex">
        <span className="text-lg">🏰</span>
        Medieval Idle
      </span>

      <div className="hidden h-6 w-px shrink-0 bg-line sm:block" />

      {view === 'skills' ? (
        <div className="flex flex-1 items-center gap-3 overflow-hidden">
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-xl leading-none">{skill?.icon}</span>
            <span className="font-semibold text-neutral-100">{skill?.name}</span>
          </span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-panel text-xs font-bold text-gold">
            {progress.level}
          </span>
          <div className="h-2 w-full max-w-md shrink overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-[width] duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="hidden shrink-0 text-xs tabular-nums text-neutral-500 sm:inline">
            {Math.floor(progress.xpIntoLevel).toLocaleString()} /{' '}
            {Math.floor(progress.xpForNextLevel).toLocaleString()} XP
          </span>
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span className="text-xl leading-none">{VIEW_META[view].icon}</span>
          <span className="shrink-0 font-semibold text-neutral-100">{VIEW_META[view].title}</span>
          <span className="hidden truncate text-sm text-neutral-500 sm:inline">
            — {VIEW_META[view].subtitle}
          </span>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-sm">
        <span className="text-gold">🪙</span>
        <span className="font-semibold tabular-nums text-neutral-100">{gold.toLocaleString()}</span>
      </div>
    </header>
  )
}
