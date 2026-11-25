// Kitchen logic: stations, what E does at each one, cooking timers, chopping.
// Items are strings "kind:form" — raw pantry goods must be prepped before they
// count in a recipe: tomato:raw -> tomato:chopped, patty:raw -> patty:grilled,
// pasta:raw -> pasta:boiled. Pantry goods with no prep are ready as-is.

import {
  CHOP_SECONDS, GRILL_SECONDS, GRILL_BURN_AFTER, BOIL_SECONDS, BOIL_BURN_AFTER,
  INGREDIENTS, MAX_HANDS, MAX_PLATE_ITEMS, STATION_DEFS, pantrySlots,
  INTERACT_RANGE,
} from './config.js';
import { addFloater, showToast, findServableOrder, serveOrder, plateMatchesOrder } from './state.js';
import { sfx } from './audio.js';

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function stationCenter(st) {
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

export function itemKind(item) { return item.split(':')[0]; }
export function itemForm(item) { return item.split(':')[1]; }

export function itemLabel(item) {
  const [kind, form] = item.split(':');
  const def = INGREDIENTS[kind];
  if (form === 'raw') return def.name + ' (raw)';
  if (form === 'chopped') return 'Chopped ' + def.name;
  if (form === 'grilled') return 'Grilled ' + def.name;
  if (form === 'boiled') return 'Boiled ' + def.name;
  return def.name;
}

// The station the chef stands closest to, if any is in reach.
export function nearestStation(state) {
  let best = null;
  let bestD = Infinity;
  for (const st of STATION_DEFS) {
    const c = stationCenter(st);
    const d = dist(state.chef.x, state.chef.y, c.x, c.y + 30);
    if (d < bestD) { bestD = d; best = st; }
  }
  // Pantry bins are stations too (they sit along the bottom wall).
  for (const slot of pantrySlots()) {
    const d = dist(state.chef.x, state.chef.y, slot.x + slot.w / 2, slot.y);
    if (d < bestD) {
      bestD = d;
      best = { id: 'pantry', kind: slot.kind, label: INGREDIENTS[slot.kind].name, x: slot.x, y: slot.y, w: slot.w, h: slot.h };
    }
  }
  return bestD <= INTERACT_RANGE + 40 ? best : null;
}

function handsFull(state) {
  return state.hands.length >= MAX_HANDS;
}

function takeInHand(state, item) {
  if (handsFull(state)) { showToast(state, 'Hands full! Serve or trash something first (Q drops).'); sfx.wrong(); return false; }
  state.hands.push(item);
  sfx.pickup();
  return true;
}

function dropHeld(state) {
  const item = state.hands.pop();
  if (!item) return;
  addFloater(state, state.chef.x, state.chef.y - 40, itemLabel(item) + ' dropped', '#cccccc');
  sfx.drop();
}

// Press E (or click) at the nearest station.
export function interact(state) {
  const st = nearestStation(state);
  if (!st) { showToast(state, 'Walk up to a station, then press E.'); return; }
  if (st.id === 'pantry') {
    const def = INGREDIENTS[st.kind];
    const form = def.prep === 'none' ? 'ready' : 'raw';
    takeInHand(state, st.kind + ':' + form);
    return;
  }
  if (st.id === 'trash') {
    if (state.hands.length) { dropHeld(state); return; }
    if (state.plate.length) { state.plate = []; showToast(state, 'Plate cleared.'); sfx.drop(); return; }
    showToast(state, 'Nothing to throw away.');
    return;
  }
  if (st.id === 'board') {
    if (state.chopping) { showToast(state, 'Still chopping…'); return; }
    const idx = state.hands.findIndex((it) => INGREDIENTS[itemKind(it)].prep === 'chop' && itemForm(it) === 'raw');
    if (idx < 0) { showToast(state, 'Bring a raw tomato, lettuce or mushroom to chop.'); sfx.wrong(); return; }
    const kind = itemKind(state.hands.splice(idx, 1)[0]);
    state.chopping = { kind, t: 0 };
    sfx.chop();
    return;
  }
  if (st.id === 'grill') {
    if (state.grill) {
      const g = state.grill;
      state.grill = null;
      if (g.burnt) { showToast(state, 'Burnt! Into the trash it goes.'); sfx.burn(); return; }
      if (g.t >= GRILL_SECONDS) { takeInHand(state, 'patty:grilled'); return; }
      state.grill = g; // too early: put it back on the grill
      showToast(state, 'Still raw — let it sizzle a little longer.');
      return;
    }
    const idx = state.hands.indexOf('patty:raw');
    if (idx < 0) { showToast(state, 'Bring a raw patty from the pantry.'); sfx.wrong(); return; }
    state.hands.splice(idx, 1);
    state.grill = { kind: 'patty', t: 0, burnt: false };
    sfx.sizzle();
    return;
  }
  if (st.id === 'pot') {
    if (state.pot) {
      const p = state.pot;
      state.pot = null;
      if (p.burnt) { showToast(state, 'Mushy! Into the trash it goes.'); sfx.burn(); return; }
      if (p.t >= BOIL_SECONDS) { takeInHand(state, 'pasta:boiled'); return; }
      state.pot = p;
      showToast(state, 'Still hard — let it boil a little longer.');
      return;
    }
    const idx = state.hands.indexOf('pasta:raw');
    if (idx < 0) { showToast(state, 'Bring dry pasta from the pantry.'); sfx.wrong(); return; }
    state.hands.splice(idx, 1);
    state.pot = { kind: 'pasta', t: 0, burnt: false };
    sfx.plop();
    return;
  }
  if (st.id === 'plate') {
    if (state.hands.length === 0) { showToast(state, 'Pick up an ingredient first, then add it to the plate.'); return; }
    if (state.plate.length >= MAX_PLATE_ITEMS) { showToast(state, 'Plate is full — serve it!'); sfx.wrong(); return; }
    const item = state.hands.shift();
    state.plate.push(item);
    sfx.plop();
    if (findServableOrder(state)) sfx.ready();
    return;
  }
  if (st.id === 'serve') {
    const order = findServableOrder(state);
    if (!order) {
      if (state.plate.length === 0) showToast(state, 'The plate is empty — build a dish first.');
      else showToast(state, 'No order wants this plate. Check the tickets!');
      sfx.wrong();
      return;
    }
    const result = serveOrder(state, order);
    const c = stationCenter(st);
    addFloater(state, c.x, c.y - 20, '+' + result.earned + ' coins', '#ffd94d');
    if (result.tip > 0) addFloater(state, c.x, c.y - 48, 'tip +' + result.tip, '#9fe870');
    sfx.serve();
    return;
  }
}

// Hold-to-chop progress and cooking timers, called every frame while playing.
export function updateKitchen(state, dt) {
  if (state.chopping) {
    state.chopping.t += dt;
    if (state.chopping.t >= CHOP_SECONDS) {
      const kind = state.chopping.kind;
      state.chopping = null;
      takeInHand(state, kind + ':chopped');
      sfx.chopDone();
    }
  }
  if (state.grill) {
    state.grill.t += dt;
    if (state.grill.t >= GRILL_BURN_AFTER && !state.grill.burnt) {
      state.grill.burnt = true;
      sfx.burn();
      showToast(state, 'The patty burnt! Grab it off the grill.');
    }
  }
  if (state.pot) {
    state.pot.t += dt;
    if (state.pot.t >= BOIL_BURN_AFTER && !state.pot.burnt) {
      state.pot.burnt = true;
      sfx.burn();
      showToast(state, 'The pasta went mushy! Grab it out of the pot.');
    }
  }
}

// Drop the item the chef is holding (Q key).
export function dropItem(state) {
  dropHeld(state);
}
