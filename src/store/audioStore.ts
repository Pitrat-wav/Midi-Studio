import { create } from 'zustand'
import * as Tone from 'tone'
import { AcidSynth } from '../logic/AcidSynth'
import { DrumMachine } from '../logic/DrumMachine'
import { PadSynth } from '../logic/PadSynth'
import { FMBass } from '../logic/FMBass'
import { HarmSynth } from '../logic/HarmSynth'
import { generateBassPattern } from '../logic/StingGenerator'
import { useBassStore, useDrumStore } from './instrumentStore'

export interface AudioState {
    isInitializing: boolean
    isInitialized: boolean
    hasStarted: boolean
    isPlaying: boolean
    bpm: number
    swing: number
    currentStep: number
    bassSynth: AcidSynth | null
    fmBass: FMBass | null
    leadSynth: AcidSynth | null
    drumMachine: DrumMachine | null
    padSynth: PadSynth | null
    harmSynth: HarmSynth | null
    volumes: { drums: number, bass: number, lead: number, pads: number, harm: number }
    mutes: { drums: boolean, bass: boolean, lead: boolean, pads: boolean, harm: boolean }
    initialize: () => Promise<void>
    togglePlay: () => void
    setBpm: (bpm: number) => void
    setSwing: (swing: number) => void
    setCurrentStep: (step: number) => void
    setVolume: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm', value: number) => void
    toggleMute: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm') => void
    dispose: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
    isInitializing: false,
    isInitialized: false,
    hasStarted: sessionStorage.getItem('midi_app_has_started') === 'true',
    isPlaying: false,
    bpm: 128,
    swing: 0,
    currentStep: 0,
    bassSynth: null,
    fmBass: null,
    leadSynth: null,
    drumMachine: null,
    padSynth: null,
    harmSynth: null,
    volumes: { drums: 0.8, bass: 0.8, lead: 0.6, pads: 0.5, harm: 0.7 },
    mutes: { drums: false, bass: false, lead: false, pads: false, harm: false },

    initialize: async () => {
        if (get().isInitialized || get().isInitializing) return
        set({ isInitializing: true })

        try {
            await Tone.start()

            // iOS Silent Switch Workaround
            const silentAudio = new Audio()
            silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/'
            silentAudio.play().catch(e => console.warn('Silent play failed', e))

            if (Tone.context.state !== 'running') {
                await Tone.context.resume()
            }

            const bass = new AcidSynth()
            bass.init()
            const fm = new FMBass()
            fm.init()
            const lead = new AcidSynth()
            lead.init()
            const drums = new DrumMachine()
            const pads = new PadSynth()
            const harm = new HarmSynth()
            harm.init()

            // Apply initial volumes defensively
            const currentVols = get().volumes
            bass?.setVolume(Tone.gainToDb(currentVols.bass))
            lead?.setVolume(Tone.gainToDb(currentVols.lead))
            drums?.setVolume(Tone.gainToDb(currentVols.drums))
            if (pads?.synth?.volume) {
                pads.synth.volume.value = Tone.gainToDb(currentVols.pads)
            }
            harm?.setVolume(Tone.gainToDb(currentVols.harm))

            Tone.Transport.bpm.value = get().bpm
            Tone.Transport.swing = get().swing
            Tone.Destination.volume.value = 0
            Tone.Transport.start()

            // Debug Beep
            const beep = new Tone.Oscillator(440, "sine").toDestination()
            beep.start().stop("+0.05")

            // Generate initial Bass Pattern
            const bassStore = useBassStore.getState()
            if (bassStore.pattern.length === 0) {
                const initialPattern = generateBassPattern(bassStore.density, bassStore.type, 'C', 'minor', 2, bassStore.seedA)
                bassStore.setPattern(initialPattern)
            }

            set({
                isInitialized: true,
                isInitializing: false,
                isPlaying: true,
                bassSynth: bass,
                fmBass: fm,
                leadSynth: lead,
                drumMachine: drums,
                padSynth: pads,
                harmSynth: harm
            })

            // Auto-start Demo: Drums + Bass
            useDrumStore.getState().togglePlay()
            useBassStore.getState().togglePlay()

            sessionStorage.setItem('midi_app_has_started', 'true')
            set({ hasStarted: true })
            console.log('Audio init success')
        } catch (e) {
            set({ isInitializing: false })
            console.error('Audio initialization failed', e)
        }
    },

    togglePlay: () => {
        if (!get().isInitialized) return
        try {
            if (get().isPlaying) {
                Tone.Transport.stop()
                set({ isPlaying: false })
            } else {
                Tone.Transport.start()
                set({ isPlaying: true })
            }
        } catch (e) {
            console.error('Toggle play failed', e)
        }
    },

    setVolume: (channel, value) => {
        set((state) => ({ volumes: { ...state.volumes, [channel]: value } }))
        const { bassSynth, leadSynth, drumMachine, padSynth, harmSynth, mutes } = get()
        if (mutes[channel]) return // Don't update volume if muted (or let it update the state but don't apply to synth)
        const db = Tone.gainToDb(value)
        try {
            if (channel === 'bass' && bassSynth) bassSynth.setVolume(db)
            if (channel === 'lead' && leadSynth) leadSynth.setVolume(db)
            if (channel === 'drums' && drumMachine) drumMachine.setVolume(db)
            if (channel === 'pads' && padSynth?.synth?.volume) padSynth.synth.volume.value = db
            if (channel === 'harm' && harmSynth) harmSynth.setVolume(db)
        } catch (e) {
            console.warn(`Volume update failed for ${channel}`, e)
        }
    },

    toggleMute: (channel) => {
        const newMutes = { ...get().mutes, [channel]: !get().mutes[channel] }
        set({ mutes: newMutes })
        const { bassSynth, leadSynth, drumMachine, padSynth, harmSynth, volumes } = get()
        const isMuted = newMutes[channel]
        const db = isMuted ? -Infinity : Tone.gainToDb(volumes[channel])

        try {
            if (channel === 'bass' && bassSynth) bassSynth.setVolume(db)
            if (channel === 'lead' && leadSynth) leadSynth.setVolume(db)
            if (channel === 'drums' && drumMachine) drumMachine.setVolume(db)
            if (channel === 'pads' && padSynth?.synth?.volume) padSynth.synth.volume.value = db
            if (channel === 'harm' && harmSynth) harmSynth.setVolume(db)
        } catch (e) {
            console.warn(`Mute update failed for ${channel}`, e)
        }
    },

    setBpm: (bpm: number) => {
        if (Tone.Transport.bpm) Tone.Transport.bpm.value = bpm
        set({ bpm })
    },

    setSwing: (swing: number) => {
        Tone.Transport.swing = swing
        set({ swing })
    },

    setCurrentStep: (currentStep: number) => set({ currentStep }),

    dispose: () => {
        const { bassSynth, fmBass, leadSynth, drumMachine, padSynth, harmSynth } = get()
        Tone.Transport.stop()
        Tone.Transport.cancel()
        // Dispose instruments if they have a dispose method
        if (bassSynth && 'dispose' in bassSynth) (bassSynth as any).dispose()
        if (fmBass && 'dispose' in fmBass) (fmBass as any).dispose()
        // ... and so on for others if implemented
        sessionStorage.removeItem('midi_app_has_started')
        set({ isInitialized: false, hasStarted: false, isPlaying: false, bassSynth: null, fmBass: null, leadSynth: null, drumMachine: null, padSynth: null, harmSynth: null })
    }
}))
