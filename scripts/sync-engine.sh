#!/usr/bin/env bash
# O motor é o mesmo nos dois plugins. Edite em plugins/greyce-instagram-editing/engine e rode este script:
# ele copia para o plugin -up mantendo config.json e setup.sh próprios de cada variante.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=plugins/greyce-instagram-editing/engine DST=plugins/greyce-instagram-editing-up/engine
rsync -a --delete --exclude config.json --exclude setup.sh --exclude setup.ps1 "$SRC/" "$DST/"
for d in references templates; do
  rsync -a --delete "plugins/greyce-instagram-editing/skills/greyce-instagram-editing/$d/" "plugins/greyce-instagram-editing-up/skills/greyce-instagram-editing-up/$d/"
done
echo "motor sincronizado"
