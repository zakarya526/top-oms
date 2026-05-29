/**
 * Generates the short order-flow chimes used by src/lib/utils/orderSounds.ts.
 * Pure Node (no deps): synthesizes 16-bit PCM mono WAVs into assets/sounds/.
 * Re-run with `node scripts/generate-order-sounds.mjs` to tweak the tones.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'sounds');
mkdirSync(OUT_DIR, { recursive: true });

const SAMPLE_RATE = 44100;
const GAP_MS = 18; // silence between notes

/** Render a sequence of notes ([{ freq, ms }]) into a Float array (-1..1). */
function renderNotes(notes) {
  const out = [];
  for (const { freq, ms } of notes) {
    const n = Math.floor((ms / 1000) * SAMPLE_RATE);
    const fade = Math.min(Math.floor(0.012 * SAMPLE_RATE), Math.floor(n / 2));
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      // Sine plus a soft second harmonic for a warmer, less harsh timbre.
      let s = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * t);
      s *= 0.35;
      // Linear fade in/out avoids clicks at note boundaries.
      const env = i < fade ? i / fade : i > n - fade ? (n - i) / fade : 1;
      out.push(s * env);
    }
    const gapN = Math.floor((GAP_MS / 1000) * SAMPLE_RATE);
    for (let i = 0; i < gapN; i++) out.push(0);
  }
  return out;
}

function toWav(samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  let o = 0;
  const str = (s) => { buf.write(s, o); o += s.length; };
  const u32 = (v) => { buf.writeUInt32LE(v, o); o += 4; };
  const u16 = (v) => { buf.writeUInt16LE(v, o); o += 2; };
  str('RIFF'); u32(36 + dataSize); str('WAVE');
  str('fmt '); u32(16); u16(1); u16(1); u32(SAMPLE_RATE); u32(SAMPLE_RATE * 2); u16(2); u16(16);
  str('data'); u32(dataSize);
  for (const sample of samples) {
    const v = Math.max(-1, Math.min(1, sample));
    buf.writeInt16LE(Math.round(v * 32767), o); o += 2;
  }
  return buf;
}

// Distinct, recognizable motifs per event (Hz / ms). Rising = positive/progress,
// falling = closing/cancel.
const SOUNDS = {
  added:     [{ freq: 523.25, ms: 110 }, { freq: 783.99, ms: 150 }],                                   // C5→G5 ding
  preparing: [{ freq: 659.25, ms: 90 }, { freq: 659.25, ms: 90 }],                                      // E5 double blip
  ready:     [{ freq: 659.25, ms: 100 }, { freq: 783.99, ms: 100 }, { freq: 1046.5, ms: 180 }],         // E5→G5→C6 fanfare
  served:    [{ freq: 783.99, ms: 110 }, { freq: 659.25, ms: 160 }],                                    // G5→E5 settle
  completed: [{ freq: 523.25, ms: 90 }, { freq: 659.25, ms: 90 }, { freq: 783.99, ms: 90 }, { freq: 1046.5, ms: 180 }], // C-E-G-C arpeggio
  cancelled: [{ freq: 440.0, ms: 130 }, { freq: 329.63, ms: 210 }],                                     // A4→E4 descent
};

for (const [name, notes] of Object.entries(SOUNDS)) {
  const wav = toWav(renderNotes(notes));
  writeFileSync(join(OUT_DIR, `${name}.wav`), wav);
  console.log(`${name}.wav  ${(wav.length / 1024).toFixed(1)} KB`);
}
