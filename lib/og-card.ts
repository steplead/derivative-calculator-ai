/**
 * Small PNG card for share links. No native canvas and no wasm font renderer.
 * Glyphs are a 5×7 bitmap so the worker stays light.
 */

const GLYPH: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '0': [14, 17, 19, 21, 25, 17, 14],
  '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 2, 4, 8, 31],
  '3': [14, 17, 1, 6, 1, 17, 14],
  '4': [2, 6, 10, 18, 31, 2, 2],
  '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [6, 8, 16, 30, 17, 17, 14],
  '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14],
  '9': [14, 17, 17, 15, 1, 2, 12],
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 14],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [14, 17, 16, 14, 1, 17, 14],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  '+': [0, 4, 4, 31, 4, 4, 0],
  '-': [0, 0, 0, 31, 0, 0, 0],
  '*': [0, 17, 10, 4, 10, 17, 0],
  '/': [1, 2, 4, 4, 4, 8, 16],
  '^': [4, 10, 17, 0, 0, 0, 0],
  '(': [2, 4, 8, 8, 8, 4, 2],
  ')': [8, 4, 2, 2, 2, 4, 8],
  '=': [0, 31, 0, 31, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 12, 12],
  ',': [0, 0, 0, 0, 0, 4, 8],
};

function glyph(char: string): number[] {
  const upper = char.toUpperCase();
  return GLYPH[upper] || GLYPH[char] || GLYPH[' '];
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  const crcInput = out.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(crcInput));
  return out;
}

function paint(width: number, height: number, lines: string[]): Uint8Array {
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = 15;
    rgb[i * 3 + 1] = 23;
    rgb[i * 3 + 2] = 42;
  }
  const scale = 4;
  const lineHeight = 8 * scale + 18;
  lines.slice(0, 8).forEach((line, lineIndex) => {
    const text = line.slice(0, 42);
    let x0 = 48;
    const y0 = 70 + lineIndex * lineHeight;
    const color = lineIndex === 0 ? [96, 165, 250] : [248, 250, 252];
    for (const char of text) {
      const rows = glyph(char);
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (((rows[row] >> (4 - col)) & 1) === 0) continue;
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const x = x0 + col * scale + sx;
              const y = y0 + row * scale + sy;
              if (x >= width || y >= height) continue;
              const pixel = (y * width + x) * 3;
              rgb[pixel] = color[0];
              rgb[pixel + 1] = color[1];
              rgb[pixel + 2] = color[2];
            }
          }
        }
      }
      x0 += 6 * scale;
    }
  });
  return rgb;
}

function asArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  return copy;
}

async function zlib(data: Uint8Array): Promise<Uint8Array> {
  const source = new Response(asArrayBuffer(data)).body;
  if (!source || typeof CompressionStream !== 'function') {
    throw new Error('PNG compression is unavailable in this runtime.');
  }
  const stream = source.pipeThrough(new CompressionStream('deflate'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function encodeCardPng(lines: string[]): Promise<Uint8Array> {
  const width = 1200;
  const height = 630;
  const rgb = paint(width, height, lines);
  const raw = new Uint8Array((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const start = y * (width * 3 + 1);
    raw[start] = 0;
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), start + 1);
  }
  const compressed = await zlib(raw);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', new Uint8Array())];
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}
