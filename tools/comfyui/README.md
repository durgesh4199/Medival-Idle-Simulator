# Art generation via local ComfyUI

Batch-generates pixel-art icons (items, skills, enemies, pets, spells,
prayers, achievements, quests, nav tabs) and background scenes (combat
areas, dungeons) for every emoji the game currently uses as a placeholder —
driven entirely by a **ComfyUI instance running on your own machine**.

This tooling only talks to `http://127.0.0.1:8188` (ComfyUI's default local
API port). It cannot run inside a hosted/remote Claude session — there's no
network path from a cloud sandbox to your desktop's GPU. Run both scripts
below on the same machine ComfyUI is running on.

## 1. Prerequisites

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) installed and
  runnable (`python main.py` from its folder starts the API on port 8188
  by default — no extra `--api` flag needed, the HTTP API is always on).
- At least one checkpoint in ComfyUI's `models/checkpoints/` folder. Any
  general SD1.5/SDXL checkpoint works; one with good flat-icon/pixel-art
  results (e.g. a pixel-art-flavored SD1.5 finetune) gives cleaner results
  than a photoreal checkpoint, but the post-processing step (below) works
  with anything.
- `pip install pillow` in whatever Python environment you'll run
  `generate_assets.py` from (that's the only third-party dependency —
  everything else is stdlib).

## 2. Build the manifest

```bash
python3 tools/comfyui/extract_manifest.py
```

Scans `src/data/*.ts` (plus `NavRail.tsx`'s hardcoded Farming/Ranching/Bank/
etc. tabs) and writes `tools/comfyui/manifest.json` — one entry per icon the
game renders today, tagged with `kind` (`item`, `enemy`, `area`, `dungeon`,
`pet`, `skill`, `achievement`, `quest`, `spell`, `prayer`, `combat_stat`,
`nav`) and, for items, `category`/`slot`. Re-run this any time `src/data`
gains new content — it fully regenerates the file from source, so don't
hand-edit `manifest.json`.

As of this writing that's **210 entries** (104 items, 27 achievements, 12
enemies, 11 pets, 11 quests, 11 nav tabs, 8 prayers, 8 skills, 6 spells, 4
areas, 4 dungeons, 4 combat stats).

## 3. Check your checkpoint name

```bash
python3 tools/comfyui/generate_assets.py --list-checkpoints
```

Prints exactly what ComfyUI will accept for `--checkpoint` (the filename as
it appears under `models/checkpoints/`).

## 4. Dry-run the prompts

```bash
python3 tools/comfyui/generate_assets.py --dry-run --kinds item --limit 10
```

Prints the exact prompt + seed for each entry without calling ComfyUI at
all — useful for sanity-checking the wording before spending GPU time.
Prompts are built from a per-kind template (e.g. items get "{name}, fantasy
medieval weapon/helmet/shield/boots" for equipment, "{name}, fantasy game
crafting resource" for raw materials) plus a shared pixel-art style suffix
and a shared negative prompt — see `generate_assets.py`'s `ITEM_PROMPTS`/
`KIND_PROMPTS` if you want to change the wording for a whole category.

## 5. Generate

```bash
python3 tools/comfyui/generate_assets.py --checkpoint your_checkpoint.safetensors
```

For each manifest entry this submits a standard txt2img graph (see
`workflow_template.json`: CheckpointLoader → positive/negative
CLIPTextEncode → EmptyLatentImage → KSampler → VAEDecode → SaveImage) to
ComfyUI's `/prompt` endpoint, polls `/history/<id>` until the image is
ready, downloads it via `/view`, then post-processes it locally with
Pillow:

- **Icons** (everything except areas/dungeons): generated at 512×512,
  downsampled to a small pixel grid, palette-quantized to ~48 colors, then
  scaled back up with nearest-neighbour — the standard "diffusion output
  into crisp pixel art" trick, since a raw 512×512 SD image isn't actually
  aligned to a pixel grid on its own. Final files are 128×128 PNGs in
  `tools/comfyui/output/icons/<id>.png`.
- **Scenes** (`area`/`dungeon`): generated at 768×432, downscaled to
  480×270 with a smooth filter (no pixelation — these are backgrounds, not
  icons). Final files land in `tools/comfyui/output/scenes/<id>.png`.

Useful flags:

- `--kinds item enemy` — only generate specific kinds.
- `--ids iron_sword goblin` — only specific entries (handy for retrying
  a single bad result).
- `--limit N` — generate at most N images this run.
- `--force` — regenerate even if the final file already exists (by
  default, already-generated files are skipped, so a batch run is safe to
  stop and resume).
- `--seed-base` — every entry gets a seed deterministically derived from
  its `kind:id`, offset by this number, so re-running with the same
  `--seed-base` reproduces the same images; change it to get a different
  variation of the whole batch.
- `--steps` / `--cfg` — KSampler overrides if the defaults (22 steps, cfg
  6.5, dpmpp_2m/karras) don't suit your checkpoint.

Every successful generation is recorded in
`tools/comfyui/output/generation_log.json` (prompt, seed, checkpoint,
timestamp used) so results are reproducible and reviewable later.

The raw (pre-post-processing) image for every generation is also kept
under `tools/comfyui/output/raw/<kind>/<id>.png`, in case you want to
re-run the pixelation step with different settings without regenerating
from ComfyUI.

## What this does *not* do (yet)

This only produces image files — it does not wire them into the game's UI.
The game currently renders every icon as an emoji string (`icon: '🌾'`
fields throughout `src/data/*.ts`), and swapping those for `<img>`/
background-image references touching every place an icon renders is a
separate follow-up task, worth doing once you're happy with a generated
set and want to commit to it as the game's actual art.

`tools/comfyui/output/` is gitignored — treat it as a local scratch/output
folder, not a build artifact to commit. If you decide to adopt a generated
set as real game assets, move (not commit-from-place) the files you want
into wherever the UI integration ends up loading them from (e.g.
`src/assets/`).
