# Algorithmic Reference — Generative Logic

This document details the mathematical models used for rhythm and melody generation within the Telegram MIDI Studio Pro.

## 1. Rhythm: Bjorklund Algorithm (`bjorklund.ts`)
Used for generating **Euclidean Rhythms**. 
- **Core Concept**: Distributes $k$ pulses as evenly as possible over $n$ steps.
- **Implementation**: Uses a recursive grouping method where "remainders" are moved to the end of the pulse groups until no more grouping is possible.
- **Rhythmic Result**: $E(k, n)$ generates the most musically "natural" rhythms found in traditional music across the globe.

## 2. Melody: Scale Snapping and Chord Generation (`Scaler.ts`)
The `Scaler` class uses the `@tonaljs/tonal` library to map raw numbers to musical structures.

### Scale Degree Finding
- **Function**: `getScaleDegree(midi, root, scaleType)`
- **Logic**: Extracts the pitch class from the MIDI number and matches it against the generated scale notes to return a 1-indexed degree.

### Chromatic Snapping
- **Function**: `snapToScale(midi, root, scaleType)`
- **Logic**: If a note is outside the scale, it calculates the distance to every note in the scale and returns the MIDI value of the absolute closest scale note.

### Diatonic Chords
- **Logic**: Built by picking indices from the scale array. 
  - **Triad**: Indices [0, 2, 4]
  - **7th**: Indices [0, 2, 4, 6]
  - **Power**: Indices [0, 4, 7] (includes octave)

## 3. Basslines: Sting Generator (`StingGenerator.ts`)
A pseudo-random generative model for 303-style patterns.

### Weight-Based Generation
- Uses a deterministic sine-wave based pseudo-random generator:
  `Math.sin(seed + i * 13.37) * 10000`
- This ensures that a specific **Seed + Morph** combination always produces the same sequence.

### Pattern Mutation
- **Morphing**: Linearly interpolates between two sets of random weights (Seed A and Seed B).
- **Density**: A global threshold. If the weight is below the density, the step becomes active.
- **Accent/Slide Bias**: Accents are biased towards off-beats (8th notes) to create "syncopated" energy.

## 4. MDD Snake (Coordinate Walking)
The walker simulates motion in a 2D space (4x4) mapped to a 1D sequence (16 steps).
- **Cartesian**: X then Y movement.
- **Spiral**: Inward or outward circular movement.
- **Random**: Brownian motion constrained to the grid.

---
*Technical reference for algorithmic auditing.*
