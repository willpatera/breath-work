# Breath Work

Simple breathing PWA with audio cues. Built with React, TypeScript, and Vite. No accounts, no tracking, no installs — just open and breathe.

**Live app →** [willpatera.github.io/breath-work](https://willpatera.github.io/breath-work/)

## Why?

There are already tons of breathing and meditation apps out there. We wanted something super simple and open source that works on desktop and phone with no installs and minimal dependencies. Breath orb, simple audio cues, and a timer.

## Add your practice

Create a folder under `data/practices/` with a `practice.json` file and open a PR.

```
data/practices/
  box-breathing/
    practice.json
  your-practice/
    practice.json
```

## Data format

Each practice is a single JSON file with this structure:

```json
{
  "id": "my-practice",
  "title": "My Practice",
  "author": "Your Name",
  "description": "A short description shown in the library.",
  "steps": []
}
```

### Step types

**`instruction`** — Text shown to the user (no breath animation).

```json
{ "type": "instruction", "label": "Settle in", "text": "Breathe normally", "duration": 10.0 }
```

**`inhale`** — Breathe in. The orb expands.

```json
{ "type": "inhale", "duration": 4.0 }
```

**`exhale`** — Breathe out. The orb contracts.

```json
{ "type": "exhale", "duration": 4.0 }
```

**`hold_in`** — Hold at the top of the inhale.

```json
{ "type": "hold_in", "duration": 4.0 }
```

**`hold_out`** — Hold at the bottom of the exhale.

```json
{ "type": "hold_out", "duration": 4.0 }
```

### Cues

Any breath step (`inhale`, `exhale`, `hold_in`, `hold_out`) can have countdown cues — short audio pips that fire at the specified seconds-before-end:

```json
{ "type": "hold_out", "duration": 20.0, "cues": { "countdown": [10, 3, 2, 1] } }
```

This plays a pip when there are 10s, 3s, 2s, and 1s remaining.

### Repeat blocks

Wrap steps in a `repeat` block to loop them:

```json
{
  "type": "repeat",
  "label": "Main cycle",
  "rounds": 8,
  "sequence": [
    { "type": "inhale", "duration": 4.0 },
    { "type": "hold_in", "duration": 4.0 },
    { "type": "exhale", "duration": 4.0 },
    { "type": "hold_out", "duration": 4.0, "cues": { "countdown": [3, 2, 1] } }
  ]
}
```

### Full example

```json
{
  "id": "box-breathing",
  "title": "Box Breathing",
  "author": "Open",
  "description": "Classic 4-4-4-4 box breathing.",
  "steps": [
    {
      "type": "instruction",
      "label": "Settle in",
      "text": "Breathe normally",
      "duration": 10.0
    },
    {
      "type": "repeat",
      "label": "Main cycle",
      "rounds": 8,
      "sequence": [
        { "type": "inhale", "duration": 4.0 },
        { "type": "hold_in", "duration": 4.0 },
        { "type": "exhale", "duration": 4.0 },
        { "type": "hold_out", "duration": 4.0, "cues": { "countdown": [3, 2, 1] } }
      ]
    }
  ]
}
```

## Dev

```bash
nvm use 22
npm install
npm run dev
```

Tests: `npm test` · Build: `npm run build`
