# Voice Generation Script

This script automates generating voice lines using the ElevenLabs API.

## Setup Steps

### 1. Get Your ElevenLabs API Key

1. Go to [ElevenLabs Settings](https://elevenlabs.io/settings/api-keys)
2. Click "Create API Key"
3. Copy the key

### 2. Choose Your Voices

Go to the [ElevenLabs Voice Library](https://elevenlabs.io/voice-library) and find voices for each character. You need voice IDs for:

**Priority 1 (Most important):**
- **Sully** - Older Boston man, 70s, gravelly but warm
- **Brendan** - Young man, early 20s, energetic and cocky
- **Maeve** - Woman, late 20s, professional and composed

**Priority 2 (Player characters - 1 line each):**
- **Danny** - Earnest, nervous, self-deprecating
- **Colleen** - Sharp, efficient, no-nonsense
- **Fitz** - Energetic oddball, conspiracy enthusiast
- **Meg** - Deadpan, burnt-out overachiever

**Priority 3 (NPCs - can reuse voices with different settings):**
- Rita, Enzo, Tommy, Trish, Eddie, Miles, Simon, Mary Catherine, Jerome, Elena

### 3. Get Voice IDs

For each voice you select:
1. Click on the voice in ElevenLabs
2. Click "Use Voice" or view its details
3. Copy the Voice ID (looks like: `EXAVITQu4vr4xnSDxMaL`)

### 4. Configure the Script

Open `generate-voices.js` and update:

```javascript
const API_KEY = 'your_api_key_here';

const VOICE_MAP = {
  sully: 'paste_sully_voice_id_here',
  brendan: 'paste_brendan_voice_id_here',
  maeve: 'paste_maeve_voice_id_here',
  // ... etc
};
```

### 5. Run the Script

```bash
cd wicked-smart
node scripts/generate-voices.js
```

## Features

- **Progress tracking**: Saves progress to `.voice-generation-progress.json`. If interrupted, just run again to continue where you left off.
- **Rate limit handling**: Automatically waits if you hit ElevenLabs rate limits.
- **Organized output**: Files are saved to `public/assets/audio/voice/{character}/`
- **Skips configured voices**: Only generates lines for characters with valid voice IDs.

## Tips

### Start Small
Test with just Sully first:
1. Only configure `sully` in the VOICE_MAP
2. Run the script
3. Check the output sounds good
4. Then add more voices

### Voice Selection Tips

**For Boston accents**, search the voice library for:
- "Boston" or "Irish"
- Male voices with "gravelly" or "warm" tags for Sully
- Energetic male voices for Brendan
- Professional female voices for Maeve

**Or use voice cloning** (Creator plan feature):
- Find YouTube clips of Boston actors
- Upload samples to create custom voices

### Reusing Voices

You can use the same voice ID for multiple characters and adjust settings:

```javascript
const VOICE_SETTINGS = {
  rita: { stability: 0.5, similarity_boost: 0.75, style: 0.4, speed: 0.9 },
  mary_catherine: { stability: 0.5, similarity_boost: 0.75, style: 0.4, speed: 0.85 },
};
```

## Troubleshooting

**"API error 401"** - Invalid API key. Check you copied it correctly.

**"API error 429"** - Rate limited. Script will wait automatically.

**"Voice not found"** - Voice ID is wrong. Double-check you copied the full ID.

## Cost Estimate

~200 lines × ~80 characters average = ~16,000 characters

Creator plan gives you 100,000 characters/month, so you have plenty of room for testing and regenerating lines you don't like.
