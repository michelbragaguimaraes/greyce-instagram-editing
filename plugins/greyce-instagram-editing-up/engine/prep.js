// Prepara um projeto de reel a partir do roteiro.json (ver references/roteiro.md).
//   node prep.js <pasta-do-projeto>
// Gera em <projeto>/build/: narr/, narracao.wav, scenes/, masks/, stems/, cache/ e timeline.json.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { loadConfig, ff, probe, pythonEnv } = require("./lib/common");

const PROJ = path.resolve(process.argv[2] || ".");
const C = loadConfig(PROJ);
const R = JSON.parse(fs.readFileSync(path.join(PROJ, "roteiro.json"), "utf8"));
const ROOT = path.resolve(PROJ, R.root || ".");                // onde estão os vídeos/fotos/áudios brutos
const TRF = path.join(PROJ, "analise", "transcricao.json");
if (!fs.existsSync(TRF)) throw new Error("Falta analise/transcricao.json — rode: python tools/transcribe.py " + PROJ);
const TR = JSON.parse(fs.readFileSync(TRF, "utf8"));
const B = path.join(PROJ, "build");
const FPS = R.fps || 30;
const src = (k) => path.join(ROOT, (R.src && R.src[k]) || k);
const srcName = (k) => (R.src && R.src[k]) || k;
const trOf = (k) => {
  const t = TR[srcName(k)] || TR[path.basename(srcName(k))];
  if (!t) throw new Error("Sem transcrição para " + srcName(k));
  return t;
};
for (const d of ["narr", "scenes", "stems", "masks", "cache"]) fs.mkdirSync(path.join(B, d), { recursive: true });

// ---------- 1. narração: pausas cortadas pelo volume da voz, fala levemente acelerada ----------
// Regra da edição original da Greyce: pausa > PAUSE vira respiro curto; fala 1,07x. Nenhuma palavra é cortada.
const TEMPO = R.tempo || 1.07, PAUSE = R.pauseMax || 0.16, BREATH = R.breath ?? 0.06, PAD = 0.04;
const VOICE_FX = "highpass=f=85,afftdn=nf=-28,equalizer=f=200:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=1.5,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-16:TP=-2:LRA=6";
R.blocks.forEach((blk, bi) => ff(["-i", src(blk.audio), ...(blk.clipFrom != null ? ["-ss", String(blk.clipFrom)] : []), "-vn", "-ac", "1", "-ar", "48000", "-af", VOICE_FX, path.join(B, "narr", `B${bi}.wav`)]));

function speechRegions(file) {
  const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
  const n = pcm.length / 2, hop = 160, rms = [];
  for (let i = 0; i + hop <= n; i += hop) {
    let acc = 0;
    for (let k = 0; k < hop; k++) { const v = pcm.readInt16LE((i + k) * 2) / 32768; acc += v * v; }
    rms.push(Math.sqrt(acc / hop));
  }
  const sorted = [...rms].sort((x, y) => x - y);
  const thr = Math.max(sorted[Math.floor(sorted.length * 0.1)] * 3, sorted[Math.floor(sorted.length * 0.98)] * 0.05);
  const regs = [];
  rms.forEach((v, i) => {
    if (v < thr) return;
    const t = (i * hop) / 16000;
    if (regs.length && t - regs.at(-1)[1] <= PAUSE) regs.at(-1)[1] = t + 0.01; else regs.push([t, t + 0.01]);
  });
  return regs.filter((r) => r[1] - r[0] > 0.06).map((r) => [Math.max(0, r[0] - PAD), r[1] + PAD]);
}

// correções de grafia da transcrição (nomes próprios etc.), ex.: { "Lia": "Liam" } — vale com ou sem pontuação
const FIX = (R.captions && R.captions.replace) || {};
const fixWord = (w) => { const m = w.match(/^(.*?)([.,!?]*)$/); return (FIX[m[1]] ?? m[1]) + m[2]; };
const words = [], segs = [], marks = {};
let tOut = 0;
R.blocks.forEach((blk, bi) => {
  let ws = trOf(blk.audio).segs.flatMap((s) => s.w);
  if (blk.clipFrom != null) ws = ws.filter((w) => w.s >= blk.clipFrom).map((w) => ({ ...w, s: w.s - blk.clipFrom, e: w.e - blk.clipFrom }));
  if (blk.fromWord != null) ws = ws.slice(blk.fromWord);
  if (blk.to != null) ws = ws.slice(0, blk.to + 1 - (blk.fromWord || 0));
  let regs = speechRegions(path.join(B, "narr", `B${bi}.wav`));
  const lo = ws[0].s - 0.25, hi = ws.at(-1).e + 0.25;
  regs = regs.filter((r) => r[1] > lo && r[0] < hi).map((r) => [Math.max(r[0], lo), Math.min(r[1], hi)]);
  const gap = bi === 0 ? (R.lead ?? 0.12) : (blk.gap ?? R.blockGap ?? 0.2) + (R.blocks[bi - 1].gapAfter || 0);
  let o = tOut + gap;
  const map = [];
  regs.forEach((r, k) => { if (k) o += BREATH; segs.push({ b: bi, from: r[0], to: r[1], at: o }); map.push({ from: r[0], to: r[1], at: o }); o += r[1] - r[0]; });
  const toOut = (x) => { for (const m of map) if (x <= m.to) return m.at + Math.max(0, x - m.from); const m = map.at(-1); return m.at + (m.to - m.from); };
  ws.forEach((w, i) => {
    const s0 = toOut(w.s), e0 = Math.max(s0 + 0.05, toOut(w.e));
    words.push({ b: blk.id, i, w: fixWord(w.w), s: +(s0 / TEMPO).toFixed(3), e: +(e0 / TEMPO).toFixed(3) });
    marks[`${blk.id}:${i}`] = +(s0 / TEMPO).toFixed(3);
  });
  tOut = o;
  marks[`${blk.id}:end`] = +(toOut(ws.at(-1).e) / TEMPO).toFixed(3);
  marks[`${blk.id}:start`] = marks[`${blk.id}:0`];
});
const duration = +(Math.ceil((tOut / TEMPO + (R.tail ?? 1.6)) * FPS) / FPS).toFixed(3);
marks.end = duration;
{
  const inputs = [], parts = [];
  R.blocks.forEach((_, bi) => inputs.push("-i", path.join(B, "narr", `B${bi}.wav`)));
  const used = R.blocks.map((_, bi) => segs.filter((s) => s.b === bi).length);
  R.blocks.forEach((_, bi) => parts.push(`[${bi}]asplit=${used[bi]}` + Array.from({ length: used[bi] }, (_, k) => `[b${bi}_${k}]`).join("")));
  const cnt = R.blocks.map(() => 0);
  segs.forEach((s, k) => {
    const d = s.to - s.from;
    parts.push(`[b${s.b}_${cnt[s.b]++}]atrim=${s.from.toFixed(3)}:${s.to.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st=${(d - 0.025).toFixed(3)}:d=0.025,adelay=${Math.round(s.at * 1000)}:all=1[g${k}]`);
  });
  parts.push(segs.map((_, k) => `[g${k}]`).join("") + `amix=inputs=${segs.length}:normalize=0,atempo=${TEMPO},apad,atrim=0:${duration}[out]`);
  ff([...inputs, "-filter_complex", parts.join(";"), "-map", "[out]", "-ac", "2", path.join(B, "narracao.wav")]);
}

// ---------- âncoras ----------
// "B7:5" (6ª palavra do bloco B7), "B7:start", "B7:end", "s14.in" / "s14.out" / "s14.t", "end", número; + / - deslocamento
let scenes = [];
function mark(ref) {
  if (typeof ref === "number") return ref;
  const m = String(ref).match(/^([A-Za-z0-9_]+(?::\w+|\.(?:in|out|t))?)\s*([+-]\s*[\d.]+)?$/);
  if (!m) throw new Error("âncora inválida: " + ref);
  let base;
  if (marks[m[1]] != null) base = marks[m[1]];
  else if (/\.(in|out|t)$/.test(m[1])) { const [id, k] = m[1].split("."); const s = scenes.find((x) => x.id === id); if (!s) throw new Error("cena inexistente na âncora: " + ref); base = s[k]; }
  else throw new Error("âncora inválida: " + ref);
  return +(base + (m[2] ? +m[2].replace(/\s/g, "") : 0)).toFixed(3);
}

// ---------- 2. cenas ----------
const IMG = /\.(jpe?g|png|webp|heic|avif)$/i;
scenes = R.scenes.map((s) => ({ ...s, photo: s.photo ?? (s.src ? IMG.test(srcName(s.src)) : false), t: mark(s.at) })).sort((a, b) => a.t - b.t);
const TR_D = { zoomblur: .7, fade: .5, grid: .6, slide: .8, heart: .6, whip: .6, footprints: 1, elefootprints: .8, trunk: 1, splash: 1.1, cable: 1.1, turtle: 1.4, meerkat: .7, snake: .8, butterflies: .8, flamingo: .8 };
scenes.forEach((s, i) => {
  const D = s.trans ? (s.D ?? TR_D[s.trans] ?? .7) : 0;
  s.in = +(i === 0 ? 0 : s.t - D / 2).toFixed(3);
  s.D = D;
  const nx = scenes[i + 1];
  s.out = +(nx ? nx.t + (nx.trans ? (nx.D ?? TR_D[nx.trans] ?? .7) / 2 : 0) : duration).toFixed(3);
  if (s.D && s.D < 0.6 && !["whip", "fade", "heart", "grid"].includes(s.trans)) console.warn(`! ${s.id}: transição "${s.trans}" com ${s.D}s — abaixo de 0,6 s o bichinho não é visto`);
});

const ESR = C.esr, CACHE = path.join(B, "cache");
const sh = (cmd, args, env) => execFileSync(cmd, args, { stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, ...env } });
const upscale = R.upscale ?? C.upscale;
function esr(inDir, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  sh(ESR, ["-i", inDir, "-o", outDir, "-n", "realesrgan-x4plus", "-m", path.join(path.dirname(ESR), "models"), "-f", "png"]);
}
function clipFrames(srcKey, from, need, outDir, w = 1080, h = 1920) {
  const avail = probe(src(srcKey));
  if (from + need > avail) { from = Math.max(0, avail - need - 0.05); console.warn(`! ${srcName(srcKey)} curto: início recuado para ${from.toFixed(2)}s`); }
  const speed = Math.min(1, (avail - from) / need);
  const key = `${srcName(srcKey)}_${from.toFixed(2)}_${need.toFixed(2)}_${speed.toFixed(3)}_${upscale ? "up" : "nu"}`.replace(/[^\w.-]/g, "_");
  const dir = path.join(CACHE, key), raw = path.join(dir, "raw"), up = path.join(dir, "up");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const vfBase = `setpts=PTS/${speed.toFixed(4)},fps=${FPS}`;
  if (!upscale) {
    ff(["-ss", String(from), "-t", String(need * speed), "-i", src(srcKey), "-an", "-vf", `${vfBase},scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}`, "-q:v", "2", path.join(outDir, "%04d.jpg")]);
    return fs.readdirSync(outDir).length;
  }
  if (!fs.existsSync(path.join(dir, "ok"))) {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(raw, { recursive: true });
    ff(["-ss", String(from), "-t", String(need * speed), "-i", src(srcKey), "-an", "-vf", vfBase, path.join(raw, "%04d.png")]);
    console.log(`  upscale ${srcName(srcKey)} (${fs.readdirSync(raw).length} frames)…`);
    esr(raw, up);
    fs.writeFileSync(path.join(dir, "ok"), "");
  }
  const sc = `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}`;
  ff(["-i", path.join(up, "%04d.png"), "-i", path.join(raw, "%04d.png"), "-filter_complex",
    `[0]${sc}[e];[1]${sc}[l];[e][l]blend=all_expr='A*0.65+B*0.35',noise=alls=3:allf=t+u`, "-q:v", "2", path.join(outDir, "%04d.jpg")]);
  return fs.readdirSync(outDir).length;
}
function photoSrc(srcKey) {  // HEIC do iPhone → JPEG (o ffmpeg nem sempre lê HEIC)
  const f = src(srcKey);
  if (!/\.heic$/i.test(f)) return f;
  const jpg = path.join(CACHE, ("heic_" + srcName(srcKey)).replace(/[^\w.-]/g, "_") + ".jpg");
  if (!fs.existsSync(jpg)) { const py = pythonEnv(C); sh(py.python, [path.join(__dirname, "tools", "heic2jpg.py"), f, jpg], py.env); }
  return jpg;
}
function photo(srcKey, out, vf) {
  const input = photoSrc(srcKey);
  if (!upscale) { ff(["-i", input, "-frames:v", "1", "-vf", vf, "-q:v", "2", out]); return; }
  const dir = path.join(CACHE, ("photo_" + srcName(srcKey)).replace(/[^\w.-]/g, "_"));
  if (!fs.existsSync(path.join(dir, "ok"))) {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(path.join(dir, "in"), { recursive: true });
    ff(["-i", input, "-frames:v", "1", path.join(dir, "in", "0001.png")]);
    esr(path.join(dir, "in"), path.join(dir, "up"));
    fs.writeFileSync(path.join(dir, "ok"), "");
  }
  ff(["-i", path.join(dir, "up", "0001.png"), "-i", path.join(dir, "in", "0001.png"), "-filter_complex",
    `[0]${vf}[e];[1]${vf}[l];[e][l]blend=all_expr='A*0.6+B*0.4',noise=alls=2:allf=u`, "-q:v", "2", out]);
}
function mask(kind, input, output) {
  const n = fs.statSync(input).isDirectory() ? fs.readdirSync(input).length : 1;
  if (C.segDevice === "cpu" && n > (C.maxMaskFramesCPU || 120)) console.warn(`! recorte de ${n} frames na CPU (~${Math.round(n * (kind === "fast" ? .6 : 8) / 60)} min). Para vídeo longo use "mask": "fast" ou recorte só um trecho curto.`);
  console.log(`  recorte (${kind}) ${path.basename(input)}…`);
  const py = pythonEnv(C);
  sh(py.python, [path.join(__dirname, "tools", "seg.py"), kind, input, output, C.segDevice || "cuda"], py.env);
}

for (const s of scenes) {
  const need = s.out - s.in + 0.2;
  if (s.grid) { s.grid.forEach((gi, k) => { gi.id = `${s.id}_g${k}`; gi.frames = clipFrames(gi.src, gi.from || 0, need, path.join(B, "scenes", gi.id), 540, 960); }); continue; }
  if (s.photo) {
    const out = path.join(B, "scenes", s.id + ".jpg");
    photo(s.src, out, s.polaroid ? "scale=1400:-2:flags=lanczos" : "scale=-2:2240:flags=lanczos");
    if (s.mask) mask(s.mask, out, path.join(B, "masks", s.id + ".png"));
    continue;
  }
  s.frames = clipFrames(s.src, s.from || 0, need, path.join(B, "scenes", s.id));
  if (s.mask) mask(s.mask, path.join(B, "scenes", s.id), path.join(B, "masks", s.id));
}
scenes.forEach((s) => { s.zoom = s.zoom || [1, 1.06]; s.focus = s.focus || [0.5, 0.5]; });

// ---------- 3. sons dos vídeos (ambiente / falas de quem aparece) ----------
const extraCaps = [];
const ambient = (R.ambient || []).map((a, i) => {
  const f = path.join(B, "stems", `amb_${i}.wav`), at = mark(a.at);
  ff(["-ss", String(a.from), "-t", String(a.dur), "-i", src(a.src), "-vn", "-ac", "2", "-ar", "48000",
    "-af", `highpass=f=90,loudnorm=I=-18:TP=-2,volume=${a.gain ?? 1},afade=t=in:d=0.04,afade=t=out:st=${a.dur - 0.1}:d=0.1`, f]);
  if (a.caption) {
    const ws = trOf(a.src).segs.flatMap((s) => s.w).filter((w) => w.s >= a.from - .05 && w.e <= a.from + a.dur + .05)
      .map((w) => ({ w: fixWord(w.w), s: +(w.s - a.from + at).toFixed(3), e: +(w.e - a.from + at).toFixed(3), hl: false }));
    if (ws.length) { ws.at(-1).hl = true; extraCaps.push({ s: ws[0].s - .06, e: Math.min(at + a.dur, ws.at(-1).e + .35), words: ws }); }
  }
  return { f, at };
});

// ---------- 4. legendas em frases curtas ----------
const kw = new Set(((R.captions && R.captions.keywords) || R.keywords || []).map((k) => k.toLowerCase()));
const clean = (w) => w.replace(/[.,!?'"]/g, "").toLowerCase();
const chunks = [];
let cur = [];
words.forEach((w, i) => {
  cur.push({ ...w, hl: kw.has(clean(w.w)) });
  const nx = words[i + 1], len = cur.map((x) => x.w).join(" ").length;
  if (!nx || nx.b !== w.b || (/[.,!?]$/.test(w.w) && cur.length >= 2) || len >= 22 || (nx && nx.s - w.e > 0.3)) { chunks.push(cur); cur = []; }
});
const caps = chunks.map((c, i) => {
  const nx = chunks[i + 1];
  const end = nx && nx[0].b === c[0].b ? nx[0].s - 0.04 : c.at(-1).e + 0.35;
  return { s: +(c[0].s - 0.06).toFixed(3), e: +end.toFixed(3), words: c.map((w) => ({ w: w.w, s: w.s, e: w.e, hl: w.hl })) };
}).concat(extraCaps);

// ---------- 5. overlays e efeitos sonoros: resolve as âncoras ----------
const TIME_KEYS = ["at", "until", "press"];
const overlays = (R.overlays || []).map((o) => {
  const r = { ...o };
  for (const k of TIME_KEYS) if (r[k] != null) r[k] = mark(r[k]);
  if (r.rows) r.rows = r.rows.map((row) => ({ ...row, at: row.at != null ? mark(row.at) : r.at }));
  return r;
});
const captions = { top: R.captions?.top ?? 1250, hide: (R.captions?.hide || []).map(([a, b]) => [mark(a), mark(b)]) };
const sfx = (R.sfx || []).map((x) => ({ ...x, at: mark(x.at) }));

const out = { fps: FPS, duration, music: R.music || {}, scenes, words, caps, marks, ambient, overlays, captions, sfx, output: R.output || path.basename(PROJ) };
fs.writeFileSync(path.join(B, "timeline.json"), JSON.stringify(out, null, 1));
console.log(`duração ${duration}s · ${scenes.length} cenas · ${overlays.length} overlays · ${caps.length} frases de legenda`);
console.log(R.blocks.map((b) => `${b.id} ${marks[b.id + ":start"].toFixed(2)}–${marks[b.id + ":end"].toFixed(2)}`).join("  "));
