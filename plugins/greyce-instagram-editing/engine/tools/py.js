// Roda um script Python do motor com o Python e as bibliotecas certas (Windows/Linux/macOS).
//   node tools/py.js transcribe <brutos> <saida.json> [--flat] [--device cpu|cuda]
//   node tools/py.js seg portrait <entrada> <saida> [cpu|cuda]
const path = require("path");
const { spawnSync } = require("child_process");
const { loadConfig, pythonEnv } = require("../lib/common");
const [name, ...args] = process.argv.slice(2);
const py = pythonEnv(loadConfig());
const r = spawnSync(py.python, [path.join(__dirname, name.endsWith(".py") ? name : name + ".py"), ...args],
  { stdio: "inherit", env: { ...process.env, ...py.env, PYTHONIOENCODING: "utf-8" } });
process.exit(r.status ?? 1);
