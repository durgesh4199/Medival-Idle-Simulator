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

**Implemented today — all 8 skills from the design doc's §4/§5:** Fishing,
Firemaking, Woodcutting, Mining, Smithing, Cooking, Hunting, Runecrafting, wired
into real resource chains: Woodcutting → Logs → Firemaking; Mining → Ore/Coal →
Smithing's furnace → Bars → Smithing's anvil → Equipment items; Mining → Rune
Essence → Runecrafting → Runes; Fishing → raw fish → Cooking (with a burn-chance
failure output). Hunting stands alone for now (fur/feathers/meat + a rare pelt) —
Cooking accepting Raw Meat, and Runes eventually feeding a Magic/Combat system, are
natural next links in the same chain.

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
`Header` doubles as the top-level nav (Skills / Bank tabs, per §13's Main Navigation),
and `BankPage` is the Bank/Equipment screen described below.

### Bank & Equipment

`Item` (in `data/types.ts`) optionally carries an `equipment: { slot, stats }` field —
`bronze_sword`, `bronze_helmet`, `bronze_shield`, `bronze_boots`, `iron_sword`, and the
rare `rusty_ancient_dagger` all have one. Equipping is instant player configuration,
not a timed `Action`, so it lives as two `gameStore` mutations (`equipItem`/
`unequipItem`) rather than in `skillEngine.ts`: equip moves one unit from inventory
into an `equipment` slot map, returning whatever was worn there back to inventory;
unequip is the reverse. `engine/equipmentEngine.ts` has the pure functions this
adds — `aggregateEquipmentStats` sums whatever's currently worn into the totals
Combat reads for its accuracy/damage rolls, and `getWeaponAttackSpeedMs` reads the
weapon slot alone (attack speed isn't a "sum across slots" kind of stat).

`BankPage` renders all 9 equipment slots (paper-doll style) plus a searchable,
category-filterable (All/Equipment/Food/Resources) grid of everything else in the
inventory — the doc's §7 "persistent economy interface." Equipment persists through
the same `saveGame`/`loadFromSave` path as everything else in the store.

### Combat

The one system that doesn't fit the gathering-skill `Action` shape (design doc §6):
instead of one timer with one outcome, it's two independent attack-speed timers
(player, enemy) racing against a shared enemy HP pool. `engine/combatEngine.ts`
holds it — `computePlayerCombatStats` derives Accuracy/Max Hit/Evasion/Max HP/Attack
Speed from combat-skill levels (Attack/Strength/Defence/Hitpoints — plain keys in the
same `skillXp` map production skills use, deliberately *not* `SkillId`s, since
they're trained only by fighting and have no Skills-sidebar UI of their own) plus
`aggregateEquipmentStats`, and `simulateCombat` is the event loop: walk forward to
`now`, resolve whichever of the two timers is next, repeat. A kill rolls loot
(`rollLoot` — every entry independent, unlike a gathering Action's single weighted
output), adds gold, and instantly respawns the same enemy, same as an idle action
looping. Below half HP, the player auto-eats whatever's selected as combat food
(closing the doc's `Fishing → Fish → Cooking → Food → Combat` chain — `healAmount` on
`cooked_herring`/`cooked_trout` is what gets eaten). A defeat clears `combat` and
fully heals for next time — no other penalty — and `CombatPage` shows a brief banner
either way, live or discovered on return from being away.

`simulateCombat` is written the same way `gameStore.tick` is: one call resolves
everything between the last state and `now`, so it's simultaneously the live-ticking
function and the offline-catchup function — verified by seeding a save with a fight
started hours in the past and confirming the "Welcome back" summary shows the XP,
loot, and gold earned (and, in one run, that the player *had* been defeated partway
through and combat had correctly stopped).

`startAction` and `startCombat` are mutually exclusive — starting either stops the
other, since skilling and fighting are the same "one current activity" slot per the
core loop (§1, §3).

### Economy

Design doc §14: "the economy is built around resource sinks and conversion chains."
Every `Item` already carries a `value` (§7), so buying/selling needed no new item
data — just `engine/economyEngine.ts`'s two pure functions, `getSellPrice` (shops pay
60% of value — the standard idle-genre spread that stops flipping items from being
free money) and `getBuyPrice` (150% of value), plus `isSellable` to keep worthless
junk like `junk`/`burnt_food` (value 0) out of the sell list — they're clutter, not a
gold sink. `data/shop.ts`'s `shopBuyableItemIds` is a short curated list (cooked fish,
logs, a bronze bar) — staples worth a convenience purchase, deliberately nothing
rare or equipment-tier, so the shop can't shortcut past progression. `sellItem`/
`buyItem` on the store are the same shape as `equipItem`: instant inventory ⇄ gold
mutations, not timed actions. `ShopPage` is Buy (curated list, price, afford-gated
button) next to Sell (everything sellable currently owned, Sell 1 / Sell All).

### Mastery

Design doc §8: "reward specialization and long-term engagement... permanent bonuses
from guild progression." Layers directly onto the completion loop `tick` already
runs — no new timer, no new UI screen, two more trackers alongside `skillXp`:

- **Per-action mastery XP** (`masteryXp`, keyed by `Action.id`) — every completion of
  "Pebble Bank" grants Pebble Bank mastery XP, separate from every other Fishing
  spot's. `engine/masteryEngine.ts`'s `masterySpeedBonus` turns that action's mastery
  level into a capped speed bonus (0.3%/level, capped at 30%) applied to its rolled
  duration in both `startAction` and `tick` — this is *why* mastery is per-action, not
  per-skill: it rewards running the same action repeatedly, not just training the
  skill in general.
- **Per-skill mastery pool XP** (`masteryPoolXp`, keyed by `SkillId`) — every action in
  a skill feeds the same pool. `MASTERY_POOL_CAP` (a milestone on `xp.ts`'s own level
  curve, not a disconnected magic number) is the "100% full" mark; once full,
  `rollMasteryPoolBonus` gives every completion in that skill a flat 10% chance to
  double its output — the "permanent bonus from guild progression" made concrete
  without needing a full task-list/guild system.

Both trackers reuse `xp.ts`'s level curve rather than inventing a second one, persist
through the normal save/offline-catchup path, and show up right where the player's
already looking — inside the selected action's detail card in `SkillPanel`, not a
separate screen.

### Quests

Design doc §9: "A quest can require gathering, training, crafting, defeating
enemies, or completing a special activity, then grant rewards and unlocks." Those
four verbs are exactly `QuestRequirement`'s four kinds (plus a fifth,
`questComplete`, for chaining quests into each other) — `data/quests.ts` has a
5-quest starter chain that deliberately exercises all of them and touches most
systems already built: gather Fishing's `raw_herring` → craft it via Cooking → craft
`bronze_bar` via Smithing → defeat `giant_rat` in Combat → a final `attack` level
gate, with two branches (Cooking and Smithing) unlocking in parallel off the first
quest before the last two converge on both.

`engine/questEngine.ts` is pure requirement-checking (`canCompleteQuest`), the same
role `hasRequiredInputs` plays for actions — nothing here mutates state.
`gameStore.completeQuest` is the turn-in: consumes any `itemCount` requirements,
grants the rewards, marks it done. Two new persistent trackers make the requirement
kinds possible: `killCounts` (lifetime kills per enemy — deliberately separate from
`combat.kills`, which is scoped to the *current* fight and resets on defeat or a new
fight) and `completedQuestIds`. `QuestsPage` shows every quest's requirements as a
live checklist (✅/⬜ plus current/target, e.g. "3/5 Raw Herring") — nothing about a
quest's state is hidden or needs a separate "check progress" action.

### Slayer

Design doc §9: "Slayer adds target selection and task-driven combat." Exactly the
extension README already called out: task assignment layered on the `killCounts`
tracker Quests introduced, no new timer or tick — it rides `combatTick`.

`data/slayer.ts` is a small pool of `{enemyId, minKills, maxKills}` defs (every
current enemy is assignable) plus two per-kill reward constants.
`engine/slayerEngine.ts` is pure, the same role `questEngine.ts`/`masteryEngine.ts`
play: `rollSlayerTask` picks a random def and rolls a kill target, capturing
`killsAtAssignment` as a baseline — because `killCounts` is lifetime (Quests need
that), a task's own progress has to be the *delta* from when it was assigned, not
the raw lifetime count. `slayerTaskProgress`/`isSlayerTaskComplete` read that delta.

`combatTick` credits `SLAYER_XP_PER_KILL` skill XP (into `skillXp.slayer`, the same
generic map every skill/combat-stat already shares) and `SLAYER_BONUS_GOLD_PER_KILL`
gold for every kill still owed toward the active task — matching Melvor's own
per-kill Slayer-coin bonus rather than a lump sum on completion, so it needs no
separate "claim reward" step. The moment a task is filled, `combatTick` rolls the
next one in the same state update — there's no idle gap waiting on a Slayer Master.
`ensureSlayerTask` (called once from `initGame`) guarantees a task exists for both a
brand-new save and an old save saved before Slayer existed. `CombatPage` shows the
current task — enemy, progress, Slayer level — as a card that also jumps the enemy
list straight to it.

### Dungeons

Design doc §9: "package multiple automated encounters into a larger risk/reward
run." Structurally close to a `CombatArea`, but a *fixed sequence* fought once
through instead of a pick-one grind list, plus a one-time completion reward — and
real risk: dying partway through ends the run with nothing, same as any other
combat defeat, unlike Quests/Slayer which never lose progress.

`data/combat/dungeons.ts` is a `Dungeon` — an ordered `enemyIds` list plus a
`completionReward` — remixing the existing 3 enemies into an escalating run rather
than needing new bestiary data. The one new engine piece is
`engine/dungeonEngine.ts`'s `advanceDungeonRun`, which chains `simulateCombat` calls
across that sequence: each call is capped with a new `maxKills: 1` parameter on
`simulateCombat` so the current enemy doesn't respawn (open-world combat's normal
behavior) but instead hands any leftover simulated time to the next enemy in line.
The outer loop is bounded by the dungeon's own length, so — like `tick`/`combatTick`
— an arbitrarily long offline absence still resolves correctly in one call: a
seeded run started an hour in the past against a strong player comes back from load
already cleared, completion reward included.

`gameStore.dungeonRun` is a third slot alongside `activeAction`/`combat`, and all
three stay mutually exclusive (still "one activity" per the core loop). `DungeonsPage`
shows the encounter order as a strip of enemy icons (cleared/current/upcoming), live
HP bars while a run is active, and the reward preview up front — same "what am I
doing, what will I gain" answer the design doc's UI section asks for.

## Extending the game

Everything else in [the design doc](docs/design-document.md) — Pets, Achievements —
plugs into this same shape:

- Any further **gathering/production skill** (Farming, Ranching, ...) is just another
  data file of `Location`/`Action` — no new engine code needed, register it in
  `data/index.ts` the same way the 8 current skills work.
- More **combat content** (new enemies, a second `CombatArea`, attack styles, spells,
  prayers) is mostly data — add enemies to `data/combat/enemies.ts`, areas to
  `data/combat/areas.ts`. Prayers/spells as *modifiers* on `computePlayerCombatStats`
  would be the next engine-level combat change.
- More **quests** are just another entry in `data/quests.ts` — the requirement/reward
  vocabulary already covers gather/train/craft/fight/chain.
- More **dungeons** are just another entry in `data/combat/dungeons.ts`.
- **Pets/Achievements** are collection trackers in the same spirit as
  `completedQuestIds`.

## Development

```
npm install
npm run dev       # local dev server with HMR
npm run build     # typecheck + production build to dist/
npm run lint      # oxlint
```
