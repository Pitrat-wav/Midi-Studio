# Project Context & Architecture

## Overview
**Telegram MIDI Studio Pro** is a React + Three.js + Tone.js application. It runs as a Telegram Mini App but can be developed in a standard browser environment.

## Key Directories
- `src/components/WebGL`: All 3D rendering logic (R3F).
- `src/components/WebGL/instruments`: Specific visualization components (DrumMachine, AcidSynth, etc.).
- `src/audio`: Tone.js audio graph setup.
- `src/store`: Zustand stores processing application logic. `audioStore.ts` is the central brain.
- `src/lib`: Utilities, including `AudioVisualBridge.ts` (crucial).

## The Audio-Visual Loop
1.  **User/Sequencer** triggers an action in a **Zustand Store**.
2.  **Store** calls **Tone.js** to produce sound.
3.  **Tone.js** emits audio, which passes through **AnalyserNodes**.
4.  **AudioVisualBridge** reads these AnalyserNodes every frame (60fps).
5.  **React Three Fiber** components read from `AudioVisualBridge` inside `useFrame` to update Scale, Color, or Shader Uniforms.

## Theme System
The app supports "Themes" (South Park, Cosmic, Pixel).
- **Themes** are managed in `visualStore.ts`.
- **Implementation**:
  - **CSS**: `index.css` classes (`.southpark-theme`) change UI.
  - **WebGL**: `GenerativeBackground.tsx` conditionally renders different worlds.
  - **Instruments**: `AllInstruments3D.tsx` conditionally swaps meshes (e.g., swapping 3D drums for Cartman sprite).

## Recent Changes (South Park Integration)
- Replaced 3D abstract instruments with 2.5D Billboard Sprites when `aestheticTheme === 'southpark'`.
- Look at `src/components/WebGL/instruments/AllInstruments3D.tsx` for the switching logic.
- Look at `src/components/WebGL/CharacterSprite.tsx` for the billboard implementation.
