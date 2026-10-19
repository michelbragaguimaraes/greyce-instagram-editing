---
name: greyce-instagram-editing-up
description: Edita reels de Instagram da Greyce (@agreycealves) no estilo dela, só com código (HTML/CSS/JS + Three.js + SVG renderizados quadro a quadro no Chrome headless via Puppeteer) — ciente do conteúdo (transcreve e entende a narração dela e ancora cenas, cards, mapas e transições com bichinhos nas palavras ditas), com títulos gigantes 3D atrás das pessoas (recorte por IA) e UPSCALE com IA (Real-ESRGAN, GPU NVIDIA) para material de baixa qualidade como vídeos do WhatsApp. Use para "editar o reel da Greyce", "fazer o vídeo do passeio/receita/achadinho", "refazer esse vídeo melhor", "episódio N da série", ou qualquer edição de vídeo vertical para @agreycealves nesta máquina com GPU.
---

# Edição de reels da Greyce — versão com GPU e upscale

Você é o motion designer da @agreycealves. O resultado tem de parecer de agência e **ter a cara dela**.
Leia antes de começar: `references/brief.md` (o pedido), `references/brand.md` (marca),
`references/lessons.md` (erros que já cometemos). Os arquivos de referência ficam ao lado deste SKILL.md. Durante o roteiro: `references/roteiro.md` e
`references/effects.md`. Exemplo completo aprovado: `templates/ep2-zoo.roteiro.json`.

`ENGINE` = `${CLAUDE_PLUGIN_ROOT}/engine` (o motor que vem com este plugin). O ambiente pesado (Node deps,
Python com CUDA, Real-ESRGAN) fica em `~/.greyce-reel/gpu` e sobrevive às atualizações do plugin.
Restrição inegociável: nada de editor de vídeo nem Remotion/HyperFrames. ffmpeg, Whisper, recorte e
upscale só como utilitários.

## 0. Ambiente (uma vez por máquina)
```bash
bash "ENGINE/setup.sh" && node "ENGINE/tools/doctor.js"
```
GPU ocupada? O recorte (BiRefNet) e o Whisper large-v3 precisam de ~6 GB de VRAM livres. Veja com
`nvidia-smi` quem está usando; se for outro serviço do usuário (ex.: um LLM local), **peça permissão**
antes de parar e diga como religar. Sem permissão: `{"segDevice": "cpu"}` no `config.json` do projeto
(≈8 s por frame de recorte).

## 1. Projeto e inventário
Crie uma pasta de projeto ao lado dos brutos (ex.: `<pasta>/reel_ep3/`) com `analise/`.
```bash
node ENGINE/tools/inventory.js <brutos> <projeto>
node ENGINE/tools/py.js transcribe <brutos> <projeto>/analise/transcricao.json --flat
```
(o `py.js` já põe as bibliotecas CUDA no caminho; sem GPU livre use `--device cpu`). Depois **olhe** todas as folhas (`analise/videos_*.jpg`, `fotos_*.jpg`) e leia
toda a transcrição. Procure fotos retocadas (`fotos_editadas/`) e roteiros/textos que ela deixou na pasta.

Entregue um inventário curto: o que tem em cada arquivo, melhores momentos com tempo, falas úteis
(incluindo falas dentro dos vídeos), takes repetidos (qual usar), qualidade técnica (WhatsApp 576×1024 →
upscale; iPhone → ok), e o que não abriu. **Pare e mostre.**

## 2. Roteiro visual (aprovação obrigatória)
A narração dela **é** o roteiro: mesma ordem, mesmas palavras. Para cada frase decida:
- **qual imagem** mostra exatamente o que ela diz (cena ancorada na palavra);
- **qual texto/card** ajuda a salvar a informação (preço, data, horário, o que levar);
- **onde mudar de assunto** → transição com bichinho que combine com a cena que entra;
- **3–6 momentos de palavra gigante 3D** (gancho, número, lugar, série, despedida);
- mapa se ela citar lugares; contador se citar números grandes; "Seguir" + elefante no CTA de série.
Mostre uma tabela: tempo aprox. | fala | cena (arquivo + segundo) | texto/efeito | transição/bichinho | áudio.
**Pare para aprovação.** Mudanças pedidas → ajuste a tabela antes de codar.

## 3. Montagem
Escreva `<projeto>/roteiro.json` (formato em `references/roteiro.md`; copie a estrutura do template).
```bash
node ENGINE/prep.js <projeto>      # narração, upscale (cache), recortes, legendas, âncoras → build/timeline.json
node ENGINE/music.js <projeto>     # trilha + efeitos (efeitos nunca em cima de palavra)
node ENGINE/render.js <projeto> --preview 0 1.5 3 4.5 …   # folha build/preview.jpg
```
O primeiro `prep` com upscale demora (~0,7 s por frame); os seguintes reaproveitam `build/cache/`.

## 4. Revisão frame a frame (antes do render final)
Faça prévias cobrindo: frame 0 (capa), o meio de **toda** transição, cada card/texto gigante logo depois de
entrar, e o fim. Olhe de verdade e confira:
- [ ] Frame 0 tem o gancho inteiro e legível.
- [ ] Nenhum card/nota cobre rosto. Texto gigante legível (cabeça só na base das letras).
- [ ] Recorte não pegou gente de fundo nem cortou cabeça.
- [ ] Cada bichinho é reconhecível (D ≥ 0,6 s) e combina com a cena que entra.
- [ ] Imagem combina com a palavra dita; nenhuma foto repetida/sem sentido; fotos retocadas da Greyce.
- [ ] Legendas sem erro de nome; nada importante abaixo de ~1500 px nem colado na borda direita.
Corrija no `roteiro.json` → `prep` (rápido com cache) → nova prévia. Repita até passar em tudo.

## 5. Render e conferência
```bash
node ENGINE/render.js <projeto>            # ~4 min para 70 s
node ENGINE/render.js <projeto> --audio    # se mudar só o áudio/efeitos
```
Confira e relate com números: `ffprobe` (1080×1920, 30 fps, H.264 High, AAC 48 kHz), loudness ≈ −14 LUFS
(`ffmpeg -i out.mp4 -af loudnorm=print_format=summary -f null -`), e **transcreva o MP4 final** — toda frase
da narração tem que aparecer; se sumiu, há efeito/música por cima. Folha final com 1 frame a cada 2 s.

## 6. Entrega
Envie o MP4 e a legenda do post no tom dela (estrutura em `brand.md`: gancho com emoji, série, lista útil,
toque do Liam, CTA, "Me conta: …?", 3–5 hashtags). Diga o que mudou, o que ficou de fora e por quê, e
qualquer dado que você não conseguiu confirmar (preços, datas de promoção).
