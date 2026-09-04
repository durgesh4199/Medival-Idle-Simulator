import { create } from 'zustand'
import { actionsById, dungeonsById, enemiesById } from '../data'
import { achievementsById } from '../data/achievements'
import { prayersById } from '../data/combat/prayers'
import { spellsById } from '../data/combat/spells'
import { items } from '../data/items/items'
import { combatPet, petBySkillId } from '../data/pets'
import { questsById } from '../data/quests'
import { shopBuyableItemIds } from '../data/shop'
import { SLAYER_BONUS_GOLD_PER_KILL, SLAYER_XP_PER_KILL } from '../data/slayer'
import type { EquipmentSlot } from '../data/types'
import { canCompleteAchievement } from '../engine/achievementEngine'
import {
  computePlayerCombatStats,
  simulateCombat,
  type PlayerCombatStats,
} from '../engine/combatEngine'
import { advanceDungeonRun } from '../engine/dungeonEngine'
import { getBuyPrice, getSellPrice, isSellable } from '../engine/economyEngine'
import { aggregateEquipmentStats, getWeaponAttackSpeedMs } from '../engine/equipmentEngine'
import {
  masteryLevelForXp,
  masterySpeedBonus,
  rollMasteryPoolBonus,
} from '../engine/masteryEngine'
import { applyCombatPetBonus, petSpeedBonus, rollPetDrop } from '../engine/petEngine'
import { canCompleteQuest } from '../engine/questEngine'
import type {
  ActiveActionSave,
  CombatSave,
  DungeonRunSave,
  SaveData,
} from '../engine/saveSystem'
import { hasRequiredInputs, rollActionRewards, rollDurationMs } from '../engine/skillEngine'
import {
  isSlayerTaskComplete,
  rollSlayerTask,
  slayerTaskProgress,
  type SlayerTaskState,
} from '../engine/slayerEngine'
import { levelForXp } from '../engine/xp'

export interface OfflineSummary {
  elapsedMs: number
  xpGained: Record<string, number>
  itemsGained: Record<string, number>
  goldGained: number
  /** Pet.id values found during this catch-up — worth its own callout,
   *  same as items/XP/gold, rather than buried in the XP numbers. */
  petsGained: string[]
}

type Equipment = Partial<Record<EquipmentSlot, string>>

interface GameState {
  gold: number
  skillXp: Record<string, number>
  inventory: Record<string, number>
  equipment: Equipment
  activeAction: ActiveActionSave | null
  combat: CombatSave | null
  /** The player's current Dungeon run, if one is in progress — mutually
   *  exclusive with `activeAction`/`combat`, same "one activity" slot. */
  dungeonRun: DungeonRunSave | null
  /** Lifetime clears per dungeon, keyed by Dungeon.id — never reset,
   *  parallel to killCounts. Drives Achievements' `dungeonCleared` kind. */
  dungeonClearCounts: Record<string, number>
  selectedFoodItemId: string | null
  /** The active Prayer, if any — persists independent of an active fight,
   *  same as `selectedFoodItemId`. */
  selectedPrayerId: string | null
  /** The active Spell, if any — persists the same way. Replaces the
   *  player's physical max hit while its runes hold out. */
  selectedSpellId: string | null
  /** Per-action mastery XP, keyed by Action.id. */
  masteryXp: Record<string, number>
  /** Per-skill mastery pool XP, keyed by SkillId. */
  masteryPoolXp: Record<string, number>
  /** Lifetime kills per enemy, keyed by Enemy.id — for Quest "kills"
   *  requirements. Never reset by starting a new fight. */
  killCounts: Record<string, number>
  /** Turned-in quests, keyed by Quest.id. */
  completedQuestIds: Record<string, boolean>
  /** Claimed achievements, keyed by Achievement.id. */
  completedAchievementIds: Record<string, boolean>
  /** Pets found, keyed by Pet.id — permanent once true, drives both the
   *  Pets collection page and the passive speed/XP bonuses in tick/
   *  combatTick/dungeonTick. */
  ownedPetIds: Record<string, boolean>
  /** Which Pet was most recently found live, and when — same "brief
   *  banner, no dismiss action" idea as `lastDefeatAt`/`lastDungeonClear`.
   *  Not persisted; a pet found while away surfaces via `offlineSummary`
   *  instead. */
  lastPetFound: { petId: string; at: number } | null
  /** The player's current Slayer task — a random enemy + kill target drawn
   *  from `data/slayer.ts`, layered on the same `killCounts` tracker Quests
   *  use. Auto-reassigned the moment it's completed (see `combatTick`). */
  slayerTask: SlayerTaskState | null
  /** Wall-clock time of the most recent defeat, live or discovered on
   *  return from offline combat — lets the Combat page show a brief
   *  "you were defeated" notice without a separate dismiss action. */
  lastDefeatAt: number | null
  /** Which Dungeon was most recently cleared, and when — same "brief
   *  banner, no dismiss action" idea as `lastDefeatAt`. Not persisted. */
  lastDungeonClear: { dungeonId: string; at: number } | null
  offlineSummary: OfflineSummary | null

  levelOf: (skillId: string) => number
  /** Mastery level for one specific action, e.g. "Pebble Bank" — separate
   *  from the skill level, which is shared across every action in it. */
  masteryLevelOf: (actionId: string) => number
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
  /** Whether `prayerId`'s Defence-level gate is currently met. */
  canSelectPrayer: (prayerId: string) => boolean
  /** Sets the active Prayer — no-ops if the level gate isn't met. Applies
   *  to open-world combat and Dungeons alike, since both read
   *  `playerCombatStats()`. */
  selectPrayer: (prayerId: string | null) => void
  /** Whether `spellId`'s Attack-level gate is currently met — not whether
   *  its runes are currently affordable, which is checked live per swing. */
  canSelectSpell: (spellId: string) => boolean
  /** Sets the active Spell — no-ops if the level gate isn't met. Applies
   *  to open-world combat and Dungeons alike, same as Prayer. */
  selectSpell: (spellId: string | null) => void
  /** Advances combat to `now`, resolving every attack event in between —
   *  same shape as `tick`, so offline catch-up covers combat too. */
  combatTick: (now: number) => void

  /** Whether `dungeonId`'s level gate is currently met. */
  canStartDungeon: (dungeonId: string) => boolean
  /** Stops any skill action or open-world fight (same "one activity" slot)
   *  and starts a fresh run at the dungeon's first enemy. */
  startDungeon: (dungeonId: string) => void
  stopDungeon: () => void
  /** Advances the current Dungeon run to `now` — same shape as `tick`/
   *  `combatTick`, so offline catch-up covers Dungeons too. */
  dungeonTick: (now: number) => void

  /** Sells `qty` of `itemId` for gold at the shop's buy-back price. */
  sellItem: (itemId: string, qty: number) => void
  /** Buys `qty` of `itemId` from the shop's stock, if affordable. */
  buyItem: (itemId: string, qty: number) => void

  /** Whether `questId`'s requirements are currently satisfied and it
   *  hasn't already been turned in. */
  canCompleteQuestById: (questId: string) => boolean
  /** Turns in a quest: consumes any itemCount requirements and grants its
   *  rewards. No-ops if requirements aren't met or it's already complete. */
  completeQuest: (questId: string) => void

  /** Whether `achievementId`'s requirements are currently satisfied and it
   *  hasn't already been claimed. */
  canCompleteAchievementById: (achievementId: string) => boolean
  /** Claims an achievement: grants its reward (no consumption — achievement
   *  requirements are permanent milestones, unlike a Quest's itemCount).
   *  No-op if requirements aren't met or it's already claimed. */
  completeAchievement: (achievementId: string) => void

  /** Assigns a fresh Slayer task only if one isn't already set — safe to
   *  call unconditionally on load/init. */
  ensureSlayerTask: () => void

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
  dungeonRun: null,
  dungeonClearCounts: {},
  selectedFoodItemId: null,
  selectedPrayerId: null,
  selectedSpellId: null,
  masteryXp: {},
  masteryPoolXp: {},
  killCounts: {},
  completedQuestIds: {},
  completedAchievementIds: {},
  ownedPetIds: {},
  lastPetFound: null,
  slayerTask: null,
  lastDefeatAt: null,
  lastDungeonClear: null,
  offlineSummary: null,

  levelOf: (skillId) => levelForXp(get().skillXp[skillId] ?? 0),

  masteryLevelOf: (actionId) => masteryLevelForXp(get().masteryXp[actionId] ?? 0),

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
    const state = get()
    const speedBonus =
      masterySpeedBonus(state.masteryLevelOf(actionId)) +
      petSpeedBonus(state.ownedPetIds, action.skillId)
    set({
      // Mutual exclusion: starting a skill action ends any fight or Dungeon
      // run in progress.
      combat: null,
      dungeonRun: null,
      activeAction: {
        actionId,
        startedAt: Date.now(),
        durationMs: rollDurationMs(action) * (1 - speedBonus),
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
      const masteryXp = { ...state.masteryXp }
      const masteryPoolXp = { ...state.masteryPoolXp }
      let ownedPetIds = state.ownedPetIds
      let lastPetFound = state.lastPetFound
      const skillPet = petBySkillId[action.skillId]
      let completions = 0

      while (now - cursor >= durationMs && completions < MAX_COMPLETIONS_PER_TICK) {
        if (!hasRequiredInputs(action, inventory)) {
          // Ran out of an input mid-loop (e.g. logs) — the action halts.
          return {
            ...state,
            activeAction: null,
            skillXp,
            inventory,
            masteryXp,
            masteryPoolXp,
            ownedPetIds,
            lastPetFound,
          }
        }
        for (const input of action.inputs ?? []) {
          inventory[input.itemId] = (inventory[input.itemId] ?? 0) - input.qty
        }

        const rewards = rollActionRewards(action)
        const poolXp = masteryPoolXp[action.skillId] ?? 0
        if (rollMasteryPoolBonus(poolXp)) {
          // Pool-full perk: a flat chance to double this completion's output.
          for (const itemId of Object.keys(rewards)) rewards[itemId] *= 2
        }
        for (const [itemId, qty] of Object.entries(rewards)) {
          inventory[itemId] = (inventory[itemId] ?? 0) + qty
        }

        skillXp[action.skillId] = (skillXp[action.skillId] ?? 0) + action.xp
        masteryXp[action.id] = (masteryXp[action.id] ?? 0) + action.xp
        masteryPoolXp[action.skillId] = poolXp + action.xp

        const masteryLevel = masteryLevelForXp(masteryXp[action.id])
        // Pets: a rare per-completion find, chance scaled by this action's
        // own mastery level — same "gets a little more likely with
        // experience" idea the Mastery pool bonus already uses.
        if (skillPet && !ownedPetIds[skillPet.id] && rollPetDrop(masteryLevel)) {
          ownedPetIds = { ...ownedPetIds, [skillPet.id]: true }
          lastPetFound = { petId: skillPet.id, at: Date.now() }
        }

        cursor += durationMs
        const speedBonus = masterySpeedBonus(masteryLevel) + petSpeedBonus(ownedPetIds, action.skillId)
        durationMs = rollDurationMs(action) * (1 - speedBonus)
        completions++
      }

      return {
        ...state,
        activeAction: { ...state.activeAction, startedAt: cursor, durationMs },
        skillXp,
        inventory,
        masteryXp,
        masteryPoolXp,
        ownedPetIds,
        lastPetFound,
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

  canCompleteQuestById: (questId) => {
    const quest = questsById[questId]
    if (!quest) return false
    const state = get()
    return canCompleteQuest(quest, {
      levelOf: state.levelOf,
      inventory: state.inventory,
      killCounts: state.killCounts,
      completedQuestIds: state.completedQuestIds,
    })
  },

  completeQuest: (questId) =>
    set((state) => {
      const quest = questsById[questId]
      if (!quest) return state
      const canComplete = canCompleteQuest(quest, {
        levelOf: state.levelOf,
        inventory: state.inventory,
        killCounts: state.killCounts,
        completedQuestIds: state.completedQuestIds,
      })
      if (!canComplete) return state

      const inventory = { ...state.inventory }
      for (const req of quest.requirements) {
        if (req.type === 'itemCount') {
          inventory[req.itemId] = (inventory[req.itemId] ?? 0) - req.qty
          if (inventory[req.itemId] <= 0) delete inventory[req.itemId]
        }
      }

      const skillXp = { ...state.skillXp }
      for (const [skillId, xp] of Object.entries(quest.rewards.xp ?? {})) {
        skillXp[skillId] = (skillXp[skillId] ?? 0) + xp
      }
      for (const item of quest.rewards.items ?? []) {
        inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.qty
      }

      return {
        ...state,
        inventory,
        skillXp,
        gold: state.gold + (quest.rewards.gold ?? 0),
        completedQuestIds: { ...state.completedQuestIds, [questId]: true },
      }
    }),

  canCompleteAchievementById: (achievementId) => {
    const achievement = achievementsById[achievementId]
    if (!achievement) return false
    const state = get()
    return canCompleteAchievement(achievement, {
      levelOf: state.levelOf,
      killCounts: state.killCounts,
      completedQuestIds: state.completedQuestIds,
      dungeonClearCounts: state.dungeonClearCounts,
      completedAchievementIds: state.completedAchievementIds,
    })
  },

  completeAchievement: (achievementId) =>
    set((state) => {
      const achievement = achievementsById[achievementId]
      if (!achievement) return state
      const canComplete = canCompleteAchievement(achievement, {
        levelOf: state.levelOf,
        killCounts: state.killCounts,
        completedQuestIds: state.completedQuestIds,
        dungeonClearCounts: state.dungeonClearCounts,
        completedAchievementIds: state.completedAchievementIds,
      })
      if (!canComplete) return state

      const skillXp = { ...state.skillXp }
      for (const [skillId, xp] of Object.entries(achievement.reward?.xp ?? {})) {
        skillXp[skillId] = (skillXp[skillId] ?? 0) + xp
      }

      return {
        ...state,
        skillXp,
        gold: state.gold + (achievement.reward?.gold ?? 0),
        completedAchievementIds: { ...state.completedAchievementIds, [achievementId]: true },
      }
    }),

  ensureSlayerTask: () =>
    set((state) => (state.slayerTask ? state : { ...state, slayerTask: rollSlayerTask(state.killCounts) })),

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
    const prayer = state.selectedPrayerId ? prayersById[state.selectedPrayerId] : undefined
    return computePlayerCombatStats(levels, equipmentStats, weaponAttackSpeedMs, prayer?.modifiers)
  },

  startCombat: (enemyId) => {
    const enemy = enemiesById[enemyId]
    if (!enemy) return
    const stats = get().playerCombatStats()
    const now = Date.now()
    set({
      activeAction: null,
      dungeonRun: null,
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

  canSelectPrayer: (prayerId) => {
    const prayer = prayersById[prayerId]
    if (!prayer) return false
    return get().levelOf('defence') >= prayer.requiredLevel
  },

  selectPrayer: (prayerId) => {
    if (prayerId === null) {
      set({ selectedPrayerId: null })
      return
    }
    if (!get().canSelectPrayer(prayerId)) return
    set({ selectedPrayerId: prayerId })
  },

  canSelectSpell: (spellId) => {
    const spell = spellsById[spellId]
    if (!spell) return false
    return get().levelOf('attack') >= spell.requiredLevel
  },

  selectSpell: (spellId) => {
    if (spellId === null) {
      set({ selectedSpellId: null })
      return
    }
    if (!get().canSelectSpell(spellId)) return
    set({ selectedSpellId: spellId })
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
      const spell = state.selectedSpellId ? spellsById[state.selectedSpellId] : undefined
      const spellRunesAvailable = Object.fromEntries(
        (spell?.cost ?? []).map((cost) => [cost.itemId, state.inventory[cost.itemId] ?? 0]),
      )

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
        spellPower: spell?.power,
        spellCost: spell?.cost,
        spellRunesAvailable,
      })

      const boostedXp = applyCombatPetBonus(result.xpGained, state.ownedPetIds)
      const skillXp = { ...state.skillXp }
      for (const [skillId, xp] of Object.entries(boostedXp)) {
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
      for (const [itemId, qty] of Object.entries(result.runesConsumed)) {
        const remaining = (inventory[itemId] ?? 0) - qty
        if (remaining > 0) inventory[itemId] = remaining
        else delete inventory[itemId]
      }

      // killCounts is lifetime, for Quest "kills" requirements — unlike
      // combat.kills (this fight only), it's never reset by starting a new
      // fight, so track it off the kills *gained this tick*, not the total.
      const killsThisTick = result.state.kills - state.combat.kills
      const killCounts = { ...state.killCounts }
      if (killsThisTick > 0) {
        killCounts[enemy.id] = (killCounts[enemy.id] ?? 0) + killsThisTick
      }

      // Pets: an independent roll per kill this tick for the Combat pet,
      // chance scaled by average combat level — stops rolling the moment
      // it's found, same "collection, not a stacking buff" idea as Slayer
      // tasks stop needing a specific enemy once a task is done.
      let ownedPetIds = state.ownedPetIds
      let lastPetFound = state.lastPetFound
      if (!ownedPetIds[combatPet.id] && killsThisTick > 0) {
        const avgCombatLevel =
          (state.levelOf('attack') +
            state.levelOf('strength') +
            state.levelOf('defence') +
            state.levelOf('hitpoints')) /
          4
        for (let i = 0; i < killsThisTick; i++) {
          if (rollPetDrop(avgCombatLevel)) {
            ownedPetIds = { ...ownedPetIds, [combatPet.id]: true }
            lastPetFound = { petId: combatPet.id, at: Date.now() }
            break
          }
        }
      }

      // Slayer: every kill still owed toward the current task pays a bonus
      // on top of the enemy's normal XP/gold, capped at however many kills
      // were actually still needed — killing past the target this tick
      // doesn't overpay. Completing it reassigns a fresh task immediately,
      // same "no separate claim step" idea as the Mastery pool bonus.
      let slayerTask = state.slayerTask
      let slayerGold = 0
      if (slayerTask && killsThisTick > 0 && enemy.id === slayerTask.enemyId) {
        const owedBefore = Math.max(
          0,
          slayerTask.targetKills - slayerTaskProgress(slayerTask, state.killCounts),
        )
        const creditedKills = Math.min(killsThisTick, owedBefore)
        if (creditedKills > 0) {
          skillXp.slayer = (skillXp.slayer ?? 0) + creditedKills * SLAYER_XP_PER_KILL
          slayerGold = creditedKills * SLAYER_BONUS_GOLD_PER_KILL
        }
        if (isSlayerTaskComplete(slayerTask, killCounts)) {
          slayerTask = rollSlayerTask(killCounts)
        }
      }

      return {
        ...state,
        skillXp,
        inventory,
        killCounts,
        slayerTask,
        ownedPetIds,
        lastPetFound,
        gold: state.gold + result.goldGained + slayerGold,
        combat: result.defeated ? null : { enemyId: state.combat.enemyId, ...result.state },
        lastDefeatAt: result.defeated ? Date.now() : state.lastDefeatAt,
      }
    }),

  canStartDungeon: (dungeonId) => {
    const dungeon = dungeonsById[dungeonId]
    if (!dungeon) return false
    return get().levelOf('attack') >= dungeon.requiredLevel
  },

  startDungeon: (dungeonId) => {
    const dungeon = dungeonsById[dungeonId]
    if (!dungeon || dungeon.enemyIds.length === 0 || !get().canStartDungeon(dungeonId)) return
    const firstEnemy = enemiesById[dungeon.enemyIds[0]]
    if (!firstEnemy) return
    const stats = get().playerCombatStats()
    const now = Date.now()
    set({
      // Mutual exclusion: entering a Dungeon ends any skill action or
      // open-world fight in progress.
      activeAction: null,
      combat: null,
      dungeonRun: {
        dungeonId,
        enemyIndex: 0,
        enemyHp: firstEnemy.hp,
        playerHp: stats.maxHp,
        nextPlayerAttackAt: now + stats.attackSpeedMs,
        nextEnemyAttackAt: now + firstEnemy.attackSpeedMs,
      },
    })
  },

  stopDungeon: () => set({ dungeonRun: null }),

  dungeonTick: (now) =>
    set((state) => {
      if (!state.dungeonRun) return state
      const dungeon = dungeonsById[state.dungeonRun.dungeonId]
      if (!dungeon) return { ...state, dungeonRun: null }

      const player = state.playerCombatStats()
      const foodItem = state.selectedFoodItemId ? items[state.selectedFoodItemId] : undefined
      const foodAvailableQty = state.selectedFoodItemId
        ? (state.inventory[state.selectedFoodItemId] ?? 0)
        : 0
      const spell = state.selectedSpellId ? spellsById[state.selectedSpellId] : undefined
      const spellRunesAvailable = Object.fromEntries(
        (spell?.cost ?? []).map((cost) => [cost.itemId, state.inventory[cost.itemId] ?? 0]),
      )

      const result = advanceDungeonRun({
        now,
        dungeon,
        enemiesById,
        player,
        state: {
          enemyIndex: state.dungeonRun.enemyIndex,
          enemyHp: state.dungeonRun.enemyHp,
          playerHp: state.dungeonRun.playerHp,
          nextPlayerAttackAt: state.dungeonRun.nextPlayerAttackAt,
          nextEnemyAttackAt: state.dungeonRun.nextEnemyAttackAt,
        },
        foodHealAmount: foodItem?.healAmount ?? 0,
        foodAvailableQty,
        spellPower: spell?.power,
        spellCost: spell?.cost,
        spellRunesAvailable,
      })

      const boostedXp = applyCombatPetBonus(result.xpGained, state.ownedPetIds)
      const skillXp = { ...state.skillXp }
      for (const [skillId, xp] of Object.entries(boostedXp)) {
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
      for (const [itemId, qty] of Object.entries(result.runesConsumed)) {
        const remaining = (inventory[itemId] ?? 0) - qty
        if (remaining > 0) inventory[itemId] = remaining
        else delete inventory[itemId]
      }

      // Pets: same per-kill Combat pet roll as combatTick, using the
      // dungeon's own kill count for this call.
      let ownedPetIds = state.ownedPetIds
      let lastPetFound = state.lastPetFound
      if (!ownedPetIds[combatPet.id] && result.kills > 0) {
        const avgCombatLevel =
          (state.levelOf('attack') +
            state.levelOf('strength') +
            state.levelOf('defence') +
            state.levelOf('hitpoints')) /
          4
        for (let i = 0; i < result.kills; i++) {
          if (rollPetDrop(avgCombatLevel)) {
            ownedPetIds = { ...ownedPetIds, [combatPet.id]: true }
            lastPetFound = { petId: combatPet.id, at: Date.now() }
            break
          }
        }
      }

      let gold = state.gold + result.goldGained
      let lastDungeonClear = state.lastDungeonClear
      let dungeonClearCounts = state.dungeonClearCounts

      if (result.cleared) {
        // One-time completion reward — same "no separate claim step" idea
        // as a Quest turn-in, just granted automatically since Dungeons
        // (unlike Quests) have no other requirement left to check.
        const reward = dungeon.completionReward
        for (const [skillId, xp] of Object.entries(reward.xp ?? {})) {
          skillXp[skillId] = (skillXp[skillId] ?? 0) + xp
        }
        for (const item of reward.items ?? []) {
          inventory[item.itemId] = (inventory[item.itemId] ?? 0) + item.qty
        }
        gold += reward.gold ?? 0
        lastDungeonClear = { dungeonId: dungeon.id, at: Date.now() }
        // Lifetime clear count, for Achievements' `dungeonCleared` kind —
        // same "never resets" idea as killCounts vs a single fight's kills.
        dungeonClearCounts = {
          ...dungeonClearCounts,
          [dungeon.id]: (dungeonClearCounts[dungeon.id] ?? 0) + 1,
        }
      }

      return {
        ...state,
        skillXp,
        inventory,
        gold,
        dungeonRun: result.state ? { dungeonId: dungeon.id, ...result.state } : null,
        dungeonClearCounts,
        ownedPetIds,
        lastPetFound,
        lastDefeatAt: result.defeated ? Date.now() : state.lastDefeatAt,
        lastDungeonClear,
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
      dungeonRun: save.dungeonRun ?? null,
      dungeonClearCounts: save.dungeonClearCounts ?? {},
      selectedFoodItemId: save.selectedFoodItemId ?? null,
      selectedPrayerId: save.selectedPrayerId ?? null,
      selectedSpellId: save.selectedSpellId ?? null,
      masteryXp: save.masteryXp ?? {},
      masteryPoolXp: save.masteryPoolXp ?? {},
      killCounts: save.killCounts ?? {},
      completedQuestIds: save.completedQuestIds ?? {},
      completedAchievementIds: save.completedAchievementIds ?? {},
      ownedPetIds: save.ownedPetIds ?? {},
      slayerTask: save.slayerTask ?? null,
    })

    const beforeXp = { ...get().skillXp }
    const beforeInventory = { ...get().inventory }
    const beforeGold = get().gold
    const beforeOwnedPetIds = { ...get().ownedPetIds }

    // Clamp how far we simulate forward so an ancient save doesn't spin the
    // tab for minutes on load.
    const effectiveNow = Math.min(Date.now(), save.savedAt + MAX_OFFLINE_MS)
    get().tick(effectiveNow)
    get().combatTick(effectiveNow)
    get().dungeonTick(effectiveNow)

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
    const petsGained = Object.keys(afterState.ownedPetIds).filter(
      (petId) => !beforeOwnedPetIds[petId],
    )

    const elapsedMs = effectiveNow - save.savedAt
    const hasProgress =
      Object.keys(xpGained).length > 0 ||
      Object.keys(itemsGained).length > 0 ||
      goldGained > 0 ||
      petsGained.length > 0
    // Only worth a popup once the player was away for a little while.
    set({
      offlineSummary:
        hasProgress && elapsedMs > 30_000
          ? { elapsedMs, xpGained, itemsGained, goldGained, petsGained }
          : null,
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
      dungeonRun: state.dungeonRun,
      dungeonClearCounts: state.dungeonClearCounts,
      selectedFoodItemId: state.selectedFoodItemId,
      selectedPrayerId: state.selectedPrayerId,
      selectedSpellId: state.selectedSpellId,
      masteryXp: state.masteryXp,
      masteryPoolXp: state.masteryPoolXp,
      killCounts: state.killCounts,
      completedQuestIds: state.completedQuestIds,
      completedAchievementIds: state.completedAchievementIds,
      ownedPetIds: state.ownedPetIds,
      slayerTask: state.slayerTask,
    }
  },
}))
