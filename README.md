# greyce-instagram-editing

Skill do **Claude Code** que edita reels de Instagram no estilo da [@agreycealves](https://www.instagram.com/agreycealves/)
— tudo feito com código (HTML/CSS/JS + Three.js + SVG renderizados quadro a quadro no Chrome headless via Puppeteer),
ciente do conteúdo (transcreve a narração e ancora cenas, cards, mapas e transições com bichinhos nas palavras ditas),
com títulos gigantes 3D atrás das pessoas (recorte por IA).

Versão para computador **sem placa de vídeo** (Windows), pensada para fotos e vídeos do iPhone (sem upscale).

## Instalar (Windows)

1. Instale o Git e o Claude Code, se ainda não tiver:
   ```powershell
   winget install Git.Git
   ```
2. Baixe a skill para a pasta de skills do Claude Code:
   ```powershell
   git clone https://github.com/michelbragaguimaraes/greyce-instagram-editing "$env:USERPROFILE\.claude\skills\greyce-instagram-editing"
   ```
3. Instale as dependências (Node.js, ffmpeg e Python são instalados pelo winget se faltarem):
   ```powershell
   powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\skills\greyce-instagram-editing\engine\setup.ps1"
   node "$env:USERPROFILE\.claude\skills\greyce-instagram-editing\engine\tools\doctor.js"
   ```
   O Google Chrome precisa estar instalado (ou o Edge).

Para atualizar depois: `git -C "$env:USERPROFILE\.claude\skills\greyce-instagram-editing" pull`.

## Usar
Abra o Claude Code na pasta com os vídeos, fotos e áudios do passeio e peça, por exemplo:
> "Edita o reel do EP.3 dos passeios com criança com os áudios que gravei."

O Claude faz o inventário e a transcrição, mostra um roteiro visual para aprovação, monta, revisa frame a frame e entrega o MP4
(1080×1920, 30 fps, H.264 + AAC, −14 LUFS) com a legenda do post.

## Estrutura
- `SKILL.md` — o fluxo de trabalho que o Claude segue.
- `references/` — briefing, marca (paleta, fontes, tom, séries), formato do roteiro, catálogo de efeitos, lições aprendidas.
- `templates/ep2-zoo.roteiro.json` — o EP.2 San Diego Zoo completo, como exemplo.
- `engine/` — o motor: `prep.js` (narração, cenas, recortes, legendas), `music.js` (trilha e efeitos), `render.js`
  (Chrome headless → MP4), `web/` (renderizador: Three.js, transições, overlays, mapa), `tools/` (transcrição, inventário, recorte).

## Licenças
Código: MIT. Fontes em `engine/web/fonts` (Fraunces, Figtree, Caveat): SIL Open Font License 1.1 (Google Fonts).
Contornos dos estados dos EUA: dados públicos do U.S. Census (via PublicaMundi/MappingAPI).
