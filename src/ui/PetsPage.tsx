import { pets, skills } from '../data'
import type { Pet } from '../data/types'
import { useGameStore } from '../state/gameStore'

/** Source label + what the bonus actually does, per `PetSource` variant —
 *  pulled out of the card render now that there are four variants, not
 *  two, to keep from nesting another ternary per pet added. */
function describePetSource(pet: Pet): { sourceLabel: string; bonusLabel: string } {
  const percent = `${(pet.bonusPercent * 100).toFixed(0)}%`
  switch (pet.source.type) {
    case 'skill': {
      const skillName = skills[pet.source.skillId]?.name ?? pet.source.skillId
      return { sourceLabel: skillName, bonusLabel: `+${percent} ${skillName} speed` }
    }
    case 'farming':
      return { sourceLabel: 'Farming', bonusLabel: `+${percent} crop growth speed` }
    case 'ranching':
      return { sourceLabel: 'Ranching', bonusLabel: `+${percent} animal raising speed` }
    case 'combat':
      return { sourceLabel: 'Combat', bonusLabel: `+${percent} combat XP` }
  }
}

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
          const { sourceLabel, bonusLabel } = describePetSource(pet)

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
