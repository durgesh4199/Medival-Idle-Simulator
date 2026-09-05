#!/usr/bin/env python3
"""Scan the game's `src/data/*` files (plus NavRail's hardcoded nav tabs) and
build `manifest.json`: one entry per icon the game currently renders as an
emoji, tagged with enough metadata (kind/subkind) for generate_assets.py to
pick a matching art-generation prompt.

This only reads the TypeScript source as text with regexes — it doesn't
need Node or a TS parser, and every data file in this repo already follows
one of two very regular shapes:

  1. Multi-line object literals, one `id:`/`name:`/`icon:` (or `label:`)
     per line, e.g. combat/enemies.ts, achievements.ts, quests.ts.
  2. Single-line object literals, e.g. items/items.ts's
     `{ id: 'x', name: 'X', icon: '🐟', value: 4, category: 'resource' }`.

Re-run this whenever data/*.ts gains new items/enemies/etc. — it's cheap
and fully regenerates manifest.json from scratch (it does not hand-merge).
"""

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "src" / "data"
NAV_RAIL = REPO_ROOT / "src" / "ui" / "NavRail.tsx"
OUT_PATH = Path(__file__).resolve().parent / "manifest.json"

# One extra capture group per file, keyed by field name, pulled from the
# same object literal as id/name/icon (searched within ~400 chars after the
# icon match, which comfortably covers one object literal in this codebase).
EXTRA_FIELDS = {
    "category": re.compile(r"category:\s*'([^']*)'"),
    "slot": re.compile(r"slot:\s*'([^']*)'"),
    "description": re.compile(r"description:\s*'([^']*)'"),
}

# (relative path, kind, id field name, name field name, extra fields to pull)
SOURCES = [
    ("items/items.ts", "item", "id", "name", ["category", "slot"]),
    ("combat/enemies.ts", "enemy", "id", "name", []),
    ("combat/areas.ts", "area", "id", "name", []),
    ("combat/dungeons.ts", "dungeon", "id", "name", ["description"]),
    ("pets.ts", "pet", "id", "name", ["description"]),
    ("achievements.ts", "achievement", "id", "name", []),
    ("quests.ts", "quest", "id", "name", []),
    ("combat/spells.ts", "spell", "id", "name", []),
    ("combat/prayers.ts", "prayer", "id", "name", []),
]

# Every entry in this file is "id: 'x',\n    name: 'X',\n icon: '🎣'," for
# just the one Skill object per file — grab the first occurrence only.
SKILL_FILES = {
    "cooking.ts": "cooking",
    "fishing.ts": "fishing",
    "firemaking.ts": "firemaking",
    "hunting.ts": "hunting",
    "mining.ts": "mining",
    "runecrafting.ts": "runecrafting",
    "smithing.ts": "smithing",
    "woodcutting.ts": "woodcutting",
}

ICON_RE = re.compile(r"icon:\s*'([^']*)'")
ID_NAME_TEMPLATE = r"id:\s*'({id})'.{{0,400}}?name:\s*'([^']*)'.{{0,400}}?icon:\s*'([^']*)'"


def extract_generic(text: str, kind: str, extra_fields: list[str]) -> list[dict]:
    entries = []
    # id, then name, then icon, in that order, within 400 chars of each other
    # (multi-line) OR all on one line (items.ts) — the same pattern handles
    # both since `.` doesn't match newlines by default and DOTALL below lets
    # it span lines when needed.
    pattern = re.compile(
        r"id:\s*'([a-zA-Z0-9_]+)'[^{}]*?name:\s*'([^']*)'[^{}]*?icon:\s*'([^']*)'",
        re.DOTALL,
    )
    for m in pattern.finditer(text):
        entry_id, name, icon = m.group(1), m.group(2), m.group(3)
        block = text[m.start() : m.start() + 500]
        entry = {"id": entry_id, "name": name, "icon": icon, "kind": kind}
        for field in extra_fields:
            fm = EXTRA_FIELDS[field].search(block)
            if fm:
                entry[field] = fm.group(1)
        entries.append(entry)
    return entries


def extract_skill(text: str, skill_id: str) -> dict | None:
    m = re.search(
        r"id:\s*'([a-zA-Z0-9_]+)'[^{}]*?name:\s*'([^']*)'[^{}]*?icon:\s*'([^']*)'",
        text,
        re.DOTALL,
    )
    if not m:
        return None
    return {"id": m.group(1), "name": m.group(2), "icon": m.group(3), "kind": "skill"}


def extract_nav_tabs(text: str) -> list[dict]:
    # { view: 'combat', icon: '⚔️', label: 'Combat' },
    pattern = re.compile(r"view:\s*'([a-zA-Z]+)',\s*icon:\s*'([^']*)',\s*label:\s*'([^']*)'")
    entries = []
    for m in pattern.finditer(text):
        view, icon, label = m.group(1), m.group(2), m.group(3)
        entries.append({"id": view, "name": label, "icon": icon, "kind": "nav"})
    return entries


def main() -> None:
    manifest: list[dict] = []
    seen: set[tuple[str, str]] = set()

    def add(entry: dict) -> None:
        key = (entry["kind"], entry["id"])
        if key in seen:
            return
        seen.add(key)
        manifest.append(entry)

    for rel_path, kind, _id_field, _name_field, extra in SOURCES:
        path = DATA_DIR / rel_path
        text = path.read_text(encoding="utf-8")
        for entry in extract_generic(text, kind, extra):
            add(entry)

    for filename, skill_id in SKILL_FILES.items():
        path = DATA_DIR / "skills" / filename
        text = path.read_text(encoding="utf-8")
        entry = extract_skill(text, skill_id)
        if entry:
            add(entry)

    # combatSkillDisplay's four stats (attack/strength/defence/hitpoints) —
    # `label:`/`icon:` on one line, keyed by the record key rather than an
    # `id:` field.
    combat_skills_text = (DATA_DIR / "combat" / "combatSkills.ts").read_text(encoding="utf-8")
    for m in re.finditer(r"(\w+):\s*\{\s*label:\s*'([^']*)',\s*icon:\s*'([^']*)'", combat_skills_text):
        add({"id": m.group(1), "name": m.group(2), "icon": m.group(3), "kind": "combat_stat"})

    # Farming/Ranching + every other app-chrome tab (Bank, Shop, Codex, ...)
    # live only as NavRail's own EXTRA_TABS array, not in src/data/.
    nav_text = NAV_RAIL.read_text(encoding="utf-8")
    for entry in extract_nav_tabs(nav_text):
        add(entry)

    manifest.sort(key=lambda e: (e["kind"], e["id"]))
    OUT_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    by_kind: dict[str, int] = {}
    for e in manifest:
        by_kind[e["kind"]] = by_kind.get(e["kind"], 0) + 1
    print(f"Wrote {len(manifest)} entries to {OUT_PATH}")
    for kind, count in sorted(by_kind.items()):
        print(f"  {kind:14s} {count}")


if __name__ == "__main__":
    main()
