# Instrument Deep-Dive: Technical Reference

This document provides a low-level technical breakdown of every instrument and sequencer engine within the Telegram MIDI Studio Pro.

---

## 🛠 1. Drum Machine (Percussion Engine)
**Core Engine**: `Tone.MembraneSynth` (Kick), `Tone.NoiseSynth` (Snare, Hats, Clap), `Tone.MetalSynth` (Ride).

### Synthesis Modes:
- **808 Mode**: White noise for snare/hats, long decay sine-based kick.
- **909 Mode**: Pink noise for snare body, shorter/punchier pitch-decay kick, darker metallic hats.

### Parameters:
- **Kick Pitch/Decay**: Maps to ` MembraneSynth.pitchDecay` and `envelope.decay`.
- **Euclidean Logic**: Uses the Bjorklund algorithm to distribute `pulses` across a 32-step sub-grid (normalized to 16 steps in the 3D visual view).

---

## 🏎 2. Acid Synth (303-Clone)
**Core Engine**: `Tone.PolySynth<Tone.MonoSynth>` with specialized slide logic.

### Technical Details:
- **Filter**: 24dB/octave Low Pass Filter (`rolloff: -24`).
- **Resonance (Q)**: High values create the characteristic "chirping" sound.
- **Accent Logic**: When a step is marked as "Accent", the filter frequency is exponentially ramped to 3x the base cutoff for 10ms, then back to original.
- **Slide Logic**: Overlaps the `triggerAttack` of the next note before the `release` of the previous note, creating a portamento effect.

---

## 🔮 3. Harm Synth (Buchla 259 Inspired)
**Core Engine**: Complex multi-oscillator voice pool with dynamic routing.

### Synthesis Architecture:
- **Principal Oscillator (OSC1)**: The main carrier.
- **Modulation Oscillator (OSC2)**: Used for FM, AM, or Timbre modulation.
- **Wavefolder**: A 4-stage recursive folding function:
  ```typescript
  let folded = x;
  if (folded > 1) folded = 2 - folded;
  if (folded < -1) folded = -2 - folded;
  ```
- **Complex Mode**: Enables dynamic patching where OSC2 frequency modulates OSC1's frequency bank.

### Visual Mapping:
- **Glow Intensity**: Tied to `timbre` and `fmIndex`.
- **Mesh Distortion**: Reacts to the spectral centroid of the voice (via `AudioVisualBridge`).

---

## ☄️ 4. Drone Engine (Cosmic Nebula)
**Core Engine**: Constant-running irrational frequency oscillators.

### Synthesis Components:
- **Carrier Oscillators**: 3 units tuned to a root, a tritone (1.414 ratio), and a sub-octave.
- **FM Layer**: An "irrational" modulator (e ratio ≈ 2.718) for creating metallic "grit".
- **Chaotic Modulation**:
  - **Sample & Hold**: Randomized cutoff offsets at intervals determined by the `Chaos` parameter.
  - **Bernoulli Gates**: 10% probability glitches that momentarily max out distortion.
  - **LFO Panner**: Slow spatial movement for atmospheric depth.

---

## 🎛 5. Sequencer Hub (Logic & Patterns)

### ML-185 (Holographic Stages):
- **Structure**: 8 stages.
- **Step Modes**:
  - `Play`: Triggers the note once.
  - `Repeat`: Triggers the note multiple times based on `pulseCount`.
  - `Mute`: Does not trigger but advances the clock.

### MDD Snake (Coordinate Walker):
- **Logic**: Moves a "head" across a 4x4 grid.
- **Directions**: Normal, Reverse, Wrap-around Cartesian, or Spiral.
- **State**: The "trail" is calculated by buffering the last 4 positions of the walker.

### Turing Machine (Shift Register):
- **Engine**: 16-bit binary register.
- **Entropy**: Percentage chance (0-100%) that a bit will flip when shifted.
- **Scale Mapping**: Binary values are converted to integers (0-255) and then mapped to a selected musical scale via `Scaler.ts`.

---

## ⚡️ 6. AudioVisual Bridge (The Sync Engine)
- **Singleton Pattern**: Ensures only one analyzer exists.
- **FFT Size**: 2048 samples for high-resolution frequency analysis.
- **Scheduling**: Uses `Tone.Draw` to execute 3D mesh updates exactly at the `AudioContext` time, compensating for any JS main-thread jitter.

---
*Document produced for development and deep-system auditing purposes.*
