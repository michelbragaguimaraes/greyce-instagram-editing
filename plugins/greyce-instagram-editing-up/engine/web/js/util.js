// Utilitários de tempo, easing e SVG compartilhados pelo motor.
export const NAVY = "#093269", SKY = "#D0E8FC", PEACH = "#FDB498", BLUSH = "#FCD9CB", CORAL = "#F3A589", BLUE = "#3666A8", PAPER = "#FAFBFD";
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => (b <= a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a)));
export const eOut = (k) => 1 - Math.pow(1 - k, 3);
export const eInOut = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const eBack = (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
// janela de entrada com "pop" e saída encolhendo
export function popWin(t, a, b, inD = .3, outD = .2) {
  if (t < a || t > b) return { s: 0, o: 0, k: 0 };
  const i = prog(t, a, a + inD), o = prog(t, b - outD, b);
  return { s: lerp(.6, 1, eBack(i)) * lerp(1, .85, o), o: Math.min(i * 2.5, 1) * (1 - o), k: i };
}
export const el = (tag, attrs = {}, parent) => {
  const n = tag.startsWith("svg:") ? document.createElementNS("http://www.w3.org/2000/svg", tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) k === "html" ? (n.innerHTML = v) : n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};
export const stroke = { stroke: NAVY, "stroke-width": 7, "stroke-linejoin": "round", "stroke-linecap": "round" };
export const A = (o, extra) => Object.assign({}, stroke, o, extra);
export const g = (p) => el("svg:g", {}, p);
export const show = (n, on) => n.setAttribute("visibility", on ? "visible" : "hidden");
export const place = (n, x, y, s = 1, r = 0, o = 1) => { n.setAttribute("transform", `translate(${x} ${y}) rotate(${r}) scale(${s})`); n.setAttribute("opacity", o); show(n, o > .01 && s > .001); };
