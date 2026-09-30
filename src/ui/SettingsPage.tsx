import { usePresentationSettings } from './presentationSettings'
import { parseSaveData } from '../engine/saveValidation'
import { useRef, useState } from 'react'
import { initGame, saveNow, stopGameLoop } from '../engine/gameLoop'
import {
  SAVE_VERSION,
  allowSaveReplacement,
  clearSave,
  originalSaveText,
  useSaveStatus,
  type SaveData,
} from '../engine/saveSystem'
import { useGameStore } from '../state/gameStore'

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Settings / Meta (design doc §13's nav list — the one entry that had no
 * page at all until now). Nothing here is a timed Action or a `gameStore`
 * mutation the rest of the game reads back; it's the one screen that talks
 * to `localStorage`/`engine/saveSystem.ts` directly instead of through the
 * store, since "back up my save" and "load a different one" are meta
 * operations on the save file itself, not events inside the simulation.
 */
export function SettingsPage() {
  const soundEnabled = usePresentationSettings(s => s.soundEnabled)
  const toggleSound = usePresentationSettings(s => s.toggleSound)
  const saveError = useSaveStatus((s) => s.error)
  const recoveryRequired = useSaveStatus((s) => s.recoveryRequired)
  const recoveredBackup = useSaveStatus((s) => s.recoveredBackup)
  const [exportText, setExportText] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importedFlash, setImportedFlash] = useState(false)
  const [resetArmed, setResetArmed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function buildExportPayload(): string {
    const data: SaveData = {
      ...useGameStore.getState().toSaveShape(),
      version: SAVE_VERSION,
      savedAt: Date.now(),
    }
    return JSON.stringify(data, null, 2)
  }

  function handleSaveNow() {
    setSavedFlash(saveNow())
    setTimeout(() => setSavedFlash(false), 2000)
  }

  function handlePrepareExport() {
    setExportText(buildExportPayload())
  }

  function handleDownload() {
    downloadJson(`medieval-idle-save-${Date.now()}.json`, exportText ?? buildExportPayload())
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) {
      setImportError('Save files must be smaller than 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImportText(String(reader.result ?? ''))
    reader.onerror = () => setImportError('Could not read that file. Try another backup.')
    reader.readAsText(file)
    // Allow re-picking the same file later without needing to change it first.
    e.target.value = ''
  }

  function handleImport() {
    setImportError(null)
    if (importText.length > 2_000_000) {
      setImportError('Save files must be smaller than 2 MB.')
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(importText)
    } catch {
      setImportError('That’s not valid JSON — check the file or paste and try again.')
      return
    }
    const result = parseSaveData(parsed)
    if (!result.ok) {
      setImportError(result.error)
      return
    }
    // Applied straight to the live store — the same loadFromSave()
    // gameLoop.initGame() calls on a normal boot, so it replays offline
    // progress from *that save's* savedAt exactly the way loading any
    // other save does. No reload needed: unlike a reload, this can't race
    // against the beforeunload autosave re-persisting the old (pre-import)
    // live state over what was just imported. saveNow() immediately
    // persists the result so it isn't only sitting in memory.
    if (!allowSaveReplacement()) return
    useGameStore.getState().loadFromSave(result.data)
    useGameStore.getState().ensureSlayerTask()
    const saved = saveNow()
    setImportedFlash(saved)
    if (!saved) setImportError('Loaded in memory, but could not save. Export a backup now.')
    setTimeout(() => setImportedFlash(false), 2000)
  }

  function handleResetClick() {
    if (!resetArmed) {
      setResetArmed(true)
      // Auto-disarm after a few seconds rather than relying on blur — a
      // deliberate second click within the window is the confirmation, an
      // accidental double-click on a stale render isn't.
      setTimeout(() => setResetArmed(false), 5000)
      return
    }
    // Stop the game loop first — reload() fires 'beforeunload', which
    // gameLoop's own autosave listener would otherwise use to write the
    // current (pre-reset) live state right back over the clearSave() below,
    // silently undoing the reset.
    stopGameLoop()
    if (clearSave()) window.location.reload()
    else initGame()
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <section className="rounded-xl border border-line bg-panel p-4">
          <h2 className="mb-2 font-serif text-lg text-gold">Atmosphere</h2>
          <p className="mb-3 text-xs text-neutral-400">A gentle chime celebrates level-ups, quests, and rare discoveries. Sound is optional; animations follow your device’s reduced-motion preference.</p>
          <button type="button" role="switch" aria-checked={soundEnabled} onClick={toggleSound} className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">Reward sounds: {soundEnabled ? 'On' : 'Off'}</button>
        </section>
        {saveError && (
          <section
            role="alert"
            className="rounded-xl border border-amber-500/50 bg-panel p-4 text-sm text-amber-200"
          >
            <p>{saveError}</p>
            {recoveryRequired && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded bg-panel-soft px-3 py-2"
                  onClick={() => {
                    const raw = originalSaveText()
                    if (raw) downloadJson('medieval-original-save.json', raw)
                  }}
                >
                  Download original save
                </button>
                {recoveredBackup && (
                  <button
                    type="button"
                    className="rounded bg-brand px-3 py-2 text-neutral-950"
                    onClick={() => {
                      if (allowSaveReplacement()) setSavedFlash(saveNow())
                    }}
                  >
                    Keep recovered progress
                  </button>
                )}
              </div>
            )}
          </section>
        )}
        <p className="text-sm text-neutral-400">
          Training and combat earn up to 24 hours of offline progress. Crops finish once; ranch
          animals stockpile up to their own limit.
        </p>
        <section className="rounded-xl border border-line bg-panel p-4">
          <h2 className="mb-1 text-sm font-semibold text-neutral-100">Save</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Progress autosaves every 10 seconds and whenever you close the tab. This just forces it
            early.
          </p>
          <button
            type="button"
            onClick={handleSaveNow}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-brand-dim"
          >
            {savedFlash ? 'Saved ✓' : 'Save Now'}
          </button>
        </section>

        <section className="rounded-xl border border-line bg-panel p-4">
          <h2 className="mb-1 text-sm font-semibold text-neutral-100">Export Save</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Back up your progress, or move it to another browser/device — this is the exact state
            the game would otherwise only keep in this browser's local storage.
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrepareExport}
              className="rounded-lg bg-panel-soft px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
            >
              Prepare Export
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg bg-panel-soft px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
            >
              Download .json
            </button>
          </div>
          {exportText && (
            <textarea
              readOnly
              value={exportText}
              onFocus={(e) => e.currentTarget.select()}
              rows={6}
              className="w-full rounded-lg border border-line bg-rail p-2 font-mono text-[11px] text-neutral-400 focus:border-gold focus:outline-none"
            />
          )}
          {exportText && (
            <p className="mt-1 text-[11px] text-neutral-600">
              Click inside the box to select all, then copy — or use Download above.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-line bg-panel p-4">
          <h2 className="mb-1 text-sm font-semibold text-neutral-100">Import Save</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Loads a previously exported save, replacing everything currently in this browser. This
            can't be undone unless you've exported the current save first.
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-panel-soft px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
            >
              Choose File…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFilePicked}
              className="hidden"
            />
          </div>
          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value)
              setImportError(null)
            }}
            placeholder="…or paste exported save JSON here"
            rows={6}
            className="w-full rounded-lg border border-line bg-rail p-2 font-mono text-[11px] text-neutral-300 placeholder:text-neutral-600 focus:border-gold focus:outline-none"
          />
          {importError && <p className="mt-1 text-[11px] text-red-400">{importError}</p>}
          <button
            type="button"
            onClick={handleImport}
            disabled={importText.trim().length === 0}
            className="mt-2 rounded-lg bg-amber-600/80 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-panel-soft disabled:text-neutral-500"
          >
            {importedFlash ? 'Loaded ✓' : 'Load Save'}
          </button>
        </section>

        <section className="rounded-xl border border-red-500/30 bg-panel p-4">
          <h2 className="mb-1 text-sm font-semibold text-red-300">Reset Game</h2>
          <p className="mb-3 text-xs text-neutral-500">
            Permanently deletes everything in this browser and starts over from level 1. Export a
            backup first if you might want this progress back.
          </p>
          <button
            type="button"
            onClick={handleResetClick}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              resetArmed
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-panel-soft text-red-400 hover:bg-neutral-700'
            }`}
          >
            {resetArmed ? 'Click again to permanently delete everything' : 'Reset Game'}
          </button>
        </section>
      </div>
    </div>
  )
}
