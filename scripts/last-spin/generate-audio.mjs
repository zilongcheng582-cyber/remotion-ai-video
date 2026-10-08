/* global process, Buffer, console */
// Original score + sound design for "The Last Spin", synthesized from scratch.
// Deterministic: running it again produces identical WAV files.
// Usage: node scripts/last-spin/generate-audio.mjs [outDir]
// Output: public/last-spin/audio/*.wav (44.1 kHz, 16-bit stereo)
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 44100;
const outDir = process.argv[2] ?? "public/last-spin/audio";
mkdirSync(outDir, { recursive: true });

// ---------- utilities ----------
let seed = 1234567;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rnd() * 2 - 1;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const NOTE = (name) => {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
  const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + base + acc;
};
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
const mixInto = (dst, src, at, gain = 1) => {
  const o = Math.round(at * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * gain;
};
const env = (i, len, a, r) => {
  const t = i / SR;
  const T = len / SR;
  if (t < a) return t / a;
  if (t > T - r) return Math.max(0, (T - t) / r);
  return 1;
};
const lowpass = (x, cutoff) => {
  const y = new Float32Array(x.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const a = 1 / SR / (rc + 1 / SR);
  let p = 0;
  for (let i = 0; i < x.length; i++) {
    p += a * (x[i] - p);
    y[i] = p;
  }
  return y;
};
const highpass = (x, cutoff) => {
  const lp = lowpass(x, cutoff);
  return x.map((v, i) => v - lp[i]);
};

// Schroeder reverb (mono in -> stereo out)
const reverb = (x, wet = 0.3, size = 1) => {
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.round(d * size));
  const combsR = [1277, 1356, 1188, 1116].map((d) => Math.round(d * size));
  const run = (delays) => {
    const out = new Float32Array(x.length);
    for (const d of delays) {
      const b = new Float32Array(d);
      let idx = 0;
      let lp = 0;
      for (let i = 0; i < x.length; i++) {
        const y = b[idx];
        lp = y * 0.6 + lp * 0.4;
        b[idx] = x[i] + lp * 0.8;
        idx = (idx + 1) % d;
        out[i] += y * 0.25;
      }
    }
    for (const d of [225, 556]) {
      const b = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < out.length; i++) {
        const bo = b[idx];
        const y = -out[i] * 0.5 + bo;
        b[idx] = out[i] + bo * 0.5;
        idx = (idx + 1) % d;
        out[i] = y;
      }
    }
    return out;
  };
  const L = run(combs);
  const R = run(combsR);
  return [x.map((v, i) => v * (1 - wet) + L[i] * wet), x.map((v, i) => v * (1 - wet) + R[i] * wet)];
};

const writeWav = (name, L, R = L, gain = 1) => {
  let peak = 0;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = peak > 0 ? (0.89 * gain) / peak : 1;
  const n = L.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 4, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * norm * 32767))), 44 + i * 4);
    b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * norm * 32767))), 46 + i * 4);
  }
  writeFileSync(path.join(outDir, name), b);
  console.log("wrote", name, (n / SR).toFixed(2) + "s");
};

// ---------- instruments ----------
const pluck = (freq, dur, bright = 0.5, decay = 0.996) => {
  const out = buf(dur);
  const N = Math.max(2, Math.round(SR / freq));
  const ring = new Float32Array(N).map(() => noise());
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    const a = ring[idx];
    const b2 = ring[(idx + 1) % N];
    ring[idx] = (a * bright + b2 * (1 - bright)) * decay;
    out[i] = a * env(i, out.length, 0.002, 0.03);
    idx = (idx + 1) % N;
  }
  return out;
};
const sine = (freq, dur, a = 0.01, r = 0.1, vib = 0, vibRate = 5.5) => {
  const out = buf(dur);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = freq * (1 + vib * Math.sin(2 * Math.PI * vibRate * t) * Math.min(1, t * 3));
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * env(i, out.length, a, r);
  }
  return out;
};
const piano = (freq, dur, vel = 1) => {
  const out = buf(dur);
  const partials = 9;
  for (let n = 1; n <= partials; n++) {
    const f = freq * n * (1 + 0.0004 * n * n);
    if (f > 16000) break;
    const amp = (vel / Math.pow(n, 1.25)) * (n === 2 ? 0.8 : 1);
    const dec = 0.9 + 2.2 * n * (freq / 440) ** 0.3;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] += Math.sin(2 * Math.PI * f * t + n) * amp * Math.exp(-t * dec * 0.9);
    }
  }
  for (let i = 0; i < Math.min(out.length, 600); i++) out[i] += noise() * 0.06 * vel * (1 - i / 600);
  for (let i = 0; i < out.length; i++) out[i] *= env(i, out.length, 0.003, 0.25);
  return out;
};
const bell = (freq, dur, vel = 1) => {
  const out = buf(dur);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const idx = 3.2 * Math.exp(-t * 4);
    out[i] = Math.sin(2 * Math.PI * freq * t + idx * Math.sin(2 * Math.PI * freq * 3.5 * t)) * Math.exp(-t * 2.2) * vel;
  }
  return out;
};
const saw = (freq, dur, a, r, detune = 0.004) => {
  const out = buf(dur);
  for (const d of [-detune, 0, detune]) {
    let ph = rnd();
    for (let i = 0; i < out.length; i++) {
      ph += (freq * (1 + d)) / SR;
      ph -= Math.floor(ph);
      out[i] += (2 * ph - 1) * env(i, out.length, a, r) / 3;
    }
  }
  return out;
};
const pad = (notes, dur, a = 0.6, r = 0.8, cutoff = 1800) => {
  const out = buf(dur);
  for (const n of notes) mixInto(out, saw(midi(n), dur, a, r, 0.006), 0, 0.3);
  return lowpass(lowpass(out, cutoff), cutoff * 1.4);
};
const kick = (dur = 0.4, f0 = 140, f1 = 45) => {
  const out = buf(dur);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t * 30);
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 9);
  }
  return out;
};
const snare = (dur = 0.2, tone = 190) => {
  const out = buf(dur);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = noise() * Math.exp(-t * 22) * 0.7 + Math.sin(2 * Math.PI * tone * t) * Math.exp(-t * 30) * 0.5;
  }
  return highpass(out, 400);
};
const hat = (dur = 0.05) => {
  const out = buf(dur);
  for (let i = 0; i < out.length; i++) out[i] = noise() * Math.exp((-i / SR) * 70);
  return highpass(highpass(out, 6000), 6000);
};
const noiseBurst = (dur, cutoff, decay) => {
  const out = buf(dur);
  for (let i = 0; i < out.length; i++) out[i] = noise() * Math.exp((-i / SR) * decay);
  return lowpass(out, cutoff);
};
const sweep = (f0, f1, dur, shape = "sine") => {
  const out = buf(dur);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    const f = f0 * Math.pow(f1 / f0, t);
    ph += (2 * Math.PI * f) / SR;
    const v = shape === "sine" ? Math.sin(ph) : Math.sign(Math.sin(ph)) * 0.5;
    out[i] = v * env(i, out.length, 0.005, 0.05);
  }
  return out;
};

// =====================================================================
// MUSIC 1 — 0.0-7.0 s: playful & slightly tense -> warm, slowing bloom
// =====================================================================
{
  const len = 7.0;
  const m = buf(len + 1.5);
  const beat = 60 / 120 / 2; // eighth notes at 120 bpm
  // tense-playful staccato motif over pizzicato bass (0 - 3.3 s)
  const motif = ["E4", "G4", "Ab4", "G4", "E4", "D4", "Eb4", "D4"];
  const bass = ["C2", "G1", "C2", "G1", "Ab1", "G1", "C2", "G1"];
  for (let i = 0; i < 26; i++) {
    const t = i * beat;
    if (t > 3.3) break;
    if (i % 2 === 0) mixInto(m, pluck(midi(NOTE(bass[(i / 2) % 8])), 0.3, 0.3, 0.99), t, 0.9);
    if (i >= 2) mixInto(m, pluck(midi(NOTE(motif[i % 8])), 0.22, 0.6, 0.985), t, 0.45);
    mixInto(m, hat(), t, 0.12);
  }
  // Shelly spins: cute major arpeggio (3.33 s)
  ["C5", "E5", "G5", "C6"].forEach((n, i) => mixInto(m, bell(midi(NOTE(n)), 1.2, 0.5), 3.33 + i * 0.12, 0.35));
  // El Primo joins (3.93 s): warm bloom, glockenspiel melody, pad swell
  mixInto(m, pad(["C3", "G3", "E4", "D5"].map(NOTE), 3.2, 0.9, 1.2, 1400), 3.9, 0.55);
  const glock = [
    ["G5", 3.95],
    ["E5", 4.2],
    ["C6", 4.45],
    ["B5", 4.85],
    ["G5", 5.35],
    ["A5", 5.95],
    ["E6", 6.6],
  ];
  glock.forEach(([n, t]) => mixInto(m, bell(midi(NOTE(n)), 2.2, 0.6), t, 0.32));
  // rising shimmer into the dream
  mixInto(m, sweep(500, 2600, 1.4), 5.6, 0.05);
  const [L, R] = reverb(m, 0.32, 1.1);
  const n = Math.round(len * SR);
  writeWav("music-1-encounter-spin.wav", L.slice(0, n + SR), R.slice(0, n + SR), 0.8);
}

// =====================================================================
// MUSIC 2 — 7.0-14.0 s: silly -> nostalgic -> heroic crescendo, HARD STOP
// =====================================================================
{
  const len = 7.0;
  const m = buf(len);
  // A: 0-3 s bouncy ukulele strums + whistle lead (silly best friends)
  const bpm = 150;
  const q = 60 / bpm;
  const chords = [
    ["C4", "E4", "G4", "C5"],
    ["F4", "A4", "C5", "F5"],
    ["G4", "B4", "D5", "G5"],
    ["C4", "E4", "G4", "C5"],
  ];
  for (let b = 0; b < 8; b++) {
    const t = b * q * 0.95;
    if (t > 2.95) break;
    const ch = chords[Math.floor(b / 2) % 4];
    ch.forEach((n, k) => mixInto(m, pluck(midi(NOTE(n)), 0.45, 0.55, 0.992), t + k * 0.012, 0.28));
    mixInto(m, b % 2 === 0 ? kick(0.25, 120, 50) : snare(0.12, 220), t, b % 2 === 0 ? 0.6 : 0.25);
    mixInto(m, pluck(midi(NOTE(ch[0]) - 12), 0.3, 0.3, 0.99), t, 0.5);
  }
  const whistle = [
    ["E5", 0.0, 0.25],
    ["G5", 0.3, 0.25],
    ["C6", 0.6, 0.4],
    ["A5", 1.1, 0.2],
    ["G5", 1.35, 0.2],
    ["E5", 1.6, 0.3],
    ["F5", 2.0, 0.2],
    ["A5", 2.25, 0.2],
    ["G5", 2.5, 0.45],
  ];
  whistle.forEach(([n, t, d]) => mixInto(m, sine(midi(NOTE(n)), d, 0.02, 0.08, 0.012, 6), t, 0.32));
  // B: 3-5 s nostalgic bells + warm pad (always there)
  mixInto(m, pad(["A3", "C4", "E4"].map(NOTE), 1.05, 0.25, 0.3, 1200), 3.0, 0.45);
  mixInto(m, pad(["F3", "A3", "C4"].map(NOTE), 1.05, 0.25, 0.4, 1200), 4.0, 0.45);
  [
    ["E5", 3.0],
    ["D5", 3.35],
    ["C5", 3.7],
    ["G4", 4.05],
    ["A4", 4.4],
    ["C5", 4.65],
    ["E5", 4.85],
  ].forEach(([n, t]) => {
    mixInto(m, bell(midi(NOTE(n)), 1.6, 0.6), t, 0.3);
    mixInto(m, piano(midi(NOTE(n)), 1.4, 0.6), t, 0.22);
  });
  // C: 5-7 s heroic brass swell + timpani roll, crescendo to the cut
  const brass = [
    [["F3", "A3", "C4", "F4"], 5.0, 0.62],
    [["G3", "B3", "D4", "G4"], 5.62, 0.62],
    [["C3", "E4", "G4", "C5", "E5"], 6.24, 0.76],
  ];
  brass.forEach(([ns, t, d], k) => {
    const p = pad(ns.map(NOTE), d + 0.05, 0.05, 0.02, 2200 + k * 900);
    mixInto(m, p, t, 0.5 + k * 0.18);
  });
  for (let i = 0; i < 26; i++) {
    const t = 5.0 + i * 0.076;
    mixInto(m, kick(0.2, 110, 60), t, 0.18 + (i / 26) * 0.5);
  }
  mixInto(m, sweep(300, 1800, 1.9), 5.1, 0.04);
  [["C6", 6.24], ["E6", 6.5], ["G6", 6.74]].forEach(([n, t]) => mixInto(m, bell(midi(NOTE(n)), 0.8, 0.8), t, 0.25));
  const [L, R] = reverb(m, 0.24, 1.0);
  // hard stop: 4 ms declick only
  const d = Math.round(0.004 * SR);
  for (let i = 0; i < d; i++) {
    const g = i / d;
    L[L.length - 1 - i] *= g;
    R[R.length - 1 - i] *= g;
  }
  writeWav("music-2-fantasy.wav", L, R, 0.85);
}

// =====================================================================
// MUSIC 3 — piano, from 17.67 s to the end: sparse, unresolved
// =====================================================================
{
  const len = 10.5;
  const m = buf(len);
  const notes = [
    ["A4", 0.4, 0.55],
    ["E4", 1.6, 0.45],
    ["C5", 2.9, 0.5],
    ["B4", 4.1, 0.45],
    ["A4", 5.3, 0.42],
    ["G4", 6.4, 0.38],
    ["F4", 7.5, 0.35],
  ];
  notes.forEach(([n, t, v]) => mixInto(m, piano(midi(NOTE(n)), 3.2, v), t, 0.6));
  [
    ["A2", 0.4],
    ["F2", 2.9],
    ["C3", 5.3],
  ].forEach(([n, t]) => mixInto(m, piano(midi(NOTE(n)), 3.5, 0.32), t, 0.5));
  // final unresolved chord (lands as the heart Pin is left alone)
  ["D3", "F4", "B4"].forEach((n, i) => mixInto(m, piano(midi(NOTE(n)), 3.6, 0.28), 8.6 + i * 0.05, 0.55));
  const [L, R] = reverb(m, 0.42, 1.3);
  writeWav("music-3-piano.wav", L, R, 0.7);
}

// =====================================================================
// SFX
// =====================================================================
const sfx = (name, x, wet = 0.12, gain = 1) => {
  const [L, R] = reverb(x, wet, 0.8);
  writeWav(name, L, R, gain);
};

{
  // bandit revolver: short bright pew
  const x = buf(0.18);
  mixInto(x, sweep(1800, 500, 0.12, "square"), 0, 0.4);
  mixInto(x, noiseBurst(0.08, 5000, 50), 0, 0.5);
  sfx("sfx-bandit-shot.wav", x, 0.1, 0.5);
}
{
  // body hit thud
  const x = buf(0.25);
  mixInto(x, kick(0.25, 160, 60), 0, 0.8);
  mixInto(x, noiseBurst(0.1, 1500, 40), 0, 0.4);
  sfx("sfx-hit.wav", x, 0.05, 0.6);
}
{
  // shotgun blast: noise boom + low thump
  const x = buf(0.7);
  mixInto(x, noiseBurst(0.5, 3500, 9), 0, 0.9);
  mixInto(x, noiseBurst(0.08, 9000, 60), 0, 0.6);
  mixInto(x, kick(0.5, 120, 40), 0, 0.9);
  sfx("sfx-shotgun.wav", x, 0.15, 0.9);
}
{
  // pump action: two clacks
  const x = buf(0.32);
  mixInto(x, highpass(noiseBurst(0.04, 8000, 80), 1500), 0, 0.7);
  mixInto(x, highpass(noiseBurst(0.05, 6000, 70), 900), 0.16, 0.8);
  sfx("sfx-pump.wav", x, 0.08, 0.5);
}
{
  // surprise blip (boing up)
  const x = buf(0.3);
  mixInto(x, sweep(300, 900, 0.25), 0, 0.6);
  sfx("sfx-surprise.wav", x, 0.15, 0.55);
}
{
  // spin whoosh: filtered noise swirls
  const x = buf(1.6);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] = noise() * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3.2 * t)) * env(i, x.length, 0.2, 0.5);
  }
  sfx("sfx-spin.wav", lowpass(lowpass(x, 1400), 1800), 0.2, 0.35);
}
{
  // Pin pop: bubbly pop + sparkle
  const x = buf(0.6);
  mixInto(x, sweep(400, 1300, 0.07), 0, 0.7);
  mixInto(x, bell(midi(NOTE("E6")), 0.5, 0.6), 0.05, 0.4);
  mixInto(x, bell(midi(NOTE("B6")), 0.4, 0.5), 0.1, 0.3);
  sfx("sfx-pin-pop.wav", x, 0.2, 0.55);
}
{
  // dream shimmer for the vortex
  const x = buf(1.8);
  ["C6", "E6", "G6", "B6", "D7", "E7"].forEach((n, i) => mixInto(x, bell(midi(NOTE(n)), 1.2, 0.4), i * 0.12, 0.3));
  mixInto(x, sweep(800, 3000, 1.2), 0, 0.05);
  sfx("sfx-dream.wav", x, 0.45, 0.45);
}
{
  // slide whistle up for the silly jump
  const x = buf(0.6);
  mixInto(x, sine(1, 0.01), 0, 0);
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / x.length;
    const f = 500 * Math.pow(3, t);
    ph += (2 * Math.PI * f) / SR;
    x[i] = Math.sin(ph) * env(i, x.length, 0.02, 0.08) * 0.5;
  }
  sfx("sfx-slide-whistle.wav", x, 0.15, 0.4);
}
{
  // propeller sputter
  const x = buf(0.9);
  for (let k = 0; k < 7; k++) mixInto(x, noiseBurst(0.06, 900, 40), k * 0.11 + (k % 2) * 0.03, 0.6 - k * 0.06);
  sfx("sfx-sputter.wav", x, 0.1, 0.45);
}
{
  // heroic whoosh + impact
  const x = buf(1.2);
  const w = buf(0.5);
  for (let i = 0; i < w.length; i++) w[i] = noise() * env(i, w.length, 0.3, 0.05);
  mixInto(x, lowpass(w, 2500), 0, 0.6);
  mixInto(x, kick(0.6, 100, 35), 0.47, 1);
  mixInto(x, noiseBurst(0.4, 3000, 10), 0.47, 0.5);
  sfx("sfx-hero-leap.wav", x, 0.25, 0.6);
}
{
  // SUPER READY: short bright rising arpeggio + shimmer
  const x = buf(0.9);
  ["E5", "A5", "C#6", "E6"].forEach((n, i) => mixInto(x, bell(midi(NOTE(n)), 0.6, 0.9), i * 0.045, 0.45));
  mixInto(x, sweep(900, 2400, 0.18, "square"), 0, 0.08);
  sfx("sfx-super-ready.wav", x, 0.2, 0.75);
}
{
  // SUPER blast: bigger, sharper shotgun with sub drop
  const x = buf(1.4);
  mixInto(x, noiseBurst(0.9, 4500, 5), 0, 1);
  mixInto(x, noiseBurst(0.06, 12000, 90), 0, 0.8);
  mixInto(x, kick(1.0, 150, 30), 0, 1.2);
  sfx("sfx-super-blast.wav", x, 0.22, 1);
}
{
  // wall break rubble
  const x = buf(1.0);
  for (let k = 0; k < 14; k++) mixInto(x, noiseBurst(0.08, 1200 + rnd() * 2500, 30), rnd() * 0.6, 0.4 + rnd() * 0.4);
  mixInto(x, kick(0.4, 90, 40), 0, 0.6);
  sfx("sfx-wall-break.wav", x, 0.15, 0.6);
}
{
  // defeat: soft airy poof
  const x = buf(1.0);
  mixInto(x, lowpass(noiseBurst(0.9, 900, 4), 700), 0, 0.8);
  mixInto(x, sweep(420, 160, 0.6), 0, 0.12);
  sfx("sfx-defeat.wav", x, 0.35, 0.35);
}
{
  // cube drop + pickup chimes
  const d = buf(0.8);
  mixInto(d, bell(midi(NOTE("A5")), 0.7, 0.6), 0, 0.5);
  mixInto(d, bell(midi(NOTE("E6")), 0.6, 0.4), 0.08, 0.35);
  sfx("sfx-cube-drop.wav", d, 0.25, 0.35);
  const p = buf(0.6);
  ["E6", "A6"].forEach((n, i) => mixInto(p, bell(midi(NOTE(n)), 0.5, 0.6), i * 0.06, 0.4));
  sfx("sfx-cube-pickup.wav", p, 0.2, 0.3);
}
{
  // tension drone between the first shot and the Super (cut by the blast)
  const x = buf(1.5);
  mixInto(x, lowpass(saw(midi(NOTE("C2")), 1.5, 0.3, 0.01, 0.01), 400), 0, 0.6);
  mixInto(x, lowpass(saw(midi(NOTE("Db2")), 1.5, 0.5, 0.01, 0.01), 400), 0, 0.4);
  for (let i = 0; i < x.length; i++) x[i] *= 0.6 + 0.4 * Math.sin(2 * Math.PI * 7 * (i / SR));
  sfx("sfx-tension.wav", x, 0.1, 0.4);
}
{
  // desert wind bed for the empty battlefield
  const x = buf(8);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] = noise() * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.21 * t) * Math.sin(2 * Math.PI * 0.13 * t)) * env(i, x.length, 1.5, 2.5);
  }
  sfx("sfx-wind.wav", lowpass(lowpass(x, 500), 650), 0.3, 0.25);
}
{
  // footsteps on sand (one step)
  const x = buf(0.15);
  mixInto(x, lowpass(noiseBurst(0.12, 1200, 35), 900), 0, 0.8);
  sfx("sfx-step.wav", x, 0.05, 0.25);
}
