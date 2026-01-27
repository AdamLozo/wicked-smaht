# Wicked Smaht Voice Generation Guide

This document contains all dialogue lines that need voice generation, organized by character with voice direction notes.

## Voice Requirements Overview

| Character | Role | Lines | Est. Characters |
|-----------|------|-------|-----------------|
| Sully | Main narrator, hints | 56 | ~6,000 |
| Rita (Southie) | NPC | 16 | ~1,500 |
| Enzo (North End) | NPC | 16 | ~1,500 |
| Tommy (Fenway) | NPC | 16 | ~1,200 |
| Trish (Beacon Hill) | NPC | 16 | ~1,200 |
| Eddie (Charlestown) | NPC | 16 | ~1,000 |
| Miles (Back Bay) | NPC | 16 | ~1,200 |
| Simon (Cambridge) | NPC | 16 | ~1,200 |
| Mary Catherine (Dorchester) | NPC | 16 | ~1,200 |
| Jerome (Downtown) | NPC | 16 | ~1,200 |
| Elena (Seaport) | NPC | 16 | ~1,200 |
| Brendan | Rival cousin | 55 | ~2,500 |
| Maeve | Rival cousin | 58 | ~2,700 |
| Danny | Player character | 1 | ~120 |
| Colleen | Player character | 1 | ~70 |
| Fitz | Player character | 1 | ~90 |
| Meg | Player character | 1 | ~50 |
| Shared NPC Lines | All NPCs | 6 | ~300 |

**Total: ~500+ lines, ~23,000 characters**

---

## CHARACTER VOICE DIRECTION

### SULLY O'BRIEN (Main Character)
**Voice Type:** Older Boston man, 70s, gravelly but warm
**Accent:** Strong Boston Irish - drops Rs, broad As
**Tone:** Nostalgic, wise, occasionally wistful, dry humor
**Think:** Martin Sheen in "The Departed" meets a wise grandfather
**Sample pronunciation:** "Pahk the cah in Hahvahd Yahd"

**Key traits:**
- Speaks slowly, deliberately
- Long pauses for emphasis
- Personal anecdotes woven into hints
- Never condescending, always teaching

---

### BRENDAN O'BRIEN (Rival)
**Voice Type:** Young man, early 20s, energetic
**Accent:** Modern Boston, less pronounced than Sully
**Tone:** Cocky, enthusiastic, competitive but friendly
**Think:** Mark Wahlberg energy, younger and goofier

**Key traits:**
- Fast talker, lots of slang
- Uses "cuz," "bro," "yo"
- Genuine underneath the bravado
- Gets excited easily

---

### MAEVE O'BRIEN (Rival)
**Voice Type:** Woman, late 20s, professional
**Accent:** Educated Boston - slight, controlled
**Tone:** Analytical, composed, subtly competitive
**Think:** Amy Adams playing a law student from Boston

**Key traits:**
- Measured speech, careful word choice
- Dry observations
- Shows warmth sparingly but genuinely
- Sometimes second-guesses herself

---

### RITA FLANAGAN (Southie NPC)
**Voice Type:** Woman, 60s, longtime local
**Accent:** Strong South Boston Irish
**Tone:** Seen-it-all, no-nonsense, protective
**Think:** Neighborhood matriarch at the corner bar

---

### ENZO MARCELLO (North End NPC)
**Voice Type:** Man, 70s, Italian-American
**Accent:** Boston Italian - deliberate, measured
**Tone:** Old-world wisdom, proud of heritage
**Think:** Retired butcher who knows everyone's secrets

---

### TOMMY BRENNAN (Fenway NPC)
**Voice Type:** Man, 50s, sports fanatic
**Accent:** Working-class Boston
**Tone:** Energetic about baseball, encyclopedic knowledge
**Think:** The guy at the bar who never stops talking about the Sox

---

### TRISH HARRINGTON (Beacon Hill NPC)
**Voice Type:** Woman, 50s, refined
**Accent:** Brahmin Boston - educated, proper
**Tone:** Elegant but with hidden edge (Sully's ex-wife)
**Think:** Politician's aide who's seen behind the curtain

---

### EDDIE WALSH (Charlestown NPC)
**Voice Type:** Man, 60s, man of few words
**Accent:** Townie - heavy Boston working class
**Tone:** Quiet, gruff, says only what's necessary
**Think:** Retired dockworker who keeps his head down

---

### MILES ASHWORTH (Back Bay NPC)
**Voice Type:** Man, 40s, affected refinement
**Accent:** Fake upper-class (secretly "Mickey from Southie")
**Tone:** Trying too hard to sound fancy
**Think:** Antiques dealer hiding his origins

---

### SIMON HARTLEY (Cambridge NPC)
**Voice Type:** Man, 50s, academic
**Accent:** Educated neutral with Boston undertones
**Tone:** Thoughtful, philosophical, slightly detached
**Think:** Harvard philosophy professor

---

### MARY CATHERINE O'BRIEN (Dorchester NPC)
**Voice Type:** Woman, 60s, family matriarch
**Accent:** Working-class Boston Irish
**Tone:** Warm but guarded (Sully's estranged sister)
**Think:** Family member with unresolved history

---

### JEROME WASHINGTON (Downtown NPC)
**Voice Type:** Man, 40s, street performer
**Accent:** Urban Boston, poetic cadence
**Tone:** Spoken word artist, rhythmic speech
**Think:** Performer who sees the city's soul

---

### ELENA SANTOS (Seaport NPC)
**Voice Type:** Woman, 40s, mysterious
**Accent:** Slight, unplaceable
**Tone:** Knowing, confident, Sully's confidante
**Think:** Woman with secrets, calm under pressure

---

### PLAYER CHARACTERS (4 total)

**Danny O'Brien** - Earnest underdog, nervous, self-deprecating
**Colleen O'Brien** - Sharp, no-nonsense, efficient
**Fitz O'Brien** - Conspiracy enthusiast, energetic oddball
**Meg O'Brien** - Burnt-out overachiever, deadpan

---

## FILE NAMING CONVENTION

All audio files should be named following this pattern:

```
{character}_{context}_{id}.mp3
```

**Examples:**
- `sully_hint_southie_q1.mp3`
- `rita_reaction_southie_q1_correct.mp3`
- `brendan_race_start_1.mp3`
- `npc_shared_intro_1.mp3`

**Directory structure:**
```
public/assets/audio/voice/
├── sully/
│   ├── hints/
│   │   ├── sully_hint_southie_q1.mp3
│   │   └── ...
│   └── gauntlet/
│       ├── sully_gauntlet_lifeline.mp3
│       └── ...
├── npcs/
│   ├── rita/
│   ├── enzo/
│   └── ...
├── rivals/
│   ├── brendan/
│   └── maeve/
├── players/
│   ├── danny_intro.mp3
│   └── ...
└── shared/
    ├── npc_shared_intro_1.mp3
    └── ...
```

---

## DIALOGUE EXPORT

See the companion file `voice-lines-export.csv` for the complete line-by-line export.

