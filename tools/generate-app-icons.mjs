import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(root, 'assets', 'sudoris-app-icon.svg');
const svg = await fs.readFile(svgPath);
const background = { r: 16, g: 23, b: 44, alpha: 1 };
const densities = [
  { folder: 'mipmap-ldpi', icon: 36, layer: 48 },
  { folder: 'mipmap-mdpi', icon: 48, layer: 108 },
  { folder: 'mipmap-hdpi', icon: 72, layer: 162 },
  { folder: 'mipmap-xhdpi', icon: 96, layer: 216 },
  { folder: 'mipmap-xxhdpi', icon: 144, layer: 324 },
  { folder: 'mipmap-xxxhdpi', icon: 192, layer: 432 },
];

for (const density of densities) {
  const directory = path.join(root, 'android', 'app', 'src', 'main', 'res', density.folder);
  await fs.mkdir(directory, { recursive: true });

  const foreground = sharp(svg).resize(density.layer, density.layer).png();
  const foregroundBuffer = await foreground.toBuffer();
  const flattened = await sharp({
    create: { width: density.icon, height: density.icon, channels: 4, background },
  }).composite([
    { input: await sharp(foregroundBuffer).resize(density.icon, density.icon).png().toBuffer() },
  ]).png().toBuffer();

  await Promise.all([
    fs.writeFile(path.join(directory, 'ic_launcher_foreground.png'), foregroundBuffer),
    fs.writeFile(path.join(directory, 'ic_launcher_background.png'), await sharp({
      create: { width: density.layer, height: density.layer, channels: 4, background },
    }).png().toBuffer()),
    fs.writeFile(path.join(directory, 'ic_launcher.png'), flattened),
    fs.writeFile(path.join(directory, 'ic_launcher_round.png'), flattened),
  ]);
}

const webIconDirectory = path.join(root, 'icons');
await fs.mkdir(webIconDirectory, { recursive: true });
for (const size of [48, 72, 96, 128, 192, 256, 512]) {
  const icon = await sharp({
    create: { width: size, height: size, channels: 4, background },
  }).composite([
    { input: await sharp(svg).resize(size, size).png().toBuffer() },
  ]).webp({ quality: 92 }).toBuffer();
  await fs.writeFile(path.join(webIconDirectory, `icon-${size}.webp`), icon);
}

console.log('Generated Sudoris launcher and web app icons.');
