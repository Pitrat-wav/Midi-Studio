# MIDI Export & Data Format Specification

This document describes how MIDI data is captured, serialized, and exported from the application.

## 1. Export Architecture (`MidiExporter.ts`)
The application uses the `midi-writer-js` library to construct Standard MIDI Files (SMF) in memory.

### Per-Instrument Logic:
- **Drums**: Maps internal trigger indices to standard MIDI Percussion (Channel 10 convention, though often exported as single-note events):
  - Kick -> C1
  - Snare -> D1
  - HiHat -> F#1
  - Open Hat -> A#1
  - Clap -> D#1
- **Bass**: Captures `BassStep` objects.
  - **Slides**: Exported as overlapping 8th notes (instead of 16th).
  - **Accents**: Mapped to Max Velocity (127).
- **Turing Machine**: Since the Turing Machine is a living register, the exporter **simulates** 64 steps of its current state mutation to produce a coherent loop.

## 2. Capture Mechanism
Midi data is not recorded "live" but is instead **re-generated** on export based on the current store state (active patterns or register values). This ensures the export is always clean and Quantized to the grid.

## 3. Smart Chord Integration
When Smart Chord is enabled, the `MidiExporter` passes raw pitches through the `Scaler.generateChord` function before adding them to the track, converting monophonic sequences into polyphonic MIDI tracks.

## 4. Technical Constants
- **PPQ (Pulses Per Quarter Note)**: Default is 128.
- **Output Format**: Base64 encoded byte array converted to `Uint8Array` for Telegram File Sharing.

---
*Technical reference for MIDI I/O.*
