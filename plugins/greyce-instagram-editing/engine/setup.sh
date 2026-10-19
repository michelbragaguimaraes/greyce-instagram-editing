#!/usr/bin/env bash
# Instala o ambiente do motor sem placa de vídeo (macOS/Linux) em ~/.greyce-reel/cpu.
set -euo pipefail
RT="${GREYCE_REEL_HOME:-$HOME/.greyce-reel/cpu}"; mkdir -p "$RT"
npm install --silent --prefix "$RT" puppeteer-core@^24 three@^0.180
[ -d "$RT/venv" ] || python3 -m venv "$RT/venv"
"$RT/venv/bin/pip" install -q --upgrade pip
"$RT/venv/bin/pip" install -q faster-whisper "rembg[cpu]" pillow-heif opencv-python-headless
echo "pronto. Teste: node $(dirname "$0")/tools/doctor.js"
