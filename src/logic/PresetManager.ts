import { useAudioStore } from '../store/audioStore'
import {
    useDrumStore,
    useBassStore,
    useSequencerStore,
    useHarmStore,
    usePadStore,
    useHarmonyStore,
    Stage,
    BassInstrument,
    HarmPreset,
    ScaleType
} from '../store/instrumentStore'
import { ChordType } from './Scaler'

export interface AudioSnapshot {
    bpm: number
    swing: number
    volumes: {
        drums: number
        bass: number
        lead: number
        pads: number
        harm: number
        sampler: number
        mic: number
    }
    mutes: {
        drums: boolean
        bass: boolean
        lead: boolean
        pads: boolean
        harm: boolean
        sampler: boolean
        mic: boolean
    }
    fx: {
        reverb: { wet: number; decay: number }
        delay: { wet: number; feedback: number; delayTime: string }
        distortion: { wet: number; amount: number }
    }
}

export interface DrumParams {
    steps: number
    pulses: number
    rotate: number
    decay: number
    pitch: number
    volume: number
    muted: boolean
}

export interface DrumSnapshot {
    kick: DrumParams
    snare: DrumParams
    hihat: DrumParams
    hihatOpen: DrumParams
    clap: DrumParams
    ride: DrumParams
    kit: '808' | '909'
}

export interface SequencerSnapshot {
    stages: Stage[]
    smartChordEnabled: boolean
    smartChordType: ChordType
    turingProbability: number
    turingIsLocked: boolean
    turingRegister: number
    turingBits: number
}

export interface GlobalSnapshot {
    audio: AudioSnapshot
    drums: DrumSnapshot
    bass: {
        activeInstrument: BassInstrument
        type: number
        seedA: number
        seedB: number
        morph: number
        density: number
        cutoff: number
        resonance: number
        slide: number
        distortion: number
    }
    sequencer: SequencerSnapshot
    harm: {
        presetData: HarmPreset
    }
    pads: {
        active: boolean
        brightness: number
        complexity: number
    }
    harmony: {
        root: string
        scale: ScaleType
    }
}

export class PresetManager {
    static capture(): GlobalSnapshot {
        const audio = useAudioStore.getState()
        const drums = useDrumStore.getState()
        const bass = useBassStore.getState()
        const seq = useSequencerStore.getState()
        const harm = useHarmStore.getState()
        const pads = usePadStore.getState()
        const harmony = useHarmonyStore.getState()

        // Filter out functions and non-serializable parts from harm
        const {
            grid, droneGrid, setParam, setSubParam, setStep, togglePlay, loadPreset,
            isPlaying, currentStep, currentDroneStep,
            ...harmData
        } = harm

        return {
            audio: {
                bpm: audio.bpm,
                swing: audio.swing,
                volumes: { ...audio.volumes },
                mutes: { ...audio.mutes },
                fx: JSON.parse(JSON.stringify(audio.fx))
            },
            drums: {
                kick: { ...drums.kick },
                snare: { ...drums.snare },
                hihat: { ...drums.hihat },
                hihatOpen: { ...drums.hihatOpen },
                clap: { ...drums.clap },
                ride: { ...drums.ride },
                kit: drums.kit
            },
            bass: {
                activeInstrument: bass.activeInstrument,
                type: bass.type,
                seedA: bass.seedA,
                seedB: bass.seedB,
                morph: bass.morph,
                density: bass.density,
                cutoff: bass.cutoff,
                resonance: bass.resonance,
                slide: bass.slide,
                distortion: bass.distortion
            },
            sequencer: {
                stages: JSON.parse(JSON.stringify(seq.stages)),
                smartChordEnabled: seq.smartChordEnabled,
                smartChordType: seq.smartChordType,
                turingProbability: seq.turingProbability,
                turingIsLocked: seq.turingIsLocked,
                turingRegister: seq.turingRegister,
                turingBits: seq.turingBits
            },
            harm: {
                presetData: JSON.parse(JSON.stringify(harmData)) as HarmPreset
            },
            pads: {
                active: pads.active,
                brightness: pads.brightness,
                complexity: pads.complexity
            },
            harmony: {
                root: harmony.root,
                scale: harmony.scale
            }
        }
    }

    static apply(snap: GlobalSnapshot) {
        // Audio
        const audio = useAudioStore.getState()
        audio.setBpm(snap.audio.bpm)
        audio.setSwing(snap.audio.swing)
        Object.entries(snap.audio.volumes).forEach(([ch, v]) =>
            audio.setVolume(ch as any, v)
        )
        Object.entries(snap.audio.fx).forEach(([eff, p]) =>
            audio.setFxParam(eff as any, p)
        )

        // Drums
        const drums = useDrumStore.getState()
        drums.setKit(snap.drums.kit)
        drums.setParams('kick', snap.drums.kick)
        drums.setParams('snare', snap.drums.snare)
        drums.setParams('hihat', snap.drums.hihat)
        drums.setParams('hihatOpen', snap.drums.hihatOpen)
        drums.setParams('clap', snap.drums.clap)
        drums.setParams('ride', snap.drums.ride)

        // Bass
        const bass = useBassStore.getState()
        bass.setParams({
            activeInstrument: snap.bass.activeInstrument,
            type: snap.bass.type,
            seedA: snap.bass.seedA,
            seedB: snap.bass.seedB,
            morph: snap.bass.morph,
            density: snap.bass.density,
            cutoff: snap.bass.cutoff,
            resonance: snap.bass.resonance,
            slide: snap.bass.slide,
            distortion: snap.bass.distortion
        })

        // Sequencer
        const seq = useSequencerStore.getState()
        seq.setStages(snap.sequencer.stages)
        seq.setSmartChordParam({
            smartChordEnabled: snap.sequencer.smartChordEnabled,
            smartChordType: snap.sequencer.smartChordType
        })
        seq.setTuringParam({
            turingProbability: snap.sequencer.turingProbability,
            turingIsLocked: snap.sequencer.turingIsLocked,
            turingRegister: snap.sequencer.turingRegister,
            turingBits: snap.sequencer.turingBits
        })

        // Harm
        const harm = useHarmStore.getState()
        harm.setParam(snap.harm.presetData)

        // Pads
        const pads = usePadStore.getState()
        pads.setParams(snap.pads)

        // Harmony
        const harmony = useHarmonyStore.getState()
        harmony.setRoot(snap.harmony.root)
        harmony.setScale(snap.harmony.scale)

        console.log('✅ Global Snapshot Applied')
    }
}
