import { useAudioStore } from '../store/audioStore'
import { useArrangementStore } from '../store/arrangementStore'
import { useSessionStore } from '../store/sessionStore'
import { 
    useBassStore, useDrumStore, useHarmonyStore, 
    usePadStore, useSequencerStore, useHarmStore, 
    useSamplerStore, useLfoStore 
} from '../store/instrumentStore'
import { useVisualStore } from '../store/visualStore'
import * as Tone from 'tone'

export interface ProjectState {
    version: string
    timestamp: number
    audio: {
        bpm: number
        swing: number
        volumes: any
        mutes: any
        solos: any
        fx: any
        masterEQ: any
    }
    instruments: {
        bass: any
        drums: any
        harmony: any
        pads: any
        sequencer: any
        harm: any
        sampler: any
        lfo: any
    }
    arrangement: any
    session: any
    visual: {
        preset: number
        theme: string
    }
}

export const ProjectManager = {
    getProjectState: (): ProjectState => {
        const audio = useAudioStore.getState()
        
        // Filter Audio State (Exclude Tone.js nodes)
        const audioState = {
            bpm: audio.bpm,
            swing: audio.swing,
            volumes: audio.volumes,
            mutes: audio.mutes,
            solos: audio.solos,
            fx: audio.fx,
            masterEQ: audio.masterEQ
        }

        // Gather Instrument States (Most are JSON safe params)
        const instruments = {
            bass: useBassStore.getState(),
            drums: useDrumStore.getState(),
            harmony: useHarmonyStore.getState(),
            pads: usePadStore.getState(),
            sequencer: useSequencerStore.getState(),
            harm: useHarmStore.getState(),
            sampler: useSamplerStore.getState(),
            lfo: useLfoStore.getState()
        }

        // Arrangement (Already persisted, so likely safe)
        const arrangement = useArrangementStore.getState()

        // Session (Clips)
        const session = useSessionStore.getState()

        // Visual
        const visual = useVisualStore.getState()

        return {
            version: '1.0',
            timestamp: Date.now(),
            audio: audioState,
            instruments: cleanStore(instruments),
            arrangement: cleanStore(arrangement),
            session: cleanStore(session),
            visual: {
                preset: visual.backgroundPreset,
                theme: visual.aestheticTheme
            }
        }
    },

    loadProjectState: (state: ProjectState) => {
        if (!state) return

        console.log('Loading Project:', state)

        // 1. Audio Global
        if (state.audio) {
            // Update Store State
            useAudioStore.setState({
                bpm: state.audio.bpm,
                swing: state.audio.swing,
                volumes: state.audio.volumes,
                mutes: state.audio.mutes,
                solos: state.audio.solos,
                fx: state.audio.fx,
                masterEQ: state.audio.masterEQ
            })

            // Sync Tone.js Nodes
            const audioStore = useAudioStore.getState()
            
            // BPM & Swing
            audioStore.setBpm(state.audio.bpm)
            audioStore.setSwing(state.audio.swing)

            // Volumes & Mutes
            const channels = audioStore.channels
            if (channels) {
                Object.keys(state.audio.volumes).forEach((k: any) => {
                    if (channels[k]) {
                        // Use rampTo for smooth transition or direct set
                        channels[k].volume.value = Tone.gainToDb(state.audio.volumes[k])
                    }
                })
                Object.keys(state.audio.mutes).forEach((k: any) => {
                    if (channels[k]) {
                        channels[k].mute = state.audio.mutes[k]
                    }
                })
                Object.keys(state.audio.solos).forEach((k: any) => {
                     if (channels[k]) {
                        channels[k].solo = state.audio.solos[k]
                    }
                })
            }

            // FX
            audioStore.setFxParam('reverb', state.audio.fx.reverb)
            audioStore.setFxParam('delay', state.audio.fx.delay)
            audioStore.setFxParam('distortion', state.audio.fx.distortion)
            
            // Master EQ
            if (state.audio.masterEQ) {
                audioStore.setMasterEQ('low', state.audio.masterEQ.low)
                audioStore.setMasterEQ('lowMid', state.audio.masterEQ.lowMid)
                audioStore.setMasterEQ('highMid', state.audio.masterEQ.highMid)
                audioStore.setMasterEQ('high', state.audio.masterEQ.high)
            }
        }

        // 2. Instruments
        if (state.instruments) {
            if (state.instruments.bass) useBassStore.setState(state.instruments.bass)
            if (state.instruments.drums) useDrumStore.setState(state.instruments.drums)
            if (state.instruments.harmony) useHarmonyStore.setState(state.instruments.harmony)
            if (state.instruments.pads) usePadStore.setState(state.instruments.pads)
            if (state.instruments.sequencer) useSequencerStore.setState(state.instruments.sequencer)
            if (state.instruments.harm) useHarmStore.setState(state.instruments.harm)
            if (state.instruments.sampler) useSamplerStore.setState(state.instruments.sampler)
            if (state.instruments.lfo) useLfoStore.setState(state.instruments.lfo)
        }

        // 3. Arrangement
        if (state.arrangement) {
            useArrangementStore.setState({
                clips: state.arrangement.clips,
                markers: state.arrangement.markers,
                automations: state.arrangement.automations,
                loopStart: state.arrangement.loopStart,
                loopEnd: state.arrangement.loopEnd,
                isLooping: state.arrangement.isLooping,
                tracks: state.arrangement.tracks
            })
        }

        // 4. Session
        if (state.session) {
            useSessionStore.setState({
                clips: state.session.clips,
                // We don't restore active/pending clips usually, just the grid
            })
        }

        // 5. Visual
        if (state.visual) {
            useVisualStore.getState().setBackgroundPreset(state.visual.preset)
        }
    }
}

// Helper to remove functions and non-serializable objects (shallow for now, or JSON cycle safe)
function cleanStore(storeState: any) {
    return JSON.parse(JSON.stringify(storeState, (key, value) => {
        if (typeof value === 'function') return undefined
        if (key.startsWith('_')) return undefined // convention for private
        return value
    }))
}
