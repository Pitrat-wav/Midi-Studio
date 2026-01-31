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

---

## Interactive Info System (?)
Pressing the `?` key while focused on these instruments triggers a 2D overlay containing:
1.  **Historical Context**: Release dates and cultural impact.
2.  **Control Map**: Precise mapping of mouse/keyboard actions to hardware knobs.
3.  **Quick Tips**: Best practices for sequencing.
