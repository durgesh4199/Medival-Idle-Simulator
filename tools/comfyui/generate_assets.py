#!/usr/bin/env python3
"""Batch-generate Medieval Idle Simulator's game art through a *local*
ComfyUI instance's HTTP API.

Run this ON THE MACHINE WHERE COMFYUI IS RUNNING — it talks to
http://127.0.0.1:8188 by default, which only resolves to your own ComfyUI
server, not anything remote.

Quick start
-----------
    pip install pillow
    python3 tools/comfyui/extract_manifest.py        # (re)build manifest.json
    python3 tools/comfyui/generate_assets.py --list-checkpoints
    python3 tools/comfyui/generate_assets.py --checkpoint <name.safetensors> --kinds item --limit 5 --dry-run
    python3 tools/comfyui/generate_assets.py --checkpoint <name.safetensors>

See tools/comfyui/README.md for the full walkthrough.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST_PATH = HERE / "manifest.json"
WORKFLOW_TEMPLATE_PATH = HERE / "workflow_template.json"
DEFAULT_OUT = HERE / "output"

ICON_STYLE_SUFFIX = (
    ", pixel art, 16-bit RPG item icon, crisp pixels, limited color palette, "
    "clean black outline, centered, plain flat background, no text, no watermark"
)
SCENE_STYLE_SUFFIX = (
    ", pixel art, 16-bit RPG background illustration, limited color palette, "
    "atmospheric lighting, no characters in frame, no UI, no text, no watermark"
)
NEGATIVE_PROMPT = (
    "photo, photorealistic, 3d render, blurry, low quality, jpeg artifacts, watermark, "
    "signature, text, letters, extra limbs, deformed, cropped, out of frame, "
    "multiple items, collage"
)

# One phrase per (kind, subkind) — subkind is `category` for items (falling
# back to `slot` for equipment), and unused (None) for everything else.
ITEM_PROMPTS: dict[str, str] = {
    "equipment:weapon": "{name}, fantasy medieval weapon",
    "equipment:helmet": "{name}, fantasy medieval helmet",
    "equipment:shield": "{name}, fantasy medieval shield",
    "equipment:boots": "{name}, fantasy medieval boots",
    "food": "{name}, appetizing fantasy food item",
    "resource": "{name}, fantasy game crafting resource",
}
KIND_PROMPTS: dict[str, str] = {
    "skill": "emblem icon representing the {name} skill, fantasy RPG skill badge",
    "enemy": "{name}, fantasy RPG monster, front-facing creature portrait",
    "pet": "{name}, cute small fantasy companion creature",
    "achievement": "trophy badge icon themed around \"{name}\", fantasy RPG achievement medal",
    "quest": "scroll icon themed around \"{name}\", fantasy RPG quest banner",
    "spell": "magical spell effect icon for \"{name}\", elemental magic burst",
    "prayer": "holy blessing icon for \"{name}\", glowing fantasy prayer symbol",
    "combat_stat": "icon representing the combat stat {name}",
    "nav": "icon representing \"{name}\" in a fantasy RPG's menu",
    "area": "wide fantasy landscape establishing shot of {name}, a combat zone",
    "dungeon": "wide fantasy dungeon interior establishing shot of {name}",
}

SCENE_KINDS = {"area", "dungeon"}
ICON_GEN_SIZE = (512, 512)
SCENE_GEN_SIZE = (768, 432)
ICON_FINAL_SIZE = 128  # square, nearest-neighbour pixelated down from ICON_GEN_SIZE
SCENE_FINAL_SIZE = (480, 270)


def build_prompt(entry: dict) -> str:
    name = entry["name"]
    kind = entry["kind"]
    if kind == "item":
        category = entry.get("category", "resource")
        key = category
        if category == "equipment":
            key = f"equipment:{entry.get('slot', 'weapon')}"
        subject = ITEM_PROMPTS.get(key, ITEM_PROMPTS["resource"]).format(name=name)
    else:
        template = KIND_PROMPTS.get(kind, "fantasy RPG icon for {name}")
        subject = template.format(name=name)
    suffix = SCENE_STYLE_SUFFIX if kind in SCENE_KINDS else ICON_STYLE_SUFFIX
    return subject + suffix


def stable_seed(entry: dict, seed_base: int) -> int:
    h = hashlib.sha256(f"{entry['kind']}:{entry['id']}".encode()).hexdigest()
    return (seed_base + int(h[:8], 16)) % (2**31 - 1)


def out_paths(entry: dict, out_dir: Path) -> tuple[Path, Path]:
    kind = entry["kind"]
    sub = "scenes" if kind in SCENE_KINDS else "icons"
    raw_dir = out_dir / "raw" / kind
    final_dir = out_dir / sub
    raw_dir.mkdir(parents=True, exist_ok=True)
    final_dir.mkdir(parents=True, exist_ok=True)
    return raw_dir / f"{entry['id']}.png", final_dir / f"{entry['id']}.png"


def http_json(url: str, data: dict | None = None) -> dict:
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def http_get_bytes(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=60) as resp:
        return resp.read()


def submit_and_wait(host: str, workflow: dict, timeout_s: float) -> dict:
    result = http_json(f"http://{host}/prompt", {"prompt": workflow})
    prompt_id = result.get("prompt_id")
    if not prompt_id:
        raise RuntimeError(f"ComfyUI did not return a prompt_id: {result}")

    deadline = time.time() + timeout_s
    while time.time() < deadline:
        history = http_json(f"http://{host}/history/{prompt_id}")
        entry = history.get(prompt_id)
        if entry and entry.get("outputs"):
            return entry
        time.sleep(1.5)
    raise TimeoutError(f"Timed out waiting for prompt {prompt_id} after {timeout_s:.0f}s")


def find_first_image(history_entry: dict) -> dict:
    for node_output in history_entry["outputs"].values():
        images = node_output.get("images")
        if images:
            return images[0]
    raise RuntimeError("ComfyUI history entry had no image outputs")


def pixelate_icon(raw_path: Path, final_path: Path, size: int) -> None:
    from PIL import Image

    img = Image.open(raw_path).convert("RGBA")
    # Downsample with a smooth filter to a small pixel grid, then quantize
    # the palette, then blow back up with nearest-neighbour so it renders
    # crisp at any UI size instead of blurry.
    small = img.resize((size // 4, size // 4), Image.LANCZOS)
    small = small.quantize(colors=48, method=Image.MEDIANCUT).convert("RGBA")
    final = small.resize((size, size), Image.NEAREST)
    final.save(final_path)


def downscale_scene(raw_path: Path, final_path: Path, target: tuple[int, int]) -> None:
    from PIL import Image

    img = Image.open(raw_path).convert("RGB")
    final = img.resize(target, Image.LANCZOS)
    final.save(final_path)


def load_workflow_template(checkpoint: str) -> dict:
    template = json.loads(WORKFLOW_TEMPLATE_PATH.read_text())
    template["4"]["inputs"]["ckpt_name"] = checkpoint
    return template


def make_workflow(template: dict, entry: dict, seed: int, steps: int, cfg: float) -> dict:
    workflow = json.loads(json.dumps(template))  # deep copy
    kind = entry["kind"]
    width, height = SCENE_GEN_SIZE if kind in SCENE_KINDS else ICON_GEN_SIZE
    workflow["5"]["inputs"]["width"] = width
    workflow["5"]["inputs"]["height"] = height
    workflow["6"]["inputs"]["text"] = build_prompt(entry)
    workflow["7"]["inputs"]["text"] = NEGATIVE_PROMPT
    workflow["3"]["inputs"]["seed"] = seed
    workflow["3"]["inputs"]["steps"] = steps
    workflow["3"]["inputs"]["cfg"] = cfg
    return workflow


def list_checkpoints(host: str) -> list[str]:
    info = http_json(f"http://{host}/object_info/CheckpointLoaderSimple")
    try:
        return info["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
    except (KeyError, IndexError):
        return []


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--host", default="127.0.0.1:8188", help="ComfyUI API host:port (default: %(default)s)")
    parser.add_argument("--checkpoint", help="Checkpoint filename as ComfyUI lists it, e.g. dreamshaper_8.safetensors")
    parser.add_argument("--list-checkpoints", action="store_true", help="Print checkpoints ComfyUI knows about, then exit")
    parser.add_argument("--kinds", nargs="+", help="Only generate these kinds (item, enemy, area, dungeon, pet, skill, achievement, quest, spell, prayer, combat_stat, nav)")
    parser.add_argument("--ids", nargs="+", help="Only generate these specific entry ids")
    parser.add_argument("--limit", type=int, help="Stop after this many generations")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output directory (default: %(default)s)")
    parser.add_argument("--seed-base", type=int, default=1000, help="Added to each entry's stable hash-derived seed")
    parser.add_argument("--steps", type=int, default=22)
    parser.add_argument("--cfg", type=float, default=6.5)
    parser.add_argument("--timeout", type=float, default=180.0, help="Seconds to wait per image before giving up")
    parser.add_argument("--force", action="store_true", help="Regenerate even if the final output file already exists")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts and exit without calling ComfyUI")
    args = parser.parse_args()

    if args.list_checkpoints:
        try:
            names = list_checkpoints(args.host)
        except (urllib.error.URLError, OSError) as e:
            print(f"Could not reach ComfyUI at {args.host}: {e}", file=sys.stderr)
            return 1
        if not names:
            print("ComfyUI returned no checkpoints — is one installed in models/checkpoints?")
        for n in names:
            print(n)
        return 0

    if not MANIFEST_PATH.exists():
        print(f"{MANIFEST_PATH} not found — run extract_manifest.py first.", file=sys.stderr)
        return 1
    manifest = json.loads(MANIFEST_PATH.read_text())

    if args.kinds:
        manifest = [e for e in manifest if e["kind"] in args.kinds]
    if args.ids:
        wanted = set(args.ids)
        manifest = [e for e in manifest if e["id"] in wanted]
    if args.limit:
        manifest = manifest[: args.limit]

    if not manifest:
        print("Nothing matched those filters.")
        return 0

    if args.dry_run:
        for entry in manifest:
            print(f"[{entry['kind']:12s}] {entry['id']:28s} seed={stable_seed(entry, args.seed_base):<12} {build_prompt(entry)}")
        return 0

    if not args.checkpoint:
        print("--checkpoint is required (see --list-checkpoints). Example: --checkpoint dreamshaper_8.safetensors", file=sys.stderr)
        return 1

    template = load_workflow_template(args.checkpoint)
    args.out.mkdir(parents=True, exist_ok=True)
    log_path = args.out / "generation_log.json"
    log = json.loads(log_path.read_text()) if log_path.exists() else {}

    generated, skipped, failed = 0, 0, 0
    for entry in manifest:
        key = f"{entry['kind']}:{entry['id']}"
        raw_path, final_path = out_paths(entry, args.out)
        if final_path.exists() and not args.force:
            skipped += 1
            continue

        seed = stable_seed(entry, args.seed_base)
        workflow = make_workflow(template, entry, seed, args.steps, args.cfg)
        print(f"Generating [{entry['kind']}] {entry['id']} (seed={seed})...")
        try:
            history_entry = submit_and_wait(args.host, workflow, args.timeout)
            image_ref = find_first_image(history_entry)
            url = (
                f"http://{args.host}/view?filename={urllib.parse.quote(image_ref['filename'])}"
                f"&subfolder={urllib.parse.quote(image_ref.get('subfolder', ''))}"
                f"&type={urllib.parse.quote(image_ref.get('type', 'output'))}"
            )
            raw_path.write_bytes(http_get_bytes(url))
            if entry["kind"] in SCENE_KINDS:
                downscale_scene(raw_path, final_path, SCENE_FINAL_SIZE)
            else:
                pixelate_icon(raw_path, final_path, ICON_FINAL_SIZE)
            log[key] = {
                "id": entry["id"],
                "kind": entry["kind"],
                "prompt": build_prompt(entry),
                "seed": seed,
                "checkpoint": args.checkpoint,
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            generated += 1
        except Exception as e:  # noqa: BLE001 - keep the batch going on one bad entry
            print(f"  FAILED: {e}", file=sys.stderr)
            failed += 1
        finally:
            log_path.write_text(json.dumps(log, indent=2) + "\n")

    print(f"\nDone. generated={generated} skipped(existing)={skipped} failed={failed}")
    print(f"Icons:  {args.out / 'icons'}")
    print(f"Scenes: {args.out / 'scenes'}")
    return 1 if failed and not generated else 0


if __name__ == "__main__":
    raise SystemExit(main())
