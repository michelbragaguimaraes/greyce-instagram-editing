# Catálogo de efeitos — quando usar cada um

Regra de ouro: **cada efeito precisa de um motivo na fala ou na imagem**. Se você não consegue dizer
"entra X porque ela está falando de Y", não use.

## Transições (campo `trans` da cena que entra)
| trans | D | O que acontece | Use quando… |
|---|---|---|---|
| `turtle` | 1.4 | tartaruga 3D (Three.js) nada atravessando; o casco revela a cena | aquário, água, "devagar", revelação; momento-surpresa |
| `trunk` | 1.0 | cabeça de elefante empurra a cena com a tromba | elefantes, "o favorito", algo grande |
| `splash` | 1.1 | onda d'água sobe com gotas e revela | piscina, área de água, praia, banho, chuva |
| `cable` | 1.1 | bondinho desliza no cabo e "carrega" a cena | bondinho/teleférico, viagem, "por cima" |
| `footprints` | 1.0 | pegadinhas de bebê andam até o centro e abrem um círculo | chegada a um lugar, "levei o Liam", primeiros passos |
| `elefootprints` | 0.8 | pegadas de elefante cruzam a tela | passeio/zoológico, sequência de dicas |
| `meerkat` | 0.7 | suricato brota de um buraco e abre um círculo | curiosidade, "olha só", surpresa |
| `snake` | 0.8 | cobra desliza em S como cortina | répteis, "nope", susto, reviravolta |
| `butterflies` | 0.8 | revoada de borboletas sobe | jardim, flores, delicadeza, recomeço |
| `flamingo` | 0.8 | perna de flamingo pisa e abre um círculo | lagoa, rosa, equilíbrio |
| `zoomblur` | 0.7 | zoom + desfoque | mudança de assunto, ir para vista aérea |
| `whip` | 0.6 | chicote lateral com motion blur | ritmo rápido, "leva carrinho!", lista |
| `slide` | 0.8 | cena entra deslizando | CTA final |
| `heart` | 0.6 | abertura circular (use com overlay `hearts`) | beijo, carinho, fechamento |
| `grid` | 0.6 | grade 2×2 entra peça por peça | "tem mais de N…", variedade, lista de opções |
| `fade` | 0.5 | dissolve | raramente |
Abaixo de 0,6 s o bichinho não é visto (o prep avisa). Uma transição com bichinho a cada mudança de
**assunto**; dentro do mesmo assunto, corte seco ou `"cut": "pop"` no ritmo da fala.

**Novo bichinho?** Adicione em `engine/web/js/transitions.js` no mesmo traço (navy 7 px + aquarela
sky/blush/peach), com `clip()` (o que revela) e `draw()` (o bichinho), e a duração padrão em `prep.js` (`TR_D`).

## Palavra gigante 3D (`big`)
A pessoa fica **na frente** das letras (camada de recorte). Como acertar:
- Cena com `mask` e pessoas **grandes e isoladas** (aquário, céu, parede). Se aparecer gente de fundo
  cortada na borda, troque a cena — o recorte pega todo mundo.
- Posição: as cabeças devem encostar só na **base** das letras (texto acima da cabeça), senão a palavra
  some. Teste com prévia: a palavra tem que ser lida em 0,5 s.
- 1 palavra (ou 2 linhas curtas). Tamanho 140–540 px; nunca sair da largura (1080).
- Use em 3–6 momentos: gancho, número-chave ($78), nome do lugar (ZOO), série (EP.2), despedida (BEIJO!).
- Se a pessoa cobrir demais, use `layer: "front"` (fica na frente, sem 3D).
- Cores: papel com sombra navy (padrão) sobre vídeo; `color: "navy"` sobre fundo claro; `<em>` = coral.

## Cards e textos
- **card** para informação útil que a pessoa vai querer salvar (preço, horário, regras, o que levar).
  As linhas entram **na palavra exata** em que ela fala. Card no terço de cima (top 200–300) ou logo
  acima da legenda (top ~820–1085); nunca em cima de rosto.
- **slab** para frase de impacto curta; **note** para comentário dela ("eu te conto já já… 🤫").
- **counter** para números ("+650 espécies", "$0").
- **map** quando ela citar lugares: estado da Califórnia com pino em San Diego, rota entre cidades
  (ex.: San Marcos → San Diego). `states: ["California"]`, `pins: [{ "label": "San Diego", "lat": 32.72, "lon": -117.16 }]`.
  Coordenadas úteis: San Diego 32.72/−117.16 · San Marcos 33.14/−117.17 · Los Angeles 34.05/−118.24 ·
  Carlsbad 33.16/−117.35 · Escondido 33.12/−117.09 · Orange County (Anaheim) 33.84/−117.91.
  Cidades a menos de ~60 km uma da outra se sobrepõem no mapa do estado inteiro: use um pino só
  (ou `states` só da Califórnia e `width`/`height` maiores). Mapa sempre longe dos rostos.
- **follow** no CTA final de série ("me segue pro EP. N+1").
- **hearts** + `big "BEIJO!"` quando ela se despede com "Beijo!".

## Zonas seguras (1080×1920)
- Topo 0–150: ícones do Instagram → só texto decorativo.
- Legenda das falas: top ≈ 1250. Abaixo de ~1500: nome do perfil, legenda do post, botões → nada importante.
- Direita 960–1080: botões de curtir/comentar → evitar texto essencial colado na borda direita.

## Legendas das falas
Frase inteira (até ~22 caracteres por bloco), palavra falada com marca-texto pêssego, palavras-chave em
Fraunces navy (`captions.keywords`). Esconder (`captions.hide`) onde um texto gigante já diz a fala.
Revisar nomes próprios (Liam, Greyce, lugares) — corrigir com `captions.replace`.
