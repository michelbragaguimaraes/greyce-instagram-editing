# greyce-skills · marketplace de plugins do Claude Code

Plugins que editam reels de Instagram no estilo da [@agreycealves](https://www.instagram.com/agreycealves/) —
tudo feito com código (HTML/CSS/JS + Three.js + SVG renderizados quadro a quadro no Chrome headless via Puppeteer),
**ciente do conteúdo** (transcreve a narração e ancora cenas, cards, mapas e transições com bichinhos nas palavras
ditas), com títulos gigantes 3D atrás das pessoas (recorte por IA).

| Plugin | Para quem |
|---|---|
| `greyce-instagram-editing` | computador **sem placa de vídeo** (Windows/macOS), fotos e vídeos do iPhone, sem upscale |
| `greyce-instagram-editing-up` | Linux com **GPU NVIDIA**: recorte e Whisper na GPU + upscale com IA (Real-ESRGAN) |

## Instalar

### 1. Adicionar o marketplace e instalar o plugin
Dentro do Claude Code:
```
/plugin marketplace add michelbragaguimaraes/greyce-instagram-editing
/plugin install greyce-instagram-editing@greyce-skills
```
(ou, no terminal: `claude plugin marketplace add michelbragaguimaraes/greyce-instagram-editing` e
`claude plugin install greyce-instagram-editing@greyce-skills`). Para a versão com GPU troque o nome por
`greyce-instagram-editing-up`.

### 2. Preparar o ambiente (uma vez por computador)
Peça ao Claude: **"prepara o ambiente da skill de reels"** — ele roda o instalador do plugin. Ou rode você mesmo:

- **Windows** (PowerShell):
  ```powershell
  powershell -ExecutionPolicy Bypass -File "$((Get-ChildItem $env:USERPROFILE\.claude\plugins\cache\greyce-skills\greyce-instagram-editing -Directory | Sort-Object LastWriteTime | Select-Object -Last 1).FullName)\engine\setup.ps1"
  ```
  Instala (via winget, se faltarem) Node.js, ffmpeg e Python, e coloca o ambiente em `%USERPROFILE%\.greyce-reel\cpu`.
  O Google Chrome (ou Edge) precisa estar instalado.
- **Linux com GPU**: `bash ~/.claude/plugins/cache/greyce-skills/greyce-instagram-editing-up/*/engine/setup.sh`
  → ambiente em `~/.greyce-reel/gpu`.

O ambiente fica **fora** do plugin, então atualizar o plugin não obriga a reinstalar nada.

### Atualizar
```
/plugin marketplace update greyce-skills
/plugin update greyce-instagram-editing@greyce-skills
```

## Usar
Abra o Claude Code na pasta com os vídeos, fotos e áudios e peça, por exemplo:
> "Edita o reel do EP.3 dos passeios com criança com os áudios que gravei."

O Claude faz o inventário e a transcrição, mostra um roteiro visual para aprovação, monta, revisa frame a frame e
entrega o MP4 (1080×1920, 30 fps, H.264 + AAC, −14 LUFS) com a legenda do post.

## Estrutura
```
.claude-plugin/marketplace.json
plugins/<plugin>/.claude-plugin/plugin.json
plugins/<plugin>/skills/<plugin>/SKILL.md         fluxo de trabalho
plugins/<plugin>/skills/<plugin>/references/      briefing, marca, formato do roteiro, efeitos, lições
plugins/<plugin>/skills/<plugin>/templates/       EP.2 San Diego Zoo completo (exemplo)
plugins/<plugin>/engine/                          motor: prep.js, music.js, render.js, web/ (Three.js, transições,
                                                  overlays, mapa), tools/ (transcrição, inventário, recorte)
scripts/sync-engine.sh                            copia o motor do plugin principal para o -up
```
O motor é o mesmo nos dois plugins; só mudam `engine/config.json`, o instalador e o `SKILL.md`.

## Licenças
Código: MIT. Fontes em `engine/web/fonts` (Fraunces, Figtree, Caveat): SIL Open Font License 1.1 (Google Fonts).
Contornos dos estados dos EUA: dados públicos do U.S. Census (via PublicaMundi/MappingAPI).
