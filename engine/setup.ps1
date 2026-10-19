# Instala o motor no Windows (sem placa de vídeo): Node deps + Python (Whisper e recorte na CPU).
# Abra o PowerShell nesta pasta e rode:   powershell -ExecutionPolicy Bypass -File setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Need($cmd, $winget, $nome) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando $nome…" -ForegroundColor Yellow
    winget install --id $winget -e --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  }
}
Need node   "OpenJS.NodeJS.LTS" "Node.js"
Need ffmpeg "Gyan.FFmpeg"       "ffmpeg (build completo, com zscale para vídeo HDR do iPhone)"
Need python "Python.Python.3.12" "Python 3.12"

Write-Host "1/2 dependências Node (puppeteer-core, three)…"
npm install --silent

Write-Host "2/2 Python: faster-whisper + rembg (CPU) + HEIC…"
if (-not (Test-Path tools\venv)) { python -m venv tools\venv }
tools\venv\Scripts\python.exe -m pip install -q --upgrade pip
tools\venv\Scripts\python.exe -m pip install -q faster-whisper "rembg[cpu]" pillow-heif opencv-python-headless

Write-Host "Pronto. Teste com:  node tools\doctor.js" -ForegroundColor Green
