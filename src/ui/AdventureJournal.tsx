import { levelForXp } from '../engine/xp'
import { actions, items, skills } from '../data'
import { useGameStore } from '../state/gameStore'
import { ArtIcon } from './ArtIcon'
import { ItemLink } from './ItemLink'
import { useGameNavigation } from './gameNavigation'

export function AdventureJournal() {
  const inventory = useGameStore((s) => s.inventory)
  const xp = useGameStore((s) => s.skillXp)
  const log = useGameStore((s) => s.eventLog)
  const levelOf = (id: string) => levelForXp(xp[id] ?? 0)
  const { navigate } = useGameNavigation()
  const supplies = Object.entries(inventory)
    .filter(([id, qty]) => qty > 0 && items[id])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const next = actions
    .filter((a) => a.requiredLevel > levelOf(a.skillId))
    .sort((a, b) => a.requiredLevel - levelOf(a.skillId) - (b.requiredLevel - levelOf(b.skillId)))
    .slice(0, 3)
  return (
    <aside
      aria-label="Adventure journal"
      className="adventure-journal hidden w-60 shrink-0 flex-col gap-5 overflow-y-auto border-l border-line p-4 xl:flex"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[.25em] text-gold">Your chronicle</p>
        <h2 className="mt-1 font-serif text-xl text-neutral-100">Adventure Journal</h2>
        <div className="journal-rule mt-3" />
      </div>
      <section>
        <h3 className="mb-3 text-xs uppercase tracking-widest text-neutral-400">
          Traveler’s supplies
        </h3>
        {supplies.length ? (
          <div className="space-y-3">
            {supplies.map(([id, qty]) => (
              <div key={id} className="flex items-center gap-2">
                <ArtIcon name={id} className="h-9 w-9" />
                <div className="min-w-0 flex-1 truncate text-xs">
                  <ItemLink itemId={id} label={`Inspect ${items[id].name}`}>
                    {items[id].name}
                  </ItemLink>
                </div>
                <span className="text-xs text-neutral-300">{qty.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-500">
            Your pack is empty. Start gathering to stock supplies for the journey.
          </p>
        )}
      </section>
      <section>
        <h3 className="mb-3 text-xs uppercase tracking-widest text-neutral-400">On the horizon</h3>
        <div className="space-y-2">
          {next.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => navigate({ view: 'skills', skillId: a.skillId, actionId: a.id })}
              className="journal-unlock w-full rounded-lg border border-line p-3 text-left"
            >
              <p className="text-xs text-neutral-200">{a.name}</p>
              <p className="mt-1 text-[11px] text-gold">
                {skills[a.skillId].name} · Level {a.requiredLevel}
              </p>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-xs uppercase tracking-widest text-neutral-400">Recent tales</h3>
        {log.length ? (
          <ol className="space-y-3">
            {log.slice(0, 4).map((entry) => (
              <li
                key={entry.id}
                className="border-l border-gold/30 pl-3 text-xs leading-relaxed text-neutral-400"
              >
                {entry.message}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-500">
            Every great adventure begins with a small step. Your milestones will appear here.
          </p>
        )}
      </section>
      <div className="mt-auto pt-3 text-center">
        <ArtIcon name="castle" className="mx-auto h-10 w-10 opacity-40" />
        <p className="mt-2 font-serif text-xs italic text-neutral-500">
          A realm of quiet adventures.
        </p>
      </div>
    </aside>
  )
}
