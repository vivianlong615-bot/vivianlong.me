const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets/cursor-retro.png');
const out32 = path.join(root, 'assets/cursor-retro-32.png');
const outTrim = path.join(root, 'assets/cursor-retro-trim.png');

function readChunks(buffer) {
  let offset = 8;
  const chunks = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.slice(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return chunks;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePNG(buffer) {
  const chunks = readChunks(buffer);
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`Unsupported PNG: depth=${bitDepth} color=${colorType}`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const compressed = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const raw = zlib.inflateSync(compressed);
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  const prev = Buffer.alloc(stride);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const row = Buffer.from(raw.slice(src, src + stride));
    src += stride;
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? row[i - channels] : 0;
      const up = prev[i];
      const upLeft = i >= channels ? prev[i - channels] : 0;
      if (filter === 1) row[i] = (row[i] + left) & 255;
      else if (filter === 2) row[i] = (row[i] + up) & 255;
      else if (filter === 3) row[i] = (row[i] + ((left + up) >> 1)) & 255;
      else if (filter === 4) row[i] = (row[i] + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error(`Unsupported filter ${filter}`);
    }
    prev.set(row);
    const dst = y * width * 4;
    for (let x = 0; x < width; x++) {
      const si = x * channels;
      const di = dst + x * 4;
      pixels[di] = row[si];
      pixels[di + 1] = row[si + 1];
      pixels[di + 2] = row[si + 2];
      pixels[di + 3] = channels === 4 ? row[si + 3] : 255;
    }
  }
  return { width, height, pixels };
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, pixels) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + stride);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', compressed),
    writeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function removeWhiteBackground({ width, height, pixels }) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (r > 235 && g > 235 && b > 235) {
        pixels[i + 3] = 0;
      } else {
        pixels[i + 3] = 255;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

function crop({ width, height, pixels }, minX, minY, maxX, maxY) {
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((y + minY) * width + (x + minX)) * 4;
      const di = (y * w + x) * 4;
      out[di] = pixels[si];
      out[di + 1] = pixels[si + 1];
      out[di + 2] = pixels[si + 2];
      out[di + 3] = pixels[si + 3];
    }
  }
  return { width: w, height: h, pixels: out };
}

function nearestScale(src, maxSize) {
  const scale = Math.min(maxSize / src.width, maxSize / src.height);
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(src.width - 1, Math.floor((x + 0.5) * src.width / w));
      const sy = Math.min(src.height - 1, Math.floor((y + 0.5) * src.height / h));
      const si = (sy * src.width + sx) * 4;
      const di = (y * w + x) * 4;
      out[di] = src.pixels[si];
      out[di + 1] = src.pixels[si + 1];
      out[di + 2] = src.pixels[si + 2];
      out[di + 3] = src.pixels[si + 3];
    }
  }
  return { width: w, height: h, pixels: out };
}

function padTopLeft(img, size) {
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const si = (y * img.width + x) * 4;
      const di = (y * size + x) * 4;
      out[di] = img.pixels[si];
      out[di + 1] = img.pixels[si + 1];
      out[di + 2] = img.pixels[si + 2];
      out[di + 3] = img.pixels[si + 3];
    }
  }
  return { width: size, height: size, pixels: out };
}

const decoded = decodePNG(fs.readFileSync(src));
const bbox = removeWhiteBackground(decoded);
const trimmed = crop(decoded, bbox.minX, bbox.minY, bbox.maxX, bbox.maxY);
fs.writeFileSync(outTrim, encodePNG(trimmed.width, trimmed.height, trimmed.pixels));

const scaled = nearestScale(trimmed, 32);
const canvas = padTopLeft(scaled, 32);
fs.writeFileSync(out32, encodePNG(canvas.width, canvas.height, canvas.pixels));

console.log(`trimmed: ${trimmed.width}x${trimmed.height}, cursor: ${scaled.width}x${scaled.height} in 32x32`);
