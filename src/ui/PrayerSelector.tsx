import { prayers } from '../data'
import { useGameStore } from '../state/gameStore'

/** Shared between CombatPage and DungeonsPage — both read
 *  `playerCombatStats()`, so a Prayer selected here applies to either. */
export function PrayerSelector() {
  const selectedPrayerId = useGameStore((s) => s.selectedPrayerId)
  const canSelectPrayer = useGameStore((s) => s.canSelectPrayer)
  const selectPrayer = useGameStore((s) => s.selectPrayer)

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Select Prayer
      </h3>
      <p className="mb-2 text-[11px] text-neutral-500">
        One active at a time — pick the stat that matters most against this enemy.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectPrayer(null)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            selectedPrayerId === null
              ? 'border-gold bg-gold/10 text-gold'
              : 'border-line bg-panel-soft text-neutral-400'
          }`}
        >
          None
        </button>
        {prayers.map((prayer) => {
          const unlocked = canSelectPrayer(prayer.id)
          const isSelected = selectedPrayerId === prayer.id
          return (
            <button
              key={prayer.id}
              type="button"
              disabled={!unlocked}
              onClick={() => selectPrayer(prayer.id)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                isSelected
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-line bg-panel-soft text-neutral-200'
              } ${!unlocked ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {prayer.icon} {prayer.name} — {prayer.description}
              {!unlocked && (
                <span className="ml-1 text-neutral-500">(Def {prayer.requiredLevel})</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
