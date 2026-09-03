import { useState } from 'react'
import { combatAreas, combatSkillDisplay, combatSkillOrder, enemiesById, getItem, items } from '../data'
import { slayerTaskProgress } from '../engine/slayerEngine'
import { xpProgress } from '../engine/xp'
import { useGameStore } from '../state/gameStore'
import { PrayerSelector } from './PrayerSelector'
import { useNow } from './useNow'

/** How long the "you were defeated" banner stays up after a defeat,
 *  whether it happened live or was just discovered on return. */
const DEFEAT_BANNER_MS = 8000

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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-400">{label}</span>
      <span className="tabular-nums text-neutral-100">{value}</span>
    </div>
  )
}

function SlayerTaskCard({ onViewEnemy }: { onViewEnemy: (enemyId: string) => void }) {
  const slayerTask = useGameStore((s) => s.slayerTask)
  const killCounts = useGameStore((s) => s.killCounts)
  const skillXp = useGameStore((s) => s.skillXp)

  if (!slayerTask) return null
  const enemy = enemiesById[slayerTask.enemyId]
  if (!enemy) return null

  const progress = slayerTaskProgress(slayerTask, killCounts)
  const percent = Math.min(100, (progress / slayerTask.targetKills) * 100)
  const level = xpProgress(skillXp.slayer ?? 0).level

  return (
    <div className="space-y-1.5 rounded-lg border border-line bg-panel p-3 text-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-neutral-500">
        <span>🎯 Slayer Task</span>
        <span className="text-neutral-400">Lv {level}</span>
      </div>
      <button
        type="button"
        onClick={() => onViewEnemy(slayerTask.enemyId)}
        className="flex w-full items-center gap-2 rounded-md border border-line-soft bg-panel-soft px-2 py-1.5 text-left hover:border-gold/50"
      >
        <span className="text-lg">{enemy.icon}</span>
        <span className="flex-1 font-medium text-neutral-100">{enemy.name}</span>
        <span className="tabular-nums text-neutral-400">
          {progress}/{slayerTask.targetKills}
        </span>
      </button>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-soft">
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[11px] text-neutral-500">
        Bonus XP and gold on every kill toward this task — a new one is assigned the
        moment it's complete.
      </p>
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
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-line bg-rail p-3">
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
                    : 'border-transparent text-neutral-300 hover:bg-panel'
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
        <div className="space-y-1 rounded-lg border border-line bg-panel p-3 text-sm">
          {combatSkillOrder.map((skillId) => (
            <Stat
              key={skillId}
              label={`${combatSkillDisplay[skillId].icon} ${combatSkillDisplay[skillId].label}`}
              value={levelOf(skillId)}
            />
          ))}
          <div className="my-1 border-t border-line" />
          <Stat label="Accuracy" value={player.accuracy} />
          <Stat label="Max Hit" value={player.maxHit} />
          <Stat label="Evasion" value={player.evasion} />
          <Stat label="Attack Speed" value={`${(player.attackSpeedMs / 1000).toFixed(1)}s`} />
        </div>

        <h2 className="mb-2 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Slayer
        </h2>
        <SlayerTaskCard onViewEnemy={setSelectedEnemyId} />
      </aside>

      <main className="flex-1 overflow-y-auto p-4">
        {selectedEnemy && (
          <div className="max-w-2xl space-y-4">
            {showDefeatBanner && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                💀 You were defeated and retreated to heal. Your HP is fully restored — no other
                penalty.
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-line bg-panel">
              <div className="border-b border-line bg-panel-soft px-4 py-2 text-center font-semibold text-gold">
                {area?.name ?? 'Combat Arena'}
              </div>

              <div className="grid grid-cols-2 divide-x divide-line">
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧑‍⚔️</span>
                    <span className="font-semibold text-neutral-100">You</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>HP</span>
                    <span className="tabular-nums">
                      {isFightingSelected ? Math.max(0, combat?.playerHp ?? 0) : player.maxHp} /{' '}
                      {player.maxHp}
                    </span>
                  </div>
                  <HpBar
                    current={isFightingSelected ? (combat?.playerHp ?? 0) : player.maxHp}
                    max={player.maxHp}
                    colorClass="bg-brand"
                  />
                </div>

                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedEnemy.icon}</span>
                    <span className="font-semibold text-neutral-100">{selectedEnemy.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>HP</span>
                    <span className="tabular-nums">
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
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line px-4 py-3 text-sm text-neutral-400">
                <span>
                  Accuracy: <span className="text-neutral-200">{selectedEnemy.accuracy}</span>
                </span>
                <span>
                  Max Hit: <span className="text-neutral-200">{selectedEnemy.maxHit}</span>
                </span>
                <span>
                  Evasion: <span className="text-neutral-200">{selectedEnemy.evasion}</span>
                </span>
                <span>
                  Attack Speed:{' '}
                  <span className="text-neutral-200">{(selectedEnemy.attackSpeedMs / 1000).toFixed(1)}s</span>
                </span>
              </div>

              {isFightingSelected && (
                <div className="border-t border-line px-4 py-2 text-sm text-neutral-400">
                  Kills: <span className="tabular-nums text-neutral-200">{combat?.kills ?? 0}</span>
                </div>
              )}

              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => (isFightingSelected ? stopCombat() : startCombat(selectedEnemy.id))}
                  className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                    isFightingSelected
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-brand text-neutral-950 hover:bg-brand-dim'
                  }`}
                >
                  {isFightingSelected ? 'Stop Fighting' : `Fight ${selectedEnemy.name}`}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-panel p-4">
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
              {selectedFoodItemId && (
                <p className="mt-2 text-[11px] text-neutral-500">
                  Eating: {getItem(selectedFoodItemId).icon} {getItem(selectedFoodItemId).name}
                </p>
              )}
            </div>

            <PrayerSelector />
          </div>
        )}
      </main>
    </div>
  )
}
