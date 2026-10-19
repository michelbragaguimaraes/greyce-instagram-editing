// Transições com bichinhos (SVG no traço navy + aquarela da Greyce, e a tartaruga 3D em Three.js).
// Cada transição tem: clip(s, p, e, t, prev) → estilo da cena que entra (e da que sai)
//                     draw(p, t, s)        → desenha os bichinhos por cima
// p = progresso 0..1 da transição; e = p suavizado. A cena que entra é sempre a de cima.
import * as THREE from "three";
import { el, A, g, place, show, NAVY, SKY, PEACH, BLUSH, CORAL, PAPER, clamp, lerp, prog, eOut, eInOut, eBack } from "./util.js";

export function makeTransitions(fx, renderer) {
  const parts = [];
  const add = (n) => (parts.push(n), n);

  // ---------- pegadinhas de bebê ----------
  function babyFoot() {
    const f = add(g(fx));
    el("svg:path", A({ d: "M0 -38 C 26 -38 30 -6 24 18 C 18 42 -18 44 -22 18 C -26 -4 -24 -38 0 -38 Z", fill: NAVY }), f);
    [[-16, -60, 9], [-2, -66, 8], [11, -64, 7], [22, -57, 6], [30, -46, 5]].forEach(([x, y, r]) => el("svg:circle", { cx: x, cy: y, r, fill: NAVY }, f));
    return f;
  }
  const babyFeet = Array.from({ length: 8 }, babyFoot);
  // ---------- pegada de elefante ----------
  function eleFoot() {
    const f = add(g(fx));
    el("svg:ellipse", A({ rx: 62, ry: 56, fill: SKY }), f);
    [-34, 0, 34].forEach((x) => el("svg:ellipse", A({ cx: x, cy: -52, rx: 14, ry: 10, fill: PAPER }, { "stroke-width": 5 }), f));
    return f;
  }
  const eleFeet = Array.from({ length: 5 }, eleFoot);
  // ---------- bondinho ----------
  const cable = add(el("svg:line", A({ x1: -60, y1: 230, x2: 1140, y2: 760, "stroke-width": 10 }), fx));
  const gondola = add(g(fx));
  el("svg:line", A({ x1: 0, y1: 0, x2: 0, y2: 90 }), gondola);
  el("svg:rect", A({ x: -120, y: 90, width: 240, height: 210, rx: 44, fill: SKY }), gondola);
  el("svg:rect", A({ x: -88, y: 124, width: 176, height: 90, rx: 20, fill: PAPER }), gondola);
  el("svg:circle", { cx: -36, cy: 176, r: 20, fill: BLUSH, stroke: NAVY, "stroke-width": 5 }, gondola);
  el("svg:circle", { cx: 34, cy: 168, r: 26, fill: BLUSH, stroke: NAVY, "stroke-width": 5 }, gondola);
  el("svg:circle", A({ cx: 0, cy: 0, r: 18, fill: PEACH }), gondola);
  // ---------- cabeça de elefante (tromba empurra) ----------
  const eleHead = add(g(fx));
  el("svg:ellipse", A({ cx: -40, cy: 0, rx: 120, ry: 140, fill: BLUSH }), eleHead);
  el("svg:circle", A({ cx: 40, cy: 10, r: 120, fill: SKY }), eleHead);
  const headTrunkO = el("svg:path", { fill: "none", stroke: NAVY, "stroke-width": 78, "stroke-linecap": "round" }, eleHead);
  const headTrunk = el("svg:path", { fill: "none", stroke: SKY, "stroke-width": 62, "stroke-linecap": "round" }, eleHead);
  el("svg:circle", { cx: 86, cy: -20, r: 13, fill: NAVY }, eleHead);
  el("svg:circle", { cx: 90, cy: -24, r: 4, fill: PAPER }, eleHead);
  el("svg:circle", { cx: 80, cy: 34, r: 20, fill: PEACH, opacity: .85 }, eleHead);
  // ---------- água ----------
  const waveBack = add(el("svg:path", A({ fill: SKY }), fx));
  const waveFront = add(el("svg:path", A({ fill: "#BFDDF8" }), fx));
  const drops = Array.from({ length: 14 }, () => add(el("svg:path", A({ d: "M0 -30 C 14 -8 20 4 20 12 A 20 20 0 0 1 -20 12 C -20 4 -14 -8 0 -30 Z", fill: SKY }, { "stroke-width": 5 }), fx)));
  const bubbles = Array.from({ length: 12 }, () => add(el("svg:circle", A({ r: 10, fill: "rgba(208,232,252,.6)" }, { "stroke-width": 5 }), fx)));
  // ---------- suricato ----------
  const meer = add(g(fx));
  el("svg:ellipse", A({ cx: 0, cy: 250, rx: 190, ry: 46, fill: NAVY }), meer);
  const meerBody = g(meer);
  el("svg:path", A({ d: "M-80 260 C -95 120 -70 -20 -40 -70 L 40 -70 C 70 -20 95 120 80 260 Z", fill: BLUSH }), meerBody);
  el("svg:path", { d: "M-40 250 C -50 140 -30 40 0 10 C 30 40 50 140 40 250 Z", fill: PAPER }, meerBody);
  el("svg:ellipse", A({ cx: 0, cy: -120, rx: 70, ry: 64, fill: BLUSH }), meerBody);
  el("svg:ellipse", A({ cx: 18, cy: -100, rx: 62, ry: 36, fill: BLUSH }), meerBody);
  [[-26, -134], [26, -134]].forEach(([x, y]) => { el("svg:ellipse", { cx: x, cy: y, rx: 18, ry: 22, fill: NAVY }, meerBody); el("svg:circle", { cx: x + 5, cy: y - 7, r: 6, fill: PAPER }, meerBody); });
  el("svg:circle", { cx: 66, cy: -102, r: 12, fill: NAVY }, meerBody);
  [[-70, -170], [70, -170]].forEach(([x, y]) => el("svg:circle", A({ cx: x, cy: y, r: 16, fill: PEACH }), meerBody));
  // ---------- cobra ----------
  const snakeOut = add(el("svg:path", { fill: "none", stroke: NAVY, "stroke-width": 92, "stroke-linecap": "round", "stroke-linejoin": "round" }, fx));
  const snakeIn = add(el("svg:path", { fill: "none", stroke: SKY, "stroke-width": 76, "stroke-linecap": "round", "stroke-linejoin": "round" }, fx));
  const snakeDots = add(el("svg:path", { fill: "none", stroke: PEACH, "stroke-width": 26, "stroke-linecap": "round", "stroke-dasharray": "1 70" }, fx));
  const snakeHead = add(g(fx));
  el("svg:path", A({ d: "M40 0 L 110 -8 M110 -8 L 130 -24 M110 -8 L 132 4", stroke: CORAL, "stroke-width": 8, fill: "none" }), snakeHead);
  el("svg:ellipse", A({ cx: 0, cy: 0, rx: 74, ry: 58, fill: SKY }), snakeHead);
  [[14, -26], [14, 26]].forEach(([x, y]) => { el("svg:circle", { cx: x, cy: y, r: 13, fill: NAVY }, snakeHead); el("svg:circle", { cx: x + 4, cy: y - 4, r: 4, fill: PAPER }, snakeHead); });
  // ---------- borboletas ----------
  const flies = Array.from({ length: 16 }, (_, i) => {
    const b = add(g(fx)), wl = g(b), wr = g(b), col = [SKY, PEACH, BLUSH][i % 3];
    el("svg:path", A({ d: "M0 0 C -40 -70 -90 -40 -70 0 C -90 30 -40 60 0 10 Z", fill: col }, { "stroke-width": 5 }), wl);
    el("svg:path", A({ d: "M0 0 C 40 -70 90 -40 70 0 C 90 30 40 60 0 10 Z", fill: col }, { "stroke-width": 5 }), wr);
    el("svg:line", A({ x1: 0, y1: -24, x2: 0, y2: 30 }, { "stroke-width": 8 }), b);
    return { b, wl, wr, x: (i * 137) % 1080, dy: ((i * 53) % 260) - 60, ph: i * 1.7, sc: .7 + ((i * 31) % 50) / 100 };
  });
  // ---------- flamingo ----------
  const flamLegO = add(el("svg:path", { fill: "none", stroke: NAVY, "stroke-width": 30, "stroke-linecap": "round", "stroke-linejoin": "round" }, fx));
  const flamLeg = add(el("svg:path", { fill: "none", stroke: CORAL, "stroke-width": 16, "stroke-linecap": "round", "stroke-linejoin": "round" }, fx));
  const flamFoot = add(g(fx));
  el("svg:path", A({ d: "M0 0 L -70 40 Q -35 30 0 46 Q 35 30 70 40 Z", fill: CORAL }), flamFoot);

  // ---------- tartaruga 3D ----------
  const scene3 = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-540, 540, 960, -960, -2000, 2000); cam.position.z = 1000;
  scene3.add(new THREE.HemisphereLight(0xffffff, 0xd0e8fc, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(-300, 600, 800); scene3.add(sun);
  const grad = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const toon = (c, map) => new THREE.MeshToonMaterial({ color: c, gradientMap: grad, map });
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x093269, side: THREE.BackSide });
  function shellTexture() {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const x = c.getContext("2d"); x.fillStyle = "#D0E8FC"; x.fillRect(0, 0, 1024, 512);
    x.strokeStyle = "#093269"; x.lineWidth = 14; x.lineJoin = "round"; const R = 64;
    for (let row = -1; row < 6; row++) for (let col = -1; col < 10; col++) {
      const cx = col * R * 1.75 + (row % 2) * R * .875, cy = row * R * 1.5 + 40;
      x.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; x.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); }
      x.closePath(); x.fillStyle = (row + col) % 3 ? "#D0E8FC" : "#BFDDF8"; x.fill(); x.stroke();
      x.fillStyle = "#FDB498"; x.beginPath(); x.arc(cx, cy, 12, 0, 7); x.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function blob(geo, mat, sx, sy, sz, ol = 1.06) {
    const grp = new THREE.Group(); const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); grp.add(m);
    const o = new THREE.Mesh(geo, inkMat); o.scale.set(sx * ol, sy * ol, sz * ol); grp.add(o); return grp;
  }
  const sph = new THREE.SphereGeometry(1, 48, 32);
  const turtle = new THREE.Group();
  const shell = blob(new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI * .55), toon(0xffffff, shellTexture()), 330, 190, 250, 1.04);
  shell.position.y = -20; turtle.add(shell);
  const belly = blob(sph, toon(0xfcd9cb), 320, 60, 240, 1.05); belly.position.y = -40; turtle.add(belly);
  const head = new THREE.Group(); head.position.set(-380, 10, 40); turtle.add(head);
  head.add(blob(sph, toon(0xfcd9cb), 105, 92, 92, 1.07));
  for (const z of [55, -55]) {
    const eye = new THREE.Mesh(sph, new THREE.MeshBasicMaterial({ color: 0x093269 })); eye.scale.set(16, 20, 16); eye.position.set(-62, 30, z); head.add(eye);
    const hl = new THREE.Mesh(sph, new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.scale.setScalar(6); hl.position.set(-74, 38, z * 1.2); head.add(hl);
    const ck = new THREE.Mesh(sph, new THREE.MeshBasicMaterial({ color: 0xfdb498 })); ck.scale.set(10, 14, 18); ck.position.set(-48, -10, z * 1.35); head.add(ck);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(26, 5, 8, 24, Math.PI), new THREE.MeshBasicMaterial({ color: 0x093269 }));
  smile.position.set(-90, -12, 0); smile.rotation.set(0, Math.PI / 2, Math.PI); head.add(smile);
  const flippers = [[-180, 1, 1], [-180, -1, 1], [210, 1, .7], [210, -1, .7]].map(([x, side, s]) => {
    const p = new THREE.Group(); p.position.set(x, -40, side * 210);
    const f = blob(sph, toon(0xfcd9cb), 150 * s, 34 * s, 70 * s, 1.08); f.position.x = -70 * s; p.add(f);
    p.userData = { side, front: x < 0 }; turtle.add(p); return p;
  });
  turtle.rotation.set(.55, -.25, 0); turtle.visible = false; scene3.add(turtle);

  const waveY = (x, y0, t) => y0 + 38 * Math.sin(x / 95 + t * 7) + 18 * Math.sin(x / 41 - t * 11);
  const snakeY = (x, y0, t) => y0 + 46 * Math.sin(x / 115 - t * 9);

  // ---------- catálogo ----------
  // duração sugerida (D) em segundos; menos que ~0,6 s o bichinho não é visto.
  const T = {
    cut: { D: 0, clip() {} },
    zoomblur: { D: .7, clip(L, p, e) { L.opacity = e; L.transform = `scale(${lerp(1.3, 1, e)})`; L.filter = `blur(${(1 - e) * 16}px)`; } },
    fade: { D: .5, clip(L, p, e) { L.opacity = e; } },
    grid: { D: .6, clip(L, p) { L.opacity = eOut(p); } },
    slide: { D: .8, clip(L, p) { L.transform = `translateX(${1080 * (1 - eOut(p))}px)`; } },
    heart: { D: .6, clip(L, p) { L.clipPath = `circle(${eOut(p) * 1300}px at 540px 820px)`; } },
    whip: { D: .6, clip(L, p, e, t, P) {
      L.transform = `translateX(${1080 * (1 - e)}px)`; L.filter = `blur(${Math.sin(p * Math.PI) * 26}px)`;
      if (P) { P.transform = `translateX(${-1080 * e}px)`; P.filter = L.filter; } } },
    footprints: { D: 1.0,
      clip(L, p) { L.clipPath = `circle(${eOut(prog(p, .55, 1)) * 1500}px at 560px 960px)`; },
      draw(p) { babyFeet.forEach((f, i) => { const k = i / 7, a = p * 1.6 - k;
        place(f, lerp(300, 560, k) + (i % 2 ? 46 : -46), lerp(1760, 980, k), a > 0 ? 1.6 : 0, 18 + (i % 2 ? 8 : -8), clamp(a * 4) * (1 - prog(p, .88, 1))); }); } },
    elefootprints: { D: .8,
      clip(L, p, e) { const x = lerp(-140, 1220, e); L.clipPath = `inset(0 ${clamp(1080 - x, 0, 1080)}px 0 0)`; },
      draw(p) { const front = lerp(-140, 1220, eInOut(p)); eleFeet.forEach((f, i) => { const x = i * 280 - 40; place(f, x, 1000 + (i % 2 ? 110 : -60), 1.3, 90, x < front ? 1 : 0); }); } },
    trunk: { D: 1.0,
      clip(L, p, e, t, P) { L.transform = `translateX(${-1080 * (1 - e)}px)`; if (P) P.transform = `translateX(${1080 * e}px)`; },
      draw(p) { const e = eInOut(p), d = `M 120 30 C 200 60 240 -40 300 ${10 - 60 * Math.sin(e * 7)}`;
        headTrunk.setAttribute("d", d); headTrunkO.setAttribute("d", d); place(eleHead, 1080 * e - 360, 1000, 1.5); } },
    splash: { D: 1.1,
      clip(L, p, e, t) { const y = lerp(2050, -220, e), pts = ["0px 1920px", "1080px 1920px"];
        for (let x = 1080; x >= 0; x -= 30) pts.push(`${x}px ${waveY(x, y + 60, t).toFixed(1)}px`); L.clipPath = `polygon(${pts.join(",")})`; },
      draw(p, t) { const e = eInOut(p), y = lerp(2050, -220, e);
        let d1 = `M 0 1920 L 0 ${waveY(0, y + 60, t)}`, d2 = `M 0 1920 L 0 ${waveY(0, y + 150, t + 1)}`;
        for (let x = 0; x <= 1080; x += 20) { d1 += ` L ${x} ${waveY(x, y + 60, t).toFixed(1)}`; d2 += ` L ${x} ${waveY(x, y + 150, t + 1).toFixed(1)}`; }
        waveBack.setAttribute("d", d1 + " L 1080 1920 Z"); waveFront.setAttribute("d", d2 + " L 1080 1920 Z");
        show(waveBack, true); show(waveFront, true);
        waveBack.setAttribute("opacity", 1 - prog(e, .78, 1)); waveFront.setAttribute("opacity", 1 - prog(e, .72, 1));
        drops.forEach((dr, i) => place(dr, (i * 83) % 1080, waveY((i * 83) % 1080, y + 60, t) - 70 - 110 * Math.sin(e * Math.PI + i), .9 + (i % 3) * .3, 0, 1 - prog(e, .75, 1))); } },
    cable: { D: 1.1,
      clip(L, p, e) { const gx = lerp(-180, 1260, e); L.clipPath = `inset(0 ${clamp(1080 - gx, 0, 1080)}px 0 0)`; },
      draw(p, t) { const gx = lerp(-180, 1260, eInOut(p)); show(cable, true); place(gondola, gx, lerp(230, 760, (gx + 60) / 1200), 1.45, 5 * Math.sin(t * 14)); } },
    turtle: { D: 1.4, three: true,
      clip(L, p) { const x = lerp(1450, -1450, p); L.clipPath = `inset(0 0 0 ${clamp(540 + x + 150, 0, 1080)}px)`; },
      draw(p, t) { const x = lerp(1450, -1450, p); turtle.visible = true;
        turtle.position.set(x, 120 + 34 * Math.sin(t * 6), 0); turtle.rotation.z = .07 * Math.sin(t * 6);
        flippers.forEach((f) => { const ph = t * 10 + (f.userData.front ? 0 : Math.PI); f.rotation.y = f.userData.side * .4 * Math.sin(ph); f.rotation.z = .32 * Math.sin(ph); });
        bubbles.forEach((b, i) => place(b, 540 + x + 380 + i * 48, 840 - 60 * Math.sin(i * 2.1 + t * 5) - i * 24, .6 + (i % 3) * .35, 0, clamp(1 - i / 12))); } },
    meerkat: { D: .7,
      clip(L, p) { L.clipPath = `circle(${eOut(prog(p, .35, 1)) * 1500}px at 540px 1300px)`; },
      draw(p) { const rise = eBack(prog(p, 0, .45)) * (1 - eInOut(prog(p, .7, 1)));
        place(meer, 540, 1700, 1.25); meerBody.setAttribute("transform", `translate(0 ${lerp(520, -60, rise)})`); } },
    snake: { D: .8,
      clip(L, p, e, t) { const y0 = lerp(-120, 2040, e), pts = ["0px 0px", "1080px 0px"];
        for (let x = 1080; x >= 0; x -= 30) pts.push(`${x}px ${snakeY(x, y0, t).toFixed(1)}px`); L.clipPath = `polygon(${pts.join(",")})`; },
      draw(p, t) { const y0 = lerp(-120, 2040, eInOut(p)); let d = "";
        for (let x = -60; x <= 1000; x += 20) d += (d ? " L " : "M ") + x + " " + snakeY(x, y0, t).toFixed(1);
        [snakeOut, snakeIn, snakeDots].forEach((n) => { n.setAttribute("d", d); show(n, true); });
        place(snakeHead, 1010, snakeY(1010, y0, t), 1, Math.atan2(snakeY(1020, y0, t) - snakeY(1000, y0, t), 20) * 57); } },
    butterflies: { D: .8,
      clip(L, p, e) { L.clipPath = `inset(${clamp(lerp(2000, -160, e), 0, 1920)}px 0 0 0)`; },
      draw(p, t) { const y = lerp(2000, -160, eInOut(p));
        flies.forEach((f) => { const fl = Math.abs(Math.cos(t * 30 + f.ph));
          f.wl.setAttribute("transform", `scale(${.25 + .75 * fl} 1)`); f.wr.setAttribute("transform", `scale(${.25 + .75 * fl} 1)`);
          place(f.b, f.x + 30 * Math.sin(t * 5 + f.ph), y + f.dy, f.sc * 1.2, 10 * Math.sin(t * 7 + f.ph)); }); } },
    flamingo: { D: .8,
      clip(L, p) { L.clipPath = `circle(${eOut(prog(p, .4, 1)) * 2000}px at 770px 1450px)`; },
      draw(p) { const down = eOut(prog(p, 0, .45)) * (1 - eInOut(prog(p, .65, 1))), fy = lerp(-80, 1450, down);
        const d = `M 760 -60 L 740 ${fy * .48} L 770 ${fy}`; flamLeg.setAttribute("d", d); flamLegO.setAttribute("d", d);
        show(flamLeg, true); show(flamLegO, true); place(flamFoot, 770, fy, 1.4); } },
  };
  return {
    T,
    hideAll() { parts.forEach((n) => show(n, false)); turtle.visible = false; },
    render3d() { renderer.render(scene3, cam); },
  };
}
