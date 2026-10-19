# Formato do `roteiro.json`

Um projeto = uma pasta com `roteiro.json` + `analise/transcricao.json`. O motor gera `build/` e `saida/`.
Exemplo completo e aprovado: `templates/ep2-zoo.roteiro.json` (EP.2 San Diego Zoo).

```jsonc
{
  "output": "EP3_Nome",            // nome do MP4 em saida/
  "root": "..",                    // pasta dos brutos, relativa ao projeto
  "upscale": false,                // opcional: sobrepõe engine/config.json
  "tempo": 1.07, "pauseMax": 0.16, "breath": 0.06,   // regra da narração (padrão da Greyce)
  "lead": 0.12, "blockGap": 0.2, "tail": 1.6,
  "music": { "bpm": 120, "energy": 0.6, "gain": 0.32, "quiet": [["B1:start", "B1:end"]] },
  "src": { "V3": "IMG_1234.MOV", "F15": "fotos_editadas/IMG_9.jpeg" },   // apelidos opcionais
  "blocks": [ ... ], "scenes": [ ... ], "ambient": [ ... ], "overlays": [ ... ],
  "captions": { ... }, "sfx": [ ... ]
}
```

## Âncoras de tempo (valem em `at`, `until`, `press`, `rows[].at`)
| Forma | Significado |
|---|---|
| `"B7:5"` | início da 6ª palavra (índice 0) do bloco B7 da narração |
| `"B7:start"` / `"B7:end"` | início da 1ª palavra / fim da última palavra do bloco |
| `"s14.in"` / `"s14.t"` / `"s14.out"` | cena s14: começo da transição / corte / fim |
| `"end"` | fim do vídeo |
| `+0.3` / `-0.1` | deslocamento em segundos (ex.: `"B5:end+0.15"`) |
| número | segundos absolutos (evitar; só para 0 = frame da capa) |

Para achar o índice da palavra, liste as palavras do take na transcrição (0, 1, 2…). **Sempre confira
os índices depois de retranscrever** — se a transcrição mudar, as âncoras mudam.

## `blocks` — a narração, na ordem do roteiro dela
```json
{ "id": "B4", "audio": "Zoo audio 6.m4a", "to": 20, "gap": 0.12, "gapAfter": 2.1 }
```
- `audio`: arquivo (ou apelido) — pode ser `.m4a` ou o áudio de um vídeo em que ela fala para a câmera.
- `to`: última palavra usada (índice) — para cortar o resto do take. `fromWord`: primeira palavra.
- `clipFrom`: segundos iniciais a pular no arquivo (útil para vídeo falado).
- `gap`: pausa antes do bloco; `gapAfter`: espaço extra depois (ex.: deixar uma fala do vídeo entrar).
- Takes repetidos: escolha o que o vídeo publicado usou ou o mais limpo/confiante (veja `p` na transcrição).

## `scenes` — o que aparece na tela
```json
{ "id": "s14", "at": "B7:0", "src": "F42e", "zoom": [1.0, 1.06], "focus": [0.5, 0.5],
  "trans": "cable", "D": 1.1, "mask": "portrait" }
```
- `at`: quando a cena entra (o corte). A cena dura até a próxima.
- `src`: vídeo (`from`: segundo inicial) ou foto (detectada pela extensão). Vídeo curto demais → o motor
  recua o início ou desacelera e avisa.
- `zoom` [início, fim] e `focus` [x, y] (0–1): Ken Burns suave, ancorado no ponto de interesse.
- `trans` + `D`: transição de entrada (ver effects.md). Sem `trans`: corte seco; `"cut": "pop"` dá um soquinho.
- `mask`: `"portrait"` (pessoas), `"general"` (pessoas + objetos/estátuas), `"fast"` (rápido na CPU) —
  necessário para `big` atrás das pessoas nessa cena.
- `polaroid`: "legenda da foto" → mostra a foto como polaroid sobre fundo de aquarela (ótimo para foto do
  site/horizontal; sempre dar crédito: "foto: site.com").
- `grid`: `[{ "src": "V1", "from": 2.2, "label": "suricato" }, … até 4]` → grade 2×2 com etiquetas.

## `ambient` — som/fala que já está no vídeo
```json
{ "src": "V3", "from": 12.45, "dur": 1.75, "at": "B5:end+0.15", "gain": 1.0, "caption": true }
```
`caption: true` cria a legenda daquela fala a partir da transcrição do vídeo. Abra espaço na narração
(`gapAfter`) para a fala não ser cortada e confira se a transição seguinte não começa em cima dela.

## `overlays` — textos e gráficos (todos ancorados)
Campos comuns: `at`, `until`, `top`, `left`, `width`, `size` (px da fonte), `align`, `rot` (graus),
`wobble` (balanço em graus), `anim: "stamp"` (carimbo), `inD`/`outD`, `style` (CSS extra).
HTML aceita `<u>` (sublinhado pêssego), `<em>` (cor coral nos `big`), `<br>`, `<b>`, `<small>`; emojis viram
emoji colorido automaticamente.

| type | uso | campos próprios |
|---|---|---|
| `big` | palavra gigante; **atrás das pessoas** (precisa `mask` na cena) | `layer: "front"` para ficar na frente; `color: "navy"` |
| `slab` | título em placa papel | — |
| `note` | nota manuscrita em caixinha blush | — |
| `hand` | manuscrito branco com sombra (sem caixa) | — |
| `card` | card de informação com linhas que entram na fala | `head`, `rows: [{html, at}]`, `chips: true` |
| `counter` | selo redondo com número subindo | `to`, `label`, `dur`, `prefix`, `suffix` |
| `map` | estado(s) desenhados + pinos + rota | `states`, `highlight`, `pins: [{label, lat, lon, dx, dy}]`, `width`, `height` |
| `follow` | botão "Seguir" + elefante que aperta com a tromba | `handle`, `press`, `eleX`, `eleY`, `eleScale` |
| `arrow` | seta desenhada à mão | `x`, `y`, `rot`, `scale` |
| `doodle` | coração / brilhinho | `kind: "heart"|"spark"`, `x`, `y`, `scale` |
| `hearts` | chuva de coraçõezinhos (final/beijo) | `x`, `y` |

Linha de card com "check": `<span class="l"><span class="tick">✓</span>bondinho incluso</span>`.
Linha com valor: `por pessoa <b>$78</b>` (`<b class="sm">` para valor menor).

## `captions`
```json
{ "top": 1250, "keywords": ["78", "bondinho"], "replace": { "Lia": "Liam" },
  "hide": [["B1:start", "B1:end+0.1"], ["B10:start-0.05", "end+5"]] }
```
`hide`: trechos sem legenda (quando um texto grande já diz a mesma coisa). `replace`: corrige nomes.

## `sfx`
`[{ "at": "B3:1", "kind": "thump" }]` — tipos: `pop`, `thump`, `ding`, `chime`, `click`. O motor tira
automaticamente qualquer efeito de cima de palavra falada (use `"overVoice": true` só se for intencional).
Whoosh nas transições, bolhas da tartaruga e o clique do "Seguir" já são automáticos.
