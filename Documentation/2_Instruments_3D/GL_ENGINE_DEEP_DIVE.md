# 2.2 WebGL Engine Deep Dive

The MIDI Studio utilizes a high-performance WebGL pipeline tailored for musical instruments.

## Architecture
- **Three.js Core**: Manages the 3D scene, cameras (Perspective vs. Cinematic), and lights.
- **Custom Shader Materials**: Used for the glow effects on LEDs and the metallic sheen on instrument panels.
- **Generative Textures**: Some panels use dynamically generated canvases as textures to allow for real-time state feedback (e.g., active step highlights).

## Optimization Techniques
- **Instanced Rendering**: Used for repeated elements like the 16-step buttons to minimize draw calls.
- **Geometry Compression**: All hardware models are optimized for mobile delivery (Telegram Mini App constraints).
- **Audio-Visual Bridge**: A singleton layer that maps audio frequencies and clock pulses to visual animations (e.g., bouncing knobs or pulsing LEDs).

## View Modes
1.  **Studio Overview**: Wide-angle perspective for navigation.
2.  **Instrument Focus**: Locked-on cinematic view for precise knob manipulation.
3.  **Module HUD**: 2D HTML/CSS overlays synced with 3D coordinate mapping for info cards.
