// All canvas drawing: the kitchen, the chef, the food, the order board and HUD.
// Everything is drawn from code — no image files, no fonts from the network.

import {
  VIEW_W, VIEW_H, DAY_SECONDS, INGREDIENTS, RECIPES, STATION_DEFS,
  pantrySlots, CHOP_SECONDS, GRILL_SECONDS, GRILL_BURN_AFTER,
  BOIL_SECONDS, BOIL_BURN_AFTER,
} from './config.js';
import { timeLeft, dayProgress, findServableOrder, starCount } from './state.js';
import { nearestStation, itemKind, itemForm, itemLabel } from './kitchen.js';

const FONT = "'Trebuchet MS', 'Segoe UI', sans-serif";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = weight + ' ' + size + 'px ' + FONT;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---- food icons -----------------------------------------------------------

export function drawIngredient(ctx, item, x, y, r) {
  const kind = itemKind(item);
  const form = itemForm(item);
  const def = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (form === 'chopped') {
    // Three little cut pieces.
    for (let i = 0; i < 3; i++) {
      const a = -0.5 + i * 0.55;
      ctx.save();
      ctx.translate(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.4);
      ctx.rotate(a);
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.55, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.35, r * 0.25, r * 0.12, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'tomato') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r * 0.35, -r * 0.55); ctx.lineTo(r * 0.35, -r * 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'lettuce') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = def.dark; ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0.3, Math.PI * 1.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 2.2, Math.PI * 0.9 + 2.2); ctx.stroke();
  } else if (kind === 'mushroom') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff8ec';
    ctx.fillRect(-r * 0.35, -r * 0.25, r * 0.7, r * 0.9);
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.6, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.75, r * 0.14, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.moveTo(-r, r * 0.6); ctx.lineTo(r, r * 0.6); ctx.lineTo(r, -r * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.25, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.35, r * 0.05, r * 0.13, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'patty') {
    ctx.fillStyle = form === 'grilled' ? '#6b4426' : def.color;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    if (form === 'grilled') {
      ctx.strokeStyle = '#3d2412'; ctx.lineWidth = r * 0.12;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * r * 0.5 - r * 0.2, -r * 0.4); ctx.lineTo(i * r * 0.5 + r * 0.2, r * 0.4); ctx.stroke();
      }
    }
    if (form === 'raw') { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.4, r * 0.18, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (kind === 'bun') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7e3b0';
    ctx.fillRect(-r * 0.95, -r * 0.15, r * 1.9, r * 0.35);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.6, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.75, r * 0.1, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'pasta') {
    ctx.strokeStyle = form === 'boiled' ? '#e8b64c' : def.color;
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.5 + i * r * 0.5);
      ctx.quadraticCurveTo(0, -r * 0.9 + i * r * 0.5, r * 0.8, -r * 0.5 + i * r * 0.5);
      ctx.stroke();
    }
  } else if (kind === 'broth') {
    ctx.fillStyle = '#d97b2f';
    ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.9, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.9, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.7); ctx.quadraticCurveTo(-r * 0.5, -r * 1.2, -r * 0.2, -r * 1.3); ctx.stroke();
  }
  ctx.restore();
}

// ---- the kitchen ---------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = '#b98a5e';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Checker tiles.
  for (let y = 110; y < VIEW_H; y += 52) {
    for (let x = 0; x < VIEW_W; x += 52) {
      const odd = ((x / 52) + (y / 52)) % 2 === 0;
      ctx.fillStyle = odd ? '#c99a6b' : '#bd8f60';
      ctx.fillRect(x, y, 52, 52);
    }
  }
  // Top wall.
  ctx.fillStyle = '#8a5a3b';
  ctx.fillRect(0, 0, VIEW_W, 110);
  ctx.fillStyle = '#f3e2c7';
  ctx.fillRect(0, 104, VIEW_W, 6);
  // Wall tiles + hanging pans.
  ctx.fillStyle = '#a06a45';
  for (let x = 20; x < VIEW_W; x += 90) ctx.fillRect(x, 18, 62, 62);
  ctx.fillStyle = '#5d5d5d';
  for (const [px, py] of [[330, 30], [560, 30], [790, 30]]) {
    ctx.beginPath(); ctx.arc(px, py + 22, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(px - 3, py - 12, 6, 16);
  }
}

function drawStation(ctx, st, state, now) {
  const near = nearestStation(state) === st;
  const servable = st.id === 'serve' && findServableOrder(state);
  ctx.save();
  if (near || servable) {
    ctx.shadowColor = servable ? '#ffd94d' : '#fff';
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = '#7c4a26';
  rr(ctx, st.x - 6, st.y - 6, st.w + 12, st.h + 12, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = st.id === 'serve' ? '#e8b25c' : '#a06a45';
  rr(ctx, st.x, st.y, st.w, st.h, 8);
  ctx.fill();
  ctx.fillStyle = '#f3e2c7';
  rr(ctx, st.x, st.y, st.w, 16, 8);
  ctx.fill();
  ctx.fillRect(st.x, st.y + 8, st.w, 8);
  ctx.restore();

  text(ctx, st.label, st.x + st.w / 2, (st.id === 'serve' || st.id === 'trash') ? st.y + st.h + 16 : st.y + st.h - 12, 13, '#ffe9c4', 'center');

  if (st.id === 'board') {
    ctx.fillStyle = '#e8d5a8';
    rr(ctx, st.x + 30, st.y + 24, st.w - 60, 34, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a6f4d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(st.x + 55, st.y + 28); ctx.lineTo(st.x + 55, st.y + 54); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(st.x + st.w - 55, st.y + 28); ctx.lineTo(st.x + st.w - 55, st.y + 54); ctx.stroke();
    if (state.chopping) {
      const k = state.chopping.kind;
      drawIngredient(ctx, k + ':raw', st.x + st.w / 2, st.y + 41, 15);
      drawProgressRing(ctx, st.x + st.w / 2, st.y + 41, 24, state.chopping.t / CHOP_SECONDS, '#ffd94d');
      text(ctx, 'CHOPPING…', st.x + st.w / 2, st.y - 10, 11, '#fff', 'center');
    }
  }
  if (st.id === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    rr(ctx, st.x + 24, st.y + 22, st.w - 48, 38, 6);
    ctx.fill();
    ctx.strokeStyle = '#777'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(st.x + 32 + i * 30, st.y + 26); ctx.lineTo(st.x + 32 + i * 30, st.y + 56); ctx.stroke();
    }
    if (state.grill) {
      const g = state.grill;
      const frac = Math.min(1, g.t / GRILL_SECONDS);
      const cx = st.x + st.w / 2, cy = st.y + 41;
      if (g.burnt) {
        ctx.fillStyle = '#1c1c1c';
        ctx.beginPath(); ctx.ellipse(cx, cy, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'BURNT!', cx, st.y - 10, 12, '#ff6b5e', 'center');
      } else {
        drawIngredient(ctx, 'patty:' + (frac >= 1 ? 'grilled' : 'raw'), cx, cy, 20);
        drawProgressRing(ctx, cx, cy, 24, frac, frac >= 1 ? '#9fe870' : '#ff9a3c');
        if (frac >= 1) text(ctx, 'READY!', cx, st.y - 10, 12, '#9fe870', 'center');
      }
      // Smoke puffs while cooking.
      if (!g.burnt && Math.floor(now * 3) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.arc(cx + 12, st.y + 8 - (now % 1) * 8, 5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  if (st.id === 'pot') {
    ctx.fillStyle = '#4a4a55';
    ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + 44, 52, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6aa8d8';
    ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + 40, 44, 18, 0, 0, Math.PI * 2); ctx.fill();
    if (state.pot) {
      const p = state.pot;
      const frac = Math.min(1, p.t / BOIL_SECONDS);
      const cx = st.x + st.w / 2, cy = st.y + 40;
      if (p.burnt) {
        ctx.fillStyle = '#3d2f1e';
        ctx.beginPath(); ctx.ellipse(cx, cy, 40, 15, 0, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'MUSHY!', cx, st.y - 10, 12, '#ff6b5e', 'center');
      } else {
        drawIngredient(ctx, 'pasta:' + (frac >= 1 ? 'boiled' : 'raw'), cx, cy - 4, 18);
        drawProgressRing(ctx, cx, cy, 26, frac, frac >= 1 ? '#9fe870' : '#6aa8d8');
        if (frac >= 1) text(ctx, 'READY!', cx, st.y - 10, 12, '#9fe870', 'center');
      }
    }
  }
  if (st.id === 'plate') {
    // The plate itself, with whatever is assembled on it.
    ctx.fillStyle = '#f7f3ea';
    ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + 42, 62, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9b896'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(st.x + st.w / 2, st.y + 42, 52, 20, 0, 0, Math.PI * 2); ctx.stroke();
    state.plate.forEach((item, i) => {
      drawIngredient(ctx, item, st.x + 52 + i * 36, st.y + 40, 15);
    });
    if (state.plate.length === 0) text(ctx, 'empty plate', st.x + st.w / 2, st.y + 42, 12, '#a08a6a', 'center');
    const match = findServableOrder(state);
    if (match) {
      ctx.strokeStyle = '#9fe870'; ctx.lineWidth = 4;
      rr(ctx, st.x - 5, st.y - 5, st.w + 10, st.h + 10, 12);
      ctx.stroke();
      text(ctx, 'READY TO SERVE!', st.x + st.w / 2, st.y + st.h + 16, 12, '#9fe870', 'center');
    }
  }
  if (st.id === 'serve') {
    ctx.fillStyle = '#2f2f38';
    rr(ctx, st.x + 14, st.y + 20, st.w - 28, 30, 4);
    ctx.fill();
    text(ctx, 'SERVE →', st.x + st.w / 2, st.y + 35, 15, servable ? '#9fe870' : '#ffe9c4', 'center');
  }
  if (st.id === 'trash') {
    ctx.fillStyle = '#4a4a55';
    rr(ctx, st.x + 28, st.y + 22, st.w - 56, 32, 4);
    ctx.fill();
    ctx.fillStyle = '#33333c';
    rr(ctx, st.x + 24, st.y + 16, st.w - 48, 10, 4);
    ctx.fill();
  }
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawPantry(ctx, state) {
  text(ctx, 'PANTRY — press E to grab (hands hold 3)', 96, 624, 13, '#ffe9c4');
  for (const slot of pantrySlots()) {
    const near = nearestStation(state) && nearestStation(state).id === 'pantry' && nearestStation(state).kind === slot.kind;
    ctx.fillStyle = near ? '#8a5a3b' : '#6b4426';
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 8);
    ctx.fill();
    ctx.fillStyle = '#f3e2c7';
    ctx.fillRect(slot.x, slot.y, slot.w, 6);
    drawIngredient(ctx, slot.kind + ':' + (INGREDIENTS[slot.kind].prep === 'none' ? 'ready' : 'raw'), slot.x + slot.w / 2, slot.y + 26, 17);
    text(ctx, INGREDIENTS[slot.kind].name, slot.x + slot.w / 2, slot.y + 52, 11, '#ffe9c4', 'center');
  }
}

function drawChef(ctx, state, now) {
  const c = state.chef;
  const bob = c.moving ? Math.sin(now * 14) * 2 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body + apron.
  ctx.fillStyle = '#f7f3ea';
  rr(ctx, -17, -8, 34, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#3f7fbf';
  rr(ctx, -13, 4, 26, 18, 6);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -20, 14, 0, Math.PI * 2); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -32, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -36, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -32, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-12, -34, 24, 6);
  // Eyes look in the walking direction.
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-5 + c.dir * 2, -20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + c.dir * 2, -20, 2, 0, Math.PI * 2); ctx.fill();
  // Carried items float above the head.
  state.hands.forEach((item, i) => {
    const hx = (i - (state.hands.length - 1) / 2) * 30;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(hx, -52, 14, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, item, hx, -52, 11);
  });
  ctx.restore();
}

// ---- order board + HUD ----------------------------------------------------

function drawTicket(ctx, order, x, y, w, h) {
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  const frac = Math.max(0, order.patience / order.patienceMax);
  const urgent = frac < 0.35;
  ctx.save();
  if (urgent && Math.floor(performance.now() / 400) % 2 === 0) {
    ctx.shadowColor = '#ff5a4d';
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = '#fff8e8';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = recipe.color;
  rr(ctx, x, y, w, 22, 8);
  ctx.fill();
  ctx.fillRect(x, y + 14, w, 8);
  text(ctx, '#' + order.id + '  ' + recipe.name, x + 8, y + 11, 13, '#fff');
  text(ctx, recipe.price + 'c', x + w - 8, y + 11, 13, '#fff', 'right');
  // Needed ingredients.
  recipe.needs.forEach((item, i) => {
    const ix = x + 22 + i * 42;
    const iy = y + 44;
    const onPlate = false;
    ctx.fillStyle = onPlate ? '#9fe870' : '#f0e2c8';
    ctx.beginPath(); ctx.arc(ix, iy, 17, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, item, ix, iy, 13);
  });
  // Patience bar.
  ctx.fillStyle = '#e0d3b8';
  rr(ctx, x + 8, y + h - 14, w - 16, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f2a93c' : '#e5484d';
  if (frac > 0) {
    rr(ctx, x + 8, y + h - 14, (w - 16) * frac, 8, 4);
    ctx.fill();
  }
  ctx.restore();
}

function drawTopBar(ctx, state) {
  // Order board.
  text(ctx, 'ORDER BOARD', 16, 20, 13, '#ffe9c4');
  state.orders.forEach((order, i) => {
    drawTicket(ctx, order, 16 + i * 212, 28, 200, 68);
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — first ticket coming…', 16, 62, 14, '#ffe9c4');
  }
  // Timer, coins, day — top right.
  const left = timeLeft(state);
  const mm = Math.floor(left / 60);
  const ss = String(Math.floor(left % 60)).padStart(2, '0');
  const urgent = left <= 30;
  text(ctx, 'TIME ' + mm + ':' + ss, 1240, 34, 26, urgent ? '#ff8a7a' : '#fff', 'right');
  const barW = 240;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, 1240 - barW, 52, barW, 10, 5);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e5484d' : '#ffd94d';
  rr(ctx, 1240 - barW, 52, barW * (1 - dayProgress(state)), 10, 5);
  ctx.fill();
  text(ctx, state.coins + ' COINS', 1240, 82, 18, '#ffd94d', 'right');
  text(ctx, 'Served ' + state.served + '   •   Combo x' + state.combo, 1000, 82, 14, '#ffe9c4', 'right');
  if (state.rush) text(ctx, 'SERVICE RUSH!', 700, 20, 15, '#ff8a7a', 'left');
}

function drawHandsPanel(ctx, state) {
  const x = 980, y = 616, w = 284, h = 84;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  text(ctx, 'HANDS (max 3) — E interact · Q drop · M mute', x + 12, y + 14, 11, '#ffe9c4');
  state.hands.forEach((item, i) => {
    const ix = x + 30 + i * 56;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(ix, y + 46, 20, 0, Math.PI * 2); ctx.fill();
    drawIngredient(ctx, item, ix, y + 46, 15);
  });
  if (state.hands.length === 0) text(ctx, 'empty hands', x + 30, y + 46, 13, '#cbb896');
  const near = nearestStation(state);
  if (near) text(ctx, 'Near: ' + near.label + ' — press E', x + 12, y + 70, 12, '#9fe870');
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    const a = 1 - f.t / f.life;
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - f.t * 34, 18, f.color, 'center');
    ctx.globalAlpha = 1;
  }
  if (state.toast) {
    ctx.globalAlpha = Math.min(1, 3 - state.toast.t);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const w = ctx.measureText(state.toast.text).width + 28;
    rr(ctx, VIEW_W / 2 - w / 2, 108, w, 28, 14);
    ctx.fill();
    text(ctx, state.toast.text, VIEW_W / 2, 122, 14, '#fff', 'center');
    ctx.globalAlpha = 1;
  }
}

// ---- screens --------------------------------------------------------------

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '🍳 THE COPPER LADLE', VIEW_W / 2, 130, 54, '#ffd94d', 'center');
  text(ctx, 'Sizzle & Serve — a one-chef kitchen rush', VIEW_W / 2, 180, 22, '#ffe9c4', 'center');
  const lines = [
    'WASD / arrows — run around the kitchen     •     E — grab, chop, cook, plate, serve',
    'Q — drop what you are holding     •     M — mute     •     R — restart the day',
    '',
    'HOW A DISH WORKS: grab ingredients from the PANTRY, chop them on the BOARD,',
    'sizzle patties on the GRILL, boil pasta in the POT, build the dish on the PLATE,',
    'then serve it at the SERVE WINDOW before the ticket runs out of patience.',
    '',
    'Ember Burger  •  Sunny Pasta  •  Forest Soup  •  Garden Salad',
    'Tips shrink as patience runs out — fast hands, big tips. Day lasts 2½ minutes.',
  ];
  lines.forEach((l, i) => text(ctx, l, VIEW_W / 2, 250 + i * 30, l === '' ? 10 : 17, '#fff', 'center'));
  const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 350);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER or click to start cooking!', VIEW_W / 2, 560, 24, '#9fe870', 'center');
  ctx.globalAlpha = 1;
  text(ctx, 'A fully original game — art, sounds and recipes made for this kitchen.', VIEW_W / 2, 620, 13, '#cbb896', 'center');
}

function drawEnd(ctx, state) {
  const s = state.endStats || { coins: state.coins, served: state.served, failed: state.failed, bestCombo: state.bestCombo };
  const stars = starCount(state);
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'DAY OVER!', VIEW_W / 2, 130, 48, '#ffd94d', 'center');
  const starRow = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  text(ctx, starRow, VIEW_W / 2, 195, 44, '#ffd94d', 'center');
  text(ctx, stars === 3 ? 'Three stars — the Copper Ladle shines tonight!' : stars === 2 ? 'Two stars — a solid service!' : stars === 1 ? 'One star — the kitchen survived.' : 'No stars — tomorrow is another service.', VIEW_W / 2, 250, 18, '#fff', 'center');
  text(ctx, 'Coins earned: ' + s.coins, VIEW_W / 2, 320, 24, '#ffd94d', 'center');
  text(ctx, 'Dishes served: ' + s.served + '      Walked out: ' + s.failed + '      Best combo: x' + s.bestCombo, VIEW_W / 2, 365, 18, '#ffe9c4', 'center');
  const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 350);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press R to cook another day', VIEW_W / 2, 450, 22, '#9fe870', 'center');
  ctx.globalAlpha = 1;
}

// ---- main entry -----------------------------------------------------------

export function render(ctx, state, now) {
  drawFloor(ctx);
  for (const st of STATION_DEFS) drawStation(ctx, st, state, now);
  drawPantry(ctx, state);
  drawChef(ctx, state, now);
  drawTopBar(ctx, state);
  drawHandsPanel(ctx, state);
  drawFloaters(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'end') drawEnd(ctx, state);
}
