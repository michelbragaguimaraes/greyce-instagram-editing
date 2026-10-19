// Utilitários do motor: configuração, ffmpeg/ffprobe, Python do venv, Chrome (Linux/Windows/macOS).
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ENGINE = path.resolve(__dirname, "..");
const WIN = process.platform === "win32";

function loadConfig(proj) {
  const base = JSON.parse(fs.readFileSync(path.join(ENGINE, "config.json"), "utf8"));
  const local = proj && fs.existsSync(path.join(proj, "config.json")) ? JSON.parse(fs.readFileSync(path.join(proj, "config.json"), "utf8")) : {};
  const c = { ...base, ...local };
  c.esr = c.esr || path.join(ENGINE, "tools", "esr", WIN ? "realesrgan-ncnn-vulkan.exe" : "realesrgan-ncnn-vulkan");
  if (c.upscale && !fs.existsSync(c.esr)) throw new Error("upscale ligado mas o Real-ESRGAN não está instalado em " + c.esr + " (rode o setup).");
  return c;
}

// HDR do iPhone (HLG / PQ) vira SDR bt709 sem ficar "lavado"
const HDR_TO_SDR = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p";
function isHDR(file) {
  try {
    const tr = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer", "-of", "csv=p=0", file]).toString().trim();
    return /arib-std-b67|smpte2084/.test(tr);
  } catch { return false; }
}
// ffmpeg com conversão de HDR automática quando a entrada é vídeo HDR
function ff(args) {
  const i = args.indexOf("-i"), vf = args.indexOf("-vf");
  if (i > -1 && vf > -1 && isHDR(args[i + 1])) args = [...args.slice(0, vf + 1), HDR_TO_SDR + "," + args[vf + 1], ...args.slice(vf + 2)];
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
}
const probe = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString();

function pythonEnv(c) {
  const venv = c.venv || path.join(ENGINE, "tools", "venv");
  const python = WIN ? path.join(venv, "Scripts", "python.exe") : path.join(venv, "bin", "python");
  if (!fs.existsSync(python)) throw new Error("Python do motor não encontrado em " + python + " (rode o setup).");
  const env = {};
  if (!WIN) {  // bibliotecas CUDA instaladas via pip (Linux)
    const lib = path.join(venv, "lib");
    const py = fs.existsSync(lib) ? fs.readdirSync(lib).find((d) => d.startsWith("python")) : null;
    if (py) {
      const nv = path.join(lib, py, "site-packages", "nvidia");
      const dirs = ["cublas", "cudnn", "cuda_runtime", "cufft", "curand"].map((k) => path.join(nv, k, "lib")).filter(fs.existsSync);
      if (dirs.length) env.LD_LIBRARY_PATH = [...dirs, process.env.LD_LIBRARY_PATH || ""].join(":");
    }
  }
  return { python, env };
}

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const cands = WIN
    ? [path.join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
       path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google\\Chrome\\Application\\chrome.exe"),
       path.join(os.homedir(), "AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"),
       path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Microsoft\\Edge\\Application\\msedge.exe")]
    : ["/opt/google/chrome/chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
       "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
  const p = cands.find(fs.existsSync);
  if (!p) throw new Error("Chrome não encontrado. Instale o Google Chrome ou defina a variável CHROME.");
  return p;
}

module.exports = { ENGINE, WIN, loadConfig, ff, probe, pythonEnv, chromePath, isHDR };
