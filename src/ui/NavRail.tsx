import { COMBAT_SKILL_IDS, skills } from '../data'
import type { SkillId } from '../data/types'
import { xpProgress } from '../engine/xp'
import { useGameStore } from '../state/gameStore'
import type { View } from './Header'

interface Props {
  view: View
  selectedSkill: SkillId
  onSelectSkill: (id: SkillId) => void
  onChangeView: (view: View) => void
}

const EXTRA_TABS: { view: Exclude<View, 'skills'>; icon: string; label: string }[] = [
  { view: 'combat', icon: '⚔️', label: 'Combat' },
  { view: 'dungeons', icon: '🗝️', label: 'Dungeons' },
  { view: 'farming', icon: '🌾', label: 'Farming' },
  { view: 'ranching', icon: '🐄', label: 'Ranching' },
  { view: 'bank', icon: '🎒', label: 'Bank' },
  { view: 'shop', icon: '🛒', label: 'Shop' },
  { view: 'quests', icon: '📜', label: 'Quests' },
  { view: 'achievements', icon: '🏆', label: 'Achievements' },
  { view: 'pets', icon: '🐾', label: 'Pets' },
]

const RING_SIZE = 44
const RING_RADIUS = 19
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** Thin circular progress ring drawn around a rail icon, filling clockwise
 *  from the top as `percent` (0-100) rises — same idea as Melvor's own
 *  sidebar icons, which ring each skill in its XP-to-next-level progress. */
function ProgressRing({ percent, isActive }: { percent: number; isActive: boolean }) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, percent)) / 100)
  return (
    <svg
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
      aria-hidden
    >
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={2}
        className="stroke-line"
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        className={`transition-[stroke-dashoffset] duration-300 ease-out ${
          isActive ? 'stroke-gold' : 'stroke-gold/60'
        }`}
      />
    </svg>
  )
}

function RailButton({
  icon,
  title,
  isActive,
  percent,
  onClick,
}: {
  icon: string
  title: string
  isActive: boolean
  /** XP progress toward next level, 0-100. Omit for destinations with no
   *  level of their own (Bank/Shop/Quests) — they get a plain icon. */
  percent?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl transition-colors ${
        isActive
          ? 'bg-gold/15 text-gold'
          : 'text-neutral-500 hover:bg-panel hover:text-neutral-200'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold" />
      )}
      {percent !== undefined && <ProgressRing percent={percent} isActive={isActive} />}
      <span className="relative" aria-hidden>
        {icon}
      </span>
    </button>
  )
}

/**
 * The single global icon rail: switches both skill (within the Skills view)
 * and top-level view, mirroring the reference UI's one slim icon strip
 * rather than a separate wide text sidebar + top tab bar. Each icon carries
 * a circular XP-progress ring, filling toward the next level.
 */
export function NavRail({ view, selectedSkill, onSelectSkill, onChangeView }: Props) {
  const skillXp = useGameStore((s) => s.skillXp)

  const combatPercent =
    COMBAT_SKILL_IDS.reduce((sum, id) => sum + xpProgress(skillXp[id] ?? 0).percent, 0) /
    COMBAT_SKILL_IDS.length
  const farmingPercent = xpProgress(skillXp.farming ?? 0).percent
  const ranchingPercent = xpProgress(skillXp.ranching ?? 0).percent
  // Which EXTRA_TABS entries get a progress ring at all — Bank/Shop/Quests/
  // etc. have no level of their own, so they're plain icons (percent
  // undefined), same as RailButton's own doc comment already says.
  const extraTabPercent: Partial<Record<Exclude<View, 'skills'>, number>> = {
    combat: combatPercent,
    farming: farmingPercent,
    ranching: ranchingPercent,
  }

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-rail py-2">
      {Object.values(skills).map((skill) => {
        const progress = xpProgress(skillXp[skill.id] ?? 0)
        return (
          <RailButton
            key={skill.id}
            icon={skill.icon}
            title={`${skill.name} (Lv ${progress.level})`}
            isActive={view === 'skills' && skill.id === selectedSkill}
            percent={progress.percent}
            onClick={() => {
              onSelectSkill(skill.id)
              onChangeView('skills')
            }}
          />
        )
      })}

      <div className="my-1 h-px w-8 shrink-0 bg-line" />

      {EXTRA_TABS.map((tab) => (
        <RailButton
          key={tab.view}
          icon={tab.icon}
          title={tab.label}
          isActive={view === tab.view}
          percent={extraTabPercent[tab.view]}
          onClick={() => onChangeView(tab.view)}
        />
      ))}
    </nav>
  )
}
