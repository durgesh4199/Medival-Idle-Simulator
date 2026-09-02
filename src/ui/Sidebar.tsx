import { skills } from '../data'
import type { SkillId } from '../data/types'
import { useGameStore } from '../state/gameStore'

interface Props {
  selected: SkillId
  onSelect: (id: SkillId) => void
}

export function Sidebar({ selected, onSelect }: Props) {
  const levelOf = useGameStore((s) => s.levelOf)

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-neutral-800 bg-neutral-950 p-3">
      {Object.values(skills).map((skill) => {
        const isActive = skill.id === selected
        return (
          <button
            key={skill.id}
            type="button"
            onClick={() => onSelect(skill.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
              isActive
                ? 'bg-teal-500/15 text-teal-300'
                : 'text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            <span className="text-xl leading-none">{skill.icon}</span>
            <span className="flex-1 truncate text-sm font-medium">{skill.name}</span>
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
              {levelOf(skill.id)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
