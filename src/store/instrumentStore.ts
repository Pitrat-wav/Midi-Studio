import { create } from 'zustand'
import { ChordType } from '../logic/Scaler'
import { SnakePattern } from '../logic/GridWalker'
import { BassStep } from '../logic/StingGenerator'
import { bjorklund } from '../logic/bjorklund'

// No changes here, just closing the thought. See audioStore.ts fix above.
export type ScaleType = 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'pentatonic' | 'chromatic'
export const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const SCALES: ScaleType[] = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'pentatonic', 'chromatic']

interface HarmonyState {
    root: string
    scale: ScaleType
    isMetronomeOn: boolean
    setRoot: (r: string) => void
    setScale: (s: ScaleType) => void
    toggleMetronome: () => void
}

export const useHarmonyStore = create<HarmonyState>((set) => ({
    root: 'C',
    scale: 'minor',
    isMetronomeOn: false,
    setRoot: (root) => set({ root }),
    setScale: (scale) => set({ scale }),
    toggleMetronome: () => set((state) => ({ isMetronomeOn: !state.isMetronomeOn }))
}))

// Drum Store
interface DrumState {
    kick: { steps: number, pulses: number, rotate: number, decay: number, pitch: number, volume: number, muted: boolean }
    snare: { steps: number, pulses: number, rotate: number, decay: number, pitch: number, volume: number, muted: boolean }
    hihat: { steps: number, pulses: number, rotate: number, decay: number, pitch: number, volume: number, muted: boolean }
    hihatOpen: { steps: number, pulses: number, rotate: number, decay: number, pitch: number, volume: number, muted: boolean }
    clap: { steps: number, pulses: number, rotate: number, decay: number, pitch: number, volume: number, muted: boolean }
    ride: { steps: number, pulses: number, rotate: number, decay: number, pitch: number, volume: number, muted: boolean }
    kit: '808' | '909'
    setParams: (drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'ride', params: Partial<{ steps: number, pulses: number, rotate: number, decay: number, pitch: number, volume: number, muted: boolean }>) => void
    setKit: (kit: '808' | '909') => void
    activePatterns: { kick: boolean[], snare: boolean[], hihat: boolean[], hihatOpen: boolean[], clap: boolean[], ride: boolean[] }
    isPlaying: boolean
    togglePlay: () => void
    triggerKick: () => void
    triggerSnare: () => void
    triggerHiHat: () => void
}

export const useDrumStore = create<DrumState>((set) => ({
    kick: { steps: 16, pulses: 4, rotate: 0, decay: 0.5, pitch: 0.5, volume: 0, muted: false },
    snare: { steps: 16, pulses: 0, rotate: 0, decay: 0.5, pitch: 0.5, volume: -5, muted: false },
    hihat: { steps: 16, pulses: 8, rotate: 0, decay: 0.5, pitch: 0.5, volume: -10, muted: false },
    hihatOpen: { steps: 16, pulses: 0, rotate: 0, decay: 0.5, pitch: 0.5, volume: -10, muted: false },
    clap: { steps: 16, pulses: 0, rotate: 0, decay: 0.5, pitch: 0.5, volume: -5, muted: false },
    ride: { steps: 16, pulses: 0, rotate: 0, decay: 0.5, pitch: 0.5, volume: -5, muted: false },
    kit: '808',
    isPlaying: false,
    activePatterns: {
        kick: bjorklund(16, 4).map(v => v === 1),
        snare: bjorklund(16, 0).map(v => v === 1),
        hihat: bjorklund(16, 8).map(v => v === 1),
        hihatOpen: bjorklund(16, 0).map(v => v === 1),
        clap: bjorklund(16, 0).map(v => v === 1),
        ride: bjorklund(16, 0).map(v => v === 1)
    },
    setParams: (drum, params) => set((state) => {
        const newState = { ...state, [drum]: { ...state[drum], ...params } }
        // Pre-calculate pattern if pulses or steps changed
        if (params.pulses !== undefined || params.steps !== undefined) {
            const pattern = bjorklund(newState[drum].steps, newState[drum].pulses).map(v => v === 1)
            newState.activePatterns = { ...newState.activePatterns, [drum]: pattern }
        }
        return newState
    }),
    setKit: (kit) => set({ kit }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    triggerKick: () => { /* Logic is handled by AudioVisualBridge on MIDI event or directly by local triggers */ },
    triggerSnare: () => { },
    triggerHiHat: () => { }
}))


// Pad Store
interface PadState {
    active: boolean
    brightness: number
    complexity: number
    setParams: (params: Partial<{ active: boolean, brightness: number, complexity: number }>) => void
    togglePlay: () => void
}

export const usePadStore = create<PadState>((set) => ({
    active: false,
    brightness: 0.5,
    complexity: 0.5,
    setParams: (params) => set((state) => ({ ...state, ...params })),
    togglePlay: () => set((state) => ({ active: !state.active }))
}))

// Bass Store
export type BassInstrument = 'acid' | 'fm'

interface BassState {
    activeInstrument: BassInstrument
    // Acid Params
    density: number
    type: number
    seedA: number
    seedB: number
    morph: number
    cutoff: number
    resonance: number
    slide: number
    distortion: number
    // FM Params
    fmHarmonicity: number
    fmModIndex: number
    fmAttack: number
    fmDecay: number
    fmMode: 'offbeat' | 'galloping' | 'syncopated' | 'random'

    pattern: BassStep[]
    isPlaying: boolean

    setInstrument: (inst: BassInstrument) => void
    setDensity: (d: number) => void
    setType: (t: number) => void
    setSeed: (s: number) => void
    setMorph: (m: number) => void
    setCutoff: (v: number) => void
    setResonance: (v: number) => void
    setSlide: (v: number) => void
    setDistortion: (v: number) => void
    setPattern: (p: BassStep[]) => void
    togglePlay: () => void
    lastNoteFrequency?: number
    setParams: (params: Partial<BassState>) => void
}

export const useBassStore = create<BassState>((set) => ({
    activeInstrument: 'acid',
    density: 0.5,
    type: 0.2,
    seedA: Math.random(),
    seedB: Math.random(),
    morph: 0,
    cutoff: 400,
    resonance: 1,
    slide: 0.1,
    distortion: 0.4,
    fmHarmonicity: 1.5,
    fmModIndex: 10,
    fmAttack: 0.01,
    fmDecay: 0.2,
    fmMode: 'offbeat',
    pattern: [],
    isPlaying: false,
    lastNoteFrequency: 55,
    setInstrument: (activeInstrument) => set({ activeInstrument }),
    setDensity: (density) => set({ density }),
    setType: (type) => set({ type }),
    setSeed: (seed) => set({ seedA: seed, seedB: (seed + 0.5) % 1 }), // Default behavior
    setMorph: (morph: number) => set({ morph }),
    setCutoff: (cutoff) => set({ cutoff }),
    setResonance: (resonance) => set({ resonance }),
    setSlide: (slide) => set({ slide }),
    setDistortion: (distortion) => set({ distortion }),
    setPattern: (pattern) => set({ pattern }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setParams: (params) => set((state) => ({ ...state, ...params }))
}))

// Sequencer Store (ML-185 + Snake)
export interface Stage {
    pitch: number
    velocity: number
    length: number // in 1/16th pulses
    pulseCount: number // repeats
    gateMode: 0 | 1 | 2 | 3 // Mute, Single, Multi, Hold
    probability: number // 0-1
    condition: 'none' | '1/2' | '2/2' | '1/4' | '2/4' | 'neighbor' | 'not-neighbor'
}

export interface SnakeCell {
    note: number
    velocity: number
    probability: number
    active: boolean
}

interface SequencerState {
    stages: Stage[]
    snakePattern: SnakePattern | 'cartesian'
    snakeGrid: SnakeCell[]
    snakeX: number
    snakeY: number
    currentStageIndex: number
    currentPulseInStage: number
    currentSnakeIndex: number
    snakeStartStep: number
    snakeEndStep: number
    setStage: (index: number, stage: Partial<Stage>) => void
    setStages: (stages: Stage[]) => void
    setSnakePattern: (p: SnakePattern | 'cartesian') => void
    setSnakeNote: (index: number, note: number) => void
    setSnakeCell: (index: number, cell: Partial<SnakeCell>) => void
    toggleSnakeStep: (index: number) => void
    setSnakeGrid: (grid: SnakeCell[]) => void
    setCurrentStep: (step: number) => void
    setCurrentStageIndex: (index: number) => void
    setCurrentSnakeIndex: (index: number) => void
    setSnakeXY: (x: number, y: number) => void
    setSnakeRange: (start: number, end: number) => void
    isStagesPlaying: boolean
    isSnakePlaying: boolean
    isTuringPlaying: boolean
    toggleStagesPlay: () => void
    toggleSnakePlay: () => void
    toggleTuringPlay: () => void
    // Turing Machine
    turingProbability: number
    turingIsLocked: boolean
    turingRegister: number
    turingBits: number
    setTuringParam: (params: Partial<{ turingProbability: number, turingIsLocked: boolean, turingRegister: number, turingBits: number }>) => void
    // Smart Chord
    smartChordEnabled: boolean
    smartChordType: ChordType
    lastChordNotes: number[]
    setSmartChordParam: (params: Partial<{ smartChordEnabled: boolean, smartChordType: ChordType }>) => void
    setLastChordNotes: (notes: number[]) => void
}

const initialStages: Stage[] = Array.from({ length: 8 }, () => ({
    pitch: 60,
    velocity: 0.8,
    length: 1,
    pulseCount: 1,
    gateMode: 1,
    probability: 1.0,
    condition: 'none'
}))

const initialSnakeGrid: SnakeCell[] = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84, 86].map(n => ({
    note: n,
    velocity: 0.8,
    probability: 1.0,
    active: true
}))

export const useSequencerStore = create<SequencerState>((set) => ({
    stages: initialStages,
    snakePattern: 'linear',
    snakeGrid: initialSnakeGrid,
    snakeX: 0,
    snakeY: 0,
    currentStageIndex: 0,
    currentPulseInStage: 0,
    currentSnakeIndex: 0,
    snakeStartStep: 0,
    snakeEndStep: 15,
    isStagesPlaying: false,
    isSnakePlaying: false,
    isTuringPlaying: false,
    setStage: (index, stage) => set((state) => {
        const newStages = [...state.stages]
        const updates = { ...stage }
        if (updates.pitch !== undefined && (isNaN(updates.pitch) || typeof updates.pitch !== 'number')) {
            updates.pitch = 60
        }
        newStages[index] = { ...newStages[index], ...updates }
        return { stages: newStages }
    }),
    setStages: (stages: Stage[]) => set({ stages }),
    setSnakePattern: (snakePattern) => set({ snakePattern }),
    setSnakeNote: (index, note) => set((state) => {
        const newGrid = [...state.snakeGrid]
        const validatedNote = (isNaN(note) || typeof note !== 'number') ? 60 : note
        newGrid[index] = { ...newGrid[index], note: validatedNote }
        return { snakeGrid: newGrid }
    }),
    setSnakeCell: (index, cell) => set((state) => {
        const newGrid = [...state.snakeGrid]
        const updates = { ...cell }
        if (updates.note !== undefined && (isNaN(updates.note) || typeof updates.note !== 'number')) {
            updates.note = 60
        }
        newGrid[index] = { ...newGrid[index], ...updates }
        return { snakeGrid: newGrid }
    }),
    toggleSnakeStep: (index) => set((state) => {
        const newGrid = [...state.snakeGrid]
        newGrid[index] = { ...newGrid[index], active: !newGrid[index].active }
        return { snakeGrid: newGrid }
    }),
    setSnakeGrid: (grid: SnakeCell[]) => set({ snakeGrid: grid }),
    setCurrentStageIndex: (currentStageIndex) => set({ currentStageIndex }),
    setCurrentSnakeIndex: (currentSnakeIndex) => set({ currentSnakeIndex }),
    setSnakeXY: (snakeX, snakeY) => set({ snakeX, snakeY }),
    setSnakeRange: (start, end) => set({ snakeStartStep: start, snakeEndStep: end }),
    toggleStagesPlay: () => set((state) => ({ isStagesPlaying: !state.isStagesPlaying })),
    toggleSnakePlay: () => set((state) => ({ isSnakePlaying: !state.isSnakePlaying })),
    toggleTuringPlay: () => set((state) => ({ isTuringPlaying: !state.isTuringPlaying })),
    turingProbability: 0.1,
    turingIsLocked: false,
    turingRegister: 0xABCD,
    turingBits: 8,
    setTuringParam: (params) => set((state) => ({ ...state, ...params })),
    setCurrentStep: (s) => { },
    // Smart Chord
    smartChordEnabled: false,
    smartChordType: 'triad',
    lastChordNotes: [],
    setSmartChordParam: (params) => set((state) => ({ ...state, ...params })),
    setLastChordNotes: (lastChordNotes) => set({ lastChordNotes })
}))

// Modulation Store
export type LfoShape = 'sine' | 'triangle' | 'saw' | 'square' | 'random'

interface LfoState {
    enabled: boolean
    shape: LfoShape
    frequency: number // in Hz or Sync
    depth: number
    target: 'none' | 'bassCutoff' | 'bassResonance' | 'leadCutoff' | 'leadResonance' | 'drumVolume' | 'padBrightness' | 'masterVolume'
    currentValue: number // Calculated value -1 to 1
    setLfo: (params: Partial<LfoState>) => void
    updateValue: (val: number) => void
}

// Harm Store (Super-Modular Synth)
import { HarmOscType, ADSRParams } from '../logic/HarmSynth'

export interface HarmPreset {
    name: string
    category?: string
    isSequencerEnabled: boolean
    isDroneEnabled: boolean
    chordOffsets: number[] // e.g. [0, 4, 7] for a major triad
    // Toggles
    osc1Enabled: boolean
    osc2Enabled: boolean
    osc3Enabled: boolean
    noiseEnabled: boolean
    f1Enabled: boolean
    f2Enabled: boolean
    // Osc 1
    osc1Type: HarmOscType
    osc1Detune: number
    osc1Env: ADSRParams
    osc1FxSend: number
    // Osc 2
    osc2Type: HarmOscType
    osc2Detune: number
    osc2Env: ADSRParams
    osc2FxSend: number
    // Osc 3
    osc3Type: HarmOscType
    osc3Detune: number
    osc3Env: ADSRParams
    osc3FxSend: number
    // Noise
    noiseEnv: ADSRParams
    noiseFxSend: number
    // Filters
    f1Freq: number
    f1Q: number
    f1Type: BiquadFilterType
    f2Freq: number
    f2Q: number
    f2Type: BiquadFilterType
    // FX Rack
    distortionDrive: number
    distortionWet: number
    phaserFreq: number
    phaserDepth: number
    phaserStages: number
    phaserWet: number
    chorusFreq: number
    chorusDelay: number
    chorusDepth: number
    chorusWet: number
    delayTime: string
    delayFeedback: number
    delayWet: number
    reverbDecay: number
    reverbWet: number
    // Complex Mode (Buchla)
    complexMode: boolean
    complexFmIndex: number
    complexAmIndex: number
    complexTimbre: number
    complexOrder: number
    complexHarmonics: number
    complexPitchMod: boolean
    complexAmpMod: boolean
    complexTimbreMod: boolean
    complexModOscRange: 'low' | 'high'
    complexModPitch: number
    complexPrincipalPitch: number
    complexVcaBypass: boolean
    complexPhaseLock: boolean
    complexModOscShape: HarmOscType
}

interface HarmState extends HarmPreset {
    grid: SnakeCell[]
    droneGrid: SnakeCell[]
    currentStep: number
    currentDroneStep: number
    isPlaying: boolean
    setParam: (params: Partial<HarmState>) => void
    setSubParam: (section: 'osc1Env' | 'osc2Env' | 'osc3Env' | 'noiseEnv', params: Partial<ADSRParams>) => void
    setStep: (index: number, step: Partial<SnakeCell>) => void
    togglePlay: () => void
    loadPreset: (preset: HarmPreset) => void
}

const defaultADSR: ADSRParams = { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.5 }

// --- 52 PRESETS GENERATION ---
const BASE_PRESET: HarmPreset = {
    name: 'Init',
    isSequencerEnabled: true, isDroneEnabled: false,
    chordOffsets: [], // no extra notes by default
    osc1Enabled: true, osc2Enabled: false, osc3Enabled: false, noiseEnabled: false,
    f1Enabled: true, f2Enabled: false,
    osc1Type: 'sawtooth', osc1Detune: 0, osc1Env: { ...defaultADSR }, osc1FxSend: 0,
    osc2Type: 'square', osc2Detune: 10, osc2Env: { ...defaultADSR }, osc2FxSend: 0,
    osc3Type: 'triangle', osc3Detune: -10, osc3Env: { ...defaultADSR }, osc3FxSend: 0,
    noiseEnv: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.1 }, noiseFxSend: 0,
    f1Freq: 2000, f1Q: 1, f1Type: 'lowpass',
    f2Freq: 5000, f2Q: 1, f2Type: 'lowpass',
    distortionDrive: 0.4, distortionWet: 0,
    phaserFreq: 0.5, phaserDepth: 0.8, phaserStages: 5, phaserWet: 0,
    chorusFreq: 1.5, chorusDelay: 3.5, chorusDepth: 0.7, chorusWet: 0,
    delayTime: '8n', delayFeedback: 0.5, delayWet: 0,
    reverbDecay: 2, reverbWet: 0,
    complexMode: false, complexFmIndex: 0, complexAmIndex: 0, complexTimbre: 0.5,
    complexOrder: 0.5, complexHarmonics: 0.5,
    complexPitchMod: true, complexAmpMod: false, complexTimbreMod: true,
    complexModOscRange: 'high',
    complexModPitch: 0, complexPrincipalPitch: 0,
    complexVcaBypass: false, complexPhaseLock: false, complexModOscShape: 'triangle'
}

export const HARM_PRESETS: HarmPreset[] = [
    {
        ...BASE_PRESET,
        name: 'Buchla 259 West Coast', category: 'West Coast',
        complexMode: true, complexFmIndex: 0.4, complexAmIndex: 0.2, complexTimbre: 0.6,
        complexOrder: 0.6, complexHarmonics: 0.4,
        complexPitchMod: true, complexAmpMod: false, complexTimbreMod: true,
        complexModOscRange: 'high',
        osc1Type: 'sine' as any, osc2Type: 'sine' as any,
        f1Freq: 4000, f1Q: 1,
        reverbWet: 0.4, delayWet: 0.2,
        osc1Env: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.2 }
    },
    {
        ...BASE_PRESET,
        name: 'Modular Lead', category: 'Lead',
        osc2Enabled: true, osc3Enabled: true,
        osc2Detune: 15, osc3Detune: -15,
        f1Freq: 1200, f1Q: 2,
        osc1FxSend: 0.5, osc2FxSend: 0.5,
        distortionDrive: 0.6, distortionWet: 0.3,
        phaserFreq: 0.2, phaserWet: 0.2,
        chorusWet: 0.4, chorusDepth: 0.8,
        delayWet: 0.2, delayFeedback: 0.3,
        reverbWet: 0.3, reverbDecay: 3
    },
    {
        ...BASE_PRESET,
        name: 'Deep Acid', category: 'Bass',
        osc1Type: 'sawtooth' as any,
        f1Freq: 400, f1Q: 8,
        osc1Env: { ...defaultADSR, decay: 0.1, sustain: 0 },
        osc1FxSend: 0.4,
        distortionDrive: 0.8, distortionWet: 0.5,
        delayWet: 0.1, delayFeedback: 0.6,
        reverbWet: 0.1
    },
    {
        ...BASE_PRESET,
        name: 'Chord Cloud', category: 'Pad',
        chordOffsets: [4, 7, 11], // Maj7
        isDroneEnabled: true,
        osc1Type: 'sine' as any, osc1Enabled: true,
        f1Freq: 800, f1Q: 1,
        reverbWet: 0.6, reverbDecay: 8,
        delayWet: 0.4, delayFeedback: 0.7
    },
    {
        ...BASE_PRESET,
        name: 'Ethereal Drone', category: 'Pad',
        chordOffsets: [7, 12], // Power chord + Octave
        isDroneEnabled: true,
        isSequencerEnabled: false,
        osc1Type: 'sine' as any, noiseEnabled: true, noiseFxSend: 0.5,
        f1Freq: 1200, f1Type: 'lowpass',
        reverbWet: 0.8, reverbDecay: 10
    },
    {
        ...BASE_PRESET,
        name: 'Cosmic Noise', category: 'SFX',
        osc1Enabled: false, noiseEnabled: true,
        f1Freq: 5000, f1Q: 15, f1Type: 'bandpass' as any,
        noiseFxSend: 0.8,
        chorusWet: 0.5, chorusDepth: 0.9,
        delayWet: 0.4, delayFeedback: 0.7, delayTime: '4n',
        reverbWet: 0.6, reverbDecay: 8
    },
    {
        ...BASE_PRESET,
        name: 'Glass Pluck', category: 'Pluck',
        osc1Type: 'sine' as any, osc2Enabled: true, osc2Type: 'triangle' as any,
        osc2Detune: 1200,
        f1Freq: 3000, f1Q: 4,
        osc1Env: { ...defaultADSR, decay: 0.15, sustain: 0 },
        osc1FxSend: 0.4, osc2FxSend: 0.5,
        reverbWet: 0.5, reverbDecay: 1.5
    },
    // Generating variations to reach 50+
    ...Array.from({ length: 10 }, (_, i) => ({
        ...BASE_PRESET,
        name: `Cyber Bass ${i + 1}`,
        category: 'Bass',
        osc1Type: (i % 2 === 0 ? 'sawtooth' : 'square') as any,
        osc2Enabled: true, osc2Detune: (i + 1) * 2,
        f1Freq: 100 + (i * 50),
        f1Q: 1 + (i % 5),
        osc1FxSend: 0.1,
        reverbWet: 0.1
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
        ...BASE_PRESET,
        name: `Ethereal Pad ${i + 1}`,
        category: 'Pad',
        osc1Type: 'sine' as any, osc2Enabled: true, osc2Type: 'triangle' as any, osc3Enabled: true, osc3Type: 'sine' as any,
        osc1Env: { attack: 0.5, decay: 1, sustain: 0.8, release: 2 },
        f1Freq: 800 + (i * 200),
        osc1FxSend: 0.5, osc2FxSend: 0.5,
        chorusWet: 0.3,
        reverbWet: 0.4 + (i * 0.05)
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
        ...BASE_PRESET,
        name: `Pulse Lead ${i + 1}`,
        category: 'Lead',
        osc1Type: 'square' as any, osc2Enabled: true, osc2Type: 'square' as any, osc2Detune: 5 + i,
        f1Freq: 2000 + (i * 300),
        osc1FxSend: 0.4,
        delayWet: 0.2, delayFeedback: 0.4
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
        ...BASE_PRESET,
        name: `Grit Perc ${i + 1}`,
        category: 'Perc',
        noiseEnabled: true, noiseEnv: { attack: 0.001, decay: 0.05 + (i * 0.01), sustain: 0, release: 0.05 },
        f1Freq: 1000 + (i * 500),
        f1Type: 'highpass' as any,
        noiseFxSend: 0.6,
        delayWet: 0.3
    }))
]

// Debug: Check if HARM_PRESETS initialized correctly
if (!HARM_PRESETS || HARM_PRESETS.length === 0) {
    console.error('HARM_PRESETS is empty or undefined!', HARM_PRESETS)
} else {
    console.log('HARM_PRESETS initialized with', HARM_PRESETS.length, 'presets')
}

export const useHarmStore = create<HarmState>((set) => ({
    ...(HARM_PRESETS[0] || BASE_PRESET),
    grid: Array.from({ length: 16 }, (_, i) => ({
        note: 48 + (i % 12),
        velocity: 0.8,
        probability: 1.0,
        active: i % 4 === 0
    })),
    droneGrid: Array.from({ length: 8 }, (_, i) => ({
        note: 36 + (i * 2),
        velocity: 0.6,
        probability: 1.0,
        active: i === 0
    })),
    currentStep: 0,
    currentDroneStep: 0,
    isPlaying: false,
    setParam: (params) => set((state) => ({ ...state, ...params })),
    setSubParam: (section, params) => set((state) => ({
        [section]: { ...state[section as keyof HarmState] as any, ...params }
    })),
    setStep: (index, step) => set((state) => ({
        grid: state.grid.map((s, i) => i === index ? { ...s, ...step } : s)
    })),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    loadPreset: (preset) => set({ ...preset })
}))

export const useLfoStore = create<LfoState>((set) => ({
    enabled: false,
    shape: 'sine',
    frequency: 1,
    depth: 0.5,
    target: 'none',
    currentValue: 0,
    setLfo: (params) => set((state) => ({ ...state, ...params })),
    updateValue: (currentValue) => set({ currentValue })
}))
