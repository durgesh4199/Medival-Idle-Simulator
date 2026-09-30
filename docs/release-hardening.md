# Release hardening and gameplay guidance

Implemented on 30 September 2026.

## Player-facing changes

- Phone navigation opens a labeled menu. Skill locations use a compact selector, gameplay occupies the full screen width, and other screens stack their panels on small displays.
- A first-adventure checklist follows real progression through fishing, cooking, equipping a sword, selecting food, and fighting Giant Rats. A visible next-goal panel explains the current requirement and links to the relevant activity. Quest rewards can be claimed from the panel.
- Any unfinished quest can be pinned. The pin survives saving, exporting, importing, and reloading.
- Item names in the Bank, item Codex, quests, skill recipes, and Shop open a keyboard-accessible item dialog. Sources include actions, special drops, enemy loot, shop stock, farming, ranching, quest rewards, and dungeon rewards. Uses include recipes, spells, planting, raising animals, equipment, food, and quest requirements. Activity shortcuts select the referenced action, enemy, or dungeon.
- Shop quantities support 1, 10, 100, and maximum. Fixed batches require sufficient gold; selling caps at the owned quantity. Store mutations reject fractional/nonfinite quantities and unsafe totals.
- Matching original vector icons appear in navigation, headers, inventory, the item Codex, and Shop. Skill locations have illustrated medieval banners. Content data still retains its emoji fallback icons.
- Visible keyboard focus and reduced-motion styles are provided, and secondary text contrast has been increased.

## Save and simulation changes

The 24-hour cap applies to active gathering, combat, and dungeon catch-up. Combat completes the permitted simulation in bounded chunks before the offline summary is calculated. Surviving activity clocks move forward by the discarded absence, preserving partial intervals. Farming is a single harvest and Ranching has a separate per-animal stockpile cap.

Validation runs before normal loading, importing, and writing. It checks version, finite nonnegative numeric values, whole inventory quantities, known IDs, equipment slots, action durations, timestamps, activity exclusivity, plots/pens, and bounded activity logs. Older version-1 saves receive defaults for missing optional systems. Unsupported versions are rejected without overwriting their save.

Successful writes retain the previous valid snapshot in a backup key. Corrupt primary saves pause autosave and can fall back to the backup. Keeping recovered progress archives the original first. The original can also be downloaded. Storage failures show a warning rather than a false success, and export remains available. Saving also runs when the page becomes hidden.

React lifecycle cleanup stops timers and unregisters listeners. GitHub Actions runs the build, lint, and browser regression checks.

## Validation

- Production build and TypeScript checks pass.
- Lint passes.
- Twelve Chromium browser regressions pass: phone navigation at 360/390/768 pixels, gathering save/reload, goal reward claims and recipe navigation, pin persistence, batch trading, invalid imports, backup recovery, quota failure feedback, 24/48/72-hour gathering and combat catch-up, legacy defaults and dungeon reward handling, and the first-adventure path from a fresh save to equipped combat with food.
- A production-preview browser smoke test checks rendering, navigation, item dialogs, and the phone training controls.

Run `npm test` locally. If system Chromium is unavailable, run `npx playwright install chromium` first. Browser tests start their own development server on port 5174; production rendering is also checked separately using `npm run preview`.

## Remaining release work

These changes resolve the initial four blockers and implement the requested gameplay additions. A full release still needs longer economy/progression playtests and Chrome/Firefox/Safari/mobile-device validation. Saves remain local to one browser; two simultaneous tabs are not synchronized. Cloud saves, deployment configuration, production error reporting, and a rollback procedure remain separate work. No deployment was performed.
