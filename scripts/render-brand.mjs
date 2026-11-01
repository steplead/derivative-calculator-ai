import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const brand = path.join(root, 'public/brand');
const iconSvg = fs.readFileSync(path.join(root, 'public/icon.svg'));

async function pngFrom(svg, size, dest) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'fill' })
    .png()
    .toFile(dest);
  return fs.readFileSync(dest);
}

function toIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const parts = [header, dir];
  images.forEach((img, index) => {
    const entry = index * 16;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, entry);
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, entry + 1);
    dir.writeUInt16LE(1, entry + 4);
    dir.writeUInt16LE(32, entry + 6);
    dir.writeUInt32LE(img.buf.length, entry + 8);
    dir.writeUInt32LE(offset, entry + 12);
    offset += img.buf.length;
    parts.push(img.buf);
  });
  return Buffer.concat(parts);
}

const icoImages = [];
for (const size of [16, 32, 48]) {
  const buf = await pngFrom(iconSvg, size, path.join(os.tmpdir(), `dca-icon-${size}.png`));
  icoImages.push({ size, buf });
}
fs.writeFileSync(path.join(root, 'public/favicon.ico'), toIco(icoImages));

await pngFrom(iconSvg, 180, path.join(root, 'public/apple-touch-icon.png'));
await pngFrom(iconSvg, 192, path.join(root, 'public/icon-192.png'));
await pngFrom(iconSvg, 512, path.join(root, 'public/icon-512.png'));

const avatarSvg = fs.readFileSync(path.join(brand, 'avatar.svg'));
await sharp(avatarSvg, { density: 192 })
  .resize(400, 400, { fit: 'fill' })
  .png()
  .toFile(path.join(brand, 'avatar-400.png'));

const ogSvg = fs.readFileSync(path.join(brand, 'og.svg'));
const og = sharp(ogSvg, { density: 144 }).resize(1200, 630, { fit: 'fill' });
await og.png().toFile(path.join(root, 'public/og-image.png'));
await sharp(ogSvg, { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .webp({ quality: 82 })
  .toFile(path.join(root, 'public/og-image.webp'));

console.log('brand rasters written');
