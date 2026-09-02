# Medieval Idle Simulator

A browser-based medieval idle/incremental game in the Melvor Idle mold: automated skill
actions, offline progress, and a web of skills that feed into each other. No game
engine — this is a plain data-driven web app (TypeScript + React + Vite), because the
entire game is panels, progress bars, and timers, not real-time rendering.

The full target design is [`docs/design-document.md`](docs/design-document.md) — a
reverse-engineered breakdown of the Melvor Idle 2 systems this project is aiming at
(skills, combat, equipment/bank, mastery, quests, offline progression, economy). The
sections below describe what's actually implemented today and how it maps onto that
document.

## Stack

- **TypeScript** — content and state are typed, which matters once there are hundreds
  of items/actions/recipes cross-referencing each other.
- **React 19 + Vite** — component-based UI, instant dev reload, trivial static build.
- **Zustand** — a single small store for player state (xp, inventory, active action).
- **Tailwind CSS v4** — utility styling for the dark, panel-heavy UI.

Ships as a static site: `npm run build` → `dist/` → deploy anywhere (GitHub Pages,
Netlify, Vercel, S3, ...). No server required for single-player idle progress.

## Architecture

The game is split into three layers, and the split is the point: **adding new
content should never require touching engine or UI code.**

```
src/
├── data/       Pure content — skills, locations, actions, items. No logic.
├── engine/     Generic systems that execute whatever `data/` describes.
└── state/      The Zustand store gluing engine + data + UI together.
└── ui/         React components that render whatever state currently holds.
```

### `data/` — the content layer

Every skill is a data file exporting a `Skill`, its `Location[]`, and its `Action[]`
(see `src/data/types.ts` for the shapes, `src/data/skills/fishing.ts` and
`firemaking.ts` for examples). An `Action` fully describes one thing the player can
do: how long it takes, what level it needs, what it consumes, what it can produce
(a weighted output table, plus independently-rolled rare "special" drops).

To add a new skill: create `src/data/skills/<skill>.ts` following the same shape,
then register it in `src/data/index.ts`. That's the whole change — the engine and
every UI component are already generic over `Action`/`Location`.

**Implemented today:** Fishing, Firemaking, Woodcutting, Mining, Smithing, Cooking —
wired into real resource chains matching the design doc's §5 (Woodcutting → Logs →
Firemaking; Mining → Ore/Coal → Smithing's furnace → Bars → Smithing's anvil →
Equipment items; Fishing → raw fish → Cooking, with a burn-chance failure output).
Hunting and Runecrafting are typed in `SkillId` but have no data file yet — same
one-file addition as any other skill.

### `engine/` — the generic systems

- **`xp.ts`** — level ⇄ XP conversion (RuneScape/Melvor-style curve).
- **`skillEngine.ts`** — pure functions: roll a duration, roll an action's rewards,
  check whether required inputs are available. Knows nothing about specific skills.
- **`gameLoop.ts`** — ticks the store on an interval, autosaves periodically, catches
  up instantly on tab refocus.
- **`saveSystem.ts`** — JSON snapshot to `localStorage`, versioned for future migrations.

### `state/gameStore.ts` — the simulation core

The store holds gold, per-skill XP, inventory, and the current active action
(`{ actionId, startedAt, durationMs }`). Progress is **timestamp-based, not
frame-based**: `tick(now)` walks forward from `startedAt`, resolving as many
completions as fit between then and `now` in a loop, re-rolling a new duration each
time (idle actions repeat automatically, like the reference screenshots).

That one loop is also the offline-progress calculator: on load, the saved
`activeAction.startedAt` is however many hours in the past, and calling `tick(now)`
with today's timestamp just resolves every completion that "should" have happened
while the tab was closed — capped at 24 hours of simulated absence. The same code
path handles "closed for 5 seconds" and "closed for 8 hours"; there's no separate
offline-catchup implementation to keep in sync. A before/after diff of XP and
inventory becomes the "Welcome back!" summary shown on load.

### `ui/`

Generic, skill-agnostic components: `Sidebar` lists whatever's in `data.skills`,
`SkillPanel` renders whatever locations/actions the selected skill has, `ProgressBar`
reads the active action's timing. No component hardcodes "Fishing" or "Firemaking".

## Extending the game

Everything in [the design doc](docs/design-document.md) this project is based on
(Hunting, Runecrafting, Combat, equipment, mastery, ...) plugs into this same shape:

- A **gathering/production skill** (Hunting, Runecrafting, or any future skill) is a
  data file of `Location`/`Action` — no new engine code needed, just add the file and
  register it, the same way Fishing/Firemaking/Woodcutting/Mining/Smithing/Cooking
  already work.
- **Combat** is the one system that needs new engine code (accuracy/evasion rolls,
  HP, enemy AI, loot tables) rather than fitting the existing `Action` shape — plan
  for a `combatEngine.ts` alongside `skillEngine.ts`, with enemies/weapons/armor as
  their own `data/` tables.
- **Equipment/mastery/prayers** are additional modifiers layered on top of the same
  action-resolution loop (e.g. bonus XP%, bonus drop chance) — they change what
  numbers go into `rollActionRewards`/`rollDurationMs`, not the loop's shape.

## Development

```
npm install
npm run dev       # local dev server with HMR
npm run build     # typecheck + production build to dist/
npm run lint      # oxlint
```
