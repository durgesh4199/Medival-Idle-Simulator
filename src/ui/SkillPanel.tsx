import { useState } from 'react'
import { actionsForLocation, getItem, locationsForSkill } from '../data'
import type { SkillId } from '../data/types'
import { useGameStore } from '../state/gameStore'
import { ProgressBar } from './ProgressBar'

interface Props {
  skillId: SkillId
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

  const actions = locationId ? actionsForLocation(locationId) : []
  const selectedAction = actions.find((a) => a.id === actionId) ?? actions[0]
  const level = levelOf(skillId)
  const isRunningHere = activeAction?.actionId === selectedAction?.id

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-neutral-800 bg-neutral-950 p-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Select Location
        </h2>
        <div className="flex flex-col gap-1">
          {locations.map((loc) => {
            const locked = level < loc.requiredLevel
            const isSelected = loc.id === locationId
            return (
              <button
                key={loc.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  setLocationId(loc.id)
                  setActionId(undefined)
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                    : 'border-transparent text-neutral-300 hover:bg-neutral-900'
                } ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <div className="font-medium">{loc.name}</div>
                {locked && (
                  <div className="text-xs text-neutral-500">Requires level {loc.requiredLevel}</div>
                )}
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
              return (
                <button
                  key={action.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setActionId(action.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-200 hover:border-neutral-700'
                  } ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {action.name}
                  {locked && <span className="ml-1 text-xs text-neutral-500">(Lv {action.requiredLevel})</span>}
                </button>
              )
            })}
          </div>
        </div>

        {selectedAction && (
          <div className="max-w-md overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            <div className="border-b border-neutral-800 bg-neutral-950 px-4 py-2 font-semibold text-teal-300">
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
                        <span className="text-neutral-400">
                          {output.qty} / {inventory[output.itemId] ?? 0}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-teal-300">
                <span>📊</span>
                <span>+{selectedAction.xp} Skill XP</span>
              </div>

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
                        <span className="text-neutral-400">{inventory[special.itemId] ?? 0}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  isRunningHere ? stopAction() : startAction(selectedAction.id)
                }
                disabled={!isRunningHere && !canStartAction(selectedAction.id)}
                className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                  isRunningHere
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-teal-500 text-neutral-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500'
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
