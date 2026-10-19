# Lições aprendidas (EP.2 San Diego Zoo, out/2026) — não repetir

1. **Nunca trocar a narração/roteiro dela.** Uma versão de 25 s com "conceito novo" e sem a narração foi
   rejeitada na hora ("cadê a narração??"). Melhorar = mesma fala, edição melhor.
2. **Não inventar fatos.** "O Liam falou turtle em inglês" era falso (quem falou foi o pai). Confirme quem
   fala o quê antes de pôr na tela; na dúvida, pergunte.
3. **Efeito sonoro em cima de palavra apaga a palavra** ("não paga" sumiu sob um plim). O motor agora empurra
   efeitos para depois da fala — não force `overVoice` em informação.
4. **Fala de vídeo cortada no meio** ("Que elefante legal!"): reserve espaço (`gapAfter`) e confira que a
   próxima transição começa depois do fim da fala.
5. **Transição rápida demais = ninguém entende o bichinho.** Mínimo ~0,6 s; tartaruga 1,4 s; tromba 1 s.
6. **Card em cima de rosto.** Revisar frame a frame; mover o card ou trocar a imagem por uma em que as
   pessoas fiquem embaixo. Cards só mostram as linhas que já foram ditas (não reservam espaço vazio).
7. **Fotos repetidas/sem sentido** (3 fotos quase iguais do carrinho de óculos) — use uma, ou nenhuma.
8. **Fotos da Greyce sem retoque** quando existem versões retocadas — sempre usar as retocadas.
9. **Recorte pega gente de fundo** (adulto cortado na borda de cima atrás do Liam) e o texto gigante some
   atrás de um estranho. Escolher cena com a pessoa isolada; não vale a pena "consertar" a máscara.
10. **Texto gigante atrás da cabeça** fica ilegível se a cabeça cobre o meio da palavra — subir o texto
    para a cabeça encostar só na base.
11. **"Em cima do letreiro real"**: não repita em texto gigante algo que já está escrito na foto (letreiro
    "San Diego Zoo"); recorte/enquadre a foto ou mude o texto.
12. **Vídeo do WhatsApp é 576×1024 comprimido** → upscale com IA (versão com GPU) ou, sem GPU, evitar
    zoom > 1,1 nesses trechos. iPhone original dispensa upscale.
13. **A transcrição erra nomes** ("Lia" no lugar de "Liam") — sempre ler as legendas antes do render.
14. **Gancho visível no frame 0** — a capa do reel é o primeiro frame.
15. **Conferir o vídeo pronto ouvindo-o pela transcrição** (Whisper no MP4 final): toda frase da narração
    tem que aparecer; o que sumir está mascarado por música/efeito.
