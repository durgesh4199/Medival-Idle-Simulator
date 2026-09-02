import { create } from 'zustand'
import { actionsById, enemiesById } from '../data'
import { items } from '../data/items/items'
import { shopBuyableItemIds } from '../data/shop'
import type { EquipmentSlot } from '../data/types'
import {
  computePlayerCombatStats,
  simulateCombat,
  type PlayerCombatStats,
} from '../engine/combatEngine'
import { getBuyPrice, getSellPrice, isSellable } from '../engine/economyEngine'
import { aggregateEquipmentStats, getWeaponAttackSpeedMs } from '../engine/equipmentEngine'
import type { ActiveActionSave, CombatSave, SaveData } from '../engine/saveSystem'
import { hasRequiredInputs, rollActionRewards, rollDurationMs } from '../engine/skillEngine'
import { levelForXp } from '../engine/xp'

export interface OfflineSummary {
  elapsedMs: number
  xpGained: Record<string, number>
  itemsGained: Record<string, number>
  goldGained: number
}

type Equipment = Partial<Record<EquipmentSlot, string>>

interface GameState {
  gold: number
  skillXp: Record<string, number>
  inventory: Record<string, number>
  equipment: Equipment
  activeAction: ActiveActionSave | null
  combat: CombatSave | null
  selectedFoodItemId: string | null
  /** Wall-clock time of the most recent defeat, live or discovered on
   *  return from offline combat — lets the Combat page show a brief
   *  "you were defeated" notice without a separate dismiss action. */
  lastDefeatAt: number | null
  offlineSummary: OfflineSummary | null

  levelOf: (skillId: string) => number
  canStartAction: (actionId: string) => boolean
  startAction: (actionId: string) => void
  stopAction: () => void
  /** Advances simulation to `now`, resolving every action completion in between. */
  tick: (now: number) => void
  /** Moves one unit of `itemId` from inventory into its equipment slot,
   *  returning whatever was previously worn there back to inventory. */
  equipItem: (itemId: string) => void
  /** Returns the item worn in `slot` back to inventory. */
  unequipItem: (slot: EquipmentSlot) => void

  /** The player's current Accuracy/Max Hit/Evasion/Max HP/Attack Speed,
   *  derived from combat-skill levels + equipped gear. */
  playerCombatStats: () => PlayerCombatStats
  /** Stops any active skill action (combat and skilling are mutually
   *  exclusive — one "current activity", per the core loop) and starts a
   *  fresh fight against `enemyId`. */
  startCombat: (enemyId: string) => void
  stopCombat: () => void
  selectCombatFood: (itemId: string | null) => void
  /** Advances combat to `now`, resolving every attack event in between —
   *  same shape as `tick`, so offline catch-up covers combat too. */
  combatTick: (now: number) => void

  /** Sells `qty` of `itemId` for gold at the shop's buy-back price. */
  sellItem: (itemId: string, qty: number) => void
  /** Buys `qty` of `itemId` from the shop's stock, if affordable. */
  buyItem: (itemId: string, qty: number) => void

  dismissOfflineSummary: () => void
  loadFromSave: (save: SaveData) => void
  toSaveShape: () => Omit<SaveData, 'version' | 'savedAt'>
}

/** Safety cap so a very stale save (or a clock jump) can't loop forever. */
const MAX_COMPLETIONS_PER_TICK = 200_000
/** Cap on how much real-world absence is simulated at once. */
const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000

export const useGameStore = create<GameState>((set, get) => ({
  gold: 0,
  skillXp: {},
  inventory: {},
  equipment: {},
  activeAction: null,
  combat: null,
  selectedFoodItemId: null,
  lastDefeatAt: null,
  offlineSummary: null,

  levelOf: (skillId) => levelForXp(get().skillXp[skillId] ?? 0),

  canStartAction: (actionId) => {
    const action = actionsById[actionId]
    if (!action) return false
    const state = get()
    if (state.levelOf(action.skillId) < action.requiredLevel) return false
    return hasRequiredInputs(action, state.inventory)
  },

  startAction: (actionId) => {
    const action = actionsById[actionId]
    if (!action || !get().canStartAction(actionId)) return
    set({
      // Mutual exclusion: starting a skill action ends any fight in progress.
      combat: null,
      activeAction: {
        actionId,
        startedAt: Date.now(),
        durationMs: rollDurationMs(action),
      },
    })
  },

  stopAction: () => set({ activeAction: null }),

  tick: (now) =>
    set((state) => {
      if (!state.activeAction) return state
      const action = actionsById[state.activeAction.actionId]
      if (!action) return { ...state, activeAction: null }

      let cursor = state.activeAction.startedAt
      let durationMs = state.activeAction.durationMs
      const skillXp = { ...state.skillXp }
      const inventory = { ...state.inventory }
      let completions = 0

      while (now - cursor >= durationMs && completions < MAX_COMPLETIONS_PER_TICK) {
        if (!hasRequiredInputs(action, inventory)) {
          // Ran out of an input mid-loop (e.g. logs) — the action halts.
          return { ...state, activeAction: null, skillXp, inventory }
        }
        for (const input of action.inputs ?? []) {
          inventory[input.itemId] = (inventory[input.itemId] ?? 0) - input.qty
        }
        const rewards = rollActionRewards(action)
        for (const [itemId, qty] of Object.entries(rewards)) {
          inventory[itemId] = (inventory[itemId] ?? 0) + qty
        }
        skillXp[action.skillId] = (skillXp[action.skillId] ?? 0) + action.xp

        cursor += durationMs
        durationMs = rollDurationMs(action)
        completions++
      }

      return {
        ...state,
        activeAction: { ...state.activeAction, startedAt: cursor, durationMs },
        skillXp,
        inventory,
      }
    }),

  equipItem: (itemId) =>
    set((state) => {
      const equipmentDef = items[itemId]?.equipment
      if (!equipmentDef) return state
      const owned = state.inventory[itemId] ?? 0
      if (owned < 1) return state

      const inventory = { ...state.inventory }
      inventory[itemId] = owned - 1
      if (inventory[itemId] <= 0) delete inventory[itemId]

      const previousItemId = state.equipment[equipmentDef.slot]
      if (previousItemId) {
        inventory[previousItemId] = (inventory[previousItemId] ?? 0) + 1
      }

      return {
        ...state,
        inventory,
        equipment: { ...state.equipment, [equipmentDef.slot]: itemId },
      }
    }),

  unequipItem: (slot) =>
    set((state) => {
      const itemId = state.equipment[slot]
      if (!itemId) return state
      const inventory = { ...state.inventory }
      inventory[itemId] = (inventory[itemId] ?? 0) + 1
      const equipment = { ...state.equipment }
      delete equipment[slot]
      return { ...state, inventory, equipment }
    }),

  sellItem: (itemId, qty) =>
    set((state) => {
      const item = items[itemId]
      if (!item || qty <= 0 || !isSellable(item)) return state
      const owned = state.inventory[itemId] ?? 0
      const sellQty = Math.min(qty, owned)
      if (sellQty <= 0) return state

      const inventory = { ...state.inventory }
      inventory[itemId] = owned - sellQty
      if (inventory[itemId] <= 0) delete inventory[itemId]

      return { ...state, inventory, gold: state.gold + getSellPrice(item) * sellQty }
    }),

  buyItem: (itemId, qty) =>
    set((state) => {
      const item = items[itemId]
      if (!item || qty <= 0 || !shopBuyableItemIds.includes(itemId)) return state
      const cost = getBuyPrice(item) * qty
      if (state.gold < cost) return state

      const inventory = { ...state.inventory }
      inventory[itemId] = (inventory[itemId] ?? 0) + qty
      return { ...state, inventory, gold: state.gold - cost }
    }),

  playerCombatStats: () => {
    const state = get()
    const levels = {
      attack: state.levelOf('attack'),
      strength: state.levelOf('strength'),
      defence: state.levelOf('defence'),
      hitpoints: state.levelOf('hitpoints'),
    }
    const equipmentStats = aggregateEquipmentStats(state.equipment)
    const weaponAttackSpeedMs = getWeaponAttackSpeedMs(state.equipment)
    return computePlayerCombatStats(levels, equipmentStats, weaponAttackSpeedMs)
  },

  startCombat: (enemyId) => {
    const enemy = enemiesById[enemyId]
    if (!enemy) return
    const stats = get().playerCombatStats()
    const now = Date.now()
    set({
      activeAction: null,
      combat: {
        enemyId,
        enemyHp: enemy.hp,
        playerHp: stats.maxHp,
        nextPlayerAttackAt: now + stats.attackSpeedMs,
        nextEnemyAttackAt: now + enemy.attackSpeedMs,
        kills: 0,
      },
    })
  },

  stopCombat: () => set({ combat: null }),

  selectCombatFood: (itemId) => {
    if (itemId !== null && !items[itemId]?.healAmount) return
    set({ selectedFoodItemId: itemId })
  },

  combatTick: (now) =>
    set((state) => {
      if (!state.combat) return state
      const enemy = enemiesById[state.combat.enemyId]
      if (!enemy) return { ...state, combat: null }

      const player = state.playerCombatStats()
      const foodItem = state.selectedFoodItemId ? items[state.selectedFoodItemId] : undefined
      const foodAvailableQty = state.selectedFoodItemId
        ? (state.inventory[state.selectedFoodItemId] ?? 0)
        : 0

      const result = simulateCombat({
        now,
        enemy,
        player,
        state: {
          enemyHp: state.combat.enemyHp,
          playerHp: state.combat.playerHp,
          nextPlayerAttackAt: state.combat.nextPlayerAttackAt,
          nextEnemyAttackAt: state.combat.nextEnemyAttackAt,
          kills: state.combat.kills,
        },
        foodHealAmount: foodItem?.healAmount ?? 0,
        foodAvailableQty,
      })

      const skillXp = { ...state.skillXp }
      for (const [skillId, xp] of Object.entries(result.xpGained)) {
        if (xp > 0) skillXp[skillId] = (skillXp[skillId] ?? 0) + xp
      }

      const inventory = { ...state.inventory }
      for (const [itemId, qty] of Object.entries(result.lootGained)) {
        inventory[itemId] = (inventory[itemId] ?? 0) + qty
      }
      if (result.foodEaten > 0 && state.selectedFoodItemId) {
        const remaining = (inventory[state.selectedFoodItemId] ?? 0) - result.foodEaten
        if (remaining > 0) inventory[state.selectedFoodItemId] = remaining
        else delete inventory[state.selectedFoodItemId]
      }

      return {
        ...state,
        skillXp,
        inventory,
        gold: state.gold + result.goldGained,
        combat: result.defeated ? null : { enemyId: state.combat.enemyId, ...result.state },
        lastDefeatAt: result.defeated ? Date.now() : state.lastDefeatAt,
      }
    }),

  dismissOfflineSummary: () => set({ offlineSummary: null }),

  loadFromSave: (save) => {
    set({
      gold: save.gold,
      skillXp: save.skillXp,
      inventory: save.inventory,
      equipment: save.equipment ?? {},
      activeAction: save.activeAction,
      combat: save.combat ?? null,
      selectedFoodItemId: save.selectedFoodItemId ?? null,
    })

    const beforeXp = { ...get().skillXp }
    const beforeInventory = { ...get().inventory }
    const beforeGold = get().gold

    // Clamp how far we simulate forward so an ancient save doesn't spin the
    // tab for minutes on load.
    const effectiveNow = Math.min(Date.now(), save.savedAt + MAX_OFFLINE_MS)
    get().tick(effectiveNow)
    get().combatTick(effectiveNow)

    const afterState = get()
    const xpGained: Record<string, number> = {}
    for (const [skillId, xp] of Object.entries(afterState.skillXp)) {
      const gained = xp - (beforeXp[skillId] ?? 0)
      if (gained > 0) xpGained[skillId] = gained
    }
    const itemsGained: Record<string, number> = {}
    for (const [itemId, qty] of Object.entries(afterState.inventory)) {
      const gained = qty - (beforeInventory[itemId] ?? 0)
      if (gained > 0) itemsGained[itemId] = gained
    }
    const goldGained = afterState.gold - beforeGold

    const elapsedMs = effectiveNow - save.savedAt
    const hasProgress =
      Object.keys(xpGained).length > 0 || Object.keys(itemsGained).length > 0 || goldGained > 0
    // Only worth a popup once the player was away for a little while.
    set({
      offlineSummary:
        hasProgress && elapsedMs > 30_000 ? { elapsedMs, xpGained, itemsGained, goldGained } : null,
    })
  },

  toSaveShape: () => {
    const state = get()
    return {
      gold: state.gold,
      skillXp: state.skillXp,
      inventory: state.inventory,
      equipment: state.equipment,
      activeAction: state.activeAction,
      combat: state.combat,
      selectedFoodItemId: state.selectedFoodItemId,
    }
  },
}))
