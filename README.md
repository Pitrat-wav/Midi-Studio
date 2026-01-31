# Telegram MIDI Studio Pro — WebGL Immersive 3D UX

This is a complete redesign of the Telegram MIDI Studio, transforming it from a 2D interface into a fully immersive, generative 3D environment.

## 🚀 Key Features (WebGL UX Fork)

### 1. Immersive 3D Navigation
- **Radial Selector**: Control instruments through a spatial radial menu.
- **Camera Transitions**: Smooth transitions between instruments using camera focus.
- **Quick Switch**: Instant access to any instrument via the bottom HUD or keyboard shortcuts (0-5).

### 2. Generative 3D Instruments
- **DrumMachine3D**: Interactive 3D shapes representing Kick, Snare, and HiHat with Euclidean (Bjorklund) rhythm rings.
- **AcidSynth3D**: A deformable 3D plane that reacts to filter cutoff, resonance, and audio energy.
- **PadsSynth3D**: A floating particle cloud that changes density and color based on ambient parameters.

### 3. Integrated 3D Controls
- **3D Knobs & Sliders**: Grab and rotate controls directly in world space using ray-casting.
- **Haptic Feedback**: Integrated with Telegram WebApp Haptic Feedback API for a tactile feel.
- **Floating HUD**: Parameter values appear above controls during interaction.

## 🎸 How to Use
- **Launch**: Click "Launch Studio" to start the audio engine.
- **Navigate**: Use the bottom menu or keys `1` (Drums), `2` (Bass), `3` (Synth), `4` (Pads), `0` (Overview).
- **Interact**: Click and drag vertically on any knob to change its value. Click buttons to toggle.
- **Controls**: Press `H` to toggle the transport overlay (Play/Stop/BPM).

## 🛠 Tech Stack
- **React + Vite**
- **Three.js + React Three Fiber**
- **Tone.js** (Audio Engine)
- **Zustand** (State Management)
- **GLSL Shaders** (Custom audio-reactive materials)

---
*Created as an experimental 3D UI fork for Telegram Mini Apps.*
