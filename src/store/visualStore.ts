import { create } from 'zustand'

export type InstrumentType = 'drums' | 'bass' | 'harmony' | 'sequencer' | 'pads' | 'drone' | 'master' | 'mixer' | 'keyboard' | 'ml185' | 'snake' | 'sampler' | 'buchla'
export type PerformanceMode = 'low' | 'medium' | 'high' | 'ultra'

export interface EnvironmentConditions {
    temperature: number // Celsius
    precipitation: boolean
    cloudiness: number // 0-1
    windSpeed: number // m/s
    timeOfDay: number // 0-23 (hour)
    lunarPhase: number // 0-1 (0 = new moon, 0.5 = full moon)
}

export interface HandLandmark {
    x: number
    y: number
    z: number
}

interface VisualState {
    // Current "Energy" levels for different parts of the scene (0-1)
    // Current "Energy" levels
    energy: Record<string, number>
    // High-frequency triggers
    triggers: Record<string, number>
    // Interaction state
    activeParam: string | null
    interactionEnergy: number

    // NEW: WebGL-specific data
    fftData: Float32Array | null
    globalAudioIntensity: number
    performanceMode: PerformanceMode
    conditions: EnvironmentConditions
    viewMode: '2D' | '3D'
    webglEnabled: boolean
    handTrackingEnabled: boolean
    handData: HandLandmark[] | null
    statusMessage: string | null
    focusInstrument: InstrumentType | null
    setFocusInstrument: (instrument: InstrumentType | null) => void

    // Actions
    updateEnergy: (instrument: string, value: number) => void
    triggerPulse: (type: string, intensity?: number) => void
    setInteraction: (param: string | null, value: number) => void
    decay: () => void

    // NEW: WebGL actions
    setFFTData: (data: Float32Array) => void
    setAudioIntensity: (intensity: number) => void
    setPerformanceMode: (mode: PerformanceMode) => void
    setConditions: (conditions: Partial<EnvironmentConditions>) => void
    setViewMode: (mode: '2D' | '3D') => void
    toggleWebGL: () => void
    setHandTrackingEnabled: (enabled: boolean) => void
    setHandData: (data: HandLandmark[] | null) => void
    setStatus: (msg: string | null) => void

    // Background
    backgroundPreset: number
    setBackgroundPreset: (index: number) => void
    cycleBackgroundPreset: () => void
}

export const useVisualStore = create<VisualState>((set) => ({
    energy: {
        drums: 0, bass: 0, harmony: 0, sequencer: 0, pads: 0,
        ml185: 0, snake: 0, drone: 0, master: 0, mixer: 0, keyboard: 0,
        sampler: 0, buchla: 0, global: 0, lead: 0
    },
    triggers: {
        kick: 0, snare: 0, hihat: 0, clap: 0, note: 0,
        bass: 0, harmony: 0, sequencer: 0, pads: 0,
        sampler: 0, buchla: 0, lead: 0
    },
    activeParam: null,
    interactionEnergy: 0,

    // NEW: WebGL defaults
    fftData: null,
    globalAudioIntensity: 0,
    performanceMode: 'high', // Default to high quality
    viewMode: '3D', // Default to 3D mode
    webglEnabled: true,
    handTrackingEnabled: false,
    handData: null,
    statusMessage: null,
    focusInstrument: null,
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

    setHandTrackingEnabled: (enabled) => set({ handTrackingEnabled: enabled }),

    setHandData: (data) => set({ handData: data }),

    setFocusInstrument: (instrument) => set({ focusInstrument: instrument }),

    // Background Presets
    backgroundPreset: 0,
    setBackgroundPreset: (index) => set({ backgroundPreset: index }),
    cycleBackgroundPreset: () => set((state) => ({
        backgroundPreset: (state.backgroundPreset + 1) % 10 // 10 presets
    })),

    setStatus: (msg) => {
        set({ statusMessage: msg })
        setTimeout(() => set({ statusMessage: null }), 2000)
    },

    decay: () => set((state) => {
        // Slow decay for energy, fast for triggers
        const d = (val: number, rate: number) => Math.max(0, (val || 0) - rate)
        return {
            energy: {
                drums: d(state.energy.drums, 0.05),
                bass: d(state.energy.bass, 0.05),
                harmony: d(state.energy.harmony, 0.05),
                pads: d(state.energy.pads, 0.05),
                buchla: d(state.energy.buchla, 0.05),
                sampler: d(state.energy.sampler, 0.05),
                global: d(state.energy.global, 0.02)
            },
            triggers: {
                kick: d(state.triggers.kick, 0.15),
                snare: d(state.triggers.snare, 0.15),
                hihat: d(state.triggers.hihat, 0.2),
                clap: d(state.triggers.clap, 0.15),
                note: d(state.triggers.note, 0.2),
                bass: d(state.triggers.bass, 0.15),
                harmony: d(state.triggers.harmony, 0.15),
                pads: d(state.triggers.pads, 0.15),
                sampler: d(state.triggers.sampler, 0.15),
                buchla: d(state.triggers.buchla, 0.15)
            },
            interactionEnergy: d(state.interactionEnergy, 0.05),
            globalAudioIntensity: d(state.globalAudioIntensity, 0.1)
        }
    })
}))
