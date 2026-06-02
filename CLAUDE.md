# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KIPPO — *Die Chronik von Kipshoven*: a browser-based pixel-art remake of the 1995
DOS economic-simulation game *KIPPO 1.0* (by Benjamin Wirtz, the repo owner). A
turn-based medieval economy sim set on the Mühlenbach in the Herzogtum Jülich.
All UI text and code comments are in **German** — match that when editing.

## Running

No build step, no dependencies, no package manager. Pure HTML/CSS/vanilla JS.
Open `index.html` directly, or serve statically (preferred, for relative paths):

```sh
python3 -m http.server 8123   # then open http://localhost:8123
```

There are no tests, linter, or CI.

## Architecture

Three source files, loaded by `index.html` in order (`scene.js` before `game.js`):

- **`game.js`** — all game logic. A single global mutable state object `S`
  (created by `newGame()`) is the source of truth. Data-driven design: the
  `CROPS`, `BUILDINGS`, `RANKS`, and `EVENTS` constants at the top define all
  game content; logic functions iterate over them. No framework — DOM is updated
  imperatively via the `$(id)` helper and a central `refresh()` that re-reads `S`
  and repaints every element + the canvas.
- **`scene.js`** — a from-scratch pixel-art canvas renderer (`drawScene`,
  `drawBuilding`, `drawTitle`, `drawGrave`, etc.). Draws at a small internal
  resolution and is CSS-upscaled with `image-rendering: pixelated`. The `PAL`
  palette object holds every color. The main building drawn switches on
  `S.rankIndex` (0–5). It reads `S` but never mutates it.
- **`style.css`** — retro C64/NES look, CRT scanlines, Press-Start-2P web font.

`index.html` defines all DOM ids that `game.js` reads/writes — if you add a stat
or input, wire up the matching id in both files.

### Key game-loop concepts

- **Immediate actions** (`doLand`, `doPlant`, `doBuild`, `doCow`, `upgradeRank`)
  apply to `S` instantly and call `refresh()`. They read inputs via `intval(id)`.
- **`endTurn()`** is the yearly resolution: roll an event → harvest (crop income
  + mill processing bonuses) → sawmill/wood → mill tolls → cattle → rank rents →
  subtract tithe (Zehnt) → bankruptcy check (`forcedSell`, then `loseGame`) →
  age/year increment and `succession()` on death → new prices.
- **Per-year event modifiers** are stashed as `S._`-prefixed fields (`_tithe`,
  `_flaxBoom`, `_millDmg`) reset at the top of `endTurn()` and read during
  resolution. Events in `EVENTS` mutate these or `S` directly in their `run(s)`.
- **Win**: stiften the Heiligkreuzkapelle (top rank, year ≥ 1492) → `winGame()`.
  **Lose**: bankrupt with no land left → `loseGame()`. Generations turn over via
  `succession()` when the lord reaches `deathAge`.
- Mills on the Mühlenbach are capped at 3 total (`streamSlots`: korn + oel).

The flax production chain (Flachs → Ölmühle/Leinöl + Webstube/Leinentuch) is the
intended high-value strategy; see README for the balance intent.

## Reference material

- `docs/REVERSE-ENGINEERING.md` — full spec reconstructed from the original DOS
  game, including original screen texts, crop yield tables, and design notes.
  Consult this before changing game balance or adding period-authentic content.
- `legacy/` — the original 1995 DOS binaries (QuickBasic EXEs, PCX images, BAT
  files). Read-only historical artifacts; not part of the running game.
- The remake intentionally diverges from the original (e.g. crops are
  Roggen/Weizen/Gerste/Hafer/Flachs here vs. Mais/Kartoffeln/Gerste/Weizen in
  the DOS version) and grounds names/places in the real history of Kipshoven.
