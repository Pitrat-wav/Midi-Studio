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
    fx: {
        reverb: { wet: number, decay: number },
        delay: { wet: number, feedback: number, delayTime: string },
        distortion: { wet: number, amount: number }
    }
    initialize: () => Promise<void>
    togglePlay: () => void
    setBpm: (bpm: number) => void
    setSwing: (swing: number) => void
    setCurrentStep: (step: number) => void
    setVolume: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm', value: number) => void
    setMasterVolume: (value: number) => void
    toggleMute: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm') => void
    setFxParam: (effect: 'reverb' | 'delay' | 'distortion', params: Partial<{ wet: number, decay: number, feedback: number, amount: number }>) => void
    panic: () => void
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
    fx: {
        reverb: { wet: 0.3, decay: 2 },
        delay: { wet: 0.2, feedback: 0.3, delayTime: '4n' },
        distortion: { wet: 0.0, amount: 0.4 }
    },

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

            // Global FX Chain
            const masterBus = new Tone.Gain(1)
            const distortion = new Tone.Distortion(get().fx.distortion.amount)
            const delay = new Tone.FeedbackDelay(get().fx.delay.delayTime, get().fx.delay.feedback)
            const reverb = new Tone.Reverb(get().fx.reverb.decay)

            distortion.wet.value = get().fx.distortion.wet
            delay.wet.value = get().fx.delay.wet
            reverb.wet.value = get().fx.reverb.wet

            // Chain: Bus -> Dist -> Delay -> Reverb -> Destination
            masterBus.chain(distortion, delay, reverb, Tone.getDestination())

                // Store nodes on window for global access (or we could add to state)
                ; (window as any).masterFX = { distortion, delay, reverb, masterBus }

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

            // Connect to Master Bus instead of Destination
            // Note: We need to modify the Logic classes or reconnect them here if they use .toDestination()
            // Fortunately, we can just connect their outputs to masterBus
            if ((bass as any).outputGain) (bass as any).outputGain.disconnect(Tone.getDestination()).connect(masterBus)
            if ((lead as any).outputGain) (lead as any).outputGain.disconnect(Tone.getDestination()).connect(masterBus)
            if ((drums as any).output) (drums as any).output.disconnect(Tone.getDestination()).connect(masterBus)
            if (pads?.synth) pads.synth.disconnect(Tone.getDestination()).connect(masterBus)
            if ((harm as any).output) (harm as any).output.disconnect(Tone.getDestination()).connect(masterBus)

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
            const beep = new Tone.Oscillator(440, "sine").connect(masterBus)
            beep.start().stop("+0.05")

            // Generate initial Bass Pattern
            const bassStore = useBassStore.getState()
            if (!bassStore.pattern || bassStore.pattern.length === 0) {
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
            console.log('Audio init success with Global FX')
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
        if (mutes[channel]) return
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

    setMasterVolume: (value) => {
        const db = Tone.gainToDb(value)
        Tone.getDestination().volume.value = db
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

    setFxParam: (effect, params) => {
        set((state) => ({
            fx: {
                ...state.fx,
                [effect]: { ...state.fx[effect], ...params }
            }
        }))

        const nodes = (window as any).masterFX
        if (!nodes) return

        if (effect === 'reverb') {
            if (params.wet !== undefined) nodes.reverb.wet.value = params.wet
            if (params.decay !== undefined) nodes.reverb.decay = params.decay
        } else if (effect === 'delay') {
            if (params.wet !== undefined) nodes.delay.wet.value = params.wet
            if (params.feedback !== undefined) nodes.delay.feedback.value = params.feedback
        } else if (effect === 'distortion') {
            if (params.wet !== undefined) nodes.distortion.wet.value = params.wet
            if (params.amount !== undefined) nodes.distortion.distortion = params.amount
        }
    },

    panic: () => {
        try {
            Tone.Transport.stop()
            Tone.Transport.cancel()

            const { bassSynth, fmBass, leadSynth, drumMachine, padSynth, harmSynth } = get()

            if (bassSynth) bassSynth.setVolume(-Infinity)
            if (leadSynth) leadSynth.setVolume(-Infinity)
            if (drumMachine) drumMachine.setVolume(-Infinity)
            if (padSynth?.synth?.volume) padSynth.synth.volume.value = -Infinity
            if (harmSynth) harmSynth.setVolume(-Infinity)

            Tone.Destination.volume.rampTo(-Infinity, 0.05)

            set({ isPlaying: false, currentStep: 0 })

            setTimeout(() => {
                Tone.Destination.volume.value = 0
            }, 100)

            console.log('PANIC: Audio engine forced to stop')
        } catch (e) {
            console.error('Panic failed', e)
        }
    },

    dispose: () => {
        const { bassSynth, fmBass, leadSynth, drumMachine, padSynth, harmSynth } = get()
        Tone.Transport.stop()
        Tone.Transport.cancel()
        if (bassSynth && 'dispose' in bassSynth) (bassSynth as any).dispose()
        if (fmBass && 'dispose' in fmBass) (fmBass as any).dispose()

        const nodes = (window as any).masterFX
        if (nodes) {
            nodes.distortion.dispose()
            nodes.delay.dispose()
            nodes.reverb.dispose()
            nodes.masterBus.dispose()
        }

        sessionStorage.removeItem('midi_app_has_started')
        set({ isInitialized: false, hasStarted: false, isPlaying: false, bassSynth: null, fmBass: null, leadSynth: null, drumMachine: null, padSynth: null, harmSynth: null })
    }
}))
