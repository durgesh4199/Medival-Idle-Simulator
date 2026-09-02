import { skills } from '../data'
import type { SkillId } from '../data/types'
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
  { view: 'bank', icon: '🎒', label: 'Bank' },
  { view: 'shop', icon: '🛒', label: 'Shop' },
  { view: 'quests', icon: '📜', label: 'Quests' },
]

function RailButton({
  icon,
  title,
  isActive,
  onClick,
}: {
  icon: string
  title: string
  isActive: boolean
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
      <span aria-hidden>{icon}</span>
    </button>
  )
}

/**
 * The single global icon rail: switches both skill (within the Skills view)
 * and top-level view, mirroring the reference UI's one slim icon strip
 * rather than a separate wide text sidebar + top tab bar.
 */
export function NavRail({ view, selectedSkill, onSelectSkill, onChangeView }: Props) {
  const levelOf = useGameStore((s) => s.levelOf)

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-rail py-2">
      {Object.values(skills).map((skill) => (
        <RailButton
          key={skill.id}
          icon={skill.icon}
          title={`${skill.name} (Lv ${levelOf(skill.id)})`}
          isActive={view === 'skills' && skill.id === selectedSkill}
          onClick={() => {
            onSelectSkill(skill.id)
            onChangeView('skills')
          }}
        />
      ))}

      <div className="my-1 h-px w-8 shrink-0 bg-line" />

      {EXTRA_TABS.map((tab) => (
        <RailButton
          key={tab.view}
          icon={tab.icon}
          title={tab.label}
          isActive={view === tab.view}
          onClick={() => onChangeView(tab.view)}
        />
      ))}
    </nav>
  )
}
