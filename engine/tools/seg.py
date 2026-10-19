# Recorte de pessoas para o efeito "texto atrás da pessoa" (BiRefNet / U²-Net via rembg).
# Uso: python seg.py <portrait|general|fast> <entrada: .jpg ou pasta de .jpg> <saída: .png ou pasta> [cuda|cpu]
#   portrait = birefnet-portrait (pessoas, melhor borda)   general = birefnet-general (pessoas + objetos/estátuas)
#   fast     = u2net_human_seg (bem mais rápido na CPU, borda mais grosseira)
# Saída: PNG branco com alfa = máscara, no mesmo tamanho da entrada.
import sys, os, glob
from PIL import Image, ImageFilter
from rembg import new_session, remove

kind, src, dst = sys.argv[1:4]
device = sys.argv[4] if len(sys.argv) > 4 else "cuda"
model = {"portrait": "birefnet-portrait", "general": "birefnet-general", "fast": "u2net_human_seg"}[kind]
prov = ["CUDAExecutionProvider", "CPUExecutionProvider"] if device == "cuda" else ["CPUExecutionProvider"]
session = new_session(model, providers=prov)

def one(a, b):
    im = Image.open(a).convert("RGB")
    m = remove(im, session=session, only_mask=True).filter(ImageFilter.GaussianBlur(0.8))
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(m)
    out.save(b, compress_level=1)

if os.path.isdir(src):
    os.makedirs(dst, exist_ok=True)
    files = sorted(glob.glob(os.path.join(src, "*.jpg")))
    for i, f in enumerate(files):
        one(f, os.path.join(dst, os.path.basename(f)[:-4] + ".png"))
        if i % 30 == 0: print(f"  máscara {i}/{len(files)}", flush=True)
else:
    one(src, dst)
