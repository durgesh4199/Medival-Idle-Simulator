import { pets, skills } from '../data'
import { useGameStore } from '../state/gameStore'

export function PetsPage() {
  const ownedPetIds = useGameStore((s) => s.ownedPetIds)
  const ownedCount = pets.filter((p) => ownedPetIds[p.id]).length

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="mb-4 text-sm text-neutral-400">
        {ownedCount} / {pets.length} found —{' '}
        <span className="text-neutral-500">
          each is a rare find while training or fighting, more likely the more
          experienced you are. Ownership is permanent and grants a small passive bonus.
        </span>
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {pets.map((pet) => {
          const owned = Boolean(ownedPetIds[pet.id])
          const sourceLabel =
            pet.source.type === 'skill' ? skills[pet.source.skillId]?.name : 'Combat'
          const bonusLabel =
            pet.source.type === 'skill'
              ? `+${(pet.bonusPercent * 100).toFixed(0)}% ${sourceLabel} speed`
              : `+${(pet.bonusPercent * 100).toFixed(0)}% combat XP`

          return (
            <div
              key={pet.id}
              className={`overflow-hidden rounded-xl border bg-panel ${
                owned ? 'border-gold/30' : 'border-line'
              }`}
            >
              <div className="flex items-center gap-3 border-b border-line bg-rail p-3">
                <span className={`text-3xl ${owned ? '' : 'opacity-25 grayscale'}`}>
                  {pet.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`truncate font-semibold ${owned ? 'text-neutral-100' : 'text-neutral-500'}`}>
                    {owned ? pet.name : '???'}
                  </div>
                  <div className="text-xs text-neutral-500">Found via {sourceLabel}</div>
                </div>
              </div>
              <div className="space-y-1.5 p-3 text-sm">
                <p className="text-neutral-400">{owned ? pet.description : 'Not yet found.'}</p>
                <div className={owned ? 'text-gold' : 'text-neutral-600'}>{bonusLabel}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
