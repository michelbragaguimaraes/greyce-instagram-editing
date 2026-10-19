# Instala o ambiente do motor no Windows (sem placa de vídeo).
# O ambiente fica em %USERPROFILE%\.greyce-reel\cpu e sobrevive às atualizações do plugin.
#   powershell -ExecutionPolicy Bypass -File setup.ps1
$ErrorActionPreference = "Stop"
$RT = if ($env:GREYCE_REEL_HOME) { $env:GREYCE_REEL_HOME } else { Join-Path $env:USERPROFILE ".greyce-reel\cpu" }
New-Item -ItemType Directory -Force -Path $RT | Out-Null

function Need($cmd, $winget, $nome) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando $nome…" -ForegroundColor Yellow
    winget install --id $winget -e --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  }
}
Need node   "OpenJS.NodeJS.LTS"  "Node.js"
Need ffmpeg "Gyan.FFmpeg"        "ffmpeg (build completo, com zscale para vídeo HDR do iPhone)"
Need python "Python.Python.3.12" "Python 3.12"

Write-Host "1/2 Node: puppeteer-core + three em $RT"
npm install --silent --prefix "$RT" puppeteer-core@^24 three@^0.180

Write-Host "2/2 Python: faster-whisper + rembg (CPU) + HEIC"
if (-not (Test-Path "$RT\venv")) { python -m venv "$RT\venv" }
& "$RT\venv\Scripts\python.exe" -m pip install -q --upgrade pip
& "$RT\venv\Scripts\python.exe" -m pip install -q faster-whisper "rembg[cpu]" pillow-heif opencv-python-headless

Write-Host "Pronto. Teste com:  node `"$PSScriptRoot\tools\doctor.js`"" -ForegroundColor Green
