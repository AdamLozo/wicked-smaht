/**
 * Generate CSV entries for NPC intro/success/failure dialogue
 *
 * Run: node scripts/generate-dialogue-csv.js
 *
 * This will output CSV lines that can be appended to voice-lines-export.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the NPC dialogue JSON
const dialoguePath = path.join(__dirname, '..', 'src', 'data', 'npc-dialogue.json');
const dialogueData = JSON.parse(fs.readFileSync(dialoguePath, 'utf-8'));

// Player character IDs
const playerIds = ['danny', 'colleen', 'fitz', 'meg'];

// CSV output
const csvLines = [];

// Helper to escape CSV values
function csvEscape(text) {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

// Process each NPC
for (const [npcId, npcData] of Object.entries(dialogueData)) {

  // INTRO DIALOGUE
  if (npcData.intro) {
    npcData.intro.forEach((introSet, setIndex) => {
      const setNum = setIndex + 1;

      // NPC opener (line 1)
      csvLines.push({
        character: npcId,
        category: 'intro',
        line_id: `intro_${setNum}_1`,
        text: introSet.npcOpener,
        filename: `${npcId}_intro_${setNum}_1.mp3`
      });

      // NPC followup (line 2)
      csvLines.push({
        character: npcId,
        category: 'intro',
        line_id: `intro_${setNum}_2`,
        text: introSet.npcFollowup,
        filename: `${npcId}_intro_${setNum}_2.mp3`
      });

      // Player greetings for each character
      for (const playerId of playerIds) {
        const greeting = introSet.playerGreetings[playerId];
        if (greeting) {
          csvLines.push({
            character: playerId,
            category: 'intro_response',
            line_id: `intro_${npcId}_${setNum}`,
            text: greeting,
            filename: `${playerId}_intro_${npcId}_${setNum}.mp3`
          });
        }
      }

      // NPC challenge (line 3)
      csvLines.push({
        character: npcId,
        category: 'intro',
        line_id: `intro_${setNum}_3`,
        text: introSet.npcChallenge,
        filename: `${npcId}_intro_${setNum}_3.mp3`
      });
    });
  }

  // SUCCESS DIALOGUE
  if (npcData.success) {
    npcData.success.forEach((successSet, setIndex) => {
      const setNum = setIndex + 1;

      // Line 1
      csvLines.push({
        character: npcId,
        category: 'success',
        line_id: `success_${setNum}_1`,
        text: successSet.line1,
        filename: `${npcId}_success_${setNum}_1.mp3`
      });

      // Line 2
      csvLines.push({
        character: npcId,
        category: 'success',
        line_id: `success_${setNum}_2`,
        text: successSet.line2,
        filename: `${npcId}_success_${setNum}_2.mp3`
      });
    });
  }

  // FAILURE DIALOGUE
  if (npcData.failure) {
    npcData.failure.forEach((failureSet, setIndex) => {
      const setNum = setIndex + 1;

      // Line 1
      csvLines.push({
        character: npcId,
        category: 'failure',
        line_id: `failure_${setNum}_1`,
        text: failureSet.line1,
        filename: `${npcId}_failure_${setNum}_1.mp3`
      });

      // Line 2
      csvLines.push({
        character: npcId,
        category: 'failure',
        line_id: `failure_${setNum}_2`,
        text: failureSet.line2,
        filename: `${npcId}_failure_${setNum}_2.mp3`
      });
    });
  }
}

// Generate CSV output
console.log('character,category,line_id,text,filename,characters');
for (const line of csvLines) {
  const chars = line.text.length;
  console.log(`${line.character},${line.category},${line.line_id},${csvEscape(line.text)},${line.filename},${chars}`);
}

// Also write to a file for easy appending
const outputPath = path.join(__dirname, 'dialogue-lines.csv');
const csvHeader = 'character,category,line_id,text,filename,characters\n';
const csvContent = csvLines.map(line => {
  const chars = line.text.length;
  return `${line.character},${line.category},${line.line_id},${csvEscape(line.text)},${line.filename},${chars}`;
}).join('\n');

fs.writeFileSync(outputPath, csvHeader + csvContent);
console.log(`\n\nWritten ${csvLines.length} lines to ${outputPath}`);
console.log('Append these to docs/voice-lines-export.csv (skip the header line)');
