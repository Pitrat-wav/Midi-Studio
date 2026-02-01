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

export const VISUALIZER_REGISTRY = [
    { name: 'Feedback Vortex', icon: '🌀', id: 0, tags: 'abstract, feedback, trippy' },
    { name: 'Quantum Particles', icon: '✨', id: 1, tags: 'particles, space, glow' },
    { name: 'Fractal Mirror', icon: '💎', id: 2, tags: 'fractal, crystal, geometry' },
    { name: 'Neon Weave', icon: '🕸️', id: 3, tags: 'grid, synthwave, lines' },
    { name: 'Plasma Orb', icon: '🔮', id: 4, tags: 'sphere, organic, glow' },
    { name: 'Liquid Mercury', icon: '💧', id: 5, tags: 'fluid, metal, distort' },
    { name: 'Gravity Well', icon: '🕳️', id: 6, tags: 'particles, physics, blackhole' },
    { name: 'Cyber Tunnel', icon: '🚇', id: 7, tags: 'tunnel, speed, neon' },
    { name: 'Kaleido Sphere', icon: '💠', id: 8, tags: 'kaleidoscope, sphere, complex' },

    // 30 NEW VISUALIZERS
    { name: 'Aura Field', icon: '🌫️', id: 9, tags: 'fog, soft, ambient' },
    { name: 'Circuit City', icon: '🌃', id: 10, tags: 'grid, data, urban' },
    { name: 'Voxel Waves', icon: '🧱', id: 11, tags: 'minecraft, voxels, terrain' },
    { name: 'String Theory', icon: '🎻', id: 12, tags: 'lines, vibrates, strings' },
    { name: 'Metablob', icon: '🦠', id: 13, tags: 'organic, blobs, blobs' },
    { name: 'Prism Portal', icon: '🌈', id: 14, tags: 'rainbow, refraction, glass' },
    { name: 'Data Rain', icon: '🔢', id: 15, tags: 'matrix, code, data' },
    { name: 'Nebula Cloud', icon: '☁️', id: 16, tags: 'clouds, space, gas' },
    { name: 'Hexagon Grid', icon: '⬢', id: 17, tags: 'hex, geometry, honey' },
    { name: 'Lidar Scan', icon: '📡', id: 18, tags: 'points, laser, scan' },
    { name: 'Hypercube', icon: '🧊', id: 19, tags: '4d, cube, geometry' },
    { name: 'Glitch World', icon: '📟', id: 20, tags: 'glitch, error, digital' },
    { name: 'Spiral Galaxy', icon: '🌌', id: 21, tags: 'stars, spin, galaxy' },
    { name: 'Crystal Cave', icon: '🌋', id: 22, tags: 'rocks, reflections, sharp' },
    { name: 'Growth Tendrils', icon: '🌿', id: 23, tags: 'organic, growth, life' },
    { name: 'Geometric Chaos', icon: '💥', id: 24, tags: 'cubes, explode, chaos' },
    { name: 'Solar Flare', icon: '☀️', id: 25, tags: 'sun, fire, rays' },
    { name: 'Depth Rings', icon: '⭕', id: 26, tags: 'rings, distance, pulse' },
    { name: 'Frequency 360', icon: '📊', id: 27, tags: 'bars, spectrum, round' },
    { name: 'Triangle Rain', icon: '🔺', id: 28, tags: 'flat, geometry, fall' },
    { name: 'Vector Field', icon: '↗️', id: 29, tags: 'arrows, flow, math' },
    { name: 'Electric Storm', icon: '⚡', id: 30, tags: 'lightning, bolts, flash' },
    { name: 'Fluid Glass', icon: '🧪', id: 31, tags: 'liquid, morph, clear' },
    { name: 'Speed Warp', icon: '🌠', id: 32, tags: 'stars, fast, jump' },
    { name: 'Abstract Solid', icon: '🗿', id: 33, tags: 'sculpture, morph, solid' },
    { name: 'Laser Grid', icon: '🕹️', id: 34, tags: '80s, synthwave, neon' },
    { name: 'Double Helix', icon: '🧬', id: 35, tags: 'dna, spiral, complex' },
    { name: 'Pulsar Star', icon: '🔔', id: 36, tags: 'pulse, rings, center' },
    { name: 'Fractal Forest', icon: '🌲', id: 37, tags: 'recursive, tree, growth' },
    { name: 'Glass Shards', icon: '🪟', id: 38, tags: 'broken, pieces, floating' },

    // 10 2D VISUALIZERS
    { name: 'Retro Oscilloscope', icon: '📉', id: 39, tags: '2d, wave, retro' },
    { name: 'Vibrant Spectrum', icon: '📊', id: 40, tags: '2d, bars, color' },
    { name: 'Radial Pulse', icon: '💿', id: 41, tags: '2d, circle, pulse' },
    { name: 'Glitch Scanner', icon: '📠', id: 42, tags: '2d, glitch, scan' },
    { name: 'Lava Lamp 2D', icon: '🟠', id: 43, tags: '2d, blobs, organic' },
    { name: 'Neon Wavelet', icon: '➰', id: 44, tags: '2d, lines, flow' },
    { name: 'Binary Star 2D', icon: '✨', id: 45, tags: '2d, star, center' },
    { name: 'Gradient Flow', icon: '🌈', id: 46, tags: '2d, color, smooth' },
    { name: 'Pixel Noise', icon: '👾', id: 47, tags: '2d, pixels, noise' },
    { name: 'Abstract Grid 2D', icon: '⏹️', id: 48, tags: '2d, grid, pattern' },
    { name: 'Mondrian Composition', icon: '🟥', id: 49, tags: '2d, modern art, grid, mondrian' },
    { name: 'Kandinsky Abstract', icon: '🎨', id: 50, tags: '2d, modern art, circles, kandinsky' }
]

export type InstrumentType = 'drums' | 'bass' | 'harmony' | 'sequencer' | 'pads' | 'drone' | 'master' | 'mixer' | 'keyboard' | 'ml185' | 'snake' | 'sampler' | 'buchla'
export type PerformanceMode = 'low' | 'medium' | 'high' | 'ultra'
export type AestheticTheme = 'none' | 'cosmic' | 'cyber' | 'pixel' | 'southpark'
export type AppView = '3D' | 'NODES' | 'LIVE' | 'ARRANGE' | 'VISUALIZER'

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

export interface PoseLandmark {
    x: number
    y: number
    z: number
    visibility: number
}

interface VisualState {
    energyCode: string // Unique code for session
    energy: Record<string, number>
    triggers: Record<string, number>
    activeParam: string | null
    interactionEnergy: number

    fftData: Float32Array | null
    globalAudioIntensity: number
    performanceMode: PerformanceMode
    conditions: EnvironmentConditions
    viewMode: '2D' | '3D'
    webglEnabled: boolean
    handTrackingEnabled: boolean
    handData: HandLandmark[] | null
    poseTrackingEnabled: boolean
    poseData: PoseLandmark[] | null
    statusMessage: string | null
    showHelp: boolean
    showGamepadHelp: boolean
    focusInstrument: InstrumentType | null
    setFocusInstrument: (instrument: InstrumentType | null) => void
    appView: AppView
    visualizerIndex: number
    visualModifier: { x: number, y: number }
    visualSpeed: number
    visualDetail: number
    setVisualizerIndex: (index: number) => void
    cycleVisualizer: (dir: number) => void
    setVisualModifier: (x: number, y: number) => void
    setVisualParams: (params: Partial<{ speed: number, detail: number }>) => void
    resetVisuals: () => void
    setAppView: (view: AppView) => void
    cycleView: () => void

    updateEnergy: (instrument: string, value: number) => void
    triggerPulse: (type: string, intensity?: number) => void
    setInteraction: (param: string | null, value: number) => void
    decay: () => void

    setFFTData: (data: Float32Array) => void
    setAudioIntensity: (intensity: number) => void
    setPerformanceMode: (mode: PerformanceMode) => void
    setConditions: (conditions: Partial<EnvironmentConditions>) => void
    setViewMode: (mode: '2D' | '3D') => void
    toggleWebGL: () => void
    setHandTrackingEnabled: (enabled: boolean) => void
    setHandData: (data: HandLandmark[] | null) => void
    setPoseTrackingEnabled: (enabled: boolean) => void
    setPoseData: (data: PoseLandmark[] | null) => void
    setStatus: (msg: string | null) => void
    toggleHelp: () => void
    toggleGamepadHelp: () => void
    micEnabled: boolean
    toggleMic: () => void

    backgroundPreset: number
    aestheticTheme: AestheticTheme
    setBackgroundPreset: (index: number) => void
    cycleBackgroundPreset: () => void
    setAestheticTheme: (theme: AestheticTheme) => void
}

export const useVisualStore = create<VisualState>((set) => ({
    energyCode: Math.random().toString(36).substring(7),
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

    fftData: null,
    globalAudioIntensity: 0,
    performanceMode: 'high',
    viewMode: '3D',
    webglEnabled: true,
    handTrackingEnabled: false,
    handData: null,
    poseTrackingEnabled: false,
    poseData: null,
    statusMessage: null,
    showHelp: false,
    showGamepadHelp: false,
    micEnabled: false,
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
    setPoseTrackingEnabled: (enabled) => set({ poseTrackingEnabled: enabled }),
    setPoseData: (data) => set({ poseData: data }),
    setFocusInstrument: (instrument) => set({ focusInstrument: instrument }),

    appView: '3D',
    visualizerIndex: 0,
    visualModifier: { x: 0, y: 0 },
    visualSpeed: 1.0,
    visualDetail: 0.5,
    setVisualizerIndex: (index: number) => set({ visualizerIndex: index }),
    cycleVisualizer: (dir) => set((state) => {
        const next = (state.visualizerIndex + dir + VISUALIZER_REGISTRY.length) % VISUALIZER_REGISTRY.length
        return { visualizerIndex: next }
    }),
    setVisualModifier: (x, y) => set({ visualModifier: { x, y } }),
    setVisualParams: (params) => set((state) => ({
        visualSpeed: params.speed !== undefined ? params.speed : state.visualSpeed,
        visualDetail: params.detail !== undefined ? params.detail : state.visualDetail
    })),
    resetVisuals: () => set({
        visualSpeed: 1.0,
        visualDetail: 0.5,
        visualModifier: { x: 0, y: 0 },
        globalAudioIntensity: 0
    }),
    setAppView: (view) => set({ appView: view }),
    cycleView: () => set((state) => {
        const views: AppView[] = ['3D', 'NODES', 'LIVE', 'ARRANGE', 'VISUALIZER']
        const currentIndex = views.indexOf(state.appView)
        const nextIndex = (currentIndex + 1) % views.length
        return { appView: views[nextIndex] }
    }),

    backgroundPreset: 0,
    aestheticTheme: 'none',
    setBackgroundPreset: (index) => set({
        backgroundPreset: index,
        aestheticTheme: (index >= 0 && PRESETS && PRESETS[index]) ? (
            PRESETS[index].name?.includes('COSMIC') ? 'cosmic' :
                PRESETS[index].name?.includes('CYBER') ? 'cyber' :
                    PRESETS[index].name?.includes('PIXEL') ? 'pixel' :
                        PRESETS[index].name?.includes('SOUTH PARK') ? 'southpark' : 'none'
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
                        nextName.includes('PIXEL') ? 'pixel' :
                            nextName.includes('SOUTH PARK') ? 'southpark' : 'none'
        }
    }),

    setStatus: (msg) => {
        set({ statusMessage: msg })
        setTimeout(() => set({ statusMessage: null }), 2000)
    },

    toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
    toggleGamepadHelp: () => set((state) => ({ showGamepadHelp: !state.showGamepadHelp })),
    toggleMic: () => set((state) => ({ micEnabled: !state.micEnabled })),

    decay: () => set((state) => {
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
            globalAudioIntensity: d(state.globalAudioIntensity, 0.1),
            visualModifier: {
                x: (state.visualModifier?.x || 0) * 0.95,
                y: (state.visualModifier?.y || 0) * 0.95
            }
        }
    })
}))
