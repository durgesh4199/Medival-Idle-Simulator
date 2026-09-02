import { useState } from 'react'
import { combatAreas, combatSkillDisplay, combatSkillOrder, enemiesById, getItem, items } from '../data'
import { useGameStore } from '../state/gameStore'
import { useNow } from './useNow'

/** How long the "you were defeated" banner stays up after a defeat,
 *  whether it happened live or was just discovered on return. */
const DEFEAT_BANNER_MS = 8000

function HpBar({ current, max, colorClass }: { current: number; max: number; colorClass: string }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
      <div
        className={`h-full rounded-full transition-[width] duration-200 ease-linear ${colorClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function CombatPage() {
  const area = combatAreas[0]
  const [selectedEnemyId, setSelectedEnemyId] = useState(area?.enemyIds[0])

  const combat = useGameStore((s) => s.combat)
  const lastDefeatAt = useGameStore((s) => s.lastDefeatAt)
  const inventory = useGameStore((s) => s.inventory)
  const selectedFoodItemId = useGameStore((s) => s.selectedFoodItemId)
  const levelOf = useGameStore((s) => s.levelOf)
  const playerCombatStats = useGameStore((s) => s.playerCombatStats)
  const startCombat = useGameStore((s) => s.startCombat)
  const stopCombat = useGameStore((s) => s.stopCombat)
  const selectCombatFood = useGameStore((s) => s.selectCombatFood)

  const selectedEnemy = selectedEnemyId ? enemiesById[selectedEnemyId] : undefined
  const isFightingSelected = combat?.enemyId === selectedEnemyId
  const player = playerCombatStats()

  const now = useNow(500)
  const showDefeatBanner = lastDefeatAt !== null && now - lastDefeatAt < DEFEAT_BANNER_MS

  const foodOptions = Object.entries(inventory)
    .filter(([itemId, qty]) => qty > 0 && items[itemId]?.healAmount)
    .map(([itemId]) => items[itemId])

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-neutral-800 bg-neutral-950 p-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {area?.name ?? 'Combat Area'}
        </h2>
        <div className="flex flex-col gap-1">
          {area?.enemyIds.map((enemyId) => {
            const enemy = enemiesById[enemyId]
            if (!enemy) return null
            const isSelected = enemyId === selectedEnemyId
            const isActive = combat?.enemyId === enemyId
            return (
              <button
                key={enemyId}
                type="button"
                onClick={() => setSelectedEnemyId(enemyId)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : 'border-transparent text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <span className="text-lg">{enemy.icon}</span>
                <span className="flex-1">{enemy.name}</span>
                {isActive && <span className="h-2 w-2 rounded-full bg-red-500" />}
              </button>
            )
          })}
        </div>

        <h2 className="mb-2 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Combat Stats
        </h2>
        <div className="space-y-1 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-sm">
          {combatSkillOrder.map((skillId) => (
            <div key={skillId} className="flex justify-between">
              <span className="text-neutral-400">
                {combatSkillDisplay[skillId].icon} {combatSkillDisplay[skillId].label}
              </span>
              <span>{levelOf(skillId)}</span>
            </div>
          ))}
          <div className="my-1 border-t border-neutral-800" />
          <div className="flex justify-between">
            <span className="text-neutral-400">Accuracy</span>
            <span>{player.accuracy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Max Hit</span>
            <span>{player.maxHit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Evasion</span>
            <span>{player.evasion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Attack Speed</span>
            <span>{(player.attackSpeedMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4">
        {selectedEnemy && (
          <div className="max-w-lg space-y-4">
            {showDefeatBanner && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                💀 You were defeated and retreated to heal. Your HP is fully restored — no other
                penalty.
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
              <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4 py-2 font-semibold text-red-300">
                <span className="text-xl">{selectedEnemy.icon}</span>
                {selectedEnemy.name}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-neutral-400">
                    <span>Enemy HP</span>
                    <span>
                      {isFightingSelected ? Math.max(0, combat?.enemyHp ?? 0) : selectedEnemy.hp} /{' '}
                      {selectedEnemy.hp}
                    </span>
                  </div>
                  <HpBar
                    current={isFightingSelected ? (combat?.enemyHp ?? 0) : selectedEnemy.hp}
                    max={selectedEnemy.hp}
                    colorClass="bg-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-neutral-400">
                  <span>Accuracy: <span className="text-neutral-200">{selectedEnemy.accuracy}</span></span>
                  <span>Max Hit: <span className="text-neutral-200">{selectedEnemy.maxHit}</span></span>
                  <span>Evasion: <span className="text-neutral-200">{selectedEnemy.evasion}</span></span>
                  <span>
                    Attack Speed:{' '}
                    <span className="text-neutral-200">{(selectedEnemy.attackSpeedMs / 1000).toFixed(1)}s</span>
                  </span>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-neutral-400">
                    <span>Your HP</span>
                    <span>
                      {isFightingSelected ? Math.max(0, combat?.playerHp ?? 0) : player.maxHp} / {player.maxHp}
                    </span>
                  </div>
                  <HpBar
                    current={isFightingSelected ? (combat?.playerHp ?? 0) : player.maxHp}
                    max={player.maxHp}
                    colorClass="bg-teal-400"
                  />
                </div>

                {isFightingSelected && (
                  <div className="text-sm text-neutral-400">
                    Kills: <span className="text-neutral-200">{combat?.kills ?? 0}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => (isFightingSelected ? stopCombat() : startCombat(selectedEnemy.id))}
                  className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                    isFightingSelected
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-teal-500 text-neutral-950 hover:bg-teal-400'
                  }`}
                >
                  {isFightingSelected ? 'Stop Fighting' : `Fight ${selectedEnemy.name}`}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Select Food
              </h3>
              <p className="mb-2 text-[11px] text-neutral-500">
                Auto-eaten once your HP drops to half. Cook fish at a Cooking Fire to stock up.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectCombatFood(null)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    selectedFoodItemId === null
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                  }`}
                >
                  None
                </button>
                {foodOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectCombatFood(item.id)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      selectedFoodItemId === item.id
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-200'
                    }`}
                  >
                    {item.icon} {item.name} x{inventory[item.id]} (+{item.healAmount} HP)
                  </button>
                ))}
                {foodOptions.length === 0 && (
                  <span className="text-sm text-neutral-500">No food in your Bank yet.</span>
                )}
              </div>
              {selectedFoodItemId && (
                <p className="mt-2 text-[11px] text-neutral-500">
                  Eating: {getItem(selectedFoodItemId).icon} {getItem(selectedFoodItemId).name}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
