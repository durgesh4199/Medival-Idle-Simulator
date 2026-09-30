# Production readiness review

Reviewed on 30 September 2026 using local Chromium and the Vite development server.

## Implementation follow-up

The four release blockers below have been addressed, alongside the adventure guide,
pinned goals, item sourcing links, batch trading, and original vector artwork.
See [release-hardening.md](release-hardening.md) for the implementation and validation.
The findings below record the initial state before these changes.

## Verdict

The game is a playable prototype with substantial systems already present. A public beta is a reasonable next goal after the release blockers below are resolved. This review does not certify a full production release or long-term balance.

## Verified

- Dependency installation succeeds with a writable npm cache.
- `npm run build` passes; the main JavaScript bundle is approximately 348 kB, or 95 kB compressed.
- `npm run lint` passes.
- Starting Fishing awards 12 XP and an inventory item after a completed action.
- Bank reflects that item; starting combat cancels gathering and advances combat HP and XP.
- Save Now and reload preserve gathering progress in the test browser.
- Combat, Bank, Quests, Shop, Farming, Ranching, Dungeons, and Settings render without observed JavaScript exceptions during the smoke test.

## Release blockers

| Priority | Finding | Recommended change and acceptance criteria |
| --- | --- | --- |
| P0 | Offline progress exceeds its advertised 24-hour cap. A controlled 72-hour-old fishing save grants approximately one day of progress on load, but its active timestamp remains 48 hours behind. The next ordinary tick grants the remaining backlog. In one randomized run, fishing XP increased from 152,652 after load to 477,192 after the next tick. | After capped catch-up, move active gathering and combat/dungeon clocks into the present while preserving their remaining intervals. Verify 24-, 48-, and 72-hour absences and the first subsequent tick. Define farming/ranching caps separately. |
| P0 | The mobile skill screen is unusable. At a 390-pixel viewport, the gameplay main element starts at x=344 and is only 46 pixels wide. | Collapse navigation, make location selection a drawer or compact selector, and stack gameplay panels. Verify usable controls and readable content at 360, 390, and 768 pixels wide. |
| P0 | Save validation accepts invalid quantities and malformed values. A save with negative gold, string XP, negative inventory, and a malformed active action passes `isValidSaveData`. Normal loading also lacks schema validation and accepts unsupported versions. | Validate finite nonnegative numbers, content IDs, collections, timestamps, durations, and mutually exclusive activity state. Add explicit version migration/rejection and recovery from corrupt saves without overwriting the original. |
| P0 | Failed persistence is hidden from players: `saveGame` catches storage errors, while Settings unconditionally shows “Saved”. | Return a save result, display failures, retain a recoverable backup, and provide export when storage is unavailable. Verify quota and unavailable-storage failures. |

## Before public beta

1. Add regression coverage for offline limits, save round trips/migrations, invalid imports, crafting input exhaustion, activity exclusivity, combat defeat/food consumption, and reward claims.
2. Add automated browser smoke checks and build/lint checks in CI. Include mobile navigation and save/reload.
3. Prevent two open tabs from independently advancing and overwriting the same save, or explicitly support synchronized ownership of the simulation.
4. Add a guided first session: catch five fish, claim the first quest, cook food, equip the rewarded sword, and start combat. Show one recommended next goal with links to the relevant screens.
5. Show visible navigation labels or a clearly labeled expandable menu. Review keyboard focus, text contrast, reduced motion, and modal behavior.
6. Test a production preview in Chrome, Firefox, Safari, and mobile browsers. Validate deployment base paths, caching of HTML versus hashed assets, and recovery after an update.
7. Add an application error boundary and production error reporting appropriate to the hosting platform. Establish a release version and a rollback procedure.

## Recommended gameplay additions

Prioritize depth and guidance before adding more parallel systems:

- A pinned quest/goal panel with progress, next unlocks, and direct navigation to required items or recipes.
- An item “Where to obtain / Used in” view built from existing content data to explain resource chains.
- Batch buying/selling and production quantities, with an explicit reason when an action stops for missing inputs.
- A limited action queue after onboarding; specify input-shortage and offline behavior before implementing it.
- A distinct visual identity using consistent medieval icons and area art, replacing platform-dependent emoji where useful.
- Later, settlement upgrades that consume surplus resources and provide meaningful choices; evaluate their effect on progression with playtesting before adding prestige or seasonal content.

## Scope and limitations

This was a short browser playtest plus targeted code and simulation checks. It did not complete the quest campaign, clear dungeons, assess rare-drop rates, test every equipment interaction, or establish multi-day economy balance. Later-game pacing and retention need longer playtests with recorded progression milestones. No game source was changed by this review.
