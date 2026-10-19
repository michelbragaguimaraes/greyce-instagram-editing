// Trilha e efeitos sintetizados em JavaScript puro (sem samples externos).
//   node music.js <pasta-do-projeto>   → build/music.wav + build/sfx.wav
// Música leve (marimba + baixo + palmas + shaker), progressão C–G–Am–F. Efeitos: whoosh automático
// em toda transição com bichinho, bolhas na tartaruga, e os que o roteiro pedir em "sfx".
// Regra: nenhum efeito (exceto whoosh) cai em cima de palavra falada — é empurrado para o fim dela.
const fs = require("fs");
const path = require("path");
const PROJ = path.resolve(process.argv[2] || ".");
const T = JSON.parse(fs.readFileSync(path.join(PROJ, "build", "timeline.json"), "utf8"));
const MU = { bpm: 120, energy: 0.6, ...T.music };

const SR = 48000, LEN = Math.ceil((T.duration + 0.5) * SR), BEAT = 60 / MU.bpm;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const track = () => [new Float32Array(LEN), new Float32Array(LEN)];
function add(tr, t0, fn, dur, pan = 0) {
  const i0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && i0 + i < LEN; i++) { if (i0 + i < 0) continue; const v = fn(i / SR); tr[0][i0 + i] += v * gl; tr[1][i0 + i] += v * gr; }
}
function bandNoise(lo, hi) {
  let a = 0, b = 0; const ka = 1 - Math.exp(-2 * Math.PI * hi / SR), kb = 1 - Math.exp(-2 * Math.PI * lo / SR);
  return () => { const x = rnd(); a += ka * (x - a); b += kb * (a - b); return a - b; };
}
const marimba = (f, amp) => (t) => amp * Math.exp(-t * 9) * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-t * 30)) * Math.min(1, t * 400);
const bass = (f, amp) => (t) => amp * Math.exp(-t * 4) * Math.sin(2 * Math.PI * f * t + 0.6 * Math.sin(2 * Math.PI * f * t)) * Math.min(1, t * 200);
const kick = (amp) => (t) => amp * Math.exp(-t * 18) * Math.sin(2 * Math.PI * (48 + 90 * Math.exp(-t * 40)) * t);
const clap = (amp) => { const n = bandNoise(900, 3200); return (t) => amp * n() * (Math.exp(-t * 35) + 0.5 * Math.exp(-Math.abs(t - 0.012) * 300)); };
const shaker = (amp) => { const n = bandNoise(5000, 11000); return (t) => amp * n() * Math.exp(-t * 60) * Math.min(1, t * 300); };

// ---------- música ----------
const M = track();
const chords = [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]], roots = [36, 43, 45, 41], motif = [0, 2, 1, 3, 2, 1, 3, 2];
const quiet = (MU.quiet || []).map(([a, b]) => [T.marks[a] ?? a, T.marks[b] ?? b]);
const energy = (t) => MU.energy * (quiet.some(([a, b]) => t >= a && t < b) ? 0.6 : 1);
for (let bar = 0; bar < Math.ceil(T.duration / (BEAT * 4)); bar++) {
  const c = chords[bar % 4], r = roots[bar % 4];
  for (let e = 0; e < 8; e++) {
    const t = (bar * 4 + e / 2) * BEAT; if (t >= T.duration - 0.4) break;
    const en = energy(t);
    add(M, t, marimba(hz(c[motif[e]] + 12), 0.16 * en), 0.6, e % 2 ? 0.35 : -0.35);
    add(M, t, shaker(0.05 * en), 0.08, 0.5);
    if (e % 4 === 0) { add(M, t, kick(0.5 * en), 0.3); add(M, t, bass(hz(r), 0.28 * en), 0.7); }
    if (e % 4 === 2) add(M, t, clap(0.22 * en), 0.2, -0.1);
  }
}
const tEnd = T.duration - 0.6;
for (const n of [48, 60, 64, 67, 72]) add(M, tEnd, marimba(hz(n), 0.18), 1.2);

// ---------- efeitos ----------
const S = track();
const whoosh = (dur, amp) => { const n = bandNoise(300, 4000); return (t) => amp * n() * Math.sin(Math.PI * Math.min(1, t / dur)) ** 2; };
const pop = (amp) => (t) => amp * Math.exp(-t * 40) * Math.sin(2 * Math.PI * (300 + 900 * Math.exp(-t * 60)) * t);
const ding = (f, amp) => (t) => amp * Math.exp(-t * 3) * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6));
const thump = (amp) => (t) => amp * Math.exp(-t * 25) * Math.sin(2 * Math.PI * (70 + 60 * Math.exp(-t * 50)) * t);
const KINDS = {
  pop: (g) => [pop(0.4 * g), 0.15], thump: (g) => [thump(0.5 * g), 0.3], ding: (g) => [ding(1568, 0.12 * g), 1.0],
  chime: (g) => [ding(2093, 0.1 * g), 1.0], click: (g) => [pop(0.5 * g), 0.12],
};
// fora das palavras faladas
const words = T.words;
const free = (t, len = 0.25) => { for (const w of words) if (t < w.e + 0.03 && t + len > w.s - 0.03) t = w.e + 0.05; return t; };

for (const sc of T.scenes.filter((x) => x.trans && x.D)) add(S, sc.in - 0.05, whoosh(sc.D + 0.1, 0.2), sc.D + 0.1, rnd() * 0.6);
const tu = T.scenes.find((x) => x.trans === "turtle");
if (tu) for (let k = 0; k < 6; k++) add(S, tu.in + k * 0.08, pop(0.1), 0.1, 0.4 - k * 0.15);
for (const f of T.overlays.filter((o) => o.type === "follow")) { const p = f.press ?? f.at + 1.2; add(S, free(p), pop(0.45), 0.12); add(S, free(p) + 0.05, ding(1760, 0.18), 1.0); }
for (const x of T.sfx || []) {
  const k = KINDS[x.kind]; if (!k) { console.warn("efeito desconhecido:", x.kind); continue; }
  const [fn, dur] = k(x.gain ?? 1), at = x.overVoice ? x.at : free(x.at, Math.min(dur, 0.3));
  if (at - x.at > 0.8) { console.log(`  efeito "${x.kind}" em ${x.at.toFixed(2)}s descartado: cairia em cima de fala (mova a âncora para uma pausa)`); continue; }
  if (Math.abs(at - x.at) > 0.01) console.log(`  efeito "${x.kind}" movido de ${x.at.toFixed(2)}s para ${at.toFixed(2)}s (estava em cima de fala)`);
  add(S, at, fn, dur);
}

function writeWav(file, tr) {
  const buf = Buffer.alloc(44 + LEN * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + LEN * 4, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(LEN * 4, 40);
  for (let i = 0; i < LEN; i++) for (let ch = 0; ch < 2; ch++) buf.writeInt16LE(Math.round(Math.tanh(tr[ch][i]) * 32000), 44 + i * 4 + ch * 2);
  fs.writeFileSync(file, buf);
}
writeWav(path.join(PROJ, "build", "music.wav"), M);
writeWav(path.join(PROJ, "build", "sfx.wav"), S);
console.log("music.wav + sfx.wav", (LEN / SR).toFixed(2), "s");
