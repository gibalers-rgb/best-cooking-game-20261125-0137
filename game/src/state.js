// Game state: the chef, orders, plates, coins and the day clock.
// Pure data + rules; rendering lives in render.js, station logic in kitchen.js.

import {
  DAY_SECONDS, MAX_ORDERS, ORDER_PATIENCE, ORDER_FIRST_AT,
  ORDER_SPAWN_EARLY, ORDER_SPAWN_LATE, RECIPES,
} from './config.js';

let orderSeq = 0;

export function makeOrder(dayProgress) {
  const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  const patience = ORDER_PATIENCE - Math.floor(dayProgress * 10);
  orderSeq += 1;
  return {
    id: orderSeq,
    recipeId: recipe.id,
    patience,
    patienceMax: patience,
    bornAt: 0,
    flash: 0,
  };
}

export function createState() {
  return {
    screen: 'title', // title | play | end
    time: 0,         // seconds since day started
    coins: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    nextOrderIn: ORDER_FIRST_AT,
    chef: { x: 640, y: 470, tx: null, ty: null, dir: 1, moving: false, bob: 0 },
    hands: [],       // finished ingredient keys the chef carries, max 3
    plate: [],       // finished ingredient keys on the plating counter
    grill: null,     // { kind:'patty', t: seconds cooking } or null
    pot: null,       // { kind:'pasta', t: seconds boiling } or null
    chopping: null,  // { kind, t } while a chop is in progress
    floaters: [],    // { x, y, text, color, t, life }
    toast: null,     // { text, t } short hint line
    rush: false,     // last 30 seconds of the day
    endStats: null,  // filled when the day ends
    lastTickSecond: -1,
  };
}

export function dayProgress(state) {
  return Math.min(1, state.time / DAY_SECONDS);
}

export function timeLeft(state) {
  return Math.max(0, DAY_SECONDS - state.time);
}

export function spawnInterval(state) {
  const p = dayProgress(state);
  return ORDER_SPAWN_EARLY + (ORDER_SPAWN_LATE - ORDER_SPAWN_EARLY) * p;
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, t: 0, life: 1.4 });
  if (state.floaters.length > 12) state.floaters.shift();
}

export function showToast(state, text) {
  state.toast = { text, t: 0 };
}

export function plateMatchesOrder(plate, recipeId) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return false;
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort().join('|');
  const want = [...recipe.needs].sort().join('|');
  return have === want;
}

export function findServableOrder(state) {
  return state.orders.find((o) => plateMatchesOrder(state.plate, o.recipeId));
}

export function serveOrder(state, order) {
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  const patienceFrac = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(recipe.price * 0.6 * patienceFrac);
  const comboBonus = Math.min(state.combo, 5) * 2;
  const earned = recipe.price + tip + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.plate = [];
  return { earned, tip, comboBonus, recipe };
}

export function expireOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.failed += 1;
  state.combo = 0;
}

export function starCount(state) {
  if (state.coins >= 320) return 3;
  if (state.coins >= 200) return 2;
  if (state.coins >= 100) return 1;
  return 0;
}

export function updateOrders(state, dt) {
  // Spawn new orders while the day runs and there is room on the board.
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && state.orders.length < MAX_ORDERS) {
    const order = makeOrder(dayProgress(state));
    order.bornAt = state.time;
    state.orders.push(order);
    state.nextOrderIn = spawnInterval(state);
    return order;
  }
  // Drain patience; an order with no patience left walks out angry.
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.flash > 0) order.flash -= dt;
    if (order.patience <= 0) {
      expireOrder(state, order);
      return { expired: order };
    }
  }
  return null;
}

export function updateFloaters(state, dt) {
  for (const f of state.floaters) f.t += dt;
  state.floaters = state.floaters.filter((f) => f.t < f.life);
  if (state.toast) {
    state.toast.t += dt;
    if (state.toast.t > 3) state.toast = null;
  }
}
