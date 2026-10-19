# Transcreve todos os áudios e vídeos de uma pasta com timestamps por palavra (faster-whisper).
# Uso: python transcribe.py <pasta-dos-brutos> <saida.json> [--device cuda|cpu] [--model large-v3|medium|small]
# Saída: { "<arquivo relativo>": { "file": ..., "segs": [ {s, e, t, p, w:[{w,s,e}]} ] } }
import sys, os, json, subprocess, argparse
import numpy as np
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("root"); ap.add_argument("out")
ap.add_argument("--device", default="cuda"); ap.add_argument("--model", default=None)
ap.add_argument("--flat", action="store_true", help="só a pasta principal, sem subpastas")
ap.add_argument("--prompt", default="Liam, Greyce, Michel, San Diego, Califórnia, EUA, Costco, Target, Trader Joe's.")
a = ap.parse_args()
model_name = a.model or ("large-v3" if a.device == "cuda" else "medium")
try:
    model = WhisperModel(model_name, device=a.device, compute_type="int8_float16" if a.device == "cuda" else "int8")
except Exception as e:
    print("GPU indisponível, usando CPU:", e); model = WhisperModel("medium", device="cpu", compute_type="int8")

EXT = (".m4a", ".mp3", ".wav", ".aac", ".mp4", ".mov", ".m4v", ".webm", ".caf")
skip = ("build", "saida", "analise", "node_modules")
files = []
for d, dirs, fs in os.walk(a.root):
    dirs[:] = [] if a.flat else [x for x in dirs if x not in skip and not x.startswith(".")]
    files += [os.path.join(d, f) for f in fs if f.lower().endswith(EXT)]
res = json.load(open(a.out)) if os.path.exists(a.out) else {}
for f in sorted(files):
    key = os.path.relpath(f, a.root).replace("\\", "/")
    if key in res: continue
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    if not raw: res[key] = {"file": key, "segs": []}; continue
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    segs, _ = model.transcribe(audio, language="pt", word_timestamps=True, vad_filter=True, condition_on_previous_text=False, initial_prompt=a.prompt)
    out = [{"s": round(s.start, 2), "e": round(s.end, 2), "t": s.text.strip(), "p": round(float(np.exp(s.avg_logprob)), 2),
            "w": [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in s.words]} for s in segs]
    res[key] = {"file": key, "segs": out}
    print(key, flush=True)
    for s in out: print(f"   [{s['s']:.1f}-{s['e']:.1f}] (conf {s['p']}) {s['t']}", flush=True)
    json.dump(res, open(a.out, "w"), ensure_ascii=False, indent=1)
json.dump(res, open(a.out, "w"), ensure_ascii=False, indent=1)
