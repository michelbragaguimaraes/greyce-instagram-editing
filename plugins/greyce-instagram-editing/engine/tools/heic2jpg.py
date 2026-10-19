# Converte foto HEIC (iPhone) em JPEG de qualidade máxima, respeitando a rotação.
# Uso: python heic2jpg.py <entrada.heic> <saida.jpg>
import sys
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener
register_heif_opener()
ImageOps.exif_transpose(Image.open(sys.argv[1])).convert("RGB").save(sys.argv[2], quality=97)
