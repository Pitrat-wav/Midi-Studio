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
    { name: 'Feedback Vortex', icon: '🌀', id: 0, tags: '2d, abstract, feedback, trippy, video' },
    { name: 'Quantum Particles', icon: '✨', id: 1, tags: 'particles, space, glow, video' },
    { name: 'Fractal Mirror', icon: '💎', id: 2, tags: 'fractal, crystal, geometry, video' },
    { name: 'Neon Weave', icon: '🕸️', id: 3, tags: 'grid, synthwave, lines' },
    { name: 'Plasma Orb', icon: '🔮', id: 4, tags: 'sphere, organic, glow' },
    { name: 'Liquid Mercury', icon: '💧', id: 5, tags: 'fluid, metal, distort' },
    { name: 'Gravity Well', icon: '🕳️', id: 6, tags: 'particles, physics, blackhole' },
    { name: 'Cyber Tunnel', icon: '🚇', id: 7, tags: 'tunnel, speed, neon' },
    { name: 'Kaleido Sphere', icon: '💠', id: 8, tags: 'kaleidoscope, sphere, complex' },

    // 30 NEW VISUALIZERS
    { name: 'Aura Field', icon: '🌫️', id: 9, tags: 'fog, soft, ambient' },
    { name: 'Circuit City', icon: '🌃', id: 10, tags: 'grid, data, urban, video' },
    { name: 'Voxel Waves', icon: '🧱', id: 11, tags: 'minecraft, voxels, terrain' },
    { name: 'String Theory', icon: '🎻', id: 12, tags: 'lines, vibrates, strings' },
    { name: 'Metablob', icon: '🦠', id: 13, tags: 'organic, blobs, blobs' },
    { name: 'Prism Portal', icon: '🌈', id: 14, tags: 'rainbow, refraction, glass' },
    { name: 'Data Rain', icon: '🔢', id: 15, tags: 'matrix, code, data, video' },
    { name: 'Nebula Cloud', icon: '☁️', id: 16, tags: 'clouds, space, gas' },
    { name: 'Hexagon Grid', icon: '⬢', id: 17, tags: 'hex, geometry, honey' },
    { name: 'Lidar Scan', icon: '📡', id: 18, tags: 'points, laser, scan, video' },
    { name: 'Hypercube', icon: '🧊', id: 19, tags: '4d, cube, geometry' },
    { name: 'Glitch World', icon: '📟', id: 20, tags: 'glitch, error, digital, video' },
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
    { name: 'Glitch Scanner', icon: '📠', id: 42, tags: '2d, glitch, scan, video' },
    { name: 'Lava Lamp 2D', icon: '🟠', id: 43, tags: '2d, blobs, organic' },
    { name: 'Neon Wavelet', icon: '➰', id: 44, tags: '2d, lines, flow' },
    { name: 'Binary Star 2D', icon: '✨', id: 45, tags: '2d, star, center' },
    { name: 'Gradient Flow', icon: '🌈', id: 46, tags: '2d, color, smooth' },
    { name: 'Pixel Noise', icon: '👾', id: 47, tags: '2d, pixels, noise' },
    { name: 'Abstract Grid 2D', icon: '⏹️', id: 48, tags: '2d, grid, pattern' },
    { name: 'Mondrian Composition', icon: '🟥', id: 49, tags: '2d, modern art, grid, mondrian' },
    { name: 'Kandinsky Abstract', icon: '🎨', id: 50, tags: '2d, modern art, circles, kandinsky' },

    // 10 NEW CAMERA VISUALIZERS
    { name: 'Mirror Mask', icon: '🎭', id: 51, tags: '2d, video, cam, mask, fx' },
    { name: 'Ghost Cam', icon: '👻', id: 52, tags: '2d, video, cam, delay, ghost' },
    { name: 'Thermal Vision', icon: '🌡️', id: 53, tags: '2d, video, cam, thermal, heat' },
    { name: 'ASCII Mirror', icon: '🔡', id: 54, tags: '2d, video, cam, ascii, retro' },
    { name: 'Edge Detector', icon: '🎞️', id: 55, tags: '2d, video, cam, edge, neon' },
    { name: 'Kaleido Mirror', icon: '💠', id: 56, tags: '2d, video, cam, mirror, symmetry' },
    { name: 'Motion Trails', icon: '☄️', id: 57, tags: '2d, video, cam, motion, trail' },
    { name: 'Pixel Face', icon: '👾', id: 58, tags: '2d, video, cam, pixel, voxel' },
    { name: 'Slit Scan', icon: '⏱️', id: 59, tags: '2d, video, cam, glitch, time' },
    { name: 'Datamosh Feed', icon: '📼', id: 60, tags: '2d, video, cam, glitch, error' },

    // 100 NEW 2D VISUALIZERS (61-160)
    { name: 'Neon Horizon', icon: '🌅', id: 61, tags: '2d, grid, synthwave' },
    { name: 'Cyber Rain', icon: '🌧️', id: 62, tags: '2d, matrix, rain' },
    { name: 'Digital Pulse', icon: '💓', id: 63, tags: '2d, heart, mono' },
    { name: 'Vortex 2D', icon: '🌪️', id: 64, tags: '2d, spin, abstract' },
    { name: 'Star Field 2D', icon: '🌟', id: 65, tags: '2d, stars, flow' },
    { name: 'Circuit Board', icon: '🔌', id: 66, tags: '2d, tech, grid' },
    { name: 'Lava Flow', icon: '🔥', id: 67, tags: '2d, organic, hot' },
    { name: 'Ice Crystal', icon: '❄️', id: 68, tags: '2d, geometry, cold' },
    { name: 'Plasma Wave', icon: '🌊', id: 69, tags: '2d, fluid, color' },
    { name: 'Audio Bars', icon: '📊', id: 70, tags: '2d, music, bars' },
    { name: 'Polar Spectrum', icon: '🧲', id: 71, tags: '2d, circle, music' },
    { name: 'Geometric Dance', icon: '📐', id: 72, tags: '2d, shapes, fast' },
    { name: 'Pixel Glitch', icon: '👾', id: 73, tags: '2d, retro, error' },
    { name: 'Shadow Play', icon: '👤', id: 74, tags: '2d, light, dark' },
    { name: 'Liquid Gold', icon: '💰', id: 75, tags: '2d, luxury, flow' },
    { name: 'Emerald City', icon: '🏙️', id: 76, tags: '2d, grid, green' },
    { name: 'Ruby Rays', icon: '🏮', id: 77, tags: '2d, light, red' },
    { name: 'Sapphire Sea', icon: '🌊', id: 78, tags: '2d, fluid, blue' },
    { name: 'Topaz Trail', icon: '🎗️', id: 79, tags: '2d, path, yellow' },
    { name: 'Quartz Quartz', icon: '💎', id: 80, tags: '2d, crystal, white' },
    { name: 'Amethyst Arcs', icon: '🟣', id: 81, tags: '2d, arcs, purple' },
    { name: 'Amber Glow', icon: '🟠', id: 82, tags: '2d, soft, orange' },
    { name: 'Obsidian Void', icon: '🌑', id: 83, tags: '2d, dark, space' },
    { name: 'Jade Jungle', icon: '🌿', id: 84, tags: '2d, leaf, organic' },
    { name: 'Pearl Pulse', icon: '⚪', id: 85, tags: '2d, round, soft' },
    { name: 'Diamond Dust', icon: '✨', id: 86, tags: '2d, spark, white' },
    { name: 'Opal Optics', icon: '🌈', id: 87, tags: '2d, rainbow, blur' },
    { name: 'Garnet Grid', icon: '🟥', id: 88, tags: '2d, grid, red' },
    { name: 'Sunstone Spikes', icon: '☀️', id: 89, tags: '2d, sharp, yellow' },
    { name: 'Moonstone Mist', icon: '🌫️', id: 90, tags: '2d, fog, grey' },
    { name: 'Malachite Maze', icon: '🌀', id: 91, tags: '2d, lines, green' },
    { name: 'Turquoise Tide', icon: '🌊', id: 92, tags: '2d, wave, cyan' },
    { name: 'Coral Chaos', icon: '🪸', id: 93, tags: '2d, complex, pink' },
    { name: 'Beryl Bloom', icon: '🌸', id: 94, tags: '2d, flower, organic' },
    { name: 'Zircon Zoom', icon: '🚀', id: 95, tags: '2d, speed, white' },
    { name: 'Peridot Pattern', icon: '🟢', id: 96, tags: '2d, shapes, green' },
    { name: 'Spinel Spin', icon: '💫', id: 97, tags: '2d, rotate, color' },
    { name: 'Tanzanite Twirl', icon: '🌀', id: 98, tags: '2d, spiral, blue' },
    { name: 'Apatite Arp', icon: '🎹', id: 99, tags: '2d, music, patterns' },
    { name: 'Morganite Morph', icon: '💓', id: 100, tags: '2d, liquid, pink' },
    { name: 'Kuntizte Kinetic', icon: '🏃', id: 101, tags: '2d, move, light' },
    { name: 'Iolite Ion', icon: '⚡', id: 102, tags: '2d, spark, violet' },
    { name: 'Fluorite Flow', icon: '〰️', id: 103, tags: '2d, wave, multireal' },
    { name: 'Sodalite Soft', icon: '☁️', id: 104, tags: '2d, cloud, blue' },
    { name: 'Lapis Layer', icon: '🧱', id: 105, tags: '2d, box, blue' },
    { name: 'Pyrite Pixel', icon: '🪙', id: 106, tags: '2d, cube, yellow' },
    { name: 'Hematite Heavy', icon: '🌑', id: 107, tags: '2d, weight, dark' },
    { name: 'Azurite Axial', icon: '🧭', id: 108, tags: '2d, center, blue' },
    { name: 'Rhodonite Rhythm', icon: '🥁', id: 109, tags: '2d, beat, pink' },
    { name: 'Larimar Lake', icon: '🏝️', id: 110, tags: '2d, water, cyan' },
    { name: 'Charoite Chill', icon: '🧊', id: 111, tags: '2d, relax, purple' },
    { name: 'Seraphinite Silk', icon: '🧣', id: 112, tags: '2d, smooth, green' },
    { name: 'Pietersite Power', icon: '🔋', id: 113, tags: '2d, energy, gold' },
    { name: 'Sugilite Surge', icon: '📈', id: 114, tags: '2d, rise, violet' },
    { name: 'Prehnite Pulse', icon: '💚', id: 115, tags: '2d, heartbeat, green' },
    { name: 'Vortex Green', icon: '🌀', id: 116, tags: '2d, spin, green' },
    { name: 'Vortex Red', icon: '🌪️', id: 117, tags: '2d, spin, red' },
    { name: 'Vortex Blue', icon: '🌊', id: 118, tags: '2d, spin, blue' },
    { name: 'Matrix Green', icon: '📟', id: 119, tags: '2d, code, tech' },
    { name: 'Matrix Blue', icon: '💻', id: 120, tags: '2d, code, cyber' },
    { name: 'Matrix Red', icon: '🚨', id: 121, tags: '2d, code, danger' },
    { name: 'Ocean Mist', icon: '🌫️', id: 122, tags: '2d, fog, ocean' },
    { name: 'Desert Mirage', icon: '🏜️', id: 123, tags: '2d, heat, wave' },
    { name: 'Arctic Aurora', icon: '🌌', id: 124, tags: '2d, sky, light' },
    { name: 'Forest Floor', icon: '🍂', id: 125, tags: '2d, leaves, earth' },
    { name: 'Space Dust', icon: '☄️', id: 126, tags: '2d, particles, dark' },
    { name: 'Supernova 2D', icon: '💥', id: 127, tags: '2d, explode, big' },
    { name: 'Black Hole 2D', icon: '🕳️', id: 128, tags: '2d, suck, dark' },
    { name: 'Star Grid', icon: '🗺️', id: 129, tags: '2d, map, stars' },
    { name: 'Comet Tail', icon: '🌠', id: 130, tags: '2d, long, light' },
    { name: 'Nebula Gas', icon: '☁️', id: 131, tags: '2d, smoke, galaxy' },
    { name: 'Solar Wind', icon: '🌬️', id: 132, tags: '2d, blow, sun' },
    { name: 'Lunar Shadow', icon: '🌒', id: 133, tags: '2d, moon, eclipse' },
    { name: 'Gravity Wave', icon: '〰️', id: 134, tags: '2d, distort, ripple' },
    { name: 'Quantum Foam', icon: '🧼', id: 135, tags: '2d, bubble, tiny' },
    { name: 'Chaos Theory', icon: '🔀', id: 136, tags: '2d, random, noisy' },
    { name: 'Fractal Fern', icon: '🌿', id: 137, tags: '2d, math, plant' },
    { name: 'Koch Snowflake', icon: '❄️', id: 138, tags: '2d, math, crystal' },
    { name: 'Sierpinski Tri', icon: '📐', id: 139, tags: '2d, triangle, math' },
    { name: 'Julia Set 2D', icon: '🍬', id: 140, tags: '2d, fractal, smooth' },
    { name: 'Mandelbrot 2D', icon: '🧅', id: 141, tags: '2d, fractal, deep' },
    { name: 'Burning Ship', icon: '🚢', id: 142, tags: '2d, fractal, fire' },
    { name: 'Binary Tree', icon: '🌳', id: 143, tags: '2d, growth, logic' },
    { name: 'Feigenbaum', icon: '📈', id: 144, tags: '2d, bifurcate, math' },
    { name: 'Lorentz Attr', icon: '🦋', id: 145, tags: '2d, butterly, chaos' },
    { name: 'Rossler Attr', icon: '🌀', id: 146, tags: '2d, spiral, chaos' },
    { name: 'Langtons Ant', icon: '🐜', id: 147, tags: '2d, automata, grid' },
    { name: 'Game of Life', icon: '🧬', id: 148, tags: '2d, conways, life' },
    { name: 'Wireworld', icon: '⚡', id: 149, tags: '2d, logic, flow' },
    { name: 'Cellular Wave', icon: '🌊', id: 150, tags: '2d, wave, auto' },
    { name: 'Boids 2D', icon: '🐦', id: 151, tags: '2d, flock, birds' },
    { name: 'Pendulum 2D', icon: '⚖️', id: 152, tags: '2d, swing, physics' },
    { name: 'Double Pendulum', icon: '🎻', id: 153, tags: '2d, chaotic, move' },
    { name: 'Elastic Grid', icon: '🕸️', id: 154, tags: '2d, bounce, lines' },
    { name: 'Fluid Box', icon: '📦', id: 155, tags: '2d, water, container' },
    { name: 'Magnetic Field', icon: '🧲', id: 156, tags: '2d, curves, iron' },
    { name: 'Electric Zap', icon: '🌩️', id: 157, tags: '2d, bolt, flash' },
    { name: 'Radio Waves', icon: '📶', id: 158, tags: '2d, signal, rings' },
    { name: 'Radar Sweep', icon: '⏲️', id: 159, tags: '2d, circular, green' },
    { name: 'Sonar Pulse', icon: '🔉', id: 160, tags: '2d, ping, blue' },

    // RETRO WINDOWS BATCH (161-165)
    { name: 'Win98 Cascade', icon: '🪟', id: 161, tags: 'retro, windows, cascade, error' },
    { name: 'BSOD Glitch', icon: '💻', id: 162, tags: 'retro, error, blue, screen' },
    { name: 'Cursor Sphere', icon: '🖱️', id: 163, tags: 'retro, mouse, 3d, sphere' },
    { name: 'XP Bliss Warp', icon: '🏞️', id: 164, tags: '2d, retro, xp, grass, sky' },
    { name: 'Icon Storm', icon: '💿', id: 165, tags: 'retro, icons, chaos, 3d' },
    { name: 'Boomy3', icon: '💥', id: 166, tags: 'video, cam, anime, speech, clouds' }
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
    trackingDebug: boolean
    statusMessage: string | null
    showHelp: boolean
    showGamepadHelp: boolean
    focusInstrument: InstrumentType | null
    setFocusInstrument: (instrument: InstrumentType | null) => void
    cycleFocusInstrument: (dir: number) => void
    appView: AppView
    visualizerIndex: number
    visualModifier: { x: number, y: number }
    visualSpeed: number
    visualDetail: number
    visualPalette: number
    visualInvert: boolean
    webcamAllowed: boolean
    webcamTexture: any | null
    setVisualizerIndex: (index: number) => void
    setWebcamTexture: (texture: any | null) => void
    setWebcamAllowed: (allowed: boolean) => void
    cycleVisualizer: (dir: number) => void
    cycleVisualizerQuickSlots: (dir: number) => void
    setVisualModifier: (x: number, y: number) => void
    setVisualParams: (params: Partial<{ speed: number, detail: number, palette: number, invert: boolean }>) => void
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
    setTrackingDebug: (enabled: boolean) => void
    setStatus: (msg: string | null) => void
    toggleHelp: () => void
    toggleGamepadHelp: () => void
    showVisualizerShop: boolean
    toggleVisualizerShop: () => void
    visualizerQuickSlots: number[]
    setQuickSlot: (index: number, visualizerId: number) => void
    micEnabled: boolean
    toggleMic: () => void

    backgroundPreset: number
    aestheticTheme: AestheticTheme
    setBackgroundPreset: (index: number) => void
    cycleBackgroundPreset: () => void
    setAestheticTheme: (theme: AestheticTheme) => void

    showTerminal: boolean
    terminalHistory: string[]
    toggleTerminal: () => void
    setTerminalHistory: (history: string[]) => void
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
    trackingDebug: (import.meta as any).env.VITE_TRACKING_DEBUG === 'true',
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
    setTrackingDebug: (enabled) => set({ trackingDebug: enabled }),
    setFocusInstrument: (instrument) => set({ focusInstrument: instrument }),

    cycleFocusInstrument: (dir) => set((state) => {
        const instruments: (InstrumentType | null)[] = [
            null, 'drums', 'bass', 'harmony', 'pads', 'sequencer',
            'drone', 'sampler', 'buchla', 'ml185', 'snake',
            'master', 'mixer', 'keyboard'
        ]
        const currentIndex = instruments.indexOf(state.focusInstrument)
        const nextIndex = (currentIndex + dir + instruments.length) % instruments.length
        return { focusInstrument: instruments[nextIndex] }
    }),

    appView: '3D',
    visualizerIndex: 0,
    visualModifier: { x: 0, y: 0 },
    visualSpeed: 1.0,
    visualDetail: 0.5,
    visualPalette: 0,
    visualInvert: false,
    webcamAllowed: false,
    webcamTexture: null,
    setVisualizerIndex: (index: number) => set({ visualizerIndex: index }),
    setWebcamTexture: (texture) => set({ webcamTexture: texture }),
    setWebcamAllowed: (allowed) => set({ webcamAllowed: allowed }),
    cycleVisualizer: (dir) => set((state) => {
        const next = (state.visualizerIndex + dir + VISUALIZER_REGISTRY.length) % VISUALIZER_REGISTRY.length
        return { visualizerIndex: next }
    }),
    cycleVisualizerQuickSlots: (dir) => set((state) => {
        // Items: [Studio (0), Slot0 (1), ..., Slot8 (9)] - Total 10
        let currentIndex = 0
        if (state.appView === 'VISUALIZER') {
            const slotIdx = state.visualizerQuickSlots.indexOf(state.visualizerIndex)
            currentIndex = slotIdx !== -1 ? slotIdx + 1 : 1
        }

        const nextIndex = (currentIndex + dir + 10) % 10

        if (nextIndex === 0) {
            return { appView: '3D' }
        } else {
            const vid = state.visualizerQuickSlots[nextIndex - 1]
            return {
                appView: 'VISUALIZER',
                visualizerIndex: vid
            }
        }
    }),
    setVisualModifier: (x, y) => set({ visualModifier: { x, y } }),
    setVisualParams: (params) => set((state) => ({
        visualSpeed: params.speed !== undefined ? params.speed : state.visualSpeed,
        visualDetail: params.detail !== undefined ? params.detail : state.visualDetail,
        visualPalette: params.palette !== undefined ? params.palette : state.visualPalette,
        visualInvert: params.invert !== undefined ? params.invert : state.visualInvert
    })),
    resetVisuals: () => set({
        visualSpeed: 1.0,
        visualDetail: 0.5,
        visualPalette: 0,
        visualInvert: false,
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
    showVisualizerShop: false,
    toggleVisualizerShop: () => set((state) => ({ showVisualizerShop: !state.showVisualizerShop })),
    visualizerQuickSlots: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    setQuickSlot: (index, visualizerId) => set((state) => {
        const slots = [...state.visualizerQuickSlots]
        slots[index] = visualizerId
        return { visualizerQuickSlots: slots }
    }),
    toggleMic: () => set((state) => ({ micEnabled: !state.micEnabled })),

    showTerminal: false,
    terminalHistory: [],
    toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
    setTerminalHistory: (history) => set({ terminalHistory: history }),

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
