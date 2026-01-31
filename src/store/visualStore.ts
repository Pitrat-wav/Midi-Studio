import { create } from 'zustand'

export type InstrumentType = 'drums' | 'bass' | 'lead' | 'harm' | 'pads' | 'global'
export type PerformanceMode = 'low' | 'medium' | 'high' | 'ultra'

export interface EnvironmentConditions {
    temperature: number // Celsius
    precipitation: boolean
    cloudiness: number // 0-1
    windSpeed: number // m/s
    timeOfDay: number // 0-23 (hour)
    lunarPhase: number // 0-1 (0 = new moon, 0.5 = full moon)
}

interface VisualState {
    // Current "Energy" levels for different parts of the scene (0-1)
    energy: {
        drums: number
        bass: number
        lead: number
        pads: number
        global: number
    }
    // High-frequency triggers (for particle bursts, flashes)
    triggers: {
        kick: number
        snare: number
        hihat: number
        clap: number
        note: number
    }
    // Interaction state (which knob is being turned)
    activeParam: string | null
    interactionEnergy: number

    // NEW: WebGL-specific data
    fftData: Float32Array | null
    globalAudioIntensity: number
    performanceMode: PerformanceMode
    conditions: EnvironmentConditions
    viewMode: '2D' | '3D'
    webglEnabled: boolean

    // Actions
    updateEnergy: (instrument: InstrumentType, value: number) => void
    triggerPulse: (type: keyof VisualState['triggers'], intensity?: number) => void
    setInteraction: (param: string | null, value: number) => void
    decay: () => void

    // NEW: WebGL actions
    setFFTData: (data: Float32Array) => void
    setAudioIntensity: (intensity: number) => void
    setPerformanceMode: (mode: PerformanceMode) => void
    setConditions: (conditions: Partial<EnvironmentConditions>) => void
    setViewMode: (mode: '2D' | '3D') => void
    toggleWebGL: () => void
}

export const useVisualStore = create<VisualState>((set) => ({
    energy: {
        drums: 0,
        bass: 0,
        lead: 0,
        pads: 0,
        global: 0
    },
    triggers: {
        kick: 0,
        snare: 0,
        hihat: 0,
        clap: 0,
        note: 0
    },
    activeParam: null,
    interactionEnergy: 0,

    // NEW: WebGL defaults
    fftData: null,
    globalAudioIntensity: 0,
    performanceMode: 'high', // Default to high quality
    viewMode: '3D', // Default to 3D mode
    webglEnabled: true,
    conditions: {
        temperature: 20,
        precipitation: false,
        cloudiness: 0.5,
        windSpeed: 0,
        timeOfDay: new Date().getHours(),
        lunarPhase: 0.5
    },

    updateEnergy: (instrument, value) => set((state) => ({
        energy: { ...state.energy, [instrument]: value }
    })),

    triggerPulse: (type, intensity = 1) => set((state) => ({
        triggers: { ...state.triggers, [type]: intensity }
    })),

    setInteraction: (param, value) => set({
        activeParam: param,
        interactionEnergy: value
    }),

    // NEW: WebGL actions
    setFFTData: (data) => set({ fftData: data }),

    setAudioIntensity: (intensity) => set({ globalAudioIntensity: intensity }),

    setPerformanceMode: (mode) => set({ performanceMode: mode }),

    setConditions: (conditions) => set((state) => ({
        conditions: { ...state.conditions, ...conditions }
    })),

    setViewMode: (mode) => set({ viewMode: mode }),

    toggleWebGL: () => set((state) => ({ webglEnabled: !state.webglEnabled })),

    decay: () => set((state) => {
        // Slow decay for energy, fast for triggers
        const d = (val: number, rate: number) => Math.max(0, val - rate)
        return {
            energy: {
                drums: d(state.energy.drums, 0.05),
                bass: d(state.energy.bass, 0.05),
                lead: d(state.energy.lead, 0.05),
                pads: d(state.energy.pads, 0.05),
                global: d(state.energy.global, 0.02)
            },
            triggers: {
                kick: d(state.triggers.kick, 0.15),
                snare: d(state.triggers.snare, 0.15),
                hihat: d(state.triggers.hihat, 0.2),
                clap: d(state.triggers.clap, 0.15),
                note: d(state.triggers.note, 0.2)
            },
            interactionEnergy: d(state.interactionEnergy, 0.05),
            globalAudioIntensity: d(state.globalAudioIntensity, 0.1)
        }
    })
}))
