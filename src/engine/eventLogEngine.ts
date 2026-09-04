/**
 * Event log — the other half of design doc §16's "Codex/event-log
 * features" (the Codex half lives in `data/`-reading `CodexPage`; this is
 * the "what just happened" activity feed, `CodexPage`'s Activity tab).
 * Pure functions, the same role every other `engine/*Engine.ts` file
 * plays: `gameStore` calls these and folds the result into its own
 * `eventLog` field, nothing here mutates state directly.
 */

import { combatSkillDisplay, skills } from '../data'
import type { CombatSkillId, SkillId } from '../data/types'
import { levelForXp } from './xp'

export interface LogEntry {
  id: string
  icon: string
  message: string
  at: number
}

/** Ring-buffer cap — recent history, not a permanent record; keeps the
 *  save small and the Activity tab scannable. */
const MAX_LOG_ENTRIES = 50

/** Display metadata for the skillXp keys that aren't a `SkillId` or a
 *  `CombatSkillId` — Slayer, Farming, and Ranching all train through the
 *  same shared XP map without a `Skill`/`combatSkillDisplay` entry of
 *  their own (see data/types.ts's CombatSkillId doc comment for why). */
const EXTRA_SKILL_DISPLAY: Record<string, { label: string; icon: string }> = {
  slayer: { label: 'Slayer', icon: '🎯' },
  farming: { label: 'Farming', icon: '🌾' },
  ranching: { label: 'Ranching', icon: '🐄' },
}

function displayFor(skillId: string): { label: string; icon: string } {
  if (skillId in skills) {
    const skill = skills[skillId as SkillId]
    return { label: skill.name, icon: skill.icon }
  }
  if (skillId in combatSkillDisplay) return combatSkillDisplay[skillId as CombatSkillId]
  return EXTRA_SKILL_DISPLAY[skillId] ?? { label: skillId, icon: '⬆️' }
}

/** Prepends one entry and trims to `MAX_LOG_ENTRIES` — newest first, same
 *  "most recent at the top" convention as `OfflineSummary`. */
export function pushLogEntry(log: LogEntry[], icon: string, message: string, at: number): LogEntry[] {
  const entry: LogEntry = { id: `${at}-${Math.random().toString(36).slice(2, 8)}`, icon, message, at }
  const next = [entry, ...log]
  return next.length > MAX_LOG_ENTRIES ? next.slice(0, MAX_LOG_ENTRIES) : next
}

/**
 * Diffs two `skillXp` snapshots and returns a log entry for every skill
 * (including combat stats, Slayer, Farming, Ranching — any key at all)
 * that crossed a level boundary between them. Cheap enough to call after
 * every XP-granting mutation regardless of how many keys changed, since
 * `skillXp` only ever has a dozen or so entries.
 */
export function levelUpMessages(
  before: Record<string, number>,
  after: Record<string, number>,
): { icon: string; message: string }[] {
  const messages: { icon: string; message: string }[] = []
  for (const skillId of Object.keys(after)) {
    const beforeLevel = levelForXp(before[skillId] ?? 0)
    const afterLevel = levelForXp(after[skillId] ?? 0)
    if (afterLevel > beforeLevel) {
      const { label, icon } = displayFor(skillId)
      messages.push({ icon, message: `Reached ${label} level ${afterLevel}` })
    }
  }
  return messages
}

/** Folds every levelUpMessages() result into `log` in one call — the
 *  common case at each mutation site, instead of a loop of pushLogEntry
 *  calls at every call site. */
export function pushLevelUps(
  log: LogEntry[],
  before: Record<string, number>,
  after: Record<string, number>,
  at: number,
): LogEntry[] {
  let next = log
  for (const { icon, message } of levelUpMessages(before, after)) {
    next = pushLogEntry(next, icon, message, at)
  }
  return next
}
