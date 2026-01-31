# 2.1 Hardware Replicas (3D)

This document details the implementation of the legendary drum machine replicas within the 3D MIDI Studio.

## TR-808 Rhythm Composer
The 808 implementation focuses on warm, analog aesthetics and the iconic 16-step sequencer.

### Components
- **Step Buttons**: 1-16 multi-colored LED buttons. Trigger individual voices when selected.
- **Instrument Selector**: Rotary switch simulation to choose which voice (BD, SD, CH, etc.) is being programmed.
- **Knobs**: Realistic 3D knobs for Level, Tone, Decay, and Snappy controls.

### Implementation Logic
- **Store Sync**: `instrumentStore.ts` manages the sequence arrays for all 11 voices.
- **Visuals**: Textures use custom displacement maps to simulate the metallic chassis.

## TR-909 Rhythm Composer
The 909 implementation features the industrial grey/orange color palette and digital/analog hybrid signal path.

### Components
- **Shift + Step**: Emulated for secondary functions like flam and accent.
- **Display**: 3-digit LED display (simulated) showing BPM and current pattern.
- **Faders/Knobs**: High-fidelity 3D assets mapped to `bass_drum`, `snare`, `toms`, etc.

## Sampler Instrument (Granular Engine)
The Sampler (Instrument #9) was upgraded to a full Granular Synthesis engine on **2026-01-31**.

### Components
- **Granular Controls**: Grain Size (10ms-500ms), Overlap (Density), and Detune (Pitch Spray).
- **CRT HUD**: Integrated into the "Chrono Splitter" interface for real-time manipulation.
- **Engine**: Powered by `Tone.GrainPlayer` for advanced time-stretching and textural synthesis.

### Implementation Logic
- **Store Sync**: `useSamplerStore` manages the grain parameters.
- **Engine**: The `SamplerInstrument` class handles the conversion of audio buffers into grain clouds.

---
*Last modified: 2026-01-31*
