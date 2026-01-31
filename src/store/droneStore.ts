import { create } from 'zustand'

export interface DroneState {
    enabled: boolean
    intensity: number // The Big Knob (0-1)
    baseNote: string
    detune: number
    complexity: number // (0-1)

    // v2.0 parameters
    chaos: number      // Bernoulli/S&H speed and probability (0-1)
    fmDepth: number    // Non-harmonic metallic character (0-1)
    grit: number       // Noise and extreme distortion (0-1)
    nervousness: number // Micro-detune speed (0-1)

    // Actions
    setEnabled: (enabled: boolean) => void
    setIntensity: (intensity: number) => void
    setBaseNote: (note: string) => void
    setDetune: (detune: number) => void
    setComplexity: (complexity: number) => void
    setParam: (params: Partial<DroneState>) => void
    toggle: () => void
}

export const useDroneStore = create<DroneState>((set) => ({
    enabled: false,
    intensity: 0.5,
    baseNote: 'C1',
    detune: 5,
    complexity: 0.5,

    chaos: 0.3,
    fmDepth: 0.2,
    grit: 0.2,
    nervousness: 0.4,

    setEnabled: (enabled) => set({ enabled }),
    setIntensity: (intensity) => set({ intensity }),
    setBaseNote: (baseNote) => set({ baseNote }),
    setDetune: (detune) => set({ detune }),
    setComplexity: (complexity) => set({ complexity }),
    setParam: (params) => set((state) => ({ ...state, ...params })),
    toggle: () => set((state) => ({ enabled: !state.enabled }))
}))
