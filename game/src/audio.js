// Tiny synthesized sound effects (WebAudio, no audio files, no network).
// Every sound is built from oscillators so the game stays fully offline.

let audioCtx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, when = 0, lowpass = 1200) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.12, 0, 760); },
  drop() { tone(300, 0.07, 'triangle', 0.1, 0, 210); },
  chop() { noiseBurst(0.09, 0.22, 0, 2400); tone(180, 0.06, 'square', 0.06); },
  chopDone() { tone(660, 0.09, 'triangle', 0.14); tone(880, 0.12, 'triangle', 0.14, 0.08); },
  sizzle() { noiseBurst(0.35, 0.1, 0, 3200); },
  plop() { tone(240, 0.12, 'sine', 0.16, 0, 120); },
  ready() { tone(740, 0.1, 'triangle', 0.14); tone(988, 0.14, 'triangle', 0.14, 0.09); },
  serve() {
    tone(523, 0.1, 'triangle', 0.16);
    tone(659, 0.1, 'triangle', 0.16, 0.09);
    tone(784, 0.18, 'triangle', 0.18, 0.18);
  },
  wrong() { tone(220, 0.16, 'sawtooth', 0.08, 0, 140); },
  burn() { tone(160, 0.25, 'sawtooth', 0.1, 0, 90); noiseBurst(0.2, 0.12, 0, 900); },
  order() { tone(587, 0.09, 'triangle', 0.12); tone(880, 0.12, 'triangle', 0.12, 0.08); },
  tick() { tone(980, 0.05, 'square', 0.05); },
  dayEnd() {
    tone(523, 0.14, 'triangle', 0.16);
    tone(659, 0.14, 'triangle', 0.16, 0.13);
    tone(784, 0.14, 'triangle', 0.16, 0.26);
    tone(1047, 0.3, 'triangle', 0.18, 0.39);
  },
  click() { tone(700, 0.05, 'triangle', 0.08); },
};
