/**
 * Combat is the one system that doesn't fit the gathering-skill `Action`
 * shape (see docs/design-document.md §6): instead of one timer with one
 * outcome, it's two independent attack-speed timers (player, enemy) racing
 * against a shared enemy HP pool, with a kill instantly restarting on a
 * fresh copy of the same enemy — the idle loop still repeats, just with a
 * richer per-event model than a single Action completion.
 *
 * `simulateCombat` is written the same way `gameStore.tick` is: it walks
 * forward from a start state to a `now` timestamp, resolving every attack
 * event in between in a single call. That's what lets the exact same
 * function serve live ticking and offline catch-up — same as skills, no
 * separate offline-combat code path to keep in sync.
 */

import type { AggregatedEquipmentStats } from './equipmentEngine'
import type { PrayerModifiers } from '../data/combat/prayers'
import type { SpellCost } from '../data/combat/spells'
import type { CombatSkillId, Enemy } from '../data/types'

export interface CombatantLevels {
  attack: number
  strength: number
  defence: number
  hitpoints: number
}

export interface PlayerCombatStats {
  accuracy: number
  maxHit: number
  evasion: number
  maxHp: number
  attackSpeedMs: number
}

export const UNARMED_ATTACK_SPEED_MS = 3600
const BASE_ACCURACY = 8
const BASE_EVASION = 8
/** Auto-eat once HP drops to/below this fraction of max, if food is selected. */
const AUTO_EAT_THRESHOLD = 0.5
/** Safety cap so a stale save (or a clock jump) can't loop forever. */
const MAX_EVENTS_PER_TICK = 20_000
const HIT_XP = 4
const DEFEND_XP = 2

export function computePlayerCombatStats(
  levels: CombatantLevels,
  equipmentStats: AggregatedEquipmentStats,
  weaponAttackSpeedMs: number | undefined,
  /** The active Prayer's modifiers, if any — applied as a percentage scale
   *  on top of the base stat (equipment + level), the one place a Prayer's
   *  effect actually enters the simulation. */
  prayerModifiers?: PrayerModifiers,
): PlayerCombatStats {
  const accuracy = levels.attack * 4 + equipmentStats.accuracy + BASE_ACCURACY
  const maxHit = 1 + Math.floor(levels.strength / 3) + equipmentStats.strength
  const evasion = levels.defence * 4 + equipmentStats.defence + BASE_EVASION
  const maxHp = levels.hitpoints * 10 + 10

  return {
    accuracy: Math.floor(accuracy * (1 + (prayerModifiers?.accuracyPercent ?? 0))),
    maxHit: Math.floor(maxHit * (1 + (prayerModifiers?.maxHitPercent ?? 0))),
    evasion: Math.floor(evasion * (1 + (prayerModifiers?.evasionPercent ?? 0))),
    maxHp: Math.floor(maxHp * (1 + (prayerModifiers?.maxHpPercent ?? 0))),
    attackSpeedMs: weaponAttackSpeedMs ?? UNARMED_ATTACK_SPEED_MS,
  }
}

/** Chance an attack with `accuracy` connects against `evasion`, clamped so
 *  neither side is ever guaranteed to always hit or always miss. */
export function hitChance(accuracy: number, evasion: number): number {
  if (accuracy <= 0 && evasion <= 0) return 0.5
  return Math.min(0.98, Math.max(0.02, accuracy / (accuracy + evasion)))
}

export function rollDamage(maxHit: number): number {
  return maxHit <= 0 ? 0 : 1 + Math.floor(Math.random() * maxHit)
}

export function rollGold(enemy: Enemy): number {
  const [min, max] = enemy.goldDrop
  return min + Math.floor(Math.random() * (max - min + 1))
}

/** Rolls every loot entry independently — a kill can drop several items at
 *  once, unlike a gathering Action's single weighted output. */
export function rollLoot(enemy: Enemy): Record<string, number> {
  const drops: Record<string, number> = {}
  for (const drop of enemy.loot) {
    if (Math.random() < drop.chance) {
      drops[drop.itemId] = (drops[drop.itemId] ?? 0) + drop.qty
    }
  }
  return drops
}

export interface CombatSimState {
  enemyHp: number
  playerHp: number
  nextPlayerAttackAt: number
  nextEnemyAttackAt: number
  kills: number
}

export interface CombatSimResult {
  state: CombatSimState
  /** True once playerHp hit 0 — the caller stops combat and heals on next start. */
  defeated: boolean
  /** True once `maxKills` was reached — the caller (Dungeons) swaps in the
   *  next enemy in its sequence and keeps simulating with `state` as-is,
   *  rather than this enemy respawning like open-world combat does. */
  stoppedAtMaxKills: boolean
  xpGained: Record<CombatSkillId, number>
  lootGained: Record<string, number>
  goldGained: number
  foodEaten: number
  /** Runes spent casting the active Spell, if any — keyed by item id, same
   *  shape `lootGained` uses. Empty if no spell was active or affordable. */
  runesConsumed: Record<string, number>
}

export function simulateCombat(params: {
  now: number
  enemy: Enemy
  player: PlayerCombatStats
  state: CombatSimState
  foodHealAmount: number
  foodAvailableQty: number
  /** Stop once this many kills have happened in this call, instead of
   *  respawning `enemy` past that point — Dungeons fight each enemy in
   *  their sequence exactly once, unlike open-world combat's endless
   *  respawn-on-kill grind. Omit for the normal unlimited behavior. */
  maxKills?: number
  /** The active Spell's damage ceiling and rune cost, if any — replaces
   *  `player.maxHit` on every swing the runes can afford. */
  spellPower?: number
  spellCost?: SpellCost[]
  /** Starting rune stock the spell can draw from, keyed by item id —
   *  decremented locally as casts happen, same role `foodAvailableQty`
   *  plays for eating. Casting silently falls back to a normal physical
   *  swing once a required rune runs out. */
  spellRunesAvailable?: Record<string, number>
}): CombatSimResult {
  const { now, enemy, player } = params
  let { enemyHp, playerHp, nextPlayerAttackAt, nextEnemyAttackAt, kills } = params.state
  let foodAvailableQty = params.foodAvailableQty
  let foodEaten = 0
  const runesAvailable = { ...params.spellRunesAvailable }
  const runesConsumed: Record<string, number> = {}
  let defeated = false
  let stoppedAtMaxKills = false
  let events = 0
  const xpGained: Record<CombatSkillId, number> = { attack: 0, strength: 0, defence: 0, hitpoints: 0 }
  const lootGained: Record<string, number> = {}
  let goldGained = 0

  while (events < MAX_EVENTS_PER_TICK) {
    const nextEventAt = Math.min(nextPlayerAttackAt, nextEnemyAttackAt)
    if (nextEventAt > now) break
    events++

    if (nextPlayerAttackAt <= nextEnemyAttackAt) {
      // Player's swing. A Spell replaces the physical max-hit roll if its
      // runes are affordable — consumed on the attempt, hit or miss, same
      // as any other reagent cost.
      let hitPower = player.maxHit
      if (
        params.spellPower !== undefined &&
        params.spellCost?.every((cost) => (runesAvailable[cost.itemId] ?? 0) >= cost.qty)
      ) {
        hitPower = params.spellPower
        for (const cost of params.spellCost) {
          runesAvailable[cost.itemId] = (runesAvailable[cost.itemId] ?? 0) - cost.qty
          runesConsumed[cost.itemId] = (runesConsumed[cost.itemId] ?? 0) + cost.qty
        }
      }

      if (Math.random() < hitChance(player.accuracy, enemy.evasion)) {
        const damage = rollDamage(hitPower)
        enemyHp -= damage
        xpGained.attack += HIT_XP
        xpGained.strength += HIT_XP
        xpGained.hitpoints += damage / 3

        if (enemyHp <= 0) {
          kills++
          goldGained += rollGold(enemy)
          for (const [itemId, qty] of Object.entries(rollLoot(enemy))) {
            lootGained[itemId] = (lootGained[itemId] ?? 0) + qty
          }
          const killBonus = enemy.xpReward / 4
          xpGained.attack += killBonus
          xpGained.strength += killBonus
          xpGained.defence += killBonus
          xpGained.hitpoints += killBonus
          // Idle loop repeats: a fresh copy of the same enemy, same as a
          // gathering Action restarting after it completes.
          enemyHp = enemy.hp
        }
      }
      nextPlayerAttackAt += player.attackSpeedMs

      if (params.maxKills !== undefined && kills - params.state.kills >= params.maxKills) {
        stoppedAtMaxKills = true
        break
      }
    } else {
      // Enemy's swing.
      if (Math.random() < hitChance(enemy.accuracy, player.evasion)) {
        playerHp -= rollDamage(enemy.maxHit)
      }
      xpGained.defence += DEFEND_XP
      nextEnemyAttackAt += enemy.attackSpeedMs

      if (playerHp <= 0) {
        defeated = true
        break
      }
      if (
        playerHp <= player.maxHp * AUTO_EAT_THRESHOLD &&
        params.foodHealAmount > 0 &&
        foodAvailableQty > 0
      ) {
        foodAvailableQty--
        foodEaten++
        playerHp = Math.min(player.maxHp, playerHp + params.foodHealAmount)
      }
    }
  }

  return {
    state: { enemyHp, playerHp, nextPlayerAttackAt, nextEnemyAttackAt, kills },
    defeated,
    stoppedAtMaxKills,
    xpGained,
    lootGained,
    goldGained,
    foodEaten,
    runesConsumed,
  }
}
