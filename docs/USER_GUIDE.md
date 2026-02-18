# User Guide

Welcome to the **Midi Studio** User Guide! This manual will help you navigate the 3D interface, sequence generative music, and create stunning visualizations.

## 🚀 Getting Started

1.  **Open the App**: Simply load the URL (e.g., `http://localhost:3000`).
2.  **Unlock Audio**: Tap anywhere on the screen or click "Start Audio" to initialize the audio engine. Browsers require user interaction to play sound.
3.  **Explore**: Use touch gestures or mouse drag to rotate the camera around the 3D scene.

## 🎛️ Interface Overview

The application is divided into several **Views**:

### 1. 3D View (Default)
Interact with instruments directly in the 3D space.
*   **Gestures**:
    *   **Drag (1 finger/mouse)**: Rotate camera.
    *   **Pinch/Spread**: Zoom in/out.
    *   **Two-Finger Swipe**: Change parameters (depends on context).
*   **Selection**: Tap on floating 3D objects (cubes, spheres) to focus on that instrument.

### 2. Node Graph Editor
Visual programming interface for advanced routing.
*   **Connect**: Drag from an output port (right side of node) to an input port (left side).
*   **Create**: Right-click to add new nodes (Oscillators, Effects, Logic).
*   **Delete**: Select a node and press Backspace/Delete.

### 3. Live Performance View
Simplified interface for real-time control.
*   **XY Pads**: Control multiple parameters at once.
*   **Mute/Solo**: Quickly toggle tracks.
*   **FX Sends**: Adjust Reverb and Delay levels.

## 🎹 Instruments

The studio features several synthesized instruments:

| Instrument | Description | Key Parameters |
|------------|-------------|----------------|
| **Acid Bass** | TB-303 style monosynth | Cutoff, Resonance, Envelope Mod |
| **FM Bass** | Frequency Modulation bass | Operator Ratio, Feedback |
| **Drums** | 808-style drum machine | Kick, Snare, HiHat (Tuning, Decay) |
| **Pads** | Atmospheric poly-synth | Attack, Release, Timbre |
| **Harmony** | Chord generator | Chord Type, Inversion |
| **Sampler** | Granular sample playback | Grain Size, Position, Speed |

## 🎼 Sequencer

The sequencer drives the music automatically.
*   **Steps**: 16-step grid for rhythm.
*   **Probability**: Adjust the chance of a note triggering (humanization).
*   **Euclidean Rhythms**: Generate complex polyrhythms mathematically.
*   **Turing Machine**: Random melody generator that can lock into repeating loops.

## 🎨 Visuals & Themes

Switch between visual styles to match the mood:
*   **Themes**: "Cosmic" (Stars), "Cyber" (Neon Grid), "Pixel" (Retro), "South Park" (Cartoon).
*   **Hand Tracking**: Enable webcam access to control parameters with hand gestures (requires camera permission).
    *   **Index Finger**: Controls Filter Cutoff.
    *   **Open Palm**: Controls Reverb Size.

## 💾 Exporting

You can save your creation as a MIDI file to use in other DAWs (Ableton, Logic, FL Studio).
1.  Open the **Menu**.
2.  Click **Export MIDI**.
3.  The file will be sent to you via the Telegram Bot (if configured) or downloaded directly.
