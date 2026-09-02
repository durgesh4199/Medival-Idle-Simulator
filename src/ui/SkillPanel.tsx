import { useState } from 'react'
import { actionsById, actionsForLocation, getItem, locationsForSkill } from '../data'
import type { Location, SkillId } from '../data/types'
import { xpProgress } from '../engine/xp'
import { MASTERY_POOL_CAP, isMasteryPoolFull, masterySpeedBonus } from '../engine/masteryEngine'
import { useGameStore } from '../state/gameStore'
import { ProgressBar } from './ProgressBar'

interface Props {
  skillId: SkillId
}

/** Small preview row of the distinct items obtainable at a location, shown
 *  on its card the way the reference UI shows a location's fish icons. */
function previewIcons(loc: Location): string[] {
  const seen = new Set<string>()
  const icons: string[] = []
  for (const actionId of loc.actionIds) {
    for (const output of actionsById[actionId]?.outputs ?? []) {
      if (seen.has(output.itemId)) continue
      seen.add(output.itemId)
      icons.push(getItem(output.itemId).icon)
      if (icons.length >= 5) return icons
    }
  }
  return icons
}

export function SkillPanel({ skillId }: Props) {
  const locations = locationsForSkill(skillId)
  const [locationId, setLocationId] = useState(locations[0]?.id)
  const [actionId, setActionId] = useState<string | undefined>()

  const activeAction = useGameStore((s) => s.activeAction)
  const inventory = useGameStore((s) => s.inventory)
  const levelOf = useGameStore((s) => s.levelOf)
  const canStartAction = useGameStore((s) => s.canStartAction)
  const startAction = useGameStore((s) => s.startAction)
  const stopAction = useGameStore((s) => s.stopAction)
  const masteryXp = useGameStore((s) => s.masteryXp)
  const masteryPoolXp = useGameStore((s) => s.masteryPoolXp)

  const actions = locationId ? actionsForLocation(locationId) : []
  const selectedAction = actions.find((a) => a.id === actionId) ?? actions[0]
  const level = levelOf(skillId)
  const isRunningHere = activeAction?.actionId === selectedAction?.id

  const actionMastery = selectedAction ? xpProgress(masteryXp[selectedAction.id] ?? 0) : undefined
  const poolXp = masteryPoolXp[skillId] ?? 0
  const poolPercent = Math.min(100, (poolXp / MASTERY_POOL_CAP) * 100)
  const poolFull = isMasteryPoolFull(poolXp)

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-line bg-rail p-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Select Location
        </h2>
        <div className="flex flex-col gap-2">
          {locations.map((loc) => {
            const locked = level < loc.requiredLevel
            const isSelected = loc.id === locationId
            const icons = previewIcons(loc)
            return (
              <button
                key={loc.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  setLocationId(loc.id)
                  setActionId(undefined)
                }}
                className={`overflow-hidden rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-gold bg-panel'
                    : 'border-line bg-panel hover:border-line-soft'
                } ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <div
                  className={`px-3 py-1.5 text-sm font-semibold ${
                    isSelected ? 'bg-gold/15 text-gold' : 'bg-panel-soft text-neutral-200'
                  }`}
                >
                  {loc.name}
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  {locked ? (
                    <span className="text-xs text-neutral-500">Requires level {loc.requiredLevel}</span>
                  ) : (
                    <span className="text-xs text-neutral-500">
                      {loc.actionIds.length} spot{loc.actionIds.length === 1 ? '' : 's'}
                    </span>
                  )}
                  <div className="flex shrink-0 gap-1 text-base">
                    {icons.map((icon, i) => (
                      <span key={i} aria-hidden>
                        {icon}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Select Spot
          </h2>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const locked = level < action.requiredLevel
              const isSelected = action.id === selectedAction?.id
              const isActive = activeAction?.actionId === action.id
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setActionId(action.id)}
                  className={`relative rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-line bg-panel text-neutral-200 hover:border-line-soft'
                  } ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {isActive && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                  {action.name}
                  {locked && <span className="ml-1 text-xs text-neutral-500">(Lv {action.requiredLevel})</span>}
                </button>
              )
            })}
          </div>
        </div>

        {selectedAction && (
          <div className="max-w-md overflow-hidden rounded-xl border border-line bg-panel">
            <div className="border-b border-line bg-panel-soft px-4 py-2 font-semibold text-gold">
              {selectedAction.name}
            </div>

            <div className="space-y-3 p-4">
              {selectedAction.inputs && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">Input</div>
                  {selectedAction.inputs.map((input) => {
                    const item = getItem(input.itemId)
                    const have = inventory[input.itemId] ?? 0
                    return (
                      <div key={input.itemId} className="flex items-center justify-between text-sm">
                        <span>
                          {item.icon} {item.name} x{input.qty}
                        </span>
                        <span className={have < input.qty ? 'text-red-400' : 'text-neutral-400'}>
                          You have {have}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold uppercase text-neutral-500">
                  <span>Output</span>
                  <span>Qty / You Have</span>
                </div>
                <div className="space-y-1">
                  {selectedAction.outputs.map((output) => {
                    const item = getItem(output.itemId)
                    return (
                      <div key={output.itemId} className="flex items-center justify-between text-sm">
                        <span>
                          {item.icon} {item.name}{' '}
                          <span className="text-neutral-500">{(output.chance * 100).toFixed(2)}%</span>
                        </span>
                        <span className="tabular-nums text-neutral-400">
                          {output.qty} / {inventory[output.itemId] ?? 0}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gold">
                <span>📊</span>
                <span>+{selectedAction.xp} Skill XP</span>
              </div>

              {actionMastery && (
                <div className="space-y-1.5 rounded-lg border border-line bg-panel-soft p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">
                      🎖️ Mastery Level{' '}
                      <span className="font-semibold text-neutral-200">{actionMastery.level}</span>
                    </span>
                    <span className="text-neutral-500">
                      +{(masterySpeedBonus(actionMastery.level) * 100).toFixed(1)}% speed
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-panel">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${actionMastery.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">
                      {skillId} Mastery Pool {poolFull && <span className="text-amber-400">(FULL)</span>}
                    </span>
                    <span className="text-neutral-500">{poolPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-panel">
                    <div
                      className="h-full rounded-full bg-amber-500/70"
                      style={{ width: `${poolPercent}%` }}
                    />
                  </div>
                  {poolFull && (
                    <p className="text-[11px] text-neutral-500">
                      10% chance to double a completion's output on every action in this skill.
                    </p>
                  )}
                </div>
              )}

              {selectedAction.specialOutputs && selectedAction.specialOutputs.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">
                    Special Items
                  </div>
                  <div className="mb-1 text-[11px] text-neutral-500">
                    Each item is rolled individually per attempt
                  </div>
                  {selectedAction.specialOutputs.map((special) => {
                    const item = getItem(special.itemId)
                    return (
                      <div key={special.itemId} className="flex items-center justify-between text-sm">
                        <span>
                          {item.icon} {item.name}{' '}
                          <span className="text-neutral-500">{(special.chance * 100).toFixed(2)}%</span>
                        </span>
                        <span className="tabular-nums text-neutral-400">{inventory[special.itemId] ?? 0}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => (isRunningHere ? stopAction() : startAction(selectedAction.id))}
                disabled={!isRunningHere && !canStartAction(selectedAction.id)}
                className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                  isRunningHere
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-brand text-neutral-950 hover:bg-brand-dim disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-neutral-500'
                }`}
              >
                {isRunningHere ? `Stop ${skillId}` : `Start ${skillId}`}
              </button>

              {isRunningHere && <ProgressBar />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
