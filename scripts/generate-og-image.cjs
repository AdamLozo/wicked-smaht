// Generate OG image as PNG
// Creates a 1200x630 PNG for social media sharing

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const imagesDir = path.join(__dirname, '../public/images');

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  }
  crc = (crc ^ 0xFFFFFFFF) >>> 0;
  const result = Buffer.alloc(4);
  result.writeUInt32BE(crc, 0);
  return result;
}

function writeUInt32BE(value) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

function createOgPng() {
  const width = 1200;
  const height = 630;

  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type (RGB)
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace

  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]));
  const ihdrChunk = Buffer.concat([
    writeUInt32BE(13),
    ihdrType,
    ihdrData,
    ihdrCrc
  ]);

  // Colors
  const navy = [0x1a, 0x27, 0x44];
  const gold = [0xc9, 0xa2, 0x27];
  const cream = [0xf5, 0xf0, 0xe1];

  // Create image data
  const rawData = [];
  const centerX = width / 2;
  const centerY = height / 2 - 50; // Key slightly above center

  // Key parameters
  const keyHeadX = centerX - 100;
  const keyHeadY = centerY;
  const keyRadius = 80;
  const keyRingWidth = 18;
  const shaftStartX = centerX - 20;
  const shaftEndX = centerX + 180;
  const shaftY = centerY;
  const shaftWidth = 26;

  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte

    for (let x = 0; x < width; x++) {
      let [r, g, b] = navy; // Default background

      // Key head ring
      const distFromHead = Math.sqrt((x - keyHeadX) ** 2 + (y - keyHeadY) ** 2);
      if (distFromHead <= keyRadius && distFromHead >= keyRadius - keyRingWidth) {
        [r, g, b] = gold;
      }

      // Key shaft
      if (x >= shaftStartX && x <= shaftEndX &&
          y >= shaftY - shaftWidth/2 && y <= shaftY + shaftWidth/2) {
        [r, g, b] = gold;
      }

      // Key teeth
      const teethStartX = shaftEndX - 80;
      if (x >= teethStartX && x <= shaftEndX && y >= shaftY) {
        const teethX = x - teethStartX;
        const toothWidth = 18;
        const toothSpacing = 28;
        const toothIndex = Math.floor(teethX / toothSpacing);
        const toothOffset = teethX % toothSpacing;

        if (toothOffset < toothWidth && toothIndex < 3) {
          const toothHeights = [45, 60, 35];
          if (y <= shaftY + toothHeights[toothIndex]) {
            [r, g, b] = gold;
          }
        }
      }

      // Border decoration
      const borderDist = 25;
      const borderWidth = 3;
      if ((x >= borderDist && x <= borderDist + borderWidth) ||
          (x >= width - borderDist - borderWidth && x <= width - borderDist) ||
          (y >= borderDist && y <= borderDist + borderWidth) ||
          (y >= height - borderDist - borderWidth && y <= height - borderDist)) {
        // Check corners
        const cornerRadius = 20;
        let inBorder = true;
        if (x < borderDist + cornerRadius && y < borderDist + cornerRadius) {
          inBorder = Math.sqrt((x - borderDist - cornerRadius) ** 2 + (y - borderDist - cornerRadius) ** 2) >= cornerRadius - borderWidth;
        } else if (x > width - borderDist - cornerRadius && y < borderDist + cornerRadius) {
          inBorder = Math.sqrt((x - (width - borderDist - cornerRadius)) ** 2 + (y - borderDist - cornerRadius) ** 2) >= cornerRadius - borderWidth;
        } else if (x < borderDist + cornerRadius && y > height - borderDist - cornerRadius) {
          inBorder = Math.sqrt((x - borderDist - cornerRadius) ** 2 + (y - (height - borderDist - cornerRadius)) ** 2) >= cornerRadius - borderWidth;
        } else if (x > width - borderDist - cornerRadius && y > height - borderDist - cornerRadius) {
          inBorder = Math.sqrt((x - (width - borderDist - cornerRadius)) ** 2 + (y - (height - borderDist - cornerRadius)) ** 2) >= cornerRadius - borderWidth;
        }

        if (inBorder) {
          // Dimmed gold for border
          r = Math.floor(gold[0] * 0.4);
          g = Math.floor(gold[1] * 0.4);
          b = Math.floor(gold[2] * 0.4);
        }
      }

      // Text area highlighting (subtle gradient)
      if (y >= 400 && y <= 580) {
        // Slightly lighten for text area
        const factor = 1 + (y - 400) / 600;
        r = Math.min(255, Math.floor(r * factor));
        g = Math.min(255, Math.floor(g * factor));
        b = Math.min(255, Math.floor(b * factor));
      }

      rawData.push(r, g, b);
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32(Buffer.concat([idatType, compressedData]));
  const idatChunk = Buffer.concat([
    writeUInt32BE(compressedData.length),
    idatType,
    compressedData,
    idatCrc
  ]);

  // IEND chunk
  const iendType = Buffer.from('IEND');
  const iendCrc = crc32(iendType);
  const iendChunk = Buffer.concat([
    writeUInt32BE(0),
    iendType,
    iendCrc
  ]);

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

console.log('Generating OG image...');
const filepath = path.join(imagesDir, 'og-image.png');
const buffer = createOgPng();
fs.writeFileSync(filepath, buffer);
console.log(`Generated og-image.png (${buffer.length} bytes)`);
console.log('OG image features Boston key logo on navy background.');
