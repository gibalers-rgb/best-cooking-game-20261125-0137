# The Copper Ladle — Sizzle & Serve

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/gibalers-rgb/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/gibalers-rgb/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game built for the make.fun bounty **Make the best cooking game**. You are the only chef in a small warm kitchen: tickets come in on the order board, and you run the whole service — grab ingredients from the pantry, chop them on the board, sizzle patties on the grill, boil pasta in the pot, build each dish on the plate, and serve it at the window before the ticket's patience runs out.

## How to play

- **WASD / arrows** — run around the kitchen (or click a station to walk to it)
- **E / Space** — grab, chop, cook, plate, serve
- **Q** — drop what you are holding
- **R** — restart the day · **M** — mute

## The menu

| Dish | Needs | Price |
| --- | --- | --- |
| Ember Burger | bun + grilled patty + cheese + chopped lettuce | 26c |
| Sunny Pasta | boiled pasta + chopped tomato + cheese | 22c |
| Forest Soup | broth + chopped mushroom + chopped tomato | 20c |
| Garden Salad | chopped lettuce + chopped tomato + cheese | 16c |

Raw ingredients must be prepped first: chop tomato, lettuce and mushroom on the board, grill the patty (don't let it burn), boil the pasta (don't let it go mushy). Tips shrink as a ticket's patience drains, and serving several dishes in a row builds a combo bonus. A day lasts 2½ minutes — orders arrive faster as the rush builds.

## Play it

Serve `game/` with any static HTTP server and open `game/index.html` in desktop Chrome. It plays fully offline: all art is drawn in code, all sounds are synthesized with WebAudio, no network requests.

```
cd game && python3 -m http.server 8080
# open http://localhost:8080/index.html
```

## Layout

- `game/index.html` — the page (canvas 1280×720)
- `game/src/config.js` — constants, ingredients, recipes
- `game/src/state.js` — game state, orders, scoring
- `game/src/kitchen.js` — stations, interactions, cooking timers
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesized sound effects
- `game/src/shots.js` — `?shot=` staging for screenshots
- `game/src/main.js` — game loop + wiring
- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes `dossier.json`)
- `screenshots/` — real renders of the game in a browser
