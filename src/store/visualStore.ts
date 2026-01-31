import { create } from 'zustand'
export const PRESETS = [
    { name: 'DEEP VOID', color: '#000000', stars: 1500, haze: 0, light1: '#ffffff', light2: '#111111' },
    { name: 'ORION NEBULA', color: '#0a0010', stars: 4000, haze: 0.02, light1: '#ff00cc', light2: '#3300ff' },
    { name: 'BLUE GIANT', color: '#000510', stars: 3000, haze: 0.01, light1: '#00ccff', light2: '#002244' },
    { name: 'RED SUPERGIANT', color: '#100200', stars: 3000, haze: 0.015, light1: '#ff3300', light2: '#441100' },
    { name: 'MILKY WAY', color: '#050505', stars: 6000, haze: 0.005, light1: '#ffeeaa', light2: '#aabbff' },
    { name: 'CYBER SPACE', color: '#000205', stars: 2000, haze: 0.01, light1: '#00ffaa', light2: '#ff00ff' },
    { name: 'EVENT HORIZON', color: '#000000', stars: 500, haze: 0.002, light1: '#333333', light2: '#000000' },
    { name: 'GOLDEN CLUSTER', color: '#050300', stars: 5000, haze: 0.01, light1: '#ffcc00', light2: '#ff8800' },
    { name: 'WHISK: COSMIC', color: '#1a0030', stars: 4000, haze: 0.02, light1: '#ff00ff', light2: '#00ffff', texture: '/assets/visuals/whisk_preset_1.png' },
    { name: 'WHISK: CYBER', color: '#001a1a', stars: 3000, haze: 0.015, light1: '#00ff88', light2: '#ffcc00', texture: '/assets/visuals/whisk_preset_2.png' },
    { name: 'WHISK: PIXEL', color: '#332255', stars: 1000, haze: 0.005, light1: '#ff00ff', light2: '#ffff00', texture: '/assets/visuals/whisk_preset_3.png' },
    { name: 'SOUTH PARK ROCK', color: '#87CEEB', stars: 800, haze: 0.003, light1: '#FFD700', light2: '#228B22', texture: '/assets/visuals/south_park_rock.png' }
]

export type InstrumentType = 'drums' | 'bass' | 'harmony' | 'sequencer' | 'pads' | 'drone' | 'master' | 'mixer' | 'keyboard' | 'ml185' | 'snake' | 'sampler' | 'buchla'
export type PerformanceMode = 'low' | 'medium' | 'high' | 'ultra'
export type AestheticTheme = 'none' | 'cosmic' | 'cyber' | 'pixel' | 'southpark'

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
    aestheticTheme: AestheticTheme
    setBackgroundPreset: (index: number) => void
    cycleBackgroundPreset: () => void
    setAestheticTheme: (theme: AestheticTheme) => void
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
    aestheticTheme: 'none',
    setBackgroundPreset: (index) => set({
        backgroundPreset: index,
        aestheticTheme: (index >= 0 && PRESETS && PRESETS[index]) ? (
            PRESETS[index].name?.includes('COSMIC') ? 'cosmic' :
                PRESETS[index].name?.includes('CYBER') ? 'cyber' :
                    PRESETS[index].name?.includes('PIXEL') ? 'pixel' : 'none'
        ) : 'none'
    }),
    setAestheticTheme: (theme) => set({ aestheticTheme: theme }),
    cycleBackgroundPreset: () => set((state) => {
        const presetsCount = (PRESETS && Array.isArray(PRESETS)) ? PRESETS.length : 1
        const next = (state.backgroundPreset + 1) % presetsCount
        const preset = (PRESETS && PRESETS[next]) ? PRESETS[next] : null
        const nextName = preset?.name || ''
        return {
            backgroundPreset: next,
            aestheticTheme:
                nextName.includes('COSMIC') ? 'cosmic' :
                    nextName.includes('CYBER') ? 'cyber' :
                        nextName.includes('PIXEL') ? 'pixel' : 'none'
        }
    }),

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
