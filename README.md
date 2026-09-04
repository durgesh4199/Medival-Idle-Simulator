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

**Follow-up fix:** Farming and Ranching both shipped with an explicit "no
Mastery yet, a natural follow-up" note — and since `masteryXp`/`masteryPoolXp`
are already plain `Record<string, number>`, not typed to `Action.id`/`SkillId`
specifically, extending them needed no new engine surface, only new call
sites. `plantCrop`/`placeAnimal` key `masteryXp` by the crop/animal id itself
(same reasoning as Action.id: rewards replanting the same crop, not just
training Farming in general) and apply `masterySpeedBonus` via the same
backdated-timestamp trick already used for the Farming/Ranching pets' bonus,
additively — matching `pets.ts`'s own comment that pet + Mastery bonuses were
always meant to combine, everywhere. `harvestCrop`/`collectRanch` roll
`rollMasteryPoolBonus` against `masteryPoolXp.farming`/`.ranching` to double a
harvest's yield or a collection's batch count, the same "flat chance once
full" perk skills get — and while touching this, the two Pet rolls switched
from using the raw skill level (a stand-in noted at the time as "since Farming
has no Mastery") to the crop/animal's own freshly-updated mastery level,
matching the pattern skills use exactly rather than approximating it.
`FarmingPage`/`RanchingPage` gained a small "🎖️ Mastery Lv N · Pool FULL" line
on each plot/pen card. Verified live: mastery XP accumulates the right amount
per harvest/collection, the displayed level matches `masteryLevelForXp`
exactly, and forcing the pool-bonus roll (via a stubbed `Math.random`) doubles
the harvested/collected amount, all through the real store, not just the pure
engine functions in isolation.

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

**Follow-up fix:** `slayerTaskPool`'s own comment claimed "every current enemy
is assignable," but it went stale across three whole content tiers — Shadowfen
Marsh, Frostfang Highlands, and Emberfall Wastes all shipped without anyone
adding their enemies to it, so a level-70+ player was still only ever handed
Training Grounds tasks. Worse, naively adding them would have let a level-1
player get assigned "kill 3 Molten Golems" — unfightable and unswappable, a
soft-lock. `rollSlayerTask` now takes the player's Attack level and filters to
whichever pool entries' own `CombatArea` is actually unlocked at that level
(the same gate `CombatPage` already enforces before letting you select an
enemy normally), falling back to the whole pool only if somehow nothing
qualifies. Verified with 3,500 rolls across three Attack levels (1/50/80): a
level-1 roll never produces anything but the original three enemies, level 50
adds exactly Shadowfen/Frostfang's six without any Emberfall enemy, and level
80 includes the full roster — plus a live check that a fresh level-1 save's
very first assigned task is genuinely low-tier.

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

### Achievements

Design doc §9: "Achievements create secondary objectives across otherwise normal
play." Deliberately *not* a new track — every requirement kind is something another
system already tracks: `skillLevel` and `questComplete` reuse Quest's own kinds,
`kills` reads the same `killCounts` Quests/Slayer already maintain, and the one new
kind, `dungeonCleared`, reads a new `dungeonClearCounts` (lifetime clears per
dungeon, kept exactly parallel to `killCounts` — never reset, bumped in
`dungeonTick`'s clear branch).

`AchievementRequirement` (`data/types.ts`) is a deliberate subset of
`QuestRequirement` — everything except `itemCount`. An achievement is meant to be a
permanent milestone: a level, a lifetime count, or a completed quest can never
become false again once true, but "currently holding N of an item" can (sell it,
lose the achievement) — the design doc's model for a *secondary objective*, not a
turn-in, so that one kind is left out on purpose. `engine/achievementEngine.ts`
mirrors `questEngine.ts` almost exactly for the same reason: `isAchievementRequirementMet`/
`canCompleteAchievement`, no state mutation. `gameStore.completeAchievement` is a
claim step identical in shape to `completeQuest`, just with no `itemCount` to
consume. `AchievementsPage` mirrors `QuestsPage`'s card-grid-with-checklist layout —
achievements ship spanning skills, combat, the quest chains, and Dungeons, so
every system already built has at least one milestone attached to it.

### Pets

Design doc §9: "Pets provide rare collection rewards plus passive bonuses." One pet
per gathering/production skill plus one Combat pet — `ownedPetIds` is a collection
tracker in the same spirit as `completedQuestIds`, but unlike Quests/Achievements,
finding a pet isn't a requirement check against existing trackers: it's a live
random roll, so this is the one system here with real new engine surface rather
than being purely additive data.

`engine/petEngine.ts`'s `petDropChance(level)` is a small base chance that scales
with the relevant level — a skill pet's own action's Mastery level, or average
combat level for the Combat pet — capped at 2% so it stays a rare find at any
level. `tick` rolls a skill pet once per completion (same place Mastery XP is
already granted); `combatTick`/`dungeonTick` roll the Combat pet once per kill
still resolved in that call — both stop rolling entirely the moment the relevant
pet is owned, so there's no wasted work or "duplicate" case to handle. Both use the
same live-roll pattern the rest of the engine avoids: everything else here (Quests,
Slayer, Achievements, Dungeon rewards) is a deterministic function of tracked
state, so it doesn't matter *when* it's checked; a pet only fires from directly
observing an event as it's resolved. That's also why the same call site rolls
identically whether it's a single live tick or a `tick`/`combatTick` call replaying
hundreds of offline completions at once: each completion or kill gets its own
independent roll either way.

The bonus itself is genuinely woven into the simulation, not just flavor: owning a
skill's pet adds a flat `petSpeedBonus` on top of Mastery's own (capped-at-30%)
speed bonus in both `startAction`'s initial duration roll and `tick`'s per-completion
recalculation; owning the Combat pet runs every combat-skill XP gain through
`applyCombatPetBonus` before it's added to `skillXp`, shared by `combatTick` and
`dungeonTick` since both produce XP through the same `simulateCombat` shape. A pet
found live surfaces as a brief global toast (`PetFoundToast`, mounted once in
`App.tsx` so it fires regardless of which page you're on); one found while away is
folded into the existing offline-summary diff (`OfflineSummary.petsGained`) the
same way XP/items/gold already are. `PetsPage` is a collection gallery — owned pets
show their name/description/bonus, unowned ones show only their source and bonus
preview (never spoiling the name), so it doubles as a checklist of what's left to
find.

### Prayers

Design doc §6: `Combat Setup = Weapon + Armour + Food + Prayer + Spell + ...`. The
first real *modifier* on `computePlayerCombatStats` rather than another
gathering/reward system layered beside it — everything up to this point (Mastery,
Pets, equipment) adds flat stats or speed; a Prayer instead scales a stat by a
percentage at combat-stat computation time.

`data/combat/prayers.ts` is deliberately small: one Prayer active at a time (mirrors
`selectedFoodItemId`), each boosting a *different* stat (Accuracy, Max Hit, Evasion,
or Max HP) rather than one universal "best" choice — the design doc's "different
builds for different enemy profiles" made concrete: precision against an evasive
enemy, protection against a hard-hitting one. No Prayer Points/drain resource —
that would be a whole second economy layered on a feature whose point here is
demonstrating the modifier mechanism, so the strategic choice comes entirely from
picking one stat to lean into, not from managing a consumable. Gated on Defence
level as a stand-in for "combat maturity," since Prayer has no skill of its own.

`computePlayerCombatStats` takes an optional `PrayerModifiers` and applies it as a
percentage scale on top of the base (level + equipment) stat, `Math.floor`ed for a
clean integer same as every other combat number. `gameStore.playerCombatStats()`
looks up the active Prayer and passes its `modifiers` through — the *only* call
site that needed to change, because `combatTick`/`dungeonTick` both already read
combat stats through that one function rather than recomputing them, so the bonus
reaches open-world combat and Dungeons identically for free. `PrayerSelector` is one
shared component mounted in both `CombatPage` and `DungeonsPage`, rather than the
food-selector's duplicated-per-page pattern, since there's only one Prayer state to
read regardless of where it's set from.

### Spells

Design doc §5's resource chain — `Runecrafting -> Runes -> Magic -> Combat` — named
a link nothing had closed yet: Runecrafting produced runes, but nothing in Combat
consumed them. A Spell is the second combat modifier (alongside Prayer), but where
Prayer scales an existing stat, a Spell *replaces* the physical damage roll outright
and costs a per-swing resource — the first thing in Combat that draws down
inventory the way a gathering skill's inputs do.

`data/combat/spells.ts` ships 5 bolts scaled to the 5 runes Runecrafting already
produces (Air/Water/Fire/Chaos/Death), each a flat `power` (rolled the same way
`rollDamage` handles physical hits) at an escalating rune cost, gated on Attack
level the same way Prayer is gated on Defence. One active at a time, same
`selectedFoodItemId`-style persistence.

The interesting engine work is in `simulateCombat` itself: it takes an optional
`spellPower`/`spellCost`/`spellRunesAvailable`, and on every player swing, casts the
spell if its runes are still affordable (consumed on the attempt, hit or miss) —
otherwise silently falls back to the normal Strength-derived `maxHit`, so running
out mid-fight degrades gracefully instead of stalling combat or wasting the
attack. This mirrors the `foodAvailableQty`/`foodEaten` pattern already used for
combat food exactly, just for runes instead of healing. `engine/dungeonEngine.ts`'s
`advanceDungeonRun` threads the same rune stock *across* its chained per-enemy
`simulateCombat` calls (one stock for the whole run, not reset per enemy), the same
way it already threads player HP and attack timers forward. `gameStore` snapshots
the relevant rune counts from `inventory` into each `combatTick`/`dungeonTick` call
and applies whatever `runesConsumed` comes back afterward — the same
read-inventory-in, apply-result-out shape every other resource-consuming system
here uses. `SpellSelector` (shared between `CombatPage`/`DungeonsPage`, like
`PrayerSelector`) shows each spell's cost against current rune stock live, so it's
visible before a fight whether a spell can actually sustain itself.

Verified with a seeded 2-hour offline fight carrying only 5 Air Runes: the runes
were consumed down to nothing and combat kept resolving another ~225 kills purely
on the melee fallback afterward, with no stall and no exception — confirming the
degrade-gracefully behavior holds across an arbitrarily long single catch-up call,
not just live ticking.

### Shadowfen Marsh, Sunken Crypt, and Iron armor

Every system in the design doc existed by this point — this was purely "broaden
what's there," per README's own note that this is the natural next step once every
top-level system is built. Three small additions, all data plus one real UI gap
they exposed:

- **3 new enemies** (`combat/enemies.ts`): Bog Troll, Dark Cultist, Wraith — roughly
  double the Training Grounds trio's numbers, hand-tuned the same "level-1-20ish"
  way the original three were, just aimed at level 25-40. Dark Cultist drops Chaos
  and Death Runes, a second acquisition path for Spells' reagents beyond grinding
  Runecrafting — "a resource is more valuable when it can become an input to
  multiple systems," design principle #1, cutting both ways here.
- **A second `CombatArea`**, Shadowfen Marsh, and **a second `Dungeon`**, Sunken
  Crypt, both gated on Attack level and built from those three. `CombatArea` gained
  a `requiredLevel`/`icon` it never needed with only one area to show.
- **The rest of the Iron armor set** (`iron_helmet`/`iron_shield`/`iron_boots`) —
  Iron had only ever shipped a sword; Bronze's full 4-piece set existed since
  Bank/Equipment, so this was a real gap in the gear progression, not new scope.

The one actual code gap this surfaced: `CombatPage` had `combatAreas[0]` hardcoded
— fine with exactly one area, silently wrong with two. It now has an area-selector
list above the enemy list, the same pattern `DungeonsPage`'s dungeon list and
`SkillPanel`'s location list already use, gated the same way Dungeons are.

Two new Achievements (`crypt_cleared`/`crypt_master`) mirror the Goblin Den pair —
`dungeonCleared` already generalizes over any `Dungeon.id`, so wiring them up was
zero engine work.

### The second quest chain

Shadowfen Marsh/Sunken Crypt shipped with no quest presence at all — the same kind
of gap as `CombatPage`'s hardcoded first area, just on the content side instead of
the code side. `data/quests.ts` now has a second 4-quest arc picking up right where
`proven_adventurer` (the first chain's capstone, itself already granting an Iron
Sword) leaves off: `marsh_rumors` (gated on 5 Iron Bars, so gearing up is part of
the story) → `bog_cull` → `cultists_end` → `shadows_reckoning`, each requiring the
previous plus a kill count against one of Shadowfen Marsh's three new enemies. Each
hands over one more piece of the Iron set as its reward, so finishing the chain
finishes the armor too — narrative and gear progression landing on the same beat
rather than running in parallel. Pure data, the same `kills`/`itemCount`/
`questComplete` requirement vocabulary the first chain already used; no new
requirement kind was needed. A ninth Achievement, `marsh_conqueror`, mirrors
`proven_in_battle`'s role for the new capstone.

### Frostfang Highlands, Frozen Bastion, and Steel/Mithril/Adamant

Every skill and combat area capped out far too early: Mining/Smithing stopped at
level ~20-24, Fishing/Firemaking/Cooking/Hunting/Woodcutting around 10-25,
Runecrafting alone reached 65. Past that ceiling there was nothing left to unlock —
just the same top action grinding toward `MAX_LEVEL` 120 forever with no new
content to reach for, which is a very different thing from "100 hours of content."
This pass exists to close that gap (see "Pacing" below for the reasoning): every
skill now has a tier that reaches into the 40s-50s (Runecrafting's new Blood Rune
tier reaches 80, deliberately the deepest grind in the game), all pure data
following the exact same shape as everything that came before it.

- **Mining → Smithing** gained two more full tiers past Iron: Steel
  (`smelt_steel_bar`, lvl 35) and Mithril (lvl 45) and Adamant (lvl 58) at the
  furnace, each smelting from a new ore (`mine_mithril`/`mine_adamant` join the
  quarry, Steel reuses Iron Ore + more Coal), then a full 4-piece anvil set per
  tier (sword/helmet/shield/boots), topping out at Adamant around Smithing level
  60-65 — deliberate parity with Runecrafting's old level-65 ceiling.
- **Every other skill** gained one or two higher-level actions at a new or
  existing location: Fishing's `deepwater_trench` (Silverfin lvl 40, Leviathan Eel
  lvl 55) feeding two new Cooking recipes; Woodcutting's Willow (30)/Yew (50) trees
  feeding matching Firemaking burns; Hunting's Boar (35)/Stag (55) traps, the
  latter with its own rare `golden_stag_hide` special drop mirroring Silver Fox
  Pelt; Runecrafting's Blood Rune (80).
- **A third `CombatArea`**, Frostfang Highlands (lvl 45: Frost Wolf, Highland
  Raider, Stone Giant — roughly Shadowfen's numbers doubled again), and **a third
  `Dungeon`**, Frozen Bastion (lvl 55), remixing the same three enemies the way
  Sunken Crypt remixed Shadowfen's.
- **A third quest chain**, five quests (`steel_resolve` → `wolves_at_the_door` →
  `raiders_bane` → `the_giants_gauntlet` → `frozen_bastion_reckoning`), picking up
  from `shadows_reckoning` exactly the way the second chain picked up from
  `proven_adventurer` — hands over the Steel set piece by piece, ends on a Stone
  Giant kill count and a unique `frozen_crown` trophy.
- **Seven new achievements**: Smithing-level milestones (`steel_forged`,
  `master_smith`), the new chain's capstone (`highland_conqueror`), a Frozen
  Bastion pair (`bastion_cleared`/`bastion_master`, mirroring the Goblin Den/Sunken
  Crypt pairs exactly), a combat-level milestone (`seasoned_warrior` — 50 in all
  four combat stats), and a second, higher `jack_of_all_trades` tier
  (`grandmaster_of_trades` — level 40 across all 8 skills).

No engine or UI changes were needed for any of this — same as every extension
before it, right down to the third `CombatArea`/`Dungeon` slotting into the
existing selector lists `CombatPage`/`DungeonsPage` already render generically.

### Emberfall Wastes, Emberfall Crucible, and Rune Smithing

The same pass again, one tier further: Rune joins Bronze/Iron/Steel/Mithril/
Adamant as Smithing's new top tier (ore at Mining level 68, bar at Smithing
level 70, a full anvil set at 71-75) — one step past Adamant, which used to
match Runecrafting's old level-65 ceiling and now sits a rung below both Rune
Smithing and Runecrafting's own Blood Rune (80). A fourth `CombatArea`,
Emberfall Wastes (level 68: Infernal Hound, Ash Wraith, Molten Golem — again
roughly doubling the previous tier's numbers), and a fourth `Dungeon`,
Emberfall Crucible (level 80), remix the same three enemies the way every
prior dungeon remixes its own area. A fourth quest chain (`rune_reckoning` →
`hounds_of_ember` → `wraiths_of_ash` → `the_molten_trial` →
`emberfall_reckoning`) hands over the Rune set piece by piece, capping with a
unique `emberfall_crown` trophy — same shape as the third chain, one tier up.
Six more achievements: a Smithing pair (`rune_forged`/`grandmaster_smith`),
the chain's capstone (`emberfall_conqueror`), an Emberfall Crucible pair
(`crucible_cleared`/`crucible_master`), and a second, higher combat-level
milestone (`grand_warlord` — 70 in all four combat stats, one tier past
`seasoned_warrior`'s 50). Same "purely additive data, zero engine/UI changes"
shape as every tier before it — verified the same way too: a data
cross-reference pass (every new id resolves) plus a live Playwright pass
confirming Smelt Rune Bar and a real fight against a Molten Golem both
resolve correctly through the existing engine.

### A second Prayer tier, and Blood Bolt

Two follow-up fixes surfaced by Emberfall's higher level range, rather than
another tier of content in their own right:

- **Blood Rune had no use anywhere.** Every other rune Runecrafting produces
  feeds a matching Spell — Air through Death Bolt — except Blood Rune, its
  own newest and highest tier, which was sellable and nothing else.
  `blood_bolt` (Attack level 80, 1 Blood Rune + 1 Death Rune per cast, 52
  power — the new top of the spell list) closes that gap the same way every
  earlier rune tier already closes into Spells.
- **Prayer had nowhere left to go.** All four original Prayers unlock by
  Defence level 15, from when Defence 15 meant something; Frostfang/
  Emberfall's 45-80 range and `grand_warlord`'s Defence-70 milestone left
  Prayer completely outpaced — nothing to reach for in that system past the
  very early game. A second tier, one stronger Prayer per stat spread across
  levels 35-50 (`zeal`/`fury`/`aegis`/`sanctity`), gives Prayer a reason to
  keep training Defence instead of maxing it out in the first few hours.

Verified live: selecting Prayer of Sanctity and Blood Bolt both persist
correctly, and fighting with Blood Bolt active spends exactly 1 Blood Rune +
1 Death Rune per successful cast, same as every other Spell's cost
accounting — confirming the new entries aren't just visible in the selector
lists but actually wired through `computePlayerCombatStats`/`simulateCombat`
the same as the originals. No engine or UI changes — `PrayerSelector`/
`SpellSelector` already render whatever's in `prayers`/`spells` generically.

### Pacing: how long is "the full game"?

`engine/xp.ts`'s level curve is already steep by design (RuneScape/Melvor-style,
`MAX_LEVEL` 120) — level 50 costs about 112k XP, level 65 about 496k, level 80
about 2.19M. The problem this pass fixes wasn't the curve, it was that content
stopped unlocking around level 20-25 in most skills: once a player reached the
top *action*, there was nothing left to do but repeat it toward a level nobody
had built a reason to reach. That's a short game with an infinite, purposeless
tail bolted onto it, not a long one.

Treating "complete" as finishing everything that now exists — every quest and
achievement, every dungeon cleared at its "master" tier, every skill and
combat stat trained up through its new top-tier content (mid-40s to mid-70s
for most skills and combat, 80 for Runecrafting's Blood Rune) — lands in the
neighborhood of 100+ hours of played time at the game's own XP rates: eleven
XP-earning tracks (8 skills + Farming + Ranching + combat, whose 4 stats level
together off the same kills) each realistically taking on the order of 8-12+
hours to reach their new ceiling once you factor in using progressively
better actions as you level rather
than only the final tier, plus the quests/dungeon-clear/gold-for-recipes time
layered on top that isn't pure XP grinding. `MAX_LEVEL` 120 stays untouched and
still sits well above every new content ceiling — full mastery of everything the
level curve technically allows remains its own, much longer-tail goal, the same
relationship Melvor's own 99 vs. "true" completion has.

### Farming

Design doc §12: Farming is called out by name as "automated planting/harvesting/
composting" — mechanically distinct from every other skill's "start it, it repeats
on a rolled duration" shape, so unlike Frostfang Highlands' skills-widening pass
above, this one **is** new engine surface, not just data. It's structured the same
way Combat/Dungeons already sit outside `SkillPanel`'s generic Location/Action
model: `FarmingCrop` is its own type (`growDurationMs` measured in real minutes,
not the few-second `durationMs` every other skill uses), `engine/farmingEngine.ts`
is three pure timestamp functions (`isPlotReady`, `plotProgress`,
`rollHarvestYield`), and `FarmingPage` is its own top-level nav tab, not a skill
entry — Farming was deliberately kept out of `SkillId` entirely, the same way the
four combat stats already share the `skillXp` map without being one.

The mechanically interesting part: readiness is a *plain timestamp comparison*
(`now >= plantedAt + growDurationMs`), not something a tick loop resolves. Every
other system here earns its offline-friendliness by replaying a bounded loop
forward to `now` (capped at `MAX_OFFLINE_MS`, 24h); Farming needs no loop and no
cap at all — a plot planted right before closing the tab is correctly ready (or
not) on return, whether that's 5 minutes or 5 days later. That also makes Farming
the one system that deliberately breaks the "one activity at a time" rule every
other system (skilling/combat/Dungeons) enforces: `farmingPlots` sits outside
`activeAction`/`combat`/`dungeonRun`'s mutual exclusion entirely, so plots keep
growing no matter what else is running — the whole point of a "plant it and walk
away" skill. `StatusBar` surfaces a "🌾 N plots ready" badge alongside whatever
else it's already showing, since that's the one piece of "what am I doing" that
isn't mutually exclusive with the rest of the bar (Ranching, below, joins it in
the same badge group once it exists).

4 fixed plots, 5 crops (Barley through the level-55 Golden Wheat, 2 minutes to 90
minutes to grow), seeds bought at the Shop (there's no separate seed-gathering
step), a harvest yielding a randomized 2-4 batch rather than a flat 1 (the one
completion in the game that isn't exactly one item), and a new Cooking recipe
(`bake_bread`, from Barley) closing the loop back into an existing system, the
same "a resource feeds multiple systems" principle every other crop chain here
follows. `pets.ts` gained a third `PetSource` variant, `{type: 'farming'}`,
alongside the existing `{type: 'combat'}` — the same precedent for "a non-
skill-panel system gets its own pet source" already set before Farming existed.
Farming has no plot-unlock progression yet — a natural follow-up, not an
oversight — but it does have Mastery now (see "Mastery comes to Farming and
Ranching" below); that gap closed on its own turn, not this one.

### Ranching

Design doc §12 names Ranching right alongside Farming: "an additional
passive-production style skill." Structured the same way — its own
`RanchAnimal` type, `engine/ranchingEngine.ts` as pure timestamp functions, a
`RanchingPage` top-level nav tab kept out of `SkillId` — but given a
deliberately different production shape rather than reskinning Farming's plot,
so the two don't feel like the same system twice: a Farming plot yields *one*
harvest and goes empty; a Ranch pen's animal, once mature, keeps producing on a
recurring `produceIntervalMs` cycle indefinitely — genuinely "passive
production," not "one-shot" — capped at `maxStockpile` so an animal left
uncollected for a long absence doesn't accumulate without limit (the pen "fills
up," the same idea a real coop or barn has).

That recurring shape is where the interesting engine work is:
`stockpiledBatches` divides elapsed time since the last collection by
`produceIntervalMs` (still a plain timestamp calculation, no tick loop, no
offline-catchup cap — same as Farming). `collectBatches` handles the cap
correctly in both directions: if the pen was genuinely capped (production was
being wasted while full), `lastCollectedAt` resets to `now`, since there's no
partial progress worth preserving past a full pen; otherwise it advances by
exactly the time actually converted into batches, so any leftover
partial-cycle progress toward the *next* batch carries forward instead of
being silently discarded. Collecting leaves the animal in the pen — unlike
`harvestCrop` emptying a plot, `collectRanch` only resets the production
clock, so the same animal immediately starts stockpiling again. `releasePen`
is the one new verb Farming didn't need, for removing an animal outright (no
penalty beyond forfeiting whatever wasn't yet collected).

4 fixed pens, 5 animals (Chicken through the level-58 Warhorse, 1-30 minutes to
raise, 45 seconds to 10 minutes per produce cycle), animals bought at the Shop
(same reasoning as Farming's seeds), and a new Cooking recipe (`bake_cake`,
from Egg + Milk) — the second crop/produce loop feeding back into an existing
system. Ranching shares every other precedent Farming set: `pets.ts`'s fourth
`PetSource` variant (`{type: 'ranching'}`), 2 achievements, and a slot in `StatusBar`'s
badge group — "🌾 N plots ready" and "🐄 N pens ready" now ride along together,
since neither is mutually exclusive with anything else running.

### Codex

Design doc §16 lists "Codex/event-log features" among what's *confirmed*
publicly about MI2 (unlike most of this game's exact numbers, which are
reconstructed) — the one design doc §13 nav entry left with no page after
Settings. Both halves live here as `CodexPage`'s three tabs: Bestiary and
Items are the Codex half, Activity is the event-log half.

Bestiary/Items are a browsable *reference*, not a discovery/collection
mechanic — every enemy and every item is listed regardless of whether the
player has ever encountered it, since the goal is answering "what does level
40 unlock" while planning, not gating information behind a separate "have I
found this yet" tracker `gameStore` would need to grow just to serve this one
screen. Zero new engine code for these two: `CodexPage` reads directly off
`data/`'s existing `enemies`/`items` exports, the same "no logic, just data"
pattern `PetsPage`/`BankPage` already use for what the player currently
owns — Codex just doesn't filter down to that. Bestiary cards show full
combat stats plus a loot table (reusing the same `ItemDrop[]` shape kills
already roll from) and cross-reference which `CombatArea`(s)/`Dungeon`(s) an
enemy actually appears in. Item cards show category, value, and — for
equipment — the same accuracy/strength/defence/attack-speed stat block
`BankPage` already renders. Both tabs share one search box (filtered by
name) plus, for items, `BankPage`'s existing All/Equipment/Food/Resources
category filter.

Activity, unlike its two siblings, *does* need new engine surface:
`engine/eventLogEngine.ts` is pure functions (`pushLogEntry`, a ring buffer
capped at 50 — newest first, `OfflineSummary`'s own convention — and
`levelUpMessages`/`pushLevelUps`, which diff a `skillXp` snapshot from
before/after a mutation and return an entry for every skill or combat stat
that crossed a level boundary in between) that `gameStore` folds into a new
`eventLog` field at every XP-granting mutation site —
`tick`/`combatTick`/`dungeonTick`/`completeQuest`/`completeAchievement`/
`harvestCrop`/`collectRanch` — the same "call a pure engine function, fold
the result into state" shape every other tracker here already uses, just
touching more call sites than usual since XP is granted in more places than
any other single kind of event. Pet finds, quest/achievement completions,
dungeon clears, and defeats are logged the same way, right alongside the
existing `lastPetFound`/`lastDungeonClear`/`lastDefeatAt` "brief banner"
trackers those events already set — Activity is a durable, scrollable history
of exactly the same moments those already surface as transient banners.

Verified with a seeded save close to a level boundary, live: training
Fishing across a level-up produces the right "Reached Fishing level N"
entry, turning in a quest produces "Completed \"...\"", and fighting across a
Hitpoints level-up produces "Reached Hitpoints level N" — confirming the
diff-based level-up detection actually fires correctly from three unrelated
mutation sites, not just that the helper function works in isolation.

### Settings

Design doc §13's nav list — Skills / Combat / Bank / Equipment / Quests /
Mastery / Codex / Settings/Meta — had two entries with no page at all until
now (Codex, above, and this one). Everything else in the game is either a
timed `Action` or a `gameStore` mutation the simulation reads back; Settings
is neither, so `SettingsPage`
talks to `engine/saveSystem.ts`/`localStorage` directly instead of through the
store — Save Now, Export, Import, and Reset are all operations on the save
file itself, not events inside the simulation.

Export builds the exact `SaveData` the normal autosave would write (via
`toSaveShape()` + a fresh `savedAt`), shown in a copyable textarea and offered
as a `.json` download. Import parses pasted or uploaded JSON, checks it loosely
resembles a save (`isValidSaveData` — enough to reject garbage, not full schema
validation) and, if it does, calls `gameStore.loadFromSave()` directly on the
live store — the same function `gameLoop.initGame()` calls on a normal boot,
so restoring an old backup correctly replays offline progress from *that
save's own* `savedAt`, not from the moment of import, exactly like loading any
other save does. No page reload needed for Import, which sidesteps a real bug
the first version of this had: reloading the page fires `beforeunload`, which
`gameLoop`'s own autosave listener uses to persist the *current* live state —
so a reload-based Import or Reset would otherwise race that autosave and get
silently overwritten by the very state it was replacing. Reset (behind a
"click again to confirm" two-step, no native `confirm()` dialog) sidesteps the
same race the other way: it calls `stopGameLoop()` — unregistering that
`beforeunload` listener — before `clearSave()` and only then reloads, so
there's nothing left to write the pre-reset state back.

Verified by round-tripping: export the current save, edit a field in the
exported JSON, paste the edited version back into Import, and confirm the
edit actually took effect with no reload race — plus confirming Reset
actually empties `localStorage` (not just visually resets) using a save
seeded via `page.evaluate` rather than `addInitScript`, since `addInitScript`
re-seeds on every navigation including the reload Reset triggers, which
would have hidden the same race bug during testing.

## Extending the game

Adding more of anything above stays additive:

- Any further **gathering/production skill** in the "start it, watch a timer,
  repeat" mold (Fletching, ...) is just another data file of
  `Location`/`Action` — no new engine code needed, register it in
  `data/index.ts` the same way the 8 current skills work.
- More **combat content** (new enemies, a third `CombatArea`) is mostly data — add
  enemies to `data/combat/enemies.ts`, areas to `data/combat/areas.ts`.
- More **quests** are just another entry in `data/quests.ts` — the requirement/reward
  vocabulary already covers gather/train/craft/fight/chain.
- More **dungeons** are just another entry in `data/combat/dungeons.ts`.
- More **achievements** are just another entry in `data/achievements.ts`.
- More **pets** are just another entry in `data/pets.ts` — one more `{source, bonusPercent}`
  pair; `petBySkillId`/`combatPet` and the roll sites in `tick`/`combatTick`/
  `dungeonTick` already generalize over the whole list.
- More **prayers** are just another entry in `data/combat/prayers.ts` — one more
  `{requiredLevel, modifiers}` pair; nothing else needs to change.
- More **spells** are just another entry in `data/combat/spells.ts` — one more
  `{requiredLevel, cost, power}` triple; the casting/fallback logic already
  generalizes over the whole list.
- A further Smithing tier past Adamant (or any further per-skill tier) is a new
  ore/bar plus 4 more equipment items following the Bronze/Iron/Steel pattern
  exactly — see "Frostfang Highlands, Frozen Bastion, and Steel/Mithril/Adamant"
  above for the shape three more tiers actually took.

## Development

```
npm install
npm run dev       # local dev server with HMR
npm run build     # typecheck + production build to dist/
npm run lint      # oxlint
```
