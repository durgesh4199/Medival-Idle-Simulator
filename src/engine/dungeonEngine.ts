/**
 * Dungeon run progression. Chains `simulateCombat` calls across a fixed
 * enemy sequence — each call capped at one kill (`maxKills: 1`) so a run
 * hands off to the next enemy instead of the current one respawning like
 * open-world combat does. The outer loop here is bounded by the dungeon's
 * own length, so an arbitrarily long offline absence still resolves in one
 * call, same as `combatTick`/`tick` do for open-world combat and skills.
 */

import type { Dungeon } from '../data/combat/dungeons'
import type { SpellCost } from '../data/combat/spells'
import type { CombatSkillId, Enemy } from '../data/types'
import { simulateCombat, type PlayerCombatStats } from './combatEngine'

export interface DungeonRunState {
  enemyIndex: number
  enemyHp: number
  playerHp: number
  nextPlayerAttackAt: number
  nextEnemyAttackAt: number
}

export interface DungeonRunResult {
  /** The run's continuing state — undefined once it's over (cleared or the
   *  player was defeated), since there's nothing left to resume. */
  state: DungeonRunState | undefined
  defeated: boolean
  /** True once every enemy in the sequence has been defeated this call. */
  cleared: boolean
  xpGained: Record<CombatSkillId, number>
  lootGained: Record<string, number>
  goldGained: number
  foodEaten: number
  /** Enemies defeated this call — for Pets' per-kill Combat pet roll, the
   *  same role `killsThisTick` plays in `combatTick`. */
  kills: number
  /** Total runes spent across every enemy this call — same shape
   *  `simulateCombat`'s own `runesConsumed` uses. */
  runesConsumed: Record<string, number>
}

export function advanceDungeonRun(params: {
  now: number
  dungeon: Dungeon
  enemiesById: Record<string, Enemy>
  player: PlayerCombatStats
  state: DungeonRunState
  foodHealAmount: number
  foodAvailableQty: number
  spellPower?: number
  spellCost?: SpellCost[]
  /** Carries forward across enemies within this same call, same as it does
   *  across kills within a single `simulateCombat` call — one rune stock
   *  for the whole run, not reset per enemy. */
  spellRunesAvailable?: Record<string, number>
}): DungeonRunResult {
  const { now, dungeon, enemiesById, player } = params
  let run = params.state
  let foodAvailableQty = params.foodAvailableQty
  let foodEaten = 0
  const runesAvailable = { ...params.spellRunesAvailable }
  const runesConsumed: Record<string, number> = {}
  let defeated = false
  let cleared = false
  const xpGained: Record<CombatSkillId, number> = { attack: 0, strength: 0, defence: 0, hitpoints: 0 }
  const lootGained: Record<string, number> = {}
  let goldGained = 0
  let kills = 0

  // At most one enemy advance per iteration, so this can never loop more
  // than the sequence is long — a real bound, not a MAX_EVENTS-style cap.
  for (let i = 0; i < dungeon.enemyIds.length; i++) {
    const enemy = enemiesById[dungeon.enemyIds[run.enemyIndex]]
    if (!enemy) {
      cleared = true
      break
    }

    const result = simulateCombat({
      now,
      enemy,
      player,
      state: {
        enemyHp: run.enemyHp,
        playerHp: run.playerHp,
        nextPlayerAttackAt: run.nextPlayerAttackAt,
        nextEnemyAttackAt: run.nextEnemyAttackAt,
        kills: 0,
      },
      foodHealAmount: params.foodHealAmount,
      foodAvailableQty,
      maxKills: 1,
      spellPower: params.spellPower,
      spellCost: params.spellCost,
      spellRunesAvailable: runesAvailable,
    })

    for (const [skillId, xp] of Object.entries(result.xpGained)) {
      xpGained[skillId as CombatSkillId] += xp
    }
    for (const [itemId, qty] of Object.entries(result.lootGained)) {
      lootGained[itemId] = (lootGained[itemId] ?? 0) + qty
    }
    goldGained += result.goldGained
    foodAvailableQty -= result.foodEaten
    foodEaten += result.foodEaten
    for (const [itemId, qty] of Object.entries(result.runesConsumed)) {
      runesAvailable[itemId] = (runesAvailable[itemId] ?? 0) - qty
      runesConsumed[itemId] = (runesConsumed[itemId] ?? 0) + qty
    }

    if (result.defeated) {
      defeated = true
      break
    }

    run = {
      ...run,
      enemyHp: result.state.enemyHp,
      playerHp: result.state.playerHp,
      nextPlayerAttackAt: result.state.nextPlayerAttackAt,
      nextEnemyAttackAt: result.state.nextEnemyAttackAt,
    }

    if (!result.stoppedAtMaxKills) break // still fighting this enemy — out of simulated time
    kills++

    const nextIndex = run.enemyIndex + 1
    if (nextIndex >= dungeon.enemyIds.length) {
      cleared = true
      break
    }
    const nextEnemy = enemiesById[dungeon.enemyIds[nextIndex]]
    run = { ...run, enemyIndex: nextIndex, enemyHp: nextEnemy.hp }
  }

  return {
    state: defeated || cleared ? undefined : run,
    defeated,
    cleared,
    xpGained,
    lootGained,
    goldGained,
    foodEaten,
    kills,
    runesConsumed,
  }
}
