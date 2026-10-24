/**
 * Generates the PWA icons for BarberShop Pro (no dependencies — writes PNGs
 * with node:zlib). The design is a barber pole: a white capsule with diagonal
 * brand-blue stripes and chrome caps, on a navy background.
 *
 * Usage: node scripts/generate-icons.mjs
 * Outputs: public/icons/{icon-192,icon-512,maskable-512,apple-touch-icon,favicon-64}.png
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

/* ---------- oklch(0.546 0.214 262.88) — the app's --primary — to sRGB ---------- */
function oklchToRgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const gam = (c) => {
    c = Math.min(1, Math.max(0, c));
    return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
  };
  return [gam(r), gam(g), gam(bb)];
}

const PRIMARY = oklchToRgb(0.546, 0.214, 262.88);
const NAVY = [27, 42, 86]; // darkened brand blue for the background
const WHITE = [255, 255, 255];
const CHROME = [207, 214, 228];
console.log(`primary rgb(${PRIMARY.join(',')}) = #${PRIMARY.map((c) => c.toString(16).padStart(2, '0')).join('')}`);

/* ---------- minimal PNG encoder (RGBA, filter 0) ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(file, width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log(`wrote ${path.relative(process.cwd(), file)} (${png.length} bytes)`);
}

/* ---------- drawing ---------- */
// rounded-rect signed distance (negative inside)
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function renderIcon(size, { rounded, scale = 1 }) {
  const SS = 4; // supersampling for antialiasing
  const big = size * SS;
  const out = Buffer.alloc(size * size * 4);

  // pole geometry (normalized), scaled around center for maskable safe zone
  const cx = 0.5, cy = 0.5;
  const pole = { cx: 0.5, cy: 0.5, hw: 0.14 * scale, hh: 0.32 * scale, r: 0.13 * scale };
  const capTop = { cx: 0.5, cy: 0.5 - (0.32 * scale + 0.045 * scale), hw: 0.18 * scale, hh: 0.045 * scale, r: 0.03 * scale };
  const capBot = { cx: 0.5, cy: 0.5 + (0.32 * scale + 0.045 * scale), hw: 0.18 * scale, hh: 0.045 * scale, r: 0.03 * scale };
  const stripePeriod = 0.17 * scale;
  const bgRadius = 0.18;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x * SS + sx + 0.5) / big;
          const py = (y * SS + sy + 0.5) / big;
          let col;
          const inPole = sdRoundRect(px, py, pole.cx, pole.cy, pole.hw, pole.hh, pole.r) < 0;
          const inCap =
            sdRoundRect(px, py, capTop.cx, capTop.cy, capTop.hw, capTop.hh, capTop.r) < 0 ||
            sdRoundRect(px, py, capBot.cx, capBot.cy, capBot.hw, capBot.hh, capBot.r) < 0;
          if (inPole) {
            // diagonal barber stripes
            const t = ((px + py) % stripePeriod + stripePeriod) % stripePeriod;
            col = t < stripePeriod * 0.5 ? PRIMARY : WHITE;
          } else if (inCap) {
            col = CHROME;
          } else {
            col = NAVY;
          }
          // background corner rounding ("any" purpose icons only)
          let alpha = 1;
          if (rounded && !inPole && !inCap) {
            const corner = sdRoundRect(px, py, 0.5, 0.5, 0.5, 0.5, bgRadius);
            if (corner >= 0) alpha = 0;
          }
          r += col[0] * alpha; g += col[1] * alpha; b += col[2] * alpha; a += alpha;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      const aSum = a || 1;
      out[i] = Math.round(r / aSum);
      out[i + 1] = Math.round(g / aSum);
      out[i + 2] = Math.round(b / aSum);
      out[i + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

writePng(path.join(OUT_DIR, 'icon-192.png'), 192, 192, renderIcon(192, { rounded: true }));
writePng(path.join(OUT_DIR, 'icon-512.png'), 512, 512, renderIcon(512, { rounded: true }));
writePng(path.join(OUT_DIR, 'maskable-512.png'), 512, 512, renderIcon(512, { rounded: false, scale: 0.82 }));
writePng(path.join(OUT_DIR, 'apple-touch-icon.png'), 180, 180, renderIcon(180, { rounded: false, scale: 0.82 }));
writePng(path.join(OUT_DIR, 'favicon-64.png'), 64, 64, renderIcon(64, { rounded: true }));
