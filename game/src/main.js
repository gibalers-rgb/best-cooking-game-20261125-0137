// The Copper Ladle — Sizzle & Serve. Game loop + wiring.
// Own code, written for this bounty: state in state.js, kitchen rules in
// kitchen.js, drawing in render.js, input in input.js, sounds in audio.js.

import { VIEW_W, VIEW_H, DAY_SECONDS } from './config.js';
import {
  createState, updateOrders, updateFloaters, dayProgress, timeLeft, starCount,
} from './state.js';
import { interact, updateKitchen, dropItem, nearestStation } from './kitchen.js';
import { render } from './render.js';
import { createInput, moveChef } from './input.js';
import { sfx, toggleMute, isMuted } from './audio.js';
import { stagedState } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
let state = shot ? (stagedState(shot) || createState()) : createState();

function startDay() {
  state = createState();
  state.screen = 'play';
  sfx.click();
}

function endDay() {
  state.screen = 'end';
  state.endStats = {
    coins: state.coins,
    served: state.served,
    failed: state.failed,
    bestCombo: state.bestCombo,
  };
  sfx.dayEnd();
}

function onKey(key) {
  if (key === 'm') { toggleMute(); return; }
  if (state.screen === 'title') {
    if (key === 'enter' || key === ' ') startDay();
    return;
  }
  if (state.screen === 'end') {
    if (key === 'r' || key === 'enter') startDay();
    return;
  }
  if (key === 'e' || key === ' ') interact(state);
  if (key === 'q') dropItem(state);
  if (key === 'r') startDay();
}

function onClick(x, y) {
  if (state.screen === 'title') { startDay(); return; }
  if (state.screen === 'end') { startDay(); return; }
  // Click near the chef's station: use it at once. Otherwise walk there.
  const near = nearestStation(state);
  if (near && x >= near.x - 10 && x <= near.x + near.w + 10 && y >= near.y - 10 && y <= near.y + near.h + 10) {
    interact(state);
    return;
  }
  state.chef.tx = Math.min(VIEW_W - 30, Math.max(30, x));
  state.chef.ty = Math.min(612, Math.max(200, y));
}

const input = createInput(canvas, { onKey, onClick });

let last = performance.now();
let titleShown = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.screen === 'play' && !shot) {
    state.time += dt;
    if (!state.rush && timeLeft(state) <= 30) {
      state.rush = true;
      sfx.tick();
    }
    const sec = Math.floor(state.time);
    if (sec !== state.lastTickSecond) {
      state.lastTickSecond = sec;
      if (state.rush && sec % 5 === 0) sfx.tick();
    }
    const spawned = updateOrders(state, dt);
    if (spawned && spawned.id !== undefined && !spawned.expired) sfx.order();
    if (spawned && spawned.expired) {
      sfx.wrong();
    }
    updateKitchen(state, dt);
    moveChef(state, input, dt);
    updateFloaters(state, dt);
    if (state.time >= DAY_SECONDS) endDay();
  } else if (state.screen === 'play' && shot) {
    // Staged screenshots stay frozen so the shot is stable.
    updateFloaters(state, dt);
  }

  render(ctx, state, now / 1000);
  if (!titleShown) { titleShown = true; }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
