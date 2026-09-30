# Scene-based interface

The supplied Melvor Idle 2 screenshots informed the screen structure: compact chrome, icon navigation, full-screen environments, teal panel headers, parchment selectors, and green/red activity buttons. All environment and sprite artwork is original. This implements a similar interaction structure; undocumented reference formulas are not claimed to be reproduced.

Fishing places spot controls and output tables over a lake with an animated boat and fish. Priority selection doubles that fish's relative output weight, then normalizes the table; independent rare drops remain unchanged. Feather bait consumes one available feather at each catch and reduces the following cast's duration by 15%. Missing bait never stops fishing. Configuration persists in the active action and is applied during offline catch-up.

Woodcutting and Mining show resource cards and a large selected resource. Each resource has 2–6 hits. Per-hit duration and XP divide the existing full-cycle duration and XP, preserving approximate economic progression. Normal rewards occur only on the final hit; each hit independently has a 0.25% bonus resource chance. Health resets automatically for the next cycle. Remaining hits are saved. Legacy actions without hit state finish their existing reward cycle before adopting staged hits.

Crafting skills have recipe selection, requirements, and production panels. Combat adds equipment slots, a central enemy illustration, and prominent health bars while retaining food, prayers, spells, Slayer, and existing combat logic. Desktop navigation is compact; phones retain the labeled drawer and stacked, scrollable controls. Decorative motion respects reduced-motion preferences.

Validation: build, lint, browser regressions for navigation, tutorial, persistence, corruption recovery, offline caps, staged resource progress, fishing priorities, bait exhaustion, and malformed gathering configuration. Screenshots at 1440×900 and 390×844 were checked for layout and runtime errors.
