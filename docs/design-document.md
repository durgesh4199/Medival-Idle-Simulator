# Melvor-Style Idle RPG — Reverse-Engineered Game Design Document

Public-information-based design analysis for a Melvor Idle 2-inspired project.

Status: Design reference | Focus: game behavior, systems, progression, and player loops

> **Scope note:** This document captures the reverse-engineered design structure
> discussed while planning this project. It combines what is publicly documented
> about Melvor Idle 2 with design-level reconstruction of how the visible systems
> fit together. It does not claim access to source code or unpublished internal
> formulas. Items marked conceptually as reconstructed should be treated as design
> inference, not exact implementation facts.
>
> Kept here (as Markdown, not the original `.docx`) so it diffs and reads cleanly
> alongside the code — see the repo README for how the current implementation maps
> onto it and what's still outstanding.

## 1. What the game fundamentally is

The game is a single-player, long-term progression RPG built around automated
activities. The player is not primarily performing moment-to-moment actions; the
player is choosing what activity to run, configuring the setup, starting it, and
returning later to evaluate the result.

```
Choose activity -> Configure -> Start -> Wait -> Collect -> Improve -> Unlock -> Repeat
```

The experience combines three games in one: an idle simulator, a progression RPG,
and an optimization/management game.

## 2. Major gameplay layers

```
PLAYER
 +-- SKILLS   -> Resources -> Processing
 +-- COMBAT   -> Equipment -> Loot
 +-- META     -> Quests / Mastery / Pets / Achievements
 +-- ECONOMY  -> Gold / Items / Production rates
 +-- PROGRESSION -> Levels / Unlocks / Gates
```

Skills generate the resources that feed other systems. Combat converts preparation
into progression, loot, and access to new content. Meta systems create long-term
goals outside the immediate activity loop.

## 3. Core player loop

```
Open -> Check current activity -> Collect offline results -> Inspect resources / goals
     -> Choose next activity -> Configure -> Start -> Leave -> Return later
```

Closing the game is part of the loop. Offline progress turns elapsed time into XP,
resources, loot, and other rewards. The interesting decision is made before the
waiting period, not during it.

## 4. Skills and skill categories

A skill is a production/progression machine with level, XP, actions, requirements,
inputs, outputs, bonuses, unlocks, and often mastery.

```
Skill
 +- Level / XP
 +- Actions
 +- Requirements
 +- Inputs
 +- Outputs
 +- Bonuses
 +- Unlocks
 +- Mastery
```

Useful design categories are Gathering, Processing/Production, Passive Production,
and Combat. Gathering obtains raw materials; processing transforms them; passive
production creates ongoing supply; combat consumes preparation to generate loot and
progression.

## 5. Resource and production systems

Fishing: choose a catch, run a timer, receive fish and XP. Firemaking: consume logs
to produce XP and secondary outputs. Runecrafting: turn raw inputs into runes used
by magic. Smithing: convert ores/bars into weapons, armour, and tools.

```
Fishing       -> Fish            -> Cooking / Other Uses
Mining        -> Ore             -> Bars -> Smithing -> Equipment -> Combat
Woodcutting   -> Logs            -> Firemaking
Runecrafting  -> Runes           -> Magic -> Combat
Farming       -> Crops           -> Cooking / Processing
Ranching      -> Animal Products -> Other Production
```

The critical property is that production branches reconnect. A resource is more
valuable when it can become an input to multiple systems.

## 6. Combat system

Combat is an automated simulation. The player chooses the enemy and creates a combat
setup using equipment, food, prayers, spells, runes/ammunition, and other modifiers.
Once started, attacks and defensive interactions are resolved automatically.

```
Combat Setup = Weapon + Armour + Food + Prayer + Spell + Ammunition/Runes + Modifiers
Outcome      = Accuracy + Damage + Speed + Evasion + Defence + Damage Reduction + Special Effects
```

The strategic layer is preparation. In a strong idle RPG, the player can choose
different builds for different enemy profiles rather than simply equipping one
universal best item.

Combat areas, Slayer areas, dungeons, bosses, enemy loot tables, and progression
requirements form the combat content graph.

## 7. Equipment, bank, and items

Equipment turns skill progression into combat strength. Typical slots include
helmet, body, legs, boots, gloves, ring, amulet, weapon, and shield. Item value is
defined by its stats and by its place in the wider economy.

```
Item = Sources + Uses + Value + Requirements + Stats + Rarity + Category + Upgrade/Recipe Links
```

The Bank is not just storage; it is the player's persistent economy interface.
Search, filtering, tagging, tabs, equipment sets, placeholders, and direct equip
actions reduce the information-management burden created by a large item catalogue.

## 8. Mastery and meta progression

The mastery layer exists to reward specialization and long-term engagement. In
Melvor Idle 2, the Mastery Guild direction shifts the focus toward structured tasks
within a skill and permanent bonuses from guild progression.

```
Skill -> Mastery Tasks -> Guild Progression -> Permanent Bonuses
```

Meta systems such as pets, achievements, collections, and long-term completion goals
create reasons to keep using content after the player no longer needs its basic
resources.

## 9. Quests, dungeons, Slayer, pets, achievements

Quests provide both narrative direction and mechanical gates. A quest can require
gathering, training, crafting, defeating enemies, or completing a special activity,
then grant rewards and unlocks.

```
Quest -> Requirement -> Gather / Train / Craft / Fight -> Complete -> Reward -> Unlock
```

Dungeons package multiple automated encounters into a larger risk/reward run. Slayer
adds target selection and task-driven combat. Pets provide rare collection rewards
plus passive bonuses. Achievements create secondary objectives across otherwise
normal play.

## 10. Offline progression and optimization

Offline progression is the defining technical/gameplay behavior of the genre. The
game remembers the active activity and enough state to convert elapsed time into
actions, XP, resources, loot, and related progress.

```
Elapsed Time -> Actions Completed -> Resource Changes -> XP / Mastery -> Loot / Currency -> Offline Summary
```

The game is fundamentally a rate simulator. Players compare XP/hour, items/hour,
profit/hour, kills/hour, or resource consumption/hour when choosing among
activities.

## 11. Progression gates and content graph

```
Level Gate
Item Gate
Equipment Gate
Resource Gate
Combat Gate
Quest Gate
Skill Dependency Gate
```

Progression is not a single line. It is a network in which branches continually
feed other branches. This creates the characteristic "one more thing to unlock"
feeling.

```
Gather -> Process -> Craft/Equip -> Combat -> Loot -> Process -> Stronger Equipment -> Harder Combat
```

## 12. MI2-specific expansion concepts

Public Melvor Idle 2 materials describe a larger sequel structure including a higher
base level cap, new skills, quest/story depth, day/night and weather presentation,
improved bank/equipment organization, an event log, a Codex, new game modes, modding
support, cloud/profile features, and deeper combat content.

Farming is described with automated planting/harvesting/composting, disease/pests
and related processing. Ranching introduces an additional passive-production style
skill. Developers have also described stronger build diversity and a move away from
a universal best-in-slot weapon meta.

A June 2026 combat expansion was publicly described as adding 12 skills, 731 items,
12 pets, 135 monsters, 40 magic spells, and 34 prayers. This illustrates the content
scale and the degree of interconnection between systems.

## 13. UI and player-information architecture

The reference screenshots are views onto the same underlying system rather than
independent mini-games. The UI repeatedly uses panels, tabs, stat blocks, progress
bars, buttons, inventories, equipment slots, timers, and action summaries.

```
Main Navigation
 +- Skills
 +- Combat
 +- Bank / Inventory
 +- Equipment
 +- Quests
 +- Mastery / Collection
 +- Codex / Information
 +- Settings / Meta
```

The UI must continuously answer five questions: What am I doing? How long will it
take? What will I gain? What do I need? What does this unlock?

## 14. Game economy and balancing model

The economy is built around resource sinks and conversion chains. Valuable items may
be used, processed, equipped, sold, consumed, upgraded, required for quests, or
required for mastery.

```
Raw Resource -> Processing Cost -> Intermediate Resource -> Final Item -> Combat/Quest/Utility -> New Demand
```

The key balancing variables are action duration, XP reward, resource yield, input
cost, rare-drop probability, item value, requirement thresholds, and unlock timing.
The desired outcome is not that every activity is identical, but that different
activities are optimal for different player goals.

## 15. Data/content model

The game behaves like a content-driven system. Most scalable content can be
represented as data definitions rather than unique hard-coded mechanics.

- Skill Definition
- Action Definition
- Item Definition
- Recipe Definition
- Enemy Definition
- Loot Table
- Equipment Definition
- Quest Definition
- Dungeon Definition
- Unlock / Requirement Definition

A good design reference therefore treats every item, action, skill, enemy, and
reward as a node with relationships to sources, sinks, requirements, and rewards.

**This is the model `src/data/` in this repo implements directly** — see the README's
Architecture section.

## 16. Confirmed vs reconstructed boundaries

**Confirmed publicly:** the sequel is in active development; public materials
describe the skill count/level-cap direction, combat expansion content, Farming,
Ranching, Mastery Guilds, quests/story, offline progression, Codex/event-log
features, bank/equipment improvements, modding, social/profile and cloud concepts,
expansions, and a no-microtransaction direction.

**Reconstructed/inferred:** exact formulas, hidden modifiers, exact XP curves, exact
drop tables, exact internal save structures, and any unpublished Alpha details.
These should not be presented as exact internal facts.

## 17. Master system map

```
GAME
 |
 +---------------+----------------+
 |               |                |
SKILLS         COMBAT            META
 |               |                |
Resources      Equipment        Quests/Pets
 |               |                |
Processing     Enemy/Loot        Mastery/Achievements
 |               |                |
 +---------------+----------------+
                 |
              ECONOMY
                 |
             PROGRESSION
                 |
          UNLOCKS / ENDGAME
```

The core design is the feedback loop between these layers. Each layer creates
reasons to engage with another layer.

## 18. Design principles for a similar game

1. Make every major resource useful somewhere else.
2. Give the player multiple optimization goals.
3. Make offline progress a first-class loop.
4. Turn levels into unlocks, not just bigger numbers.
5. Give combat strategic preparation rather than real-time execution.
6. Make information discoverable so players can understand the dependency graph.
7. Keep new content compatible with existing systems.
8. Add long-term collection and mastery goals so old content retains value.

The most important takeaway is that the game is not primarily a collection of
screens. It is a progression graph made from skills, actions, resources, items,
requirements, combat, rewards, and time.

## Public-source notes

The analysis referenced public Melvor Idle / Melvor Idle 2 materials including the
Steam store page, Steam Community developer announcements/discussions, and the
Melvor Wiki. Because Melvor Idle 2 is in development, public documentation is
evolving and some systems can change between Alpha updates.

- <https://store.steampowered.com/app/3218350/Melvor_Idle_2/>
- <https://steamcommunity.com/app/3218350/>
- <https://wiki.melvoridle.com/>
