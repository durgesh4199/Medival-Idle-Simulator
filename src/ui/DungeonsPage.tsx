import { useState } from 'react'
import { dungeons, dungeonsById, enemiesById, getItem, items } from '../data'
import { useGameStore } from '../state/gameStore'
import { PrayerSelector } from './PrayerSelector'
import { useNow } from './useNow'

/** How long the "cleared"/"defeated" banners stay up, whether the outcome
 *  happened live or was just discovered on return — same idea as
 *  CombatPage's defeat banner. */
const OUTCOME_BANNER_MS = 8000

function HpBar({ current, max, colorClass }: { current: number; max: number; colorClass: string }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-panel-soft">
      <div
        className={`h-full rounded-full transition-[width] duration-200 ease-linear ${colorClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function DungeonsPage() {
  const [selectedDungeonId, setSelectedDungeonId] = useState(dungeons[0]?.id)

  const dungeonRun = useGameStore((s) => s.dungeonRun)
  const lastDefeatAt = useGameStore((s) => s.lastDefeatAt)
  const lastDungeonClear = useGameStore((s) => s.lastDungeonClear)
  const levelOf = useGameStore((s) => s.levelOf)
  const canStartDungeon = useGameStore((s) => s.canStartDungeon)
  const startDungeon = useGameStore((s) => s.startDungeon)
  const stopDungeon = useGameStore((s) => s.stopDungeon)
  const playerCombatStats = useGameStore((s) => s.playerCombatStats)
  const selectedFoodItemId = useGameStore((s) => s.selectedFoodItemId)
  const selectCombatFood = useGameStore((s) => s.selectCombatFood)
  const inventory = useGameStore((s) => s.inventory)

  const selectedDungeon = selectedDungeonId ? dungeonsById[selectedDungeonId] : undefined
  const isRunningSelected = dungeonRun?.dungeonId === selectedDungeonId
  const player = playerCombatStats()

  const now = useNow(500)
  const showDefeatBanner = lastDefeatAt !== null && now - lastDefeatAt < OUTCOME_BANNER_MS
  const showClearBanner =
    lastDungeonClear !== null &&
    lastDungeonClear.dungeonId === selectedDungeonId &&
    now - lastDungeonClear.at < OUTCOME_BANNER_MS

  const foodOptions = Object.entries(inventory)
    .filter(([itemId, qty]) => qty > 0 && items[itemId]?.healAmount)
    .map(([itemId]) => items[itemId])

  const currentEnemyIndex = isRunningSelected ? (dungeonRun?.enemyIndex ?? 0) : -1
  const currentEnemy = selectedDungeon
    ? enemiesById[selectedDungeon.enemyIds[Math.max(0, currentEnemyIndex)]]
    : undefined

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-line bg-rail p-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Dungeons
        </h2>
        <div className="flex flex-col gap-1">
          {dungeons.map((dungeon) => {
            const isSelected = dungeon.id === selectedDungeonId
            const isActive = dungeonRun?.dungeonId === dungeon.id
            const locked = levelOf('attack') < dungeon.requiredLevel
            return (
              <button
                key={dungeon.id}
                type="button"
                onClick={() => setSelectedDungeonId(dungeon.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'border-gold/50 bg-gold/10 text-gold'
                    : 'border-transparent text-neutral-300 hover:bg-panel'
                } ${locked ? 'opacity-60' : ''}`}
              >
                <span className="text-lg">{dungeon.icon}</span>
                <span className="flex-1">
                  {dungeon.name}
                  {locked && (
                    <span className="block text-xs text-neutral-500">
                      Requires Attack level {dungeon.requiredLevel}
                    </span>
                  )}
                </span>
                {isActive && <span className="h-2 w-2 rounded-full bg-brand" />}
              </button>
            )
          })}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4">
        {selectedDungeon && (
          <div className="max-w-2xl space-y-4">
            {showDefeatBanner && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                💀 Defeated partway through — the run ended with no reward. Your HP is
                fully restored.
              </div>
            )}
            {showClearBanner && (
              <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm text-gold">
                🏆 {selectedDungeon.name} cleared! Rewards have been added to your Bank.
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-line bg-panel">
              <div className="border-b border-line bg-panel-soft px-4 py-2 font-semibold text-gold">
                {selectedDungeon.icon} {selectedDungeon.name}
              </div>

              <div className="space-y-3 p-4">
                <p className="text-sm text-neutral-400">{selectedDungeon.description}</p>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">
                    Encounter Order
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDungeon.enemyIds.map((enemyId, i) => {
                      const enemy = enemiesById[enemyId]
                      const cleared = isRunningSelected && i < currentEnemyIndex
                      const current = isRunningSelected && i === currentEnemyIndex
                      return (
                        <span
                          key={`${enemyId}-${i}`}
                          title={enemy?.name}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg ${
                            current
                              ? 'border-gold bg-gold/15'
                              : cleared
                                ? 'border-line bg-panel-soft opacity-40'
                                : 'border-line bg-panel-soft'
                          }`}
                        >
                          {enemy?.icon ?? '❔'}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {isRunningSelected && currentEnemy && (
                  <>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-neutral-400">
                        <span>{currentEnemy.name} HP</span>
                        <span className="tabular-nums">
                          {Math.max(0, dungeonRun?.enemyHp ?? 0)} / {currentEnemy.hp}
                        </span>
                      </div>
                      <HpBar
                        current={dungeonRun?.enemyHp ?? 0}
                        max={currentEnemy.hp}
                        colorClass="bg-red-500"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-neutral-400">
                        <span>Your HP</span>
                        <span className="tabular-nums">
                          {Math.max(0, dungeonRun?.playerHp ?? 0)} / {player.maxHp}
                        </span>
                      </div>
                      <HpBar
                        current={dungeonRun?.playerHp ?? 0}
                        max={player.maxHp}
                        colorClass="bg-brand"
                      />
                    </div>
                  </>
                )}

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase text-neutral-500">
                    Completion Reward
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-300">
                    {selectedDungeon.completionReward.gold && (
                      <span>🪙 {selectedDungeon.completionReward.gold} gold</span>
                    )}
                    {Object.entries(selectedDungeon.completionReward.xp ?? {}).map(
                      ([skillId, xp]) => (
                        <span key={skillId} className="capitalize">
                          +{xp} {skillId} XP
                        </span>
                      ),
                    )}
                    {(selectedDungeon.completionReward.items ?? []).map((reward) => {
                      const item = getItem(reward.itemId)
                      return (
                        <span key={reward.itemId}>
                          {item.icon} {item.name}
                          {reward.qty > 1 ? ` x${reward.qty}` : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    isRunningSelected ? stopDungeon() : startDungeon(selectedDungeon.id)
                  }
                  disabled={!isRunningSelected && !canStartDungeon(selectedDungeon.id)}
                  className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                    isRunningSelected
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-brand text-neutral-950 hover:bg-brand-dim disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-neutral-500'
                  }`}
                >
                  {isRunningSelected ? 'Abandon Run' : `Enter ${selectedDungeon.name}`}
                </button>
                {!isRunningSelected && !canStartDungeon(selectedDungeon.id) && (
                  <p className="text-center text-[11px] text-neutral-500">
                    Requires Attack level {selectedDungeon.requiredLevel}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-panel p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Select Food
              </h3>
              <p className="mb-2 text-[11px] text-neutral-500">
                Auto-eaten once your HP drops to half, same as open-world combat.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectCombatFood(null)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    selectedFoodItemId === null
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-line bg-panel-soft text-neutral-400'
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
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-line bg-panel-soft text-neutral-200'
                    }`}
                  >
                    {item.icon} {item.name} x{inventory[item.id]} (+{item.healAmount} HP)
                  </button>
                ))}
                {foodOptions.length === 0 && (
                  <span className="text-sm text-neutral-500">No food in your Bank yet.</span>
                )}
              </div>
            </div>

            <PrayerSelector />
          </div>
        )}
      </main>
    </div>
  )
}
