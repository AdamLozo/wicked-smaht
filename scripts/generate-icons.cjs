// Simple script to generate minimal valid PNG icons
// Creates solid navy color PNG placeholders with key icon

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// CRC32 table
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

function createPng(size) {
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
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

  // Create image data - navy background with gold key icon
  // Navy RGB: 26, 39, 68 (0x1a, 0x27, 0x44)
  // Gold RGB: 201, 162, 39 (0xc9, 0xa2, 0x27)
  const rawData = [];

  const center = size / 2;
  const keyRadius = size * 0.18;
  const keyHoleRadius = size * 0.07;
  const shaftLength = size * 0.35;
  const shaftWidth = size * 0.06;

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte for each row
    for (let x = 0; x < size; x++) {
      // Default to navy
      let r = 0x1a, g = 0x27, b = 0x44;

      // Key head (circle) - centered slightly left and up
      const keyHeadX = center - size * 0.12;
      const keyHeadY = center - size * 0.08;
      const distFromHead = Math.sqrt((x - keyHeadX) ** 2 + (y - keyHeadY) ** 2);

      // Key shaft - horizontal rectangle
      const shaftY = keyHeadY;
      const shaftStartX = keyHeadX + keyRadius * 0.3;
      const shaftEndX = shaftStartX + shaftLength;

      // Check if in key head ring (not the hole)
      if (distFromHead <= keyRadius && distFromHead >= keyRadius - size * 0.05) {
        r = 0xc9; g = 0xa2; b = 0x27;
      }
      // Check if in key shaft
      else if (x >= shaftStartX && x <= shaftEndX &&
               y >= shaftY - shaftWidth/2 && y <= shaftY + shaftWidth/2) {
        r = 0xc9; g = 0xa2; b = 0x27;
      }
      // Key teeth
      else if (x >= shaftEndX - size * 0.15 && x <= shaftEndX) {
        const toothX = x - (shaftEndX - size * 0.15);
        const toothWidth = size * 0.03;
        const toothSpacing = size * 0.05;
        const toothIndex = Math.floor(toothX / toothSpacing);
        const toothOffset = toothX % toothSpacing;

        if (toothOffset < toothWidth && toothIndex < 3) {
          const toothHeights = [size * 0.07, size * 0.1, size * 0.06];
          const toothHeight = toothHeights[toothIndex] || size * 0.05;
          if (y >= shaftY && y <= shaftY + toothHeight) {
            r = 0xc9; g = 0xa2; b = 0x27;
          }
        }
      }

      // Add rounded corners (circular mask)
      const cornerRadius = size * 0.125;
      let inCorner = false;
      if (x < cornerRadius && y < cornerRadius) {
        inCorner = Math.sqrt((x - cornerRadius) ** 2 + (y - cornerRadius) ** 2) > cornerRadius;
      } else if (x >= size - cornerRadius && y < cornerRadius) {
        inCorner = Math.sqrt((x - (size - cornerRadius)) ** 2 + (y - cornerRadius) ** 2) > cornerRadius;
      } else if (x < cornerRadius && y >= size - cornerRadius) {
        inCorner = Math.sqrt((x - cornerRadius) ** 2 + (y - (size - cornerRadius)) ** 2) > cornerRadius;
      } else if (x >= size - cornerRadius && y >= size - cornerRadius) {
        inCorner = Math.sqrt((x - (size - cornerRadius)) ** 2 + (y - (size - cornerRadius)) ** 2) > cornerRadius;
      }

      if (inCorner) {
        r = 0; g = 0; b = 0; // Transparent corners (will appear black in PNG RGB)
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

// Generate icons
console.log('Generating app icons...');

sizes.forEach(size => {
  const filename = size <= 32 ? `favicon-${size}x${size}.png` : `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  const buffer = createPng(size);
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated ${filename} (${buffer.length} bytes)`);
});

console.log('\nAll icons generated successfully!');
console.log('Icons feature the Boston key logo on navy background.');
