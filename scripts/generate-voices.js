/**
 * ElevenLabs Voice Generation Script
 *
 * This script reads the voice-lines-export.csv and generates audio files
 * using the ElevenLabs API, then saves them to the correct locations.
 *
 * Setup:
 * 1. Get your API key from https://elevenlabs.io/settings/api-keys
 * 2. Create a .env file in the scripts folder with: ELEVENLABS_API_KEY=your_key_here
 * 3. In ElevenLabs, create or select voices for each character and note their voice IDs
 * 4. Update the VOICE_MAP below with your voice IDs
 * 5. Run: node scripts/generate-voices.js
 *
 * The script will:
 * - Read all lines from the CSV
 * - Generate audio for each line using the assigned voice
 * - Save files to public/assets/audio/voice/{character}/
 * - Track progress and skip already-generated files
 * - Handle rate limiting automatically
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Get your API key from https://elevenlabs.io/settings/api-keys
const API_KEY = process.env.ELEVENLABS_API_KEY || '38cf8d3ee5f7944e5607bd80301c2bab515151e4630fe0de133acb1388663e7d';

// Voice IDs from ElevenLabs - you'll need to select/create voices and copy their IDs
// Find voice IDs at: https://elevenlabs.io/voice-library or your "My Voices" page
const VOICE_MAP = {
  // Main characters - UPDATE THESE WITH YOUR CHOSEN VOICE IDs
  sully: 'NywA242qQXB7MIJrCoqS',           // Older Boston man, 70s, gravelly but warm
  brendan: 'QPnMNBEEOmsb7ezbv7f1',         // Young man, early 20s, energetic
  maeve: 'vmaJr0jlXauKX3wB1cyW',           // Woman, late 20s, professional

  // Player characters
  danny: 'QjqXzCkVChvjEoE397Wj',           // Earnest underdog, nervous
  colleen: '5h7yamR53TAavMtELWLe',         // Sharp, no-nonsense
  fitz: 'pooz8IrjkxHDBt14Xi8v',            // Conspiracy enthusiast, energetic
  meg: 'wjvNNgKVI6WF55OixcD7',             // Burnt-out, deadpan

  // NPCs - can use same voice with different settings, or unique voices
  rita: 'qEogh1Px8Nyc7ADbqU4P',            // Woman, 60s, Southie
  enzo: 'gPPSy02AZNNwzjeTEfx4',            // Man, 70s, Italian-American
  tommy: 'MK8VT39pGxFCrNQTuylS',           // Man, 50s, sports fanatic
  trish: 'iQwW0Wk6Yn8dGykrQVXU',           // Woman, 50s, refined
  eddie: '0STyFUxfI6C3cJtqD8bn',           // Man, 60s, gruff, few words
  miles: 'rLOxQ3Ng9cSsUw5PcOHf',           // Man, 40s, fake refined accent
  simon: 'W31Vf96FFmtR0O1RDPKp',           // Man, 50s, academic
  mary_catherine: 'TgKgL4AAQZFIC8wypQ2l',  // Woman, 60s, family matriarch
  jerome: 'mXCULW79xNk7bZvGBPnL',          // Man, 40s, street performer
  elena: 'eWtfC1JrnYxr8lIrjQt4',           // Woman, 40s, mysterious

  // Shared NPC lines - pick a neutral voice
  shared_npc: 'DlFTuhKbwQqMQaj4fYv2',
};

// Voice settings per character (stability, similarity_boost, style, speed)
const VOICE_SETTINGS = {
  sully: { stability: 0.5, similarity_boost: 0.75, style: 0.4, speed: 0.9 },
  brendan: { stability: 0.4, similarity_boost: 0.8, style: 0.6, speed: 1.1 },
  maeve: { stability: 0.6, similarity_boost: 0.8, style: 0.3, speed: 0.95 },
  // Add more as needed - defaults will be used otherwise
};

const DEFAULT_SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0.0, speed: 1.0 };

// Rate limiting - ElevenLabs allows ~100 requests/minute on Creator plan
const DELAY_BETWEEN_REQUESTS_MS = 700; // ~85 requests/minute to be safe

// ============================================
// SCRIPT LOGIC - NO CHANGES NEEDED BELOW
// ============================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(PROJECT_ROOT, 'docs', 'voice-lines-export.csv');
const OUTPUT_BASE = path.join(PROJECT_ROOT, 'public', 'assets', 'audio', 'voice');
const PROGRESS_FILE = path.join(__dirname, '.voice-generation-progress.json');

async function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.log('No progress file found, starting fresh');
  }
  return { completed: [], failed: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    // Handle quoted fields (text may contain commas)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i] || '';
    });
    return obj;
  });
}

async function generateVoice(text, voiceId, settings) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function getOutputPath(character, filename) {
  // Organize by character
  const charFolder = character.replace('shared_', '');
  const outputDir = path.join(OUTPUT_BASE, charFolder);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return path.join(outputDir, filename);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log('ElevenLabs Voice Generation Script');
  console.log('='.repeat(60));

  // Validate API key
  if (API_KEY === 'YOUR_API_KEY_HERE' || !API_KEY) {
    console.error('\n❌ ERROR: Please set your ElevenLabs API key!');
    console.error('   Edit this file and replace YOUR_API_KEY_HERE with your key');
    console.error('   Or set the ELEVENLABS_API_KEY environment variable\n');
    process.exit(1);
  }

  // Check for unconfigured voices
  const unconfiguredVoices = Object.entries(VOICE_MAP)
    .filter(([_, id]) => id === 'VOICE_ID_HERE')
    .map(([name]) => name);

  if (unconfiguredVoices.length > 0) {
    console.warn('\n⚠️  WARNING: Some voices are not configured:');
    unconfiguredVoices.forEach(v => console.warn(`   - ${v}`));
    console.warn('   Lines for these characters will be skipped.\n');
  }

  // Load CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = parseCSV(csvContent);
  console.log(`\n📄 Loaded ${lines.length} voice lines from CSV`);

  // Load progress
  const progress = await loadProgress();
  console.log(`✅ Already completed: ${progress.completed.length} lines`);
  console.log(`❌ Previously failed: ${progress.failed.length} lines\n`);

  // Filter lines that need processing
  const toProcess = lines.filter(line => {
    const voiceId = VOICE_MAP[line.character];
    if (!voiceId || voiceId === 'VOICE_ID_HERE') return false;
    if (progress.completed.includes(line.filename)) return false;
    return true;
  });

  console.log(`🎙️  Lines to generate: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log('Nothing to process! All lines either completed or have unconfigured voices.');
    return;
  }

  // Estimate time
  const estimatedMinutes = Math.ceil((toProcess.length * DELAY_BETWEEN_REQUESTS_MS) / 60000);
  console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes\n`);
  console.log('Starting generation...\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const line = toProcess[i];
    const voiceId = VOICE_MAP[line.character];
    const settings = VOICE_SETTINGS[line.character] || DEFAULT_SETTINGS;
    const outputPath = getOutputPath(line.character, line.filename);

    const progressStr = `[${i + 1}/${toProcess.length}]`;

    try {
      process.stdout.write(`${progressStr} Generating ${line.filename}...`);

      const audioBuffer = await generateVoice(line.text, voiceId, settings);
      fs.writeFileSync(outputPath, audioBuffer);

      progress.completed.push(line.filename);
      saveProgress(progress);

      console.log(' ✅');
      successCount++;

    } catch (error) {
      console.log(` ❌ ${error.message}`);
      progress.failed.push({ filename: line.filename, error: error.message });
      saveProgress(progress);
      failCount++;

      // If rate limited, wait longer
      if (error.message.includes('429')) {
        console.log('   Rate limited, waiting 60 seconds...');
        await sleep(60000);
      }
    }

    // Delay between requests
    if (i < toProcess.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Generation Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Output directory: ${OUTPUT_BASE}`);

  if (failCount > 0) {
    console.log('\nTo retry failed lines, run the script again.');
    console.log('To start completely fresh, delete: ' + PROGRESS_FILE);
  }
}

main().catch(console.error);
