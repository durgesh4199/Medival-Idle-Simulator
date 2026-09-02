/**
 * Persistence. A save is just a JSON snapshot of the store's serializable
 * fields — no engine state, no functions — so it stores and diffs cleanly
 * and is trivial to version/migrate later.
 */

import type { EquipmentSlot } from '../data/types'

const SAVE_KEY = 'medieval-idle-save'
const SAVE_VERSION = 1

export interface ActiveActionSave {
  actionId: string
  startedAt: number
  durationMs: number
}

export interface SaveData {
  version: number
  gold: number
  skillXp: Record<string, number>
  inventory: Record<string, number>
  equipment: Partial<Record<EquipmentSlot, string>>
  activeAction: ActiveActionSave | null
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

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}
