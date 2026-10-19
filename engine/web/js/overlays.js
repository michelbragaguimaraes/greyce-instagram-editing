// Overlays dirigidos pelo roteiro (ver references/roteiro.md). Todos os tempos já chegam em segundos.
// Tipos: big, slab, note, hand, card, counter, arrow, doodle, hearts, follow, map.
import { el, A, g, place, show, NAVY, SKY, PEACH, BLUSH, CORAL, PAPER, clamp, lerp, prog, eOut, eInOut, eBack, popWin } from "./util.js";

const emojiRe = /(\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*|[\u{1F1E6}-\u{1F1FF}]{2})/gu;
const em = (html) => html.replace(emojiRe, '<span class="emoji">$1</span>');
const px = (v) => (typeof v === "number" ? v + "px" : v);

export function makeOverlays(list, { ui, back, fx, stateShapes }) {
  return list.map((o) => {
    const parent = o.type === "big" && o.layer !== "front" ? back : ui;
    const st = (extra = "") => `top:${px(o.top ?? 0)};left:${px(o.left ?? 0)};${o.width ? `width:${px(o.width)};` : ""}${o.size ? `font-size:${px(o.size)};` : ""}${o.align ? `text-align:${o.align};` : ""}${extra}${o.style || ""}`;
    const node = (cls, html, extra) => el("div", { class: "ov " + cls, style: st(extra), html: em(html || "") }, parent);
    let n;
    switch (o.type) {
      case "big": n = node("big" + (o.color === "navy" ? " navy" : ""), o.html, o.left == null ? "left:0;" : ""); break;
      case "slab": n = node("slab", o.html); break;
      case "note": n = node("note", o.html); break;
      case "hand": n = node("hand", o.html); break;
      case "card": {
        const rows = (o.rows || []).map((r) => `<div class="row">${r.html}</div>`).join("");
        n = node("card" + (o.chips ? " chips" : ""), (o.head ? `<div class="head">${o.head}</div>` : "") + (o.chips ? `<div class="wrap">${rows}</div>` : rows));
        break;
      }
      case "counter": n = node("badge", `<b class="n">0</b><span>${o.label || ""}</span>`); break;
      case "follow": {
        n = node("btn", `<span class="t">Seguir</span> <span style="font-weight:600;font-size:42px;opacity:.85">${o.handle || "@agreycealves"}</span>`);
        o.ele = elephant(fx);
        break;
      }
      case "arrow": {
        o.g = g(fx);
        el("svg:path", A({ d: "M0 0 C 40 60 60 120 40 190", fill: "none" }, { "stroke-width": 8 }), o.g);
        el("svg:path", A({ d: "M14 160 L 40 192 L 66 162", fill: "none" }, { "stroke-width": 8 }), o.g);
        break;
      }
      case "doodle": {
        o.g = g(fx);
        if (o.kind === "spark") [[-26, -20, -12, -8], [0, -30, 0, -14], [26, -20, 12, -8]].forEach(([a, b, c, d]) => el("svg:line", A({ x1: a, y1: b, x2: c, y2: d }, { "stroke-width": 6 }), o.g));
        else el("svg:path", A({ d: "M0 18 C -40 -10 -30 -46 0 -24 C 30 -46 40 -10 0 18 Z", fill: "none" }, { "stroke-width": 6 }), o.g);
        break;
      }
      case "hearts": o.hs = Array.from({ length: 12 }, (_, i) => { const h = g(fx); el("svg:path", A({ d: "M0 18 C -40 -10 -30 -46 0 -24 C 30 -46 40 -10 0 18 Z", fill: i % 2 ? PEACH : BLUSH }, { "stroke-width": 5 }), h); return h; }); break;
      case "map": n = mapNode(o, ui, stateShapes); break;
    }
    o.n = n;
    return o;
  });
}

function elephant(fx) {
  const ele = g(fx);
  const legs = [-70, -10, 90, 150].map((x) => el("svg:rect", A({ x: x - 28, y: 90, width: 58, height: 110, rx: 24, fill: SKY }), ele));
  el("svg:path", A({ d: "M220 10 C 250 30 255 60 240 80", fill: "none" }), ele);
  el("svg:ellipse", A({ cx: 50, cy: 30, rx: 190, ry: 125, fill: SKY }), ele);
  const trunkO = el("svg:path", { fill: "none", stroke: NAVY, "stroke-width": 64, "stroke-linecap": "round" }, ele);
  const trunk = el("svg:path", { fill: "none", stroke: SKY, "stroke-width": 50, "stroke-linecap": "round" }, ele);
  el("svg:circle", A({ cx: -130, cy: -50, r: 112, fill: SKY }), ele);
  const ear = el("svg:ellipse", A({ cx: -40, cy: -40, rx: 82, ry: 100, fill: BLUSH }), ele);
  el("svg:circle", { cx: -168, cy: -72, r: 12, fill: NAVY }, ele);
  el("svg:circle", { cx: -164, cy: -77, r: 4, fill: PAPER }, ele);
  el("svg:circle", { cx: -176, cy: -22, r: 20, fill: PEACH, opacity: .85 }, ele);
  return { ele, legs, trunk, trunkO, ear };
}

// mapa: estados desenhados (traço navy + aquarela azul), pinos que caem e rota tracejada
function mapNode(o, ui, shapes) {
  const W = o.width || 900, Hh = o.height || 900;
  const wrap = el("div", { class: "ov", style: `top:${o.top ?? 260}px;left:${o.left ?? 90}px;width:${W}px;height:${Hh}px;` }, ui);
  const svg = el("svg:svg", { viewBox: `0 0 ${W} ${Hh}`, width: W, height: Hh, style: "overflow:visible" }, wrap);
  const names = [].concat(o.states || o.region || "California");
  const polys = names.flatMap((nm) => (shapes[nm] || []).map((r) => ({ nm, r })));
  let lat0 = 0, n = 0;
  polys.forEach(({ r }) => r.forEach(([, la]) => { lat0 += la; n++; }));
  lat0 /= Math.max(1, n);
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xy = ([lo, la]) => [lo * k, -la];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  polys.forEach(({ r }) => r.forEach((p) => { const [x, y] = xy(p); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
  const pad = 40, s = Math.min((W - 2 * pad) / (x1 - x0), (Hh - 2 * pad) / (y1 - y0));
  const ox = (W - s * (x1 - x0)) / 2, oy = (Hh - s * (y1 - y0)) / 2;
  const P = (p) => { const [x, y] = xy(p); return [ox + (x - x0) * s, oy + (y - y0) * s]; };
  o.paths = polys.map(({ nm, r }) => {
    const d = "M" + r.map((p) => P(p).map((v) => v.toFixed(1)).join(" ")).join(" L ") + " Z";
    const focus = !o.highlight || [].concat(o.highlight).includes(nm);
    return el("svg:path", { d, fill: focus ? SKY : PAPER, stroke: NAVY, "stroke-width": 6, "stroke-linejoin": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, "fill-opacity": 0 }, svg);
  });
  o.pinEls = (o.pins || []).map((pin) => {
    const [x, y] = P([pin.lon, pin.lat]);
    const grp = el("svg:g", {}, svg);
    el("svg:path", A({ d: "M0 0 C -26 -34 -40 -52 -40 -74 A 40 40 0 1 1 40 -74 C 40 -52 26 -34 0 0 Z", fill: CORAL }, { "stroke-width": 6 }), grp);
    el("svg:circle", { cx: 0, cy: -76, r: 14, fill: PAPER }, grp);
    const lbl = el("div", { class: "maplbl", style: `position:absolute;left:${x + (pin.dx ?? 30)}px;top:${y + (pin.dy ?? -150)}px;`, html: em(pin.label || "") }, wrap);
    return { grp, lbl, x, y };
  });
  if (o.pinEls.length > 1) {
    const [a, b] = o.pinEls;
    const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 160;
    o.route = el("svg:path", { d: `M${a.x} ${a.y - 40} Q ${mx} ${my} ${b.x} ${b.y - 40}`, fill: "none", stroke: CORAL, "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": "2 22" }, svg);
  }
  return wrap;
}

export function setUI(n, s, o, extra = "") { n.style.opacity = o; n.style.display = o > .01 ? "" : "none"; n.style.transform = `scale(${s}) ${extra}`; }

export function updateOverlays(ovs, t, T) {
  for (const o of ovs) {
    const rot = o.rot ?? 0, a = o.at, b = o.until ?? T.duration + 1;
    switch (o.type) {
      case "big": {
        if (t < a || t > b) { o.n.style.display = "none"; break; }
        const i = a <= 0 && o.instant !== false ? 1 : eOut(prog(t, a, a + .3)), out = prog(t, b - .15, b);
        o.n.style.display = ""; o.n.style.opacity = Math.min(1, i * 1.6) * (1 - out);
        o.n.style.transform = `translateY(${60 * (1 - i)}px) scale(${lerp(.85, 1, i) * lerp(1, 1.06, out)}) rotate(${rot}deg)`;
        break;
      }
      case "slab": case "note": case "hand": case "card": case "counter": case "map": {
        const w = a <= 0 && t <= b ? { s: 1, o: 1 - prog(t, b - .2, b) }       // já visível no frame 0 (capa)
          : o.anim === "stamp" ? stamp(t, a, b) : popWin(t, a, b, o.inD ?? .3, o.outD ?? .2);
        const wob = o.wobble ? ` rotate(${o.wobble * Math.sin(t * 3)}deg)` : "";
        setUI(o.n, w.s, w.o, `rotate(${rot}deg)${wob}`);
        if (o.type === "card") rows(o.n, (o.rows || []).map((r) => r.at ?? a), t);
        if (o.type === "counter") o.n.querySelector(".n").textContent = (o.prefix ?? "+") + Math.round((o.to || 0) * eOut(prog(t, a, a + (o.dur ?? 1.2)))) + (o.suffix ?? "");
        if (o.type === "map" && w.o > 0) drawMap(o, t, a);
        break;
      }
      case "arrow": case "doodle": { const w = popWin(t, a, b); place(o.g, o.x, o.y, w.s * (o.scale ?? 1.2), rot + (o.type === "doodle" ? 8 * Math.sin(t * 3) : 0), w.o); break; }
      case "hearts": o.hs.forEach((h, i) => {
        const k = prog(t, a + i * .07, a + 1.4 + i * .07), ang = i * 2.4;
        place(h, (o.x ?? 540) + Math.cos(ang) * 500 * eOut(k), (o.y ?? 470) - Math.abs(Math.sin(ang)) * 300 * eOut(k) - 80 * k, lerp(.4, 1.7, eOut(k)), 15 * Math.sin(i), t >= a && k > 0 && t < b ? 1 - prog(k, .75, 1) : 0);
      }); break;
      case "follow": {
        const w = popWin(t, a, b, .3, .2), press = o.press ?? a + 1.2, pressed = t >= press;
        const pr = prog(t, press, press + .12) * (1 - prog(t, press + .12, press + .3));
        setUI(o.n, w.s * (1 - .08 * pr), w.o, `rotate(${rot}deg)`);
        o.n.classList.toggle("on", pressed); o.n.querySelector(".t").textContent = pressed ? "Seguindo ✓" : "Seguir";
        const E = o.ele, ex = o.eleX ?? 900, ey = o.eleY ?? 660;
        if (t >= a - .1 && t < b + .3) {
          const walk = eOut(prog(t, a - .1, a + .8)), bob = t < a + .8 ? Math.abs(Math.sin(t * 10)) * 14 : 0;
          const lift = eBack(prog(t, press - .4, press)), wave = t > press + .3 ? Math.sin((t - press - .3) * 8) : 0;
          const d = `M -205 -10 Q ${lerp(-300, -330, lift)} ${lerp(60, -40, lift)} ${-320 + 50 * wave} ${lerp(140, -150, lift) - 25 * Math.abs(wave)}`;
          E.trunk.setAttribute("d", d); E.trunkO.setAttribute("d", d);
          E.legs.forEach((l, i) => l.setAttribute("transform", `translate(0 ${t < a + .8 ? Math.sin(t * 10 + i * 1.6) * 8 : 0})`));
          E.ear.setAttribute("transform", `rotate(${6 * Math.sin(t * 6)} -40 -40)`);
          place(E.ele, lerp(1400, ex, walk), ey - bob, o.eleScale ?? .72, 0, 1 - prog(t, b, b + .3));
        } else show(E.ele, false);
        break;
      }
    }
  }
}
function stamp(t, a, b) {
  if (t < a || t > b) return { s: 0, o: 0 };
  const k = prog(t, a, a + .16), out = prog(t, b - .2, b);
  return { s: lerp(1.7, 1, eOut(k)), o: clamp(k * 4) * (1 - out) };
}
function rows(card, times, t) {
  card.querySelectorAll(".row").forEach((r, i) => {
    const ti = times[i];
    r.style.display = t >= ti ? "" : "none";
    const a = prog(t, ti, ti + .3);
    r.style.opacity = a; r.style.transform = `translateX(${-40 * (1 - eOut(a))}px)`;
    const b = r.querySelector("b"); if (b) b.style.transform = `scale(${lerp(1.6, 1, eBack(prog(t, ti, ti + .35)))})`;
  });
}
function drawMap(o, t, a) {
  const k = prog(t, a, a + 1.0);
  o.paths.forEach((p) => { p.setAttribute("stroke-dashoffset", 1 - eInOut(k)); p.setAttribute("fill-opacity", prog(t, a + .6, a + 1.1)); });
  o.pinEls.forEach((pin, i) => {
    const pk = eBack(prog(t, a + .9 + i * .5, a + 1.3 + i * .5));
    pin.grp.setAttribute("transform", `translate(${pin.x} ${pin.y - 120 * (1 - pk)}) scale(${Math.max(0.001, pk)})`);
    pin.lbl.style.opacity = prog(t, a + 1.1 + i * .5, a + 1.4 + i * .5);
  });
  if (o.route) { o.route.setAttribute("opacity", prog(t, a + 1.2, a + 1.3)); o.route.style.strokeDashoffset = -t * 60; }
}
