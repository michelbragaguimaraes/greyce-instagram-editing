#!/usr/bin/env bash
# Instala o motor sem placa de vídeo (macOS/Linux): Node deps + Python (Whisper e recorte na CPU).
set -euo pipefail
cd "$(dirname "$0")"
npm install --silent
[ -d tools/venv ] || python3 -m venv tools/venv
tools/venv/bin/pip install -q --upgrade pip
tools/venv/bin/pip install -q faster-whisper "rembg[cpu]" pillow-heif opencv-python-headless
echo "pronto. Teste: node tools/doctor.js"
