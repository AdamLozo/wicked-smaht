// Generate minimal valid MP3 audio files for SFX
// These are short silent/minimal audio files that can be replaced later

const fs = require('fs');
const path = require('path');

const sfxDir = path.join(__dirname, '../public/assets/audio/sfx');

// Create a minimal valid MP3 frame
// This creates a very short (~26ms) valid MP3 file with silence
function createMinimalMp3() {
  // MP3 frame header for 44100Hz, stereo, 128kbps
  // Sync word: 0xFFE
  // Version: MPEG Audio Version 1 (2 bits = 11)
  // Layer: Layer III (2 bits = 01)
  // Protection: No CRC (1 bit = 1)
  // Bitrate: 128kbps (index 9 = 1001)
  // Sample rate: 44100Hz (index 0 = 00)
  // Padding: No (0)
  // Private: 0
  // Channel mode: Stereo (00)
  // Mode extension: 00
  // Copyright: 0
  // Original: 1
  // Emphasis: None (00)

  // Frame header bytes: 0xFF 0xFB 0x90 0x04
  const frameHeader = Buffer.from([0xFF, 0xFB, 0x90, 0x04]);

  // Side info for stereo (32 bytes)
  const sideInfo = Buffer.alloc(32, 0);

  // Audio data - silence (approximately 384 bytes for one frame at 128kbps)
  const frameDataSize = 417 - 4 - 32; // Frame size minus header minus side info
  const audioData = Buffer.alloc(frameDataSize, 0);

  // Create multiple frames for a slightly longer audio (~100ms)
  const numFrames = 4;
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    frames.push(frameHeader, sideInfo, audioData);
  }

  return Buffer.concat(frames);
}

// Create MP3 files with simple tone generation
// This creates a basic MP3 with ID3 tag and audio frames
function createMp3WithTone(name, freqHint) {
  // ID3v2 header (optional but helps with compatibility)
  const id3Header = Buffer.from([
    0x49, 0x44, 0x33,  // "ID3"
    0x04, 0x00,        // version 2.4.0
    0x00,              // flags
    0x00, 0x00, 0x00, 0x00  // size (0 = no tags)
  ]);

  // MP3 audio frames
  const audioData = createMinimalMp3();

  return Buffer.concat([id3Header, audioData]);
}

const sfxFiles = [
  { name: 'correct', description: 'Success sound for correct answers' },
  { name: 'wrong', description: 'Error sound for wrong answers' },
  { name: 'key_get', description: 'Achievement sound for collecting keys' },
  { name: 'polaroid', description: 'Camera shutter sound for polaroids' },
  { name: 'timer_tick', description: 'Tick sound for timer' },
  { name: 'timer_end', description: 'Alarm sound when timer ends' },
  { name: 'unlock', description: 'Unlock sound for locations' },
  { name: 'notification', description: 'Notification ping' },
];

console.log('Generating SFX audio files...');

sfxFiles.forEach(({ name, description }) => {
  const filepath = path.join(sfxDir, `${name}.mp3`);
  const buffer = createMp3WithTone(name, 440);
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated ${name}.mp3 (${buffer.length} bytes) - ${description}`);
});

console.log('\nAll SFX files generated successfully!');
console.log('These are minimal silent MP3 placeholders.');
console.log('For production, replace with actual sound effects.');
