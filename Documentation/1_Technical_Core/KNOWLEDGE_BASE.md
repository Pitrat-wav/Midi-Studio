# Comprehensive Knowledge Base — Telegram MIDI Studio Pro

## 1. Core Philosophy
Telegram MIDI Studio Pro is designed as a **high-performance generative workstation** that lives inside a Telegram Mini App. It prioritizes "Playability", "Generative Intelligence", and "Visual Immersion".

## 2. Audio Engine (Logic Architecture)
The audio engine is built on **Tone.js**, wrapping raw oscillators and effects into specialized classes.

### 2.1 Bass Engines
- **AcidSynth.ts**: A 303-style monophonic synth. Uses a gated envelope and a resonant low-pass filter with high emphasis on the `slide` parameter.
- **FMBass.ts**: A 2-operator frequency modulation synth. Carrier is modulated by a modulator with variable harmonicity and modulation index, providing "metallic" and "growling" textures.

### 2.2 Poly-Synths
- **HarmSynth.ts**: The most complex unit. It's a Buchla 259 inspired complex oscillator.
  - **Waveshaping**: Uses a custom wavefolder algorithm.
  - **Cross-Modulation**: OSC1 can modulate OSC2 and vice versa.
  - **Polyphony**: Managed via a VoicePool to prevent CPU spikes.
- **PadSynth.ts**: A multi-voice ambient generator using long attack/release stages and chorus/reverb chains.

### 2.3 Generative Algorithms
- **Turing Machine**: Based on a 16-bit shift register. Every clock pulse, a bit is flipped based on a probability (Entropy), creating evolving melodic loops.
- **Bjorklund Algorithm**: Used for Euclidean rhythms. It distributes pulses as evenly as possible across a set number of steps.
- **MDD Snake**: A custom coordinate-based walker. It moves through a 4x4 grid (16 steps) based on geometric rules (Cartesian, Spiral, Random).
- **ML-185**: A stage-based sequencer where each step has its own playback mode (Play once, Repeat, Mute).

## 3. WebGL Visual System
The application is a **3D-only environment** using React Three Fiber (Three.js).

### 3.1 Audio-Visual Synchronization
- **AudioVisualBridge.ts**: The brain of the synchronization.
  - Receives `FFT` data from `Tone.Analyser`.
  - Distributes MIDI triggers from the sequencers to the 3D meshes using `Tone.Draw` to ensure the visual "pulse" matches the audio latency.
  - Manages global `uTime` and `uAudioIntensity` uniforms for shaders.

### 3.2 3D Interaction Logic
- **Raycasting**: All interactions (knobs, buttons) use a centralized Raycaster.
- **GestureManager.ts**: Manages complex gestures (drag, edge-swipe, long-press).
- **Spatial Layout**: Coordinates are strictly defined in `SpatialLayout.ts`. Each instrument "station" has a unique XYZ position and a corresponding camera focus preset.

### 3.3 AI Vision & Hand Tracking
- **useHandTracking.ts**: Uses MediaPipe Tasks Vision to detect 21 hand landmarks via webcam.
- **HandVision3D.tsx**: Translates landmarks into 3D space.
- **Gesture Mapping**:
  - **Pinch**: Used for parameter modulation.
  - **Height**: Mapped to Cutoff/Pitch (Theremin-style).

### 3.4 Pulse Engine (High Performance)
- **Non-Reactive Triggers**: Audio events (kick, snare, etc.) bypass the React state and are handled directly in `AudioVisualBridge.ts`.
- **RAF Decay**: Triggers decay smoothly at 60fps within the Bridge's animation loop, providing frame-perfect visual pulses without VDOM overhead.

## 4. State Management (Zustand)
We use a **Multi-Store approach** for performance:
- `useAudioStore`: Global transport, volume, FX chains, and instrument instances.
- `useInstrumentStore`: High-frequency UI state (knobs, steps).
- `useVisualStore`: Transient visual data (FFT, hand data).
- `usePresetStore`: Storage and management of Global Snapshots.

## 5. Global FX & Presets
- **Master Bus**: All instruments sum into a `MasterBus` gain node.
- **FX Rack**: A global chain of `Distortion -> FeedbackDelay -> Reverb` applied to the master output.
- **PresetManager**: Captures and applies "Global Snapshots" across all stores, allowing instant recall of entire studio states.

## 6. Integration with Telegram
- **Haptic Feedback**: Triggered on every knob movement and button press.
- **Theme Integration**: Colors are dynamically pulled from Telegram CSS variables.

## 6. Logic Engine (Python/Pyodide)
- **DeterministicWorker.ts**: Runs a Python environment (Pyodide) in a separate thread.
- **Music Generator**: Uses Python logic for Euclidean and generative pattern generation, ensuring the main UI thread stays at 60fps.

## 7. Performance Guidelines
- **Transient Updates**: Avoid React re-renders in `useFrame`. Use direct mesh/material mutation via `refs`.
- **Atomic Selectors**: Always use selectors like `useStore(s => s.prop)` to minimize component updates.
- **Shared Uniforms**: Use the `uAudioIntensity` uniform for global audio-reactive effects.

---
*End of Knowledge Base*
