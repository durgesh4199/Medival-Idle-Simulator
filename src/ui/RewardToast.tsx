import { useEffect, useRef, useState } from 'react'
import { items } from '../data'
import { useGameStore } from '../state/gameStore'
import type { LogEntry } from '../engine/eventLogEngine'
import { ArtIcon } from './ArtIcon'
import { playRewardChime } from './presentationSettings'
import { useNow } from './useNow'

export function RewardToast() {
  const log = useGameStore((s) => s.eventLog)
  const offline = useGameStore((s) => s.offlineSummary)
  const seen = useRef(new Set(log.map((entry) => entry.id)))
  const [sessionStart] = useState(() => Date.now())
  const [reward, setReward] = useState<LogEntry | null>(null)
  const now = useNow(500)
  useEffect(() => {
    const fresh = log.filter(
      (entry) =>
        !seen.current.has(entry.id) &&
        entry.at >= sessionStart &&
        /^(Reached|Completed|Cleared|Found)/.test(entry.message),
    )
    seen.current = new Set(log.map((entry) => entry.id))
    if (offline || !fresh.length) return
    const entry =
      fresh.find((e) => e.message.startsWith('Completed')) ??
      fresh.find((e) => e.message.startsWith('Found rare loot')) ??
      fresh[0]
    setReward({ ...entry, at: Date.now() })
    playRewardChime()
  }, [log, offline, sessionStart])
  if (!reward || now - reward.at > 5500) return null
  const level = reward.message.startsWith('Reached')
  const rare = reward.message.startsWith('Found rare loot')
  const rareItem = rare
    ? Object.values(items).find((item) => reward.message.includes(item.name))
    : undefined
  return (
    <div
      role="status"
      aria-live="polite"
      className="reward-toast pointer-events-none fixed bottom-14 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-gold/60 px-5 py-4 shadow-2xl"
    >
      <div className="reward-emblem">
        <ArtIcon name={rareItem?.id ?? (level ? 'achievements' : 'quests')} className="h-9 w-9" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[.2em] text-gold">
          {rare ? 'A rare discovery' : level ? 'A new milestone' : 'Adventure rewarded'}
        </p>
        <p className="mt-1 font-serif text-base text-neutral-100">{reward.message}</p>
      </div>
      <span className="reward-spark spark-one" />
      <span className="reward-spark spark-two" />
      <span className="reward-spark spark-three" />
    </div>
  )
}
