# Zustand Store Reference — State Management

The application state is split into four primary stores to optimize React re-rendering and maintain a clean architecture.

## 1. `audioStore.ts` (The Audio Engine Root)
- **Role**: Manages Tone.js instances and global transport.
- **Key State**:
  - `synthInstances`: Map of initialized Tone.Synth classes.
  - `isPlaying`: Global boolean for Tone.Transport.
  - `bpm`: Global beats per minute.
  - `volumes`: Map of instrument gain levels.

## 2. `instrumentStore.ts` (The Parameter Hub)
- **Role**: High-frequency parameter management (Knob values, pattern grids).
- **Key Sub-Stores**:
  - `useDrumStore`: Kick/Snare/HiHat pitch, decay, and patterns.
  - `useBassStore`: Acid/FM parameters and Sting generator seeds.
  - `useHarmStore`: Modular synth ADSR and routing.
  - `useSequencerStore`: ML-185 stages, Snake grid, and Turing Machine register.

## 3. `visualStore.ts` (Transient Frame Data)
- **Role**: Stores data that changes every frame (not persisted/serialized).
- **Key State**:
  - `triggers`: Binary flags (0 or 1) that flash when a MIDI note fires.
  - `energyLevels`: Averaged intensity for ambient background glow.
  - `fftData`: Raw array for shader-based waveform visualization.

## 4. `droneStore.ts` (Complex Generative State)
- **Role**: Isolated state for the Drone Engine's chaotic parameters.
- **Key State**:
  - `intensity`, `chaos`, `grit`, `nervousness`.
  - `enabled`: Local mute/unmute for the drone.

---
*State architecture reference.*
