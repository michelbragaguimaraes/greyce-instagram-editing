#!/usr/bin/env bash
# Instala o ambiente do motor com GPU NVIDIA (Linux) em ~/.greyce-reel/gpu (sobrevive às atualizações do plugin):
# Node deps, Python (Whisper + recorte com CUDA) e Real-ESRGAN.
set -euo pipefail
RT="${GREYCE_REEL_HOME:-$HOME/.greyce-reel/gpu}"; mkdir -p "$RT"
for c in node ffmpeg python3 curl unzip; do command -v $c >/dev/null || { echo "Instale: $c"; exit 1; }; done
echo "1/3 Node: puppeteer-core + three"
npm install --silent --prefix "$RT" puppeteer-core@^24 three@^0.180
echo "2/3 Python: faster-whisper + rembg (GPU) + CUDA"
[ -d "$RT/venv" ] || python3 -m venv "$RT/venv"
"$RT/venv/bin/pip" install -q --upgrade pip
"$RT/venv/bin/pip" install -q faster-whisper "rembg[gpu]" pillow-heif opencv-python-headless nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"
# o faster-whisper puxa o onnxruntime de CPU, que esconde o de GPU: deixa só o de GPU
"$RT/venv/bin/pip" uninstall -q -y onnxruntime || true
"$RT/venv/bin/pip" install -q --force-reinstall --no-deps onnxruntime-gpu
echo "3/3 Real-ESRGAN (upscale)"
if [ ! -x "$RT/esr/realesrgan-ncnn-vulkan" ]; then
  tmp=$(mktemp -d)
  curl -sL -o "$tmp/esr.zip" https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip
  mkdir -p "$RT/esr" && unzip -q -o "$tmp/esr.zip" -d "$RT/esr" && rm -rf "$tmp" "$RT"/esr/*.jpg "$RT"/esr/*.mp4
  chmod +x "$RT/esr/realesrgan-ncnn-vulkan"
fi
echo "pronto. Teste: node $(dirname "$0")/tools/doctor.js"
