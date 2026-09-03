import { combatSkillDisplay, getItem, petsById, skills } from '../data'
import { useGameStore } from '../state/gameStore'

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function skillDisplay(skillId: string): { icon: string; name: string } {
  const skill = skills[skillId as keyof typeof skills]
  if (skill) return { icon: skill.icon, name: skill.name }
  const combatSkill = combatSkillDisplay[skillId as keyof typeof combatSkillDisplay]
  if (combatSkill) return { icon: combatSkill.icon, name: combatSkill.label }
  return { icon: '❔', name: skillId }
}

export function OfflineModal() {
  const summary = useGameStore((s) => s.offlineSummary)
  const dismiss = useGameStore((s) => s.dismissOfflineSummary)

  if (!summary) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-5">
        <h2 className="mb-1 text-lg font-semibold text-gold">Welcome back!</h2>
        <p className="mb-4 text-sm text-neutral-400">
          You were away for {formatDuration(summary.elapsedMs)}. Here's what you earned:
        </p>

        <div className="mb-4 space-y-1">
          {Object.entries(summary.xpGained).map(([skillId, xp]) => {
            const display = skillDisplay(skillId)
            return (
              <div key={skillId} className="flex justify-between text-sm">
                <span>
                  {display.icon} {display.name}
                </span>
                <span className="text-gold">+{Math.floor(xp).toLocaleString()} XP</span>
              </div>
            )
          })}
        </div>

        <div className="mb-4 space-y-1">
          {Object.entries(summary.itemsGained).map(([itemId, qty]) => {
            const item = getItem(itemId)
            return (
              <div key={itemId} className="flex justify-between text-sm">
                <span>
                  {item.icon} {item.name}
                </span>
                <span className="text-neutral-300">x{qty}</span>
              </div>
            )
          })}
          {summary.goldGained > 0 && (
            <div className="flex justify-between text-sm">
              <span>🪙 Gold</span>
              <span className="text-neutral-300">+{summary.goldGained.toLocaleString()}</span>
            </div>
          )}
        </div>

        {summary.petsGained.length > 0 && (
          <div className="mb-4 space-y-1 rounded-lg border border-gold/30 bg-gold/10 p-2.5">
            {summary.petsGained.map((petId) => {
              const pet = petsById[petId]
              if (!pet) return null
              return (
                <div key={petId} className="flex items-center gap-2 text-sm text-gold">
                  <span className="text-lg">{pet.icon}</span>
                  <span>You found a pet: {pet.name}!</span>
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-neutral-950 hover:bg-brand-dim"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
