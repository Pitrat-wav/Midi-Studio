---
description: How to integrate a new Audio Instrument into the 3D Studio
---

# Skill: Audio-Visual Instrument Integration

This skill outlines the standard pattern for adding a new generative instrument to the Telegram Midi Studio.

## Architecture Pattern
A complete instrument consists of 3 parts:
1.  **Store (Logic & Audio)**: Zustand store + Tone.js synth.
2.  **3D Component (Visual)**: R3F component interacting with the store and `AudioVisualBridge`.
3.  **Bridge (Connector)**: Registering the audio source for analysis.

## Step 1: Create the Audio Store
Location: `src/store/instrumentNameStore.ts`
- Use `zustand`.
- Initialize `Tone.Instrument` (e.g., `Tone.Synth`, `Tone.Sampler`) inside `initialize()`.
- Connect to `Destination` or a Mixer channel.
- Implement `triggerAttack()` / `triggerRelease()` methods.

```typescript
export const useMyInstStore = create<MyInstState>((set, get) => ({
  synth: null,
  initialize: () => {
    const synth = new Tone.Synth().toDestination();
    set({ synth });
  },
  trigger: (note) => {
    get().synth?.triggerAttackRelease(note, "8n");
  }
}))
```

## Step 2: Register in AudioVisualBridge
Location: `src/lib/AudioVisualBridge.ts`
- Allows the visualizer to "see" the audio output.
- Add a new analyzer node if needed, or route the synth to the main FFT.

## Step 3: Create 3D Component
Location: `src/components/WebGL/instruments/MyInstrument3D.tsx`
- **Render**: Use Three.js primitives or GLTF models.
- **Animate**: Use `useFrame` loop.
- **React**:
  - Get reactive data from `useAudioVisualBridge()`.
  - `bridge.getPulse('channelName')` returns 0.0-1.0 value based on volume envelope.
  - `bridge.getSpectralCentroid()` returns timbre color.

```tsx
function MyInstrument3D() {
  const bridge = useAudioVisualBridge()
  const mesh = useRef()
  
  useFrame(() => {
    const kick = bridge.getPulse('kick') // React to kick drum?
    mesh.current.scale.setScalar(1 + kick * 0.5)
  })

  return <mesh ref={mesh} ... />
}
```

## Step 4: Add to Scene
Location: `src/components/WebGL/instruments/AllInstruments3D.tsx`
- Add `<MyInstrument3D />` inside the return statement.
- Wrap in `InstrumentGroup` if it needs focus/camera zoom functionality.

## Step 5: Spatial Layout
Location: `src/lib/SpatialLayout.ts`
- Define the `position` (Vector3) and `rotation` of the new instrument in the 3D world.
