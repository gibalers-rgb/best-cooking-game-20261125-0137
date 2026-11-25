// Keyboard + mouse input. The chef walks with WASD/arrows; clicking a station
// walks the chef toward it, and clicking again (or pressing E) uses it.

import { CHEF_SPEED, VIEW_W, VIEW_H } from './config.js';

export function createInput(canvas, handlers) {
  const keys = new Set();
  const input = { keys, clickX: null, clickY: null };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.key.toLowerCase());
    handlers.onKey(e.key.toLowerCase());
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    handlers.onClick(x, y);
  });

  return input;
}

// Move the chef from held keys, or toward a click target. Returns true if moving.
export function moveChef(state, input, dt) {
  const c = state.chef;
  let dx = 0;
  let dy = 0;
  const k = input.keys;
  if (k.has('a') || k.has('arrowleft')) dx -= 1;
  if (k.has('d') || k.has('arrowright')) dx += 1;
  if (k.has('w') || k.has('arrowup')) dy -= 1;
  if (k.has('s') || k.has('arrowdown')) dy += 1;
  if (dx === 0 && dy === 0 && c.tx !== null && c.ty !== null) {
    const ddx = c.tx - c.x;
    const ddy = c.ty - c.y;
    const d = Math.hypot(ddx, ddy);
    if (d < 8) { c.tx = null; c.ty = null; }
    else { dx = ddx / d; dy = ddy / d; }
  }
  if (dx === 0 && dy === 0) { c.moving = false; return false; }
  const len = Math.hypot(dx, dy);
  dx /= len; dy /= len;
  c.x = Math.min(VIEW_W - 30, Math.max(30, c.x + dx * CHEF_SPEED * dt));
  c.y = Math.min(612, Math.max(200, c.y + dy * CHEF_SPEED * dt));
  if (dx !== 0) c.dir = dx > 0 ? 1 : -1;
  c.moving = true;
  return true;
}
