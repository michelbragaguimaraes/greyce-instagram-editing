---
name: greyce-instagram-editing
description: Edita reels de Instagram da Greyce (@agreycealves) no estilo dela, só com código (HTML/CSS/JS + Three.js + SVG renderizados quadro a quadro no Chrome headless via Puppeteer) — ciente do conteúdo (transcreve e entende a narração dela e ancora cenas, cards, mapas e transições com bichinhos nas palavras ditas), com títulos gigantes 3D atrás das pessoas (recorte por IA na CPU). Versão para computador SEM placa de vídeo e material do iPhone (sem upscale). Use para "editar meu reel", "fazer o vídeo do passeio/receita/achadinho", "episódio N da série", "refazer esse vídeo melhor" ou qualquer edição de vídeo vertical para @agreycealves.
---

# Edição de reels da Greyce — versão sem placa de vídeo (iPhone)

Você é o motion designer da @agreycealves. O resultado tem de parecer de agência e **ter a cara dela**.
Leia antes de começar: `references/brief.md` (o pedido), `references/brand.md` (marca),
`references/lessons.md` (erros que já cometemos). Os arquivos de referência ficam ao lado deste SKILL.md. Durante o roteiro: `references/roteiro.md` e
`references/effects.md`. Exemplo completo aprovado: `templates/ep2-zoo.roteiro.json`.

`ENGINE` = `${CLAUDE_PLUGIN_ROOT}/engine` (o motor que vem com este plugin). O ambiente pesado (Node deps,
Python, modelos) fica em `%USERPROFILE%\.greyce-reel\cpu` e sobrevive às atualizações do plugin.
Restrição inegociável: nada de editor de vídeo nem Remotion/HyperFrames. ffmpeg, Whisper e recorte só
como utilitários. **Sem upscale** aqui: as fotos e vídeos do iPhone já têm qualidade (o motor converte
HDR e HEIC sozinho). Se vier material ruim (WhatsApp, print), avise e evite zoom > 1,1 nele.

## 0. Ambiente (uma vez)
```powershell
powershell -ExecutionPolicy Bypass -File "ENGINE/setup.ps1"
node "ENGINE/tools/doctor.js"
```
Se o `doctor` acusar algo faltando, rode o setup de novo (macOS/Linux: `bash ENGINE/setup.sh`).

## 1. Projeto e inventário
Crie uma pasta de projeto ao lado dos brutos (ex.: `Documentos\Instagram\Zoologico\reel_ep3\`).
```powershell
node ENGINE\tools\inventory.js <brutos> <projeto>
node ENGINE\tools\py.js transcribe <brutos> <projeto>\analise\transcricao.json --flat --device cpu
```
A transcrição na CPU usa o modelo `medium` (≈ 1–2× o tempo do áudio). **Olhe** todas as folhas
(`analise\videos_*.jpg`, `fotos_*.jpg`) e leia toda a transcrição. Use as fotos retocadas se existirem.
Entregue um inventário curto (arquivos, melhores momentos com tempo, falas úteis, takes repetidos, o que
não abriu). **Pare e mostre.**

## 2. Roteiro visual (aprovação obrigatória)
A narração dela **é** o roteiro: mesma ordem, mesmas palavras. Para cada frase: qual imagem mostra o que
ela diz; qual card ajuda a salvar a informação; onde muda o assunto (transição com bichinho que combine);
3–6 momentos de palavra gigante 3D; mapa se citar lugares; "Seguir" + elefante no CTA de série.
Mostre a tabela (tempo | fala | cena | texto/efeito | transição | áudio). **Pare para aprovação.**

### Recorte na CPU (texto gigante atrás das pessoas)
Cada frame de recorte leva ~8 s (`"mask": "portrait"`). Planeje:
- Prefira o efeito 3D em **fotos** (1 recorte só) — gancho com foto forte, "EP.N", preço, "BEIJO!".
- Em vídeo, só em trechos curtos (≤ 3 s ≈ 90 frames ≈ 12 min) ou use `"mask": "fast"` (~0,6 s/frame,
  borda menos fina). O `prep` avisa a estimativa de tempo.
- Escolha cenas com a pessoa **isolada** (o recorte pega todo mundo que aparece).

## 3. Montagem
Escreva `<projeto>\roteiro.json` (formato em `references/roteiro.md`; copie a estrutura do template).
```powershell
node ENGINE\prep.js <projeto>
node ENGINE\music.js <projeto>
node ENGINE\render.js <projeto> --preview 0 1.5 3 4.5 …     # folha build\preview.jpg
```

## 4. Revisão frame a frame (antes do render final)
Prévias no frame 0, no meio de **toda** transição, logo depois de cada card/texto gigante e no fim:
- [ ] Frame 0 tem o gancho inteiro e legível (é a capa).
- [ ] Nenhum card/nota cobre rosto; texto gigante legível (cabeça só na base das letras).
- [ ] Recorte não pegou gente de fundo nem cortou cabeça.
- [ ] Cada bichinho é reconhecível (≥ 0,6 s) e combina com a cena que entra.
- [ ] Imagem combina com a palavra dita; nada repetido/sem sentido.
- [ ] Legendas sem erro de nome (`captions.replace`); nada importante abaixo de ~1500 px.
Corrija → `prep` → nova prévia, até passar em tudo.

## 5. Render e conferência
```powershell
node ENGINE\render.js <projeto>            # sem GPU: ~2–4 frames/s → 70 s de vídeo ≈ 10–20 min
node ENGINE\render.js <projeto> --audio    # se mudar só o áudio/efeitos
```
Confira: 1080×1920, 30 fps, H.264 + AAC, ≈ −14 LUFS
(`ffmpeg -i saida\X.mp4 -af loudnorm=print_format=summary -f null -`) e **transcreva o MP4 final**
(`node ENGINE\tools\py.js transcribe <projeto>\saida <projeto>\analise\conferencia.json --flat --device cpu`):
toda frase da narração tem que aparecer.

## 6. Entrega
MP4 + legenda do post no tom dela (estrutura em `brand.md`). Diga o que mudou, o que ficou de fora e
qualquer dado que não deu para confirmar (preços, datas de promoção).
