/**
 * Persistence. A save is just a JSON snapshot of the store's serializable
 * fields — no engine state, no functions — so it stores and diffs cleanly
 * and is trivial to version/migrate later.
 */

import type { EquipmentSlot } from '../data/types'
import type { LogEntry } from './eventLogEngine'
import type { FarmingPlotState } from './farmingEngine'
import type { RanchPenState } from './ranchingEngine'
import type { SlayerTaskState } from './slayerEngine'

const SAVE_KEY = 'medieval-idle-save'
/** Exported so `SettingsPage` can stamp an export with the same version an
 *  import will be checked against, without reaching into localStorage. */
export const SAVE_VERSION = 1

export interface ActiveActionSave {
  actionId: string
  startedAt: number
  durationMs: number
}

/** Mirrors engine/combatEngine.ts's CombatSimState, plus which enemy. */
export interface CombatSave {
  enemyId: string
  enemyHp: number
  playerHp: number
  nextPlayerAttackAt: number
  nextEnemyAttackAt: number
  kills: number
}

/** An in-progress Dungeon run — which dungeon, how far through its fixed
 *  enemy sequence, and the current enemy's fight state. No `kills` field
 *  (unlike CombatSave): `enemyIndex` already tracks progress, since each
 *  enemy in the sequence is fought exactly once. */
export interface DungeonRunSave {
  dungeonId: string
  enemyIndex: number
  enemyHp: number
  playerHp: number
  nextPlayerAttackAt: number
  nextEnemyAttackAt: number
}

export interface SaveData {
  version: number
  gold: number
  skillXp: Record<string, number>
  inventory: Record<string, number>
  equipment: Partial<Record<EquipmentSlot, string>>
  activeAction: ActiveActionSave | null
  combat: CombatSave | null
  /** Persists independent of whether a fight is active, like equipment. */
  selectedFoodItemId: string | null
  /** The active Prayer, if any — persists the same way, independent of an
   *  active fight. */
  selectedPrayerId: string | null
  /** The active Spell, if any — persists the same way. */
  selectedSpellId: string | null
  /** Per-action mastery XP, keyed by Action.id. */
  masteryXp: Record<string, number>
  /** Per-skill mastery pool XP, keyed by SkillId. */
  masteryPoolXp: Record<string, number>
  /** Lifetime kills per enemy, keyed by Enemy.id — never reset by starting a
   *  new fight, unlike CombatSave.kills (that fight's kill count only). */
  killCounts: Record<string, number>
  /** Turned-in quests, keyed by Quest.id. */
  completedQuestIds: Record<string, boolean>
  /** The player's current Slayer task, if one has been assigned yet. */
  slayerTask: SlayerTaskState | null
  /** The player's current Dungeon run, if one is in progress. */
  dungeonRun: DungeonRunSave | null
  /** Lifetime clears per dungeon, keyed by Dungeon.id — never reset,
   *  parallel to killCounts. Drives Achievements' `dungeonCleared` kind. */
  dungeonClearCounts: Record<string, number>
  /** Claimed achievements, keyed by Achievement.id. */
  completedAchievementIds: Record<string, boolean>
  /** Pets found, keyed by Pet.id — permanent once true, same shape as
   *  completedQuestIds. */
  ownedPetIds: Record<string, boolean>
  /** Farming's plots — undefined on any save written before Farming
   *  existed, same "optional, defaulted on load" treatment every other
   *  field added after launch gets. */
  farmingPlots?: FarmingPlotState[]
  /** Ranching's pens — undefined on any save written before Ranching
   *  existed, same treatment as `farmingPlots`. */
  ranchPens?: RanchPenState[]
  /** Recent activity-feed entries — undefined on any save written before
   *  the event log existed, same treatment as `farmingPlots`. */
  eventLog?: LogEntry[]
  /** Timestamp this save was written, used to compute offline progress. */
  savedAt: number
}

export function saveGame(data: Omit<SaveData, 'version' | 'savedAt'>): void {
  const payload: SaveData = { ...data, version: SAVE_VERSION, savedAt: Date.now() }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn('[saveSystem] failed to save game', err)
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SaveData
    if (data.version !== SAVE_VERSION) {
      // Future migrations go here, keyed off the stored version number.
      return data
    }
    return data
  } catch (err) {
    console.warn('[saveSystem] failed to load save', err)
    return null
  }
}

/** Loose shape check for a save imported from outside the game (pasted or
 *  uploaded on `SettingsPage`) — just enough to reject obvious garbage
 *  before it's written to `localStorage` and reloaded, not a full schema
 *  validation. `loadGame` already tolerates a version mismatch, so this
 *  doesn't check `version` either. */
export function isValidSaveData(data: unknown): data is SaveData {
  if (typeof data !== 'object' || data === null) return false
  const save = data as Partial<SaveData>
  return (
    typeof save.gold === 'number' &&
    typeof save.skillXp === 'object' &&
    save.skillXp !== null &&
    typeof save.inventory === 'object' &&
    save.inventory !== null
  )
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}
