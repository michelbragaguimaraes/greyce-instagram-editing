// Render quadro a quadro no Chrome headless (Puppeteer) + mixagem e MP4 com ffmpeg.
//   node render.js <projeto>                       → <projeto>/saida/<output>.mp4
//   node render.js <projeto> --preview 0 2.5 10    → <projeto>/build/preview/t*.png (+ folha preview.jpg)
//   node render.js <projeto> --audio               → refaz só mixagem + MP4 (frames já renderizados)
const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");
const { ENGINE, RUNTIME, chromePath, runtimeRequire } = require("./lib/common");
const puppeteer = runtimeRequire("puppeteer-core");

const args = process.argv.slice(2);
const PROJ = path.resolve(args[0] && !args[0].startsWith("--") ? args.shift() : ".");
const B = path.join(PROJ, "build");
const T = JSON.parse(fs.readFileSync(path.join(B, "timeline.json"), "utf8"));
const WEB = path.join(ENGINE, "web"), THREE = path.join(RUNTIME, "node_modules", "three", "build");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2" };

function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split("?")[0]);
      const f = u.startsWith("/p/") ? path.join(PROJ, u.slice(3)) : u.startsWith("/three/") ? path.join(THREE, u.slice(7)) : path.join(WEB, u === "/" ? "index.html" : u);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(res);
    }).listen(0, "127.0.0.1", () => ok(srv));
  });
}

async function frames(times, outDir, type) {
  const srv = await serve();
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true,
    args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--force-device-scale-factor=1", "--hide-scrollbars"] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("PÁGINA:", e.message));
  page.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && console.error("CONSOLE:", m.text()));
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.READY === true", { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(outDir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => window.renderAt(t), times[i]);
    const name = type === "png" ? `t${times[i].toFixed(2)}.png` : `${String(i).padStart(5, "0")}.jpg`;
    await page.screenshot({ path: path.join(outDir, name), type, ...(type === "jpeg" ? { quality: 95 } : {}) });
    if (type === "jpeg" && i % 150 === 0) console.log(`frame ${i}/${times.length}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await browser.close(); srv.close();
}

function sheet(times) {  // folha de prévia: 8 por linha, com o tempo escrito
  const ins = times.flatMap((t) => ["-i", path.join(B, "preview", `t${t.toFixed(2)}.png`)]);
  const fc = times.map((t, i) => `[${i}]scale=270:-1,drawtext=text='${t.toFixed(1)}s':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black[v${i}]`).join(";")
    + ";" + times.map((_, i) => `[v${i}]`).join("") + `xstack=inputs=${times.length}:layout=` + times.map((_, i) => `${(i % 8) * 270}_${Math.floor(i / 8) * 480}`).join("|") + ":fill=black";
  if (times.length === 1) return fs.copyFileSync(path.join(B, "preview", `t${times[0].toFixed(2)}.png`), path.join(B, "preview.jpg"));
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", fc, path.join(B, "preview.jpg")], { stdio: "inherit" });
}

function mixAudio() {
  // narração na frente; falas/ambiente dos vídeos; música baixinha que abaixa quando alguém fala; efeitos
  const inputs = ["-i", path.join(B, "narracao.wav")], parts = [];
  T.ambient.forEach((a, i) => { inputs.push("-i", a.f); parts.push(`[${i + 1}]adelay=${Math.round(a.at * 1000)}:all=1[a${i}]`); });
  const nA = T.ambient.length, iM = nA + 1, iS = nA + 2;
  inputs.push("-i", path.join(B, "music.wav"), "-i", path.join(B, "sfx.wav"));
  parts.push(`[0]asplit=2[voz][vozsc]`, `[${iM}]volume=${T.music.gain ?? 0.32}[mus]`,
    `[mus][vozsc]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=400:makeup=1[musd]`, `[${iS}]volume=0.7[sfx]`,
    `[voz]${T.ambient.map((_, i) => `[a${i}]`).join("")}[musd][sfx]amix=inputs=${nA + 3}:normalize=0,atrim=0:${T.duration},` +
      `afade=t=out:st=${T.duration - 0.4}:d=0.4,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]`);
  execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", parts.join(";"), "-map", "[out]", "-ac", "2", path.join(B, "audio_final.wav")], { stdio: "inherit" });
}

function encode() {
  const out = path.join(PROJ, "saida"); fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, T.output.replace(/\.mp4$/, "") + ".mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(T.fps), "-i", path.join(B, "frames", "%05d.jpg"), "-i", path.join(B, "audio_final.wav"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", file], { stdio: "inherit" });
  console.log("pronto:", file);
}

(async () => {
  if (args.includes("--audio")) { mixAudio(); return encode(); }
  const pv = args.indexOf("--preview");
  if (pv > -1) {
    const times = args.slice(pv + 1).map(Number).filter((x) => !isNaN(x));
    fs.rmSync(path.join(B, "preview"), { recursive: true, force: true });
    await frames(times, path.join(B, "preview"), "png");
    sheet(times); return console.log("prévia:", path.join(B, "preview.jpg"));
  }
  const n = Math.round(T.duration * T.fps);
  fs.rmSync(path.join(B, "frames"), { recursive: true, force: true });
  await frames(Array.from({ length: n }, (_, i) => i / T.fps), path.join(B, "frames"), "jpeg");
  mixAudio(); encode();
})();
