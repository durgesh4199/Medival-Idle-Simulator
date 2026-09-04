import { getItem, spells } from '../data'
import { useGameStore } from '../state/gameStore'

/** Shared between CombatPage and DungeonsPage, same reasoning as
 *  PrayerSelector — one Spell state regardless of where it's set from. */
export function SpellSelector() {
  const selectedSpellId = useGameStore((s) => s.selectedSpellId)
  const canSelectSpell = useGameStore((s) => s.canSelectSpell)
  const selectSpell = useGameStore((s) => s.selectSpell)
  const inventory = useGameStore((s) => s.inventory)

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Select Spell
      </h3>
      <p className="mb-2 text-[11px] text-neutral-500">
        Replaces your physical attack with a flat-damage bolt while its runes hold
        out — falls back to melee automatically once you run dry. Craft runes at
        Runecrafting.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectSpell(null)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            selectedSpellId === null
              ? 'border-gold bg-gold/10 text-gold'
              : 'border-line bg-panel-soft text-neutral-400'
          }`}
        >
          None (melee)
        </button>
        {spells.map((spell) => {
          const unlocked = canSelectSpell(spell.id)
          const isSelected = selectedSpellId === spell.id
          const canAffordNow = spell.cost.every(
            (cost) => (inventory[cost.itemId] ?? 0) >= cost.qty,
          )
          return (
            <button
              key={spell.id}
              type="button"
              disabled={!unlocked}
              onClick={() => selectSpell(spell.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                isSelected
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-line bg-panel-soft text-neutral-200'
              } ${!unlocked ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <div>
                {spell.icon} {spell.name}{' '}
                <span className="text-neutral-500">— {spell.power} power</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
                {spell.cost.map((cost) => {
                  const item = getItem(cost.itemId)
                  const have = inventory[cost.itemId] ?? 0
                  return (
                    <span key={cost.itemId} className={have < cost.qty ? 'text-red-400' : ''}>
                      {item.icon} {cost.qty} ({have})
                    </span>
                  )
                })}
                {!unlocked && <span>Atk {spell.requiredLevel}</span>}
                {unlocked && isSelected && !canAffordNow && (
                  <span className="text-red-400">out of runes — melee for now</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
