# Cage Legacy — MMA Universe Simulator

A long-term MMA simulation game focused on **emergent history**, **rivalries**, and **legendary careers**. You sim events and watch a fictional universe of fighters rise and fall over decades.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Lucide React** for icons (MIT, SVG, color-reactive)
- Google Fonts: Oswald (display), Barlow Condensed (stats), Inter (body)
- LocalStorage for persistence (no backend)
- GitHub Pages deploy via Actions

## Quick start

```bash
npm install
npm run dev
# → http://localhost:5173/cage-legacy/
```

## Deploy to GitHub Pages

1. Create a GitHub repo named **`cage-legacy`** (name must match `base` in `vite.config.ts`)
2. Push to `main`
3. Repo Settings → Pages → Source: **GitHub Actions**
4. Live at `https://<your-username>.github.io/cage-legacy/`

If you fork with a different repo name, update `base` in `vite.config.ts` to match.

## Architecture — engine vs UX separation

The codebase is split into two layers so you can rebalance mechanics without disturbing the UI and vice versa:

```
src/
├── sim/        ── ENGINE (pure TypeScript, no React, no DOM)
├── types/      ── SHARED CONTRACTS (the API between layers)
├── data/       ── STATIC DATA (names, archetypes, divisions, matchups)
├── state/      ── React hook bridging engine to React
├── components/ ── UI LAYER (React components)
├── styles/     ── DESIGN TOKENS + global CSS
└── icons/      ── ICON REGISTRY (one place to swap libraries)
```

### Engine layer (`src/sim/`)
Pure functions. Knows nothing about React.
- `random.ts` — RNG utilities
- `fighter.ts` — generation, aging, lifecycle, HOF evaluation
- `fight.ts` — fight simulation, power calc, finish check
- `rankings.ts` — per-division rankings, matchmaking, championship handling
- `event.ts` — event orchestration

If you want to rebalance — change finish rates, age curves, archetype matchup matrix, etc. — work happens **only in `sim/` and `data/`**. UI does not need to be touched.

### UX layer (`src/components/`, `src/styles/`, `src/icons/`)
Reads state through `useGameState` and renders. Imports from `sim/` are limited to *view-helper functions* (`fullName`, `recordStr`) and types — not raw engine internals.

**To retheme without changing components**, edit `src/styles/tokens.css`. All colors, fonts, gradients, and timings are CSS variables.

**To swap icon library**, edit `src/icons/index.tsx` only. Components import semantic icon names (`<Icon name="champion" />`), not library specifics.

## Design system

EA UFC-inspired aesthetic:
- Deep navy background with subtle gold/red atmospheric gradients
- Oswald + Barlow Condensed display type (broadcast sport feel)
- Gold (`#d4af37`) as the primary accent, red for danger, cyan for active
- Octagon clip-paths for champion portraits and brand mark
- Stat numbers in large condensed type
- Hover states use color + subtle transform, never layout shifts
- Division-coded color stripes on every fight row

## Keyboard shortcuts

- **Space** — simulate next event
- **Esc** — close fighter profile modal

## Features (v0.2)

- 4 divisions: Lightweight, Welterweight, Light Heavyweight, Heavyweight
- Per-division aging curves & finish rates
- Per-division champions, rankings, title lineage, records
- 5 archetypes with rock-paper-scissors matchups
- Rarity system (Common → Legendary) drives stat ceilings
- Fighter aging, retirement, automatic roster replenishment
- Hall of Fame auto-induction
- Story-of-the-night headlines per event

## Phase 2 roadmap

- Rivalry system (shared records, hype trilogy fights)
- Detailed rivalry tab on profile ("Silva leads 2-1")
- Event archive UI
- More random events (injuries, hype boosts, title strips)
- Meta-evolution — archetype dominance shifts over decades
- Animated stat reveals
- Optional: split the engine into a web worker

## Notes on rebalancing

- All engine constants (rarity weights, archetype weights, division aging windows, finish multipliers) are in `src/data/index.ts`
- The matchup matrix (rock-paper-scissors style) is at the bottom of `data/index.ts`
- Finish rate formula and "off night" probability are in `src/sim/fight.ts`
- Save key is `cage_legacy_save_v2` — bump in `state/useGameState.ts` if you make breaking state shape changes

## License

MIT
