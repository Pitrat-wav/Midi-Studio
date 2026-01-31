# Spatial Index & Camera Layout Map

This document serves as a coordinate reference for the 3D WebGL environment.

## 1. Instrument Station Coordinates
The cosmic studio is arranged in a 3D field. Each station has a `position` (where the meshes live) and a `cameraPreset` (where the camera looks from).

| Station | Position [X, Y, Z] | Ideal View [X, Y, Z] | Purpose |
|---|---|---|---|
| **Drums** | `[0, 0, 0]` | `[0, 5, 8]` | Central rhythmic core |
| **Bass** | `[-15, 0, 0]` | `[-15, 4, 7]` | Acid and FM module |
| **Harmony** | `[15, 0, 0]` | `[15, 6, 10]` | Buchla Complex Synth |
| **Sequencer** | `[0, 0, -15]` | `[0, 8, -5]` | Holographic Hub |
| **Pads** | `[0, 0, 15]` | `[0, 4, 22]` | Ambient Particle Cloud |
| **Drone** | `[0, 12, -8]` | `[0, 15, 2]` | High-altitude Nebula |
| **Master** | `[-10, 0, 12]` | `[-10, 5, 18]` | FX & Global Transport |

## 2. Control Placement Logic
Controls for each instrument are offset from their station's base position. Many follow a **modular grid** system:
- **Knobs**: Typically spaced 1-2 units apart.
- **Buttons**: Often placed below knobs for "trigger" actions.

## 3. Camera Interaction
- **Hyper-Jumps**: When switching instruments, the `CameraController` performs a smooth `lerp` between these fixed presets.
- **Overview Mode**: A special preset at `[0, 25, 25]` provides a bird's-eye view of the entire galaxy.

---
*Reference for 3D UI development and mesh placement.*
