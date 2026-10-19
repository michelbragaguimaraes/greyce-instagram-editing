// Inventário dos materiais brutos: lista, confere se abre, mede, e gera folhas de frames para olhar.
//   node tools/inventory.js <pasta-dos-brutos> <pasta-do-projeto>
// Saída em <projeto>/analise/: inventario.json, videos_N.jpg (8 frames por vídeo, 4 vídeos por folha), fotos_N.jpg
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(process.argv[2] || "."), PROJ = path.resolve(process.argv[3] || ROOT);
const OUT = path.join(PROJ, "analise"); fs.mkdirSync(path.join(OUT, "tmp"), { recursive: true });
const skip = new Set(["build", "saida", "analise", "node_modules", "reel_ep2", "reel_v3"]);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (skip.has(e.name) || e.name.startsWith(".") ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
const files = walk(ROOT);
const VID = /\.(mp4|mov|m4v|webm)$/i, AUD = /\.(m4a|mp3|wav|aac|caf)$/i, IMG = /\.(jpe?g|png|webp|heic|avif)$/i;
const probe = (f) => { try { return JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,color_transfer:stream_side_data=rotation", "-of", "json", f]).toString()); } catch (e) { return { erro: String(e.message).slice(0, 200) }; } };
const ff = (a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);

const inv = { videos: [], audios: [], fotos: [], outros: [] };
files.forEach((f) => {
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  if (VID.test(f)) inv.videos.push({ id: "V" + (inv.videos.length + 1), file: rel, ...probe(f) });
  else if (AUD.test(f)) inv.audios.push({ id: "A" + (inv.audios.length + 1), file: rel, ...probe(f) });
  else if (IMG.test(f)) inv.fotos.push({ id: "F" + (inv.fotos.length + 1), file: rel, ...probe(f) });
  else inv.outros.push(rel);
});
// folhas de vídeo: 8 frames espalhados por vídeo
inv.videos.forEach((v) => {
  const d = +(v.format?.duration || 0); if (!d) return;
  try { ff(["-i", path.join(ROOT, v.file), "-vf", `fps=${8 / d},scale=240:-2,drawtext=text='${v.id} %{pts\\:hms}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=8x1`, "-frames:v", "1", path.join(OUT, "tmp", v.id + ".jpg")]); } catch { v.erroFolha = true; }
});
for (let i = 0; i < inv.videos.length; i += 4) {
  const ids = inv.videos.slice(i, i + 4).map((v) => path.join(OUT, "tmp", v.id + ".jpg")).filter(fs.existsSync);
  if (!ids.length) continue;
  ff([...ids.flatMap((f) => ["-i", f]), "-filter_complex", ids.length > 1 ? `${ids.map((_, k) => `[${k}]scale=1920:-2[s${k}]`).join(";")};${ids.map((_, k) => `[s${k}]`).join("")}vstack=inputs=${ids.length}` : "scale=1920:-2", path.join(OUT, `videos_${i / 4 + 1}.jpg`)]);
}
// folhas de fotos: 8 x 3 por folha
inv.fotos.forEach((p) => { try { ff(["-i", path.join(ROOT, p.file), "-frames:v", "1", "-vf", `scale=240:320:force_original_aspect_ratio=decrease,pad=240:320:(ow-iw)/2:(oh-ih)/2,drawtext=text='${p.id}':x=4:y=4:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7`, path.join(OUT, "tmp", p.id + ".jpg")]); } catch { p.erroFolha = true; } });
const ok = inv.fotos.filter((p) => !p.erroFolha);
for (let i = 0; i < ok.length; i += 24) {
  const grp = ok.slice(i, i + 24);
  ff([...grp.flatMap((p) => ["-i", path.join(OUT, "tmp", p.id + ".jpg")]), "-filter_complex", `xstack=inputs=${grp.length}:layout=${grp.map((_, k) => `${(k % 8) * 240}_${Math.floor(k / 8) * 320}`).join("|")}:fill=black`.replace(/^xstack=inputs=1:.*$/, "null"), path.join(OUT, `fotos_${i / 24 + 1}.jpg`)]);
}
fs.rmSync(path.join(OUT, "tmp"), { recursive: true, force: true });
fs.writeFileSync(path.join(OUT, "inventario.json"), JSON.stringify(inv, null, 1));
const falhas = [...inv.videos, ...inv.audios, ...inv.fotos].filter((x) => x.erro || x.erroFolha).map((x) => x.file);
console.log(`${inv.videos.length} vídeos · ${inv.audios.length} áudios · ${inv.fotos.length} fotos · ${inv.outros.length} outros`);
if (falhas.length) console.log("NÃO ABRIRAM:", falhas.join(", "));
console.log("folhas em", OUT);
