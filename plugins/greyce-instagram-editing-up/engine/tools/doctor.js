// Confere se tudo que o motor precisa está instalado e funcionando.
//   node tools/doctor.js
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { ENGINE, RUNTIME, loadConfig, pythonEnv, chromePath } = require("../lib/common");

const ok = (m) => console.log("  ✓ " + m), bad = (m) => (console.log("  ✗ " + m), (process.exitCode = 1));
const run = (c, a, env) => execFileSync(c, a, { env: { ...process.env, ...env } }).toString().trim();
console.log("Motor em", ENGINE); console.log("Ambiente em", RUNTIME);
try { ok("node " + process.version); } catch { bad("node"); }
try { ok(run("ffmpeg", ["-version"]).split("\n")[0]); } catch { bad("ffmpeg não encontrado no PATH"); }
try { run("ffmpeg", ["-hide_banner", "-filters"]).includes("zscale") ? ok("ffmpeg com zscale (HDR do iPhone → SDR)") : bad("ffmpeg sem zscale: vídeo HDR do iPhone pode sair lavado (use um build completo do ffmpeg)"); } catch {}
try { ok("Chrome: " + chromePath()); } catch (e) { bad(e.message); }
for (const m of ["puppeteer-core", "three"]) fs.existsSync(path.join(RUNTIME, "node_modules", m)) ? ok(m) : bad(m + " (rode o setup)");
let C; try { C = loadConfig(); ok(`config: upscale=${C.upscale} · recorte=${C.segDevice} · whisper=${C.whisperDevice}`); } catch (e) { bad(e.message); }
try {
  const py = pythonEnv(C || {});
  const out = run(py.python, ["-c", "import faster_whisper, rembg, onnxruntime as o; print(o.get_available_providers())"], py.env);
  ok("Python: faster-whisper + rembg · " + out);
  if (C && C.segDevice === "cuda" && !out.includes("CUDA")) bad("recorte configurado para GPU mas o onnxruntime não vê CUDA");
} catch (e) { bad("Python do motor: " + e.message.split("\n")[0]); }
if (C && C.upscale) fs.existsSync(C.esr) ? ok("Real-ESRGAN: " + C.esr) : bad("Real-ESRGAN ausente");
const fonts = path.join(ENGINE, "web", "fonts", "fonts.css");
fs.existsSync(fonts) ? ok("fontes Fraunces / Figtree / Caveat") : bad("fontes ausentes");
console.log(process.exitCode ? "Há itens a corrigir." : "Tudo certo.");
