// Generates the PWA PNG icons with no image libraries: a gradient tile with a
// progress ring at 75%. Run with `npm run icons`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const NEON = [0, 255, 102];
const GREEN = [0, 224, 90];
const PALE = [150, 255, 190];
const INK = [0, 0, 0];

function render(size, { maskable }) {
  const row = size * 4 + 1;
  const raw = Buffer.alloc(row * size);
  const c = size / 2;
  const k = maskable ? 0.82 : 1; // keep the ring inside the maskable safe zone
  const radius = size * 0.3 * k;
  const stroke = size * 0.11 * k;
  const corner = maskable ? 0 : size * 0.22;
  for (let y = 0; y < size; y++) {
    raw[y * row] = 0;
    for (let x = 0; x < size; x++) {
      const i = y * row + 1 + x * 4;
      const px = x + 0.5 - c;
      const py = y + 0.5 - c;
      // Rounded-square mask, anti-aliased.
      const dx = Math.max(Math.abs(px) - (c - corner), 0);
      const dy = Math.max(Math.abs(py) - (c - corner), 0);
      const outside = Math.hypot(dx, dy) - corner;
      const alpha = Math.max(0, Math.min(1, 0.5 - outside));
      let col = mix(INK, [0, 24, 10], (x + y) / (2 * size));
      const ringDist = Math.abs(Math.hypot(px, py) - radius) - stroke / 2;
      const ringA = Math.max(0, Math.min(1, 0.5 - ringDist));
      if (ringA > 0) {
        let ang = Math.atan2(px, -py); // 0 at the top, clockwise
        if (ang < 0) ang += Math.PI * 2;
        const t = ang / (Math.PI * 2);
        let ringCol = [0, 60, 25];
        if (t <= 0.75) ringCol = t < 0.4 ? mix(NEON, GREEN, t / 0.4) : mix(GREEN, PALE, (t - 0.4) / 0.35);
        col = mix(col, ringCol, ringA);
      }
      raw[i] = col[0];
      raw[i + 1] = col[1];
      raw[i + 2] = col[2];
      raw[i + 3] = Math.round(alpha * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', render(192, { maskable: false }));
writeFileSync('public/icons/icon-512.png', render(512, { maskable: false }));
writeFileSync('public/icons/icon-maskable-512.png', render(512, { maskable: true }));
console.log('Icons written to public/icons');
