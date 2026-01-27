// Generate favicon.ico from the 32x32 PNG
// ICO format is essentially a container for BMP or PNG images

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

// Read the 32x32 PNG
const png32 = fs.readFileSync(path.join(iconsDir, 'favicon-32x32.png'));
const png16 = fs.readFileSync(path.join(iconsDir, 'favicon-16x16.png'));

// ICO file structure:
// - ICONDIR header (6 bytes)
// - ICONDIRENTRY for each image (16 bytes each)
// - Image data (PNG format is supported in ICO)

function createIco(pngFiles) {
  const numImages = pngFiles.length;

  // ICONDIR header
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);      // Reserved, must be 0
  iconDir.writeUInt16LE(1, 2);      // Image type: 1 = icon
  iconDir.writeUInt16LE(numImages, 4); // Number of images

  // Calculate offsets
  let offset = 6 + (16 * numImages); // Header + entries
  const entries = [];
  const images = [];

  pngFiles.forEach((pngData, index) => {
    // Parse PNG to get dimensions
    // PNG files have width/height in IHDR chunk at bytes 16-23
    const width = pngData.readUInt32BE(16);
    const height = pngData.readUInt32BE(20);

    // ICONDIRENTRY (16 bytes)
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width <= 255 ? width : 0, 0);   // Width (0 = 256)
    entry.writeUInt8(height <= 255 ? height : 0, 1); // Height (0 = 256)
    entry.writeUInt8(0, 2);                           // Color count (0 = no palette)
    entry.writeUInt8(0, 3);                           // Reserved
    entry.writeUInt16LE(1, 4);                        // Color planes
    entry.writeUInt16LE(32, 6);                       // Bits per pixel
    entry.writeUInt32LE(pngData.length, 8);          // Image size
    entry.writeUInt32LE(offset, 12);                 // Offset to image data

    entries.push(entry);
    images.push(pngData);
    offset += pngData.length;
  });

  return Buffer.concat([iconDir, ...entries, ...images]);
}

// Create favicon.ico with 16x16 and 32x32 images
const icoBuffer = createIco([png16, png32]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
console.log(`Generated favicon.ico (${icoBuffer.length} bytes) with 16x16 and 32x32 icons`);
