// Motor de render quadro a quadro: lê /p/build/timeline.json (gerado pelo prep.js a partir do roteiro.json)
// e expõe window.renderAt(t) para o render.js (Puppeteer) fotografar cada frame.
import * as THREE from "three";
import { el, clamp, lerp, prog, eOut, eInOut, eBack } from "./util.js";
import { makeTransitions } from "./transitions.js";
import { makeOverlays, updateOverlays } from "./overlays.js";

const P = "/p/build/";
const T = await (await fetch(P + "timeline.json")).json();
const stateShapes = await (await fetch("data/us-states.json")).json();
const FPS = T.fps;
const pad = (n) => String(n).padStart(4, "0");
const imgCache = new Map();
const loadImg = (url) => { if (!imgCache.has(url)) { const im = new Image(); im.src = url; imgCache.set(url, im.decode().then(() => im)); } return imgCache.get(url); };

// ---------- cenas ----------
const layersEl = document.getElementById("layers"), frontEl = document.getElementById("front");
const GRID_POS = [[18, 250], [546, 250], [18, 970], [546, 970]];
T.scenes.forEach((s, i) => {
  s.div = el("div", { class: "layer" + (s.polaroid ? " polaroid" : "") + (s.grid ? " grid" : "") }, layersEl);
  s.div.style.zIndex = i;
  if (s.grid) {
    s.tiles = s.grid.map((gi, k) => {
      const tile = el("div", { class: "tile", style: `left:${GRID_POS[k][0]}px;top:${GRID_POS[k][1]}px` }, s.div);
      const img = el("img", { class: "media" }, tile);
      if (gi.label) el("div", { class: "lbl", html: gi.label }, tile);
      return { tile, img, ...gi };
    });
    return;
  }
  s.img = el("img", { class: "media" }, s.div);
  if (s.polaroid) el("div", { class: "pcap", html: s.polaroid }, s.div);
  if (s.mask) {   // gêmeo recortado (só as pessoas), desenhado por cima do texto "atrás"
    s.fdiv = el("div", { class: "layer" }, frontEl);
    s.fcan = el("canvas", { class: "media" }, s.fdiv);
  }
});
const frameN = (s, t, frames) => clamp(Math.floor((t - s.in) * FPS) + 1, 1, frames);
async function setFrame(s, t) {
  if (s.grid) {
    await Promise.all(s.tiles.map(async (tl) => {
      const url = `${P}scenes/${tl.id}/${pad(frameN(s, t, tl.frames))}.jpg`;
      if (tl.img.dataset.u !== url) { tl.img.src = url; tl.img.dataset.u = url; await tl.img.decode(); }
    }));
    return;
  }
  const url = s.photo ? `${P}scenes/${s.id}.jpg` : `${P}scenes/${s.id}/${pad(frameN(s, t, s.frames))}.jpg`;
  if (s.img.dataset.u !== url) { s.img.src = url; s.img.dataset.u = url; await s.img.decode(); }
  if (s.fcan) {
    const murl = s.photo ? `${P}masks/${s.id}.png` : `${P}masks/${s.id}/${pad(frameN(s, t, s.frames))}.png`;
    if (s.fcan.dataset.u !== murl) {
      const [im, mk] = await Promise.all([loadImg(url), loadImg(murl)]);
      s.fcan.width = im.naturalWidth; s.fcan.height = im.naturalHeight;
      const c = s.fcan.getContext("2d");
      c.globalCompositeOperation = "source-over"; c.drawImage(im, 0, 0);
      c.globalCompositeOperation = "destination-in"; c.drawImage(mk, 0, 0, im.naturalWidth, im.naturalHeight);
      s.fcan.dataset.u = murl;
      imgCache.delete(murl); if (!s.photo) imgCache.delete(url);
    }
  }
}

// ---------- bichinhos, 3D e overlays ----------
const fx = document.getElementById("fx");
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("three"), alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(1080, 1920, false); renderer.setClearColor(0, 0);
const TR = makeTransitions(fx, renderer);
const OV = makeOverlays(T.overlays || [], { ui: document.getElementById("ui"), back: document.getElementById("back"), fx, stateShapes });

// ---------- legendas ----------
const ui = document.getElementById("ui");
const capBox = el("div", { class: "cap", style: `top:${T.captions?.top ?? 1250}px` }, ui);
const capInner = el("div", { class: "box" }, capBox);
let capKey = "", capSpans = [];
const CAPS = [...T.caps].sort((a, b) => a.s - b.s);
const hidden = (t) => (T.captions?.hide || []).some(([a, b]) => t >= a && t < b);

function transition(s, t, prev) {
  const L = s.div.style; L.clipPath = "none"; L.transform = ""; L.filter = ""; L.opacity = 1;
  const p = s.D ? prog(t, s.in, s.in + s.D) : 1;
  if (!s.trans || p >= 1) {
    if (s.cut === "pop") { const k = prog(t, s.in, s.in + .25); L.transform = `scale(${lerp(1.05, 1, eOut(k))})`; }
    return;
  }
  const tr = TR.T[s.trans];
  if (!tr) throw new Error("transição desconhecida: " + s.trans);
  tr.clip(L, p, eInOut(p), t, prev?.div.style);
  if (tr.draw) tr.draw(p, t, s);
}
function syncFront(s) {
  if (!s.fdiv) return;
  const a = s.div.style, f = s.fdiv.style;
  f.clipPath = a.clipPath; f.transform = a.transform; f.filter = a.filter; f.opacity = a.opacity;
  s.fcan.style.transformOrigin = s.img.style.transformOrigin; s.fcan.style.transform = s.img.style.transform;
}

window.renderAt = async function (t) {
  const loads = [];
  TR.hideAll();
  T.scenes.forEach((s, i) => {
    const on = t >= s.in && (t < s.out || i === T.scenes.length - 1);
    s.div.style.display = on ? "" : "none";
    if (s.fdiv) s.fdiv.style.display = on ? "" : "none";
    if (!on) return;
    loads.push(setFrame(s, t));
    const z = lerp(s.zoom[0], s.zoom[1], eInOut(prog(t, s.in, s.out)));
    if (s.grid) {
      s.tiles.forEach((tl, k) => {
        const a = eBack(prog(t, s.in + .15 + k * .22, s.in + .5 + k * .22));
        tl.tile.style.opacity = clamp(a * 2); tl.tile.style.transform = `scale(${lerp(.6, 1, a)}) rotate(${(k % 2 ? 1.5 : -1.5) * (1 - a * .6)}deg)`;
      });
    } else {
      s.img.style.transformOrigin = `${s.focus[0] * 100}% ${s.focus[1] * 100}%`;
      s.img.style.transform = s.polaroid ? `rotate(-3deg) scale(${z})` : `scale(${z})`;
    }
    transition(s, t, T.scenes[i - 1]);
  });
  T.scenes.forEach(syncFront);
  TR.render3d();
  updateOverlays(OV, t, T);

  // legenda: frase inteira; a palavra falada ganha marca-texto pêssego
  const c = CAPS.find((x) => t >= x.s && t < x.e);
  const hide = !c || hidden(c.words[0].s);
  capBox.style.display = hide ? "none" : "";
  if (!hide) {
    const key = c.s + "|" + c.words.length;
    if (key !== capKey) { capKey = key; capInner.innerHTML = ""; capSpans = c.words.map((wd) => el("span", { class: wd.hl ? "hl" : "", html: wd.w }, capInner)); }
    const k = eBack(prog(t, c.s, c.s + .18));
    capInner.style.transform = `translateY(${16 * (1 - k)}px) scale(${lerp(.94, 1, k)})`;
    c.words.forEach((wd, i) => capSpans[i].classList.toggle("on", t >= wd.s - .03 && t < Math.max(wd.e, (c.words[i + 1]?.s ?? wd.e) - .02)));
  }
  await Promise.all(loads);
  return true;
};
window.READY = true;
