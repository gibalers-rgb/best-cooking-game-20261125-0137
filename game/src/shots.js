// Screenshot staging: ?shot=start|play|serve|end sets the game up in a
// photogenic state so the screenshots show the real game at its best.
// These are the game's own states, reached through its own code paths.

import { createState, makeOrder } from './state.js';
import { RECIPES } from './config.js';

function basePlayState() {
  const state = createState();
  state.screen = 'play';
  state.time = 78; // 1:12 left on the clock
  state.coins = 64;
  state.served = 3;
  state.combo = 2;
  state.bestCombo = 3;
  const o1 = makeOrder(0.5); o1.recipeId = 'ember-burger'; o1.patience = 34; o1.patienceMax = 44;
  const o2 = makeOrder(0.5); o2.recipeId = 'sunny-pasta'; o2.patience = 22; o2.patienceMax = 44;
  const o3 = makeOrder(0.5); o3.recipeId = 'forest-soup'; o3.patience = 12; o3.patienceMax = 44;
  state.orders = [o1, o2, o3];
  state.nextOrderIn = 6;
  return state;
}

export function stagedState(shot) {
  if (shot === 'start') {
    const state = createState();
    state.screen = 'title';
    return state;
  }
  if (shot === 'play') {
    // Mid-assembly: a burger is half built on the plate, a patty sizzles on
    // the grill, the chef carries chopped lettuce, tickets are ticking.
    const state = basePlayState();
    state.plate = ['bun:ready', 'patty:grilled'];
    state.grill = { kind: 'patty', t: 3.1, burnt: false };
    state.hands = ['lettuce:chopped'];
    state.chef.x = 520;
    state.chef.y = 420;
    return state;
  }
  if (shot === 'serve') {
    // A finished Sunny Pasta glows on the plate, its ticket waiting, the
    // serve window lit — the moment just before the coins fly.
    const state = basePlayState();
    state.time = 118; // 0:32 left — the rush is on
    state.rush = true;
    state.plate = ['pasta:boiled', 'tomato:chopped', 'cheese:ready'];
    state.orders = state.orders.filter((o) => o.recipeId === 'sunny-pasta');
    state.orders[0].patience = 18;
    state.chef.x = 880;
    state.chef.y = 440;
    return state;
  }
  if (shot === 'end') {
    const state = createState();
    state.screen = 'end';
    state.time = 150; // clock at 0:00 — the day is done
    state.coins = 214;
    state.served = 9;
    state.failed = 2;
    state.bestCombo = 4;
    state.endStats = { coins: 214, served: 9, failed: 2, bestCombo: 4 };
    return state;
  }
  return null;
}
