import { create } from 'zustand'
import { parseSaveData } from './saveValidation'
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
  pinnedQuestId?: string | null
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

export const useSaveStatus = create<{
  error: string | null
  recoveryRequired: boolean
  recoveredBackup: boolean
  lastSavedAt: number | null
}>(() => ({ error: null, recoveryRequired: false, recoveredBackup: false, lastSavedAt: null }))

const BACKUP_KEY = `${SAVE_KEY}-backup`
const RECOVERY_KEY = `${SAVE_KEY}-recovery`

export function saveGame(data: Omit<SaveData, 'version' | 'savedAt'>): boolean {
  if (useSaveStatus.getState().recoveryRequired) return false
  const payload: SaveData = { ...data, version: SAVE_VERSION, savedAt: Date.now() }
  const validated = parseSaveData(payload)
  if (!validated.ok) {
    useSaveStatus.setState({ error: `Could not save: ${validated.error}` })
    return false
  }
  try {
    const previous = localStorage.getItem(SAVE_KEY)
    if (previous) {
      let validPrevious = false
      try {
        validPrevious = parseSaveData(JSON.parse(previous)).ok
      } catch {
        /* invalid JSON */
      }
      if (validPrevious) localStorage.setItem(BACKUP_KEY, previous)
      else if (localStorage.getItem(RECOVERY_KEY) !== previous) {
        useSaveStatus.setState({
          recoveryRequired: true,
          error:
            'The existing save is damaged. Autosave is paused. Open Settings to preserve and replace it.',
        })
        return false
      }
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
    useSaveStatus.setState({ error: null, lastSavedAt: payload.savedAt })
    return true
  } catch {
    useSaveStatus.setState({
      error:
        'Progress could not be saved. Storage may be full or unavailable. Export a backup in Settings.',
    })
    return false
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const result = parseSaveData(JSON.parse(raw))
    if (result.ok) return result.data
    useSaveStatus.setState({ error: result.error })
  } catch {
    useSaveStatus.setState({ error: 'The saved game could not be read.' })
  }
  // Preserve the damaged primary save. Never let autosave silently overwrite it.
  useSaveStatus.setState({ recoveryRequired: true })
  try {
    const backup = localStorage.getItem(BACKUP_KEY)
    const result = backup ? parseSaveData(JSON.parse(backup)) : null
    if (result?.ok) {
      useSaveStatus.setState({
        recoveredBackup: true,
        error:
          'Recovered the previous backup. Open Settings to keep it. The original save is preserved until you choose.',
      })
      return result.data
    }
  } catch {
    /* Keep the primary untouched even if the backup is also damaged. */
  }
  useSaveStatus.setState({
    error:
      'Your save could not be loaded. Autosave is paused to protect it. Open Settings to export the original or import a valid backup.',
  })
  return null
}

/** Explicit recovery/import action; archive the original before allowing writes. */
export function allowSaveReplacement(): boolean {
  try {
    if (useSaveStatus.getState().recoveryRequired) {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw !== null) localStorage.setItem(RECOVERY_KEY, raw)
    }
    useSaveStatus.setState({ recoveryRequired: false, recoveredBackup: false, error: null })
    return true
  } catch {
    useSaveStatus.setState({
      error:
        'Could not preserve the original save. Download it before freeing browser storage and retrying.',
    })
    return false
  }
}

export function originalSaveText(): string | null {
  try {
    return useSaveStatus.getState().recoveryRequired
      ? localStorage.getItem(SAVE_KEY)
      : (localStorage.getItem(RECOVERY_KEY) ?? localStorage.getItem(SAVE_KEY))
  } catch {
    return null
  }
}

export function isValidSaveData(data: unknown): data is SaveData {
  return parseSaveData(data).ok
}

export function clearSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem(BACKUP_KEY)
    localStorage.removeItem(RECOVERY_KEY)
    useSaveStatus.setState({
      error: null,
      recoveryRequired: false,
      recoveredBackup: false,
      lastSavedAt: null,
    })
    return true
  } catch {
    useSaveStatus.setState({
      error: 'Could not reset the game because browser storage is unavailable.',
    })
    return false
  }
}
