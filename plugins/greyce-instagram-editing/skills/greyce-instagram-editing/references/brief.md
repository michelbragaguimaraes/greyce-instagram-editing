# Briefing da skill (o pedido do Michel, reescrito como especificação)

## Objetivo
Editar reels de Instagram para a **Greyce (@agreycealves)** com qualidade de agência: o vídeo tem que
parecer feito por um motion designer que conhece a marca dela, e não por um editor automático.
Tudo é feito **com código**: HTML/CSS/JS + Three.js + SVG renderizados quadro a quadro no Chrome headless
(Puppeteer). ffmpeg e modelos de IA (Whisper, recorte de pessoas, upscale) entram só como utilitários.
Proibido: editores de vídeo (Premiere, CapCut…) e frameworks de vídeo (Remotion, HyperFrames…).

## O que "ciente do conteúdo" significa
1. **Ouvir antes de editar.** Transcrever todos os áudios e vídeos com tempo por palavra. A narração
   gravada pela Greyce **é o roteiro**: nunca trocar, encurtar a ideia, reordenar ou substituir por
   outro conceito. "Fazer melhor" = mesma fala, edição melhor.
2. **Ver antes de editar.** Folhas de frames de cada vídeo e de todas as fotos; escolher os melhores
   momentos (rosto do Liam, ação, emoção) e descartar o que não faz sentido.
3. **Cada imagem combina com a palavra dita.** Quando ela fala "78 dólares", aparece o card do preço;
   quando fala "bondinho", aparece o bondinho. Cenas e textos são ancorados em palavras, não em segundos.
4. **Cada transição tem sentido narrativo.** O bichinho que aparece tem a ver com a cena que entra
   (tartaruga nada pelo vidro do aquário, tromba empurra para os elefantes, onda d'água na área de água,
   bondinho no cabo quando o assunto é o bondinho, pegadinhas de bebê levando até o lugar).

## Linguagem visual (ver brand.md e effects.md)
- Identidade da Greyce: navy #093269, papel #FAFBFD, aquarela azul #D0E8FC, pêssego #FDB498,
  caixinha #FCD9CB, coral #F3A589; título serif pesado (Fraunces), texto Figtree, notas manuscritas (Caveat).
- **Título gigante 3D**: palavra enorme atrás das pessoas (elas ficam na frente das letras), feito com
  recorte de pessoas por IA frame a frame. Usar em 3–6 momentos-chave, nunca em todos.
- Cards de informação (preço, horário, checklist), contador animado, mapa (estado + pinos + rota),
  grade de vídeos, polaroid, seta desenhada, rabiscos (corações, brilhinhos), botão "Seguir" com elefante.
- Legendas por frase com a palavra falada marcada em pêssego; nomes próprios sempre revisados.
- Trilha leve gerada em código, que abaixa sozinha quando alguém fala; efeitos nunca em cima de palavra.

## Engajamento
Gancho no 1º segundo (texto já na tela no frame 0, que vira capa), uma informação "pra salvar",
pergunta para comentário no tom dela ("Me conta: …?"), CTA de seguir/compartilhar no fim.

## Qualidade "incontestável"
1080×1920, 30 fps, H.264 High + AAC 48 kHz, −14 LUFS. Revisão **frame a frame** antes do render final:
nenhum card cobrindo rosto, nenhum texto ilegível, nenhuma transição rápida demais (< 0,6 s),
nenhuma fala cortada, nenhum efeito sonoro em cima de palavra, fotos retocadas da Greyce quando existirem.
Versão com GPU: upscale com IA (Real-ESRGAN) para material do WhatsApp. Versão sem GPU (computador
da Greyce): sem upscale (as fotos/vídeos do iPhone já são bons), recorte na CPU só onde vale a pena.

## Entregas e paradas
1. Inventário + transcrição + leitura do material → **parar e mostrar**.
2. Roteiro visual (tabela: fala → cena → texto/efeito → transição) → **parar para aprovação**.
3. Prévia em folha de frames → corrigir → render final → conferir (transcrição do vídeo pronto, loudness).
4. MP4 + legenda do post no tom dela (3–5 hashtags + pergunta).
