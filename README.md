# Telegram MIDI Studio Pro — Autonomous 3D Audio Workstation

**Telegram MIDI Studio Pro** is a next-generation generative audio workstation built for Telegram Mini Apps. It abandons traditional 2D interfaces in favor of a fully immersive, autonomous 3D environment where every visual element reacts to sound.

![Studio Preview](public/assets/preview.png)

## 🌌 Core Philosophy: "The Studio is the Instrument"
Unlike DAWs that mimic hardware panels, this project turns the entire 3D space into a reactive instrument. The environment itself breathes, pulsates, and transforms based on the music being generated.

## 🎹 Generative Engines (The "Brain")

The studio is powered by several autonomous music engines running in parallel:

### 1. **Drum Machine (Euclidean Core)**
- **Visual**: `DrumMachine3D` - Floating holographic rings representing rhythm cycles.
- **Logic**: Euclidean algorithms (Bjorklund) generate evolving polyrhythms.
- **Sound**: Samples (808/909 kits) with physics-based velocity.

### 2. **Acid Bass (TB-303 Clone)**
- **Visual**: `AcidSynth3D` - A liquid, deforming mercury pool that reacts to filter cutoff.
- **Logic**: Generative step sequencer with accent/slide probability.
- **Sound**: Virtual analog subtraction (Saw/Square) with resonant filter.

### 3. **Buchla Complex Generator (Model 259)**
- **Visual**: `Buchla3D` - Abstract geometric forms visualizing wavefolding and modulation.
- **Logic**: West Coast synthesis architecture (AM/FM/Wavefolding).
- **Control**: Complex routing and modulation matrices.

### 4. **Drone Engine (Atmosphere)**
- **Visual**: `DroneEngine3D` - procedural nebula clouds.
- **Logic**: Slow-evolving textures and soundscapes independent of BPM.

### 5. **Sequencers**
- **ML-185**: 8-stage stochastic sequencer.
- **Snake Grid**: Cartesian 4x4 coordinate sequencer.
- **Turing Machine**: Probabilistic shift-register for infinite melody generation.

### 6. **Arrangement Mode (Elite 4.0)**
- **Timeline**: Linear DAW-style arrangement with sample-accurate clip placement.
- **Tools**: Scissors (`S`) for splitting, cross-track dragging, and automation lanes.
- **Markers**: Logical song structure (Intro, Drop, Outro) on the timeline.

## 🎨 Visual Themes System

The studio features a dynamic "Aesthetic Engine" that completely transforms the rendering pipeline:

| Theme | Description | Visual Style |
|-------|-------------|--------------|
| **DEFAULT** | Clean Lab | Minimalist white/grey, soft AO, studio lighting. |
| **COSMIC** | Deep Space | Neon visuals, starfields, bloom effects. |
| **CYBER** | Matrix/Tron | Wireframe geometry, digital rain, green/black palette. |
| **PIXEL** | Retro Game | CRT shader effects, scanlines, quantization. |
| **SOUTH PARK** | Paper Cutout | 2.5D billboard sprites, flat shading, parallax environment. |

*Theme switching changes shaders, geometry, and UI overlays instantly.*

## 🕹️ Controls & Navigation

### 3D Interaction
- **Navigation**: `WASD` or Arrow Keys to fly through the studio.
- **Focus**: Click any instrument to zoom in (`Double Click` for instant jump).
- **Manipulation**: Click & Drag knobs vertically to adjust parameters.
- **HUD**: Press `H` to toggle the Head-Up Display (Transport/BPM).
- **HELP**: Press `?` anywhere for the **Global Reference HUD**.

### Shortcuts
- `1` - Drums
- `2` - Bass
- `3` - Synth (Harmony)
- `4` - Pads
- `5` - Sequencer Cluster
- `6` - Drone Station
- `0` - Overview (Command Center)

## 🛠 Technical Architecture

### Stack
- **Frontend**: React 18, TypeScript, Vite
- **3D Engine**: Three.js, React Three Fiber (R3F), Drei
- **Audio Engine**: Tone.js (Web Audio API wrapper)
- **State**: Zustand (Store architecture)

### The "AudioVisualBridge"
A custom high-performance bridge (`AudioVisualBridge.ts`) connects the Audio thread (Tone.js) to the Visual thread (R3F).
- **Analysis**: Real-time FFT and Waveform analysis.
- **Reactivity**: Extracts "Pulse", "Energy", and "Spectral" data.
- **Optimization**: Uses direct refs and uniforms to bypass React renders for 60fps performance.

## 🤖 Agentic Integrations
This project is optimized for AI-assisted development.
- **Skills**: Located in `.agent/skills` (e.g., `AntigravityThinking`).
- **Context**: Architecture documentation for autonomous agents.

---
*Built for the Telegram App Platform | 2026*
