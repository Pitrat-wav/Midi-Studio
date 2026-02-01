import { create } from 'zustand'
import * as Tone from 'tone'
import { AcidSynth } from '../logic/AcidSynth'
import { DrumMachine } from '../logic/DrumMachine'
import { PadSynth } from '../logic/PadSynth'
import { FMBass } from '../logic/FMBass'
import { HarmSynth } from '../logic/HarmSynth'
import { SamplerInstrument } from '../logic/SamplerInstrument'
import { generateBassPattern } from '../logic/StingGenerator'
import { useBassStore, useDrumStore, useSamplerStore, usePadStore, useSequencerStore, useHarmStore } from './instrumentStore'
import sampleManifest from '../data/sampleManifest.json'
import { SNAPSHOT_LIBRARY } from '../data/snapshotLibrary'

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
    samplerInstrument: SamplerInstrument | null
    volumes: { drums: number, bass: number, lead: number, pads: number, harm: number, sampler: number, mic: number }
    mutes: { drums: boolean, bass: boolean, lead: boolean, pads: boolean, harm: boolean, sampler: boolean, mic: boolean }
    solos: { drums: boolean, bass: boolean, lead: boolean, pads: boolean, harm: boolean, sampler: boolean, mic: boolean }
    fx: {
        reverb: { wet: number, decay: number },
        delay: { wet: number, feedback: number, delayTime: string },
        distortion: { wet: number, amount: number }
    }
    loadingStep: string
    mic: Tone.UserMedia | null
    micGate: Tone.Gate | null
    micGain: Tone.Volume | null
    isMicOpen: boolean
    isMicMonitor: boolean
    initialize: () => Promise<void>
    togglePlay: () => void
    toggleMic: () => Promise<void>
    setMicVolume: (value: number) => void
    setMicMonitor: (enabled: boolean) => void
    setVolume: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm' | 'mic' | 'sampler', value: number) => void
    setMasterVolume: (value: number) => void
    toggleMute: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm' | 'mic' | 'sampler') => void
    toggleSolo: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm' | 'mic' | 'sampler') => void
    triggerPerformanceFx: (effect: 'tapeStop' | 'washOut' | 'stutter' | 'noise' | 'glitch' | 'riser', active: boolean) => void
    setBpm: (bpm: number) => void
    setSwing: (swing: number) => void
    setCurrentStep: (currentStep: number) => void
    setFxParam: (effect: 'reverb' | 'delay' | 'distortion', params: Partial<{ wet: number, decay: number, feedback: number, amount: number, delayTime: string }>) => void
    panic: () => void
    dispose: () => void
    masterEQ: { low: number, lowMid: number, highMid: number, high: number }
    setMasterEQ: (band: 'low' | 'lowMid' | 'highMid' | 'high', value: number) => void
    recalculateRouting: (edges: any[]) => void
    // Snapshot Grid
    activeSnapshots: Record<string, number>
    queuedSnapshots: Record<string, number | null>
    triggerSnapshot: (instId: string, index: number) => void
    commitSnapshots: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
    isInitializing: false,
    isInitialized: false,
    hasStarted: false,
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
    samplerInstrument: null,
    volumes: { drums: 0.8, bass: 0.8, lead: 0.8, pads: 0.8, harm: 0.8, sampler: 0.8, mic: 1 },
    mutes: { drums: false, bass: false, lead: false, pads: false, harm: false, sampler: false, mic: false },
    solos: { drums: false, bass: false, lead: false, pads: false, harm: false, sampler: false, mic: false },
    fx: {
        reverb: { wet: 0.3, decay: 1.5 },
        delay: { wet: 0.3, feedback: 0.3, delayTime: "8n" },
        distortion: { wet: 0, amount: 0.4 }
    },
    loadingStep: '',
    mic: null,
    micGate: null,
    micGain: null,
    isMicOpen: false,
    isMicMonitor: false,

    activeSnapshots: { drums: 0, bass: 0, lead: 0, pads: 0, sampler: 0, harm: 0 },
    queuedSnapshots: { drums: null, bass: null, lead: null, pads: null, sampler: null, harm: null },

    masterEQ: { low: 0, lowMid: 0, highMid: 0, high: 0 },

    initialize: async () => {
        if (get().isInitialized || get().isInitializing) return
        set({ isInitializing: true, loadingStep: 'Starting Audio Context...' })

        try {
            console.log('[Audio] Step 1: Tone.start()')
            await Tone.start()

            // iOS Silent Switch Workaround
            set({ loadingStep: 'Unlocking Audio...' })
            const silentAudio = new Audio()
            silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/'
            silentAudio.play().catch(e => console.warn('Silent play failed', e))

            if (Tone.context.state !== 'running') {
                console.log('[Audio] Step 2: Resuming Context')
                await Tone.context.resume()
            }

            console.log('[Audio] Step 3: Global FX')
            set({ loadingStep: 'Initializing Effects Chain...' })

            // Global FX Chain
            const masterBus = new Tone.Gain(1)

            // 4-Band EQ Chain
            // Low Shelf (< 150Hz)
            const eqLow = new Tone.Filter(150, "lowshelf")
            // Low Mid Peaking (400Hz)
            const eqLowMid = new Tone.Filter(400, "peaking")
            eqLowMid.Q.value = 1
            // High Mid Peaking (2.5kHz)
            const eqHighMid = new Tone.Filter(2500, "peaking")
            eqHighMid.Q.value = 1
            // High Shelf (> 8kHz)
            const eqHigh = new Tone.Filter(8000, "highshelf")

            const distortion = new Tone.Distortion(get().fx.distortion.amount)
            const delay = new Tone.FeedbackDelay(get().fx.delay.delayTime, get().fx.delay.feedback)

            // USE LIGHTWEIGHT REVERB FOR NOW
            const reverb = new Tone.Reverb({ decay: 1.5, preDelay: 0.01 })
            await reverb.ready

            console.log('[Audio] Step 4: FX Params')
            // Apply initial EQ gains
            eqLow.gain.value = get().masterEQ.low
            eqLowMid.gain.value = get().masterEQ.lowMid
            eqHighMid.gain.value = get().masterEQ.highMid
            eqHigh.gain.value = get().masterEQ.high

            distortion.wet.value = get().fx.distortion.wet
            delay.wet.value = get().fx.delay.wet
            reverb.wet.value = get().fx.reverb.wet

            // Chain: Bus -> EQ -> Dist -> Delay -> Reverb -> Destination
            masterBus.chain(eqLow, eqLowMid, eqHighMid, eqHigh, distortion, delay, reverb, Tone.getDestination())

            // Initialize Microphone Chain
            // Mic -> Gate (remove background noise) -> Compressor (even levels) -> Gain -> MasterBus
            const mic = new Tone.UserMedia()
            const micGate = new Tone.Gate(-50) // Open only when louder than -50db
            const micComp = new Tone.Compressor(-20, 3)
            const micGain = new Tone.Volume(0)

            mic.chain(micGate, micComp, micGain)
            micGain.connect(masterBus)

                // Store nodes on window for global access
                ; (window as any).masterFX = {
                    distortion, delay, reverb, masterBus, mic, micGate, micGain,
                    eqLow, eqLowMid, eqHighMid, eqHigh
                }

            console.log('[Audio] Step 5: Instruments')
            // ... (Rest of init)
            set({ loadingStep: 'Constructing Synths (Bass)...' })
            await new Promise(r => setTimeout(r, 10))
            const bass = new AcidSynth()
            bass.init()

            set({ loadingStep: 'Constructing Synths (FM)...' })
            await new Promise(r => setTimeout(r, 10))
            const fm = new FMBass()
            fm.init()

            set({ loadingStep: 'Constructing Synths (Lead)...' })
            await new Promise(r => setTimeout(r, 10))
            const lead = new AcidSynth()
            lead.init()

            set({ loadingStep: 'Constructing Synths (Drums)...' })
            await new Promise(r => setTimeout(r, 10))
            const drums = new DrumMachine()

            set({ loadingStep: 'Constructing Synths (Pads)...' })
            await new Promise(r => setTimeout(r, 10))
            const pads = new PadSynth()

            set({ loadingStep: 'Constructing Synths (Harm)...' })
            await new Promise(r => setTimeout(r, 10))
            const harm = new HarmSynth()
            harm.init()

            set({ loadingStep: 'Constructing Synths (Sampler)...' })
            await new Promise(r => setTimeout(r, 10))
            const sampler = new SamplerInstrument()
            await sampler.load(useSamplerStore.getState().url)

            set({ loadingStep: 'Connecting Modules...' })
            console.log('[Audio] Step 6: Connecting Modules')

            // Bass & Lead
            if ((bass as any).outputGain) (bass as any).outputGain.connect(masterBus)
            if ((lead as any).outputGain) (lead as any).outputGain.connect(masterBus)

            // Drums
            if ((drums as any).output) (drums as any).output.connect(masterBus)

            // Pads
            if (pads?.synth) pads.synth.connect(masterBus)

            // Harm
            if ((harm as any).outputGain) (harm as any).outputGain.connect(masterBus)
            else if ((harm as any).output) (harm as any).output.connect(masterBus)

            // Sampler
            sampler.volume.connect(masterBus)


            // Apply initial volumes
            const currentVols = get().volumes
            bass?.setVolume(Tone.gainToDb(currentVols.bass))
            lead?.setVolume(Tone.gainToDb(currentVols.lead))
            drums?.setVolume(Tone.gainToDb(currentVols.drums))
            if (pads?.synth?.volume) pads.synth.volume.value = Tone.gainToDb(currentVols.pads)
            harm?.setVolume(Tone.gainToDb(currentVols.harm))
            sampler.setVolume(Tone.gainToDb(currentVols.sampler))

            Tone.Transport.bpm.value = get().bpm
            Tone.Transport.swing = get().swing
            Tone.Destination.volume.value = 0
            Tone.Transport.start()

            set({ loadingStep: 'Warmup...' })
            const beep = new Tone.Oscillator(440, "sine").connect(masterBus)
            beep.start().stop("+0.05")

            const bassStore = useBassStore.getState()
            if (!bassStore.pattern || bassStore.pattern.length === 0) {
                const initialPattern = generateBassPattern(bassStore.density, bassStore.type, 'C', 'minor', 2, bassStore.seedA)
                bassStore.setPattern(initialPattern)
            }

            set({
                isInitialized: true,
                isInitializing: false,
                loadingStep: 'Ready',
                isPlaying: true,
                bassSynth: bass,
                fmBass: fm,
                leadSynth: lead,
                drumMachine: drums,
                padSynth: pads,
                harmSynth: harm,
                samplerInstrument: sampler,
                mic: mic,
                micGate: micGate,
                micGain: micGain
            })

            useDrumStore.getState().togglePlay()
            useBassStore.getState().togglePlay()

            // Sampler Sync logic
            useSamplerStore.subscribe((state) => {
                const inst = get().samplerInstrument
                if (inst) {
                    inst.setGranularParams({
                        grainSize: state.grainSize,
                        overlap: state.overlap,
                        detune: state.detune
                    })
                    inst.setPlaybackRate(state.playbackRate)
                    // URL loading logic
                    if (inst.loaded && state.url !== (inst.player.buffer as any)._url && !state.url.includes('blob')) {
                        // This is a bit hacky to check if URL changed, 
                        // but GrainPlayer.buffer is a ToneAudioBuffer
                        // For now we'll rely on the fact that if user changes sample, we should load
                        // A better way would be a dedicated action, but subscription is safer for UI sync.
                    }
                }
            })

            sessionStorage.setItem('midi_app_has_started', 'true')
            set({ hasStarted: true })
            console.log('Audio init success with Global FX & Mic')
        } catch (e) {
            set({ isInitializing: false, loadingStep: `Error: ${e}` })
            console.error('Audio initialization failed', e)
        }
    },





    setMasterEQ: (band, value) => {
        set(state => ({
            masterEQ: { ...state.masterEQ, [band]: value }
        }))
        const nodes = (window as any).masterFX
        if (nodes) {
            if (band === 'low') nodes.eqLow.gain.rampTo(value, 0.1)
            if (band === 'lowMid') nodes.eqLowMid.gain.rampTo(value, 0.1)
            if (band === 'highMid') nodes.eqHighMid.gain.rampTo(value, 0.1)
            if (band === 'high') nodes.eqHigh.gain.rampTo(value, 0.1)
        }
    },

    togglePlay: () => {
        const { isPlaying } = get()
        if (isPlaying) {
            Tone.Transport.stop()
            set({ isPlaying: false })
        } else {
            Tone.Transport.start()
            set({ isPlaying: true })
        }
    },

    toggleMic: async () => {
        const { mic, isMicOpen, isMicMonitor } = get()
        if (!mic) return

        if (isMicOpen) {
            mic.close()
            set({ isMicOpen: false })
        } else {
            try {
                await mic.open()
                mic.mute = !isMicMonitor
                set({ isMicOpen: true })
            } catch (e) {
                console.error('Failed to open mic', e)
                alert('Microphone access denied or error.')
            }
        }
    },

    setMicVolume: (value) => {
        set((state) => ({ volumes: { ...state.volumes, mic: value } }))
        const { micGain } = get()
        if (micGain) micGain.volume.value = Tone.gainToDb(value)
    },

    setMicMonitor: (enabled) => {
        set({ isMicMonitor: enabled })
        const { mic, isMicOpen } = get()
        if (mic && isMicOpen) {
            mic.mute = !enabled
        }
    },

    setVolume: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm' | 'mic' | 'sampler', value: number) => {
        set((state) => ({ volumes: { ...state.volumes, [channel]: value } }))
        const { bassSynth, leadSynth, drumMachine, padSynth, harmSynth, samplerInstrument, micGain, mutes } = get()
        if (mutes[channel as keyof typeof mutes]) return
        const db = Tone.gainToDb(value)
        try {
            if (channel === 'bass' && bassSynth) bassSynth.setVolume(db)
            if (channel === 'lead' && leadSynth) leadSynth.setVolume(db)
            if (channel === 'drums' && drumMachine) drumMachine.setVolume(db)
            if (channel === 'pads' && padSynth?.synth?.volume) padSynth.synth.volume.value = db
            if (channel === 'harm' && harmSynth) harmSynth.setVolume(db)
            if (channel === 'sampler' && samplerInstrument) samplerInstrument.setVolume(db)
            if (channel === 'mic' && micGain) micGain.volume.value = db
        } catch (e) {
            console.warn(`Volume update failed for ${channel}`, e)
        }
    },

    setMasterVolume: (value: number) => {
        const db = Tone.gainToDb(value)
        Tone.getDestination().volume.value = db
    },

    toggleMute: (channel: 'drums' | 'bass' | 'lead' | 'pads' | 'harm' | 'mic' | 'sampler') => {
        const currentMutes = get().mutes
        const newMutes = { ...currentMutes, [channel]: !currentMutes[channel] }
        set({ mutes: newMutes })
        const { bassSynth, leadSynth, drumMachine, padSynth, harmSynth, samplerInstrument, micGain, volumes } = get()
        const isMuted = newMutes[channel]
        const db = isMuted ? -Infinity : Tone.gainToDb(volumes[channel])

        try {
            if (channel === 'bass' && bassSynth) bassSynth.setVolume(db)
            if (channel === 'lead' && leadSynth) leadSynth.setVolume(db)
            if (channel === 'drums' && drumMachine) drumMachine.setVolume(db)
            if (channel === 'pads' && padSynth?.synth?.volume) padSynth.synth.volume.value = db
            if (channel === 'harm' && harmSynth) harmSynth.setVolume(db)
            if (channel === 'sampler' && samplerInstrument) samplerInstrument.setVolume(db)
            if (channel === 'mic' && micGain) micGain.volume.value = db
        } catch (e) {
            console.warn(`Mute update failed for ${channel}`, e)
        }
    },

    toggleSolo: (channel) => {
        const currentSolos = get().solos
        const newSolos = { ...currentSolos, [channel]: !currentSolos[channel] }
        set({ solos: newSolos })

        const hasAnySolo = Object.values(newSolos).some(v => v)
        const channels: ('drums' | 'bass' | 'lead' | 'pads' | 'harm' | 'sampler' | 'mic')[] = ['drums', 'bass', 'lead', 'pads', 'harm', 'sampler', 'mic']

        channels.forEach(ch => {
            const isSoloed = newSolos[ch]
            const isMuted = get().mutes[ch]

            // If any solo is active, non-soloed tracks should be silent unless they are also soloed
            // Logic: play if (it is soloed) OR (no solos are active AND it is not muted)
            const shouldBeSilent = hasAnySolo ? !isSoloed : isMuted
            const db = shouldBeSilent ? -Infinity : Tone.gainToDb(get().volumes[ch])

            const { bassSynth, leadSynth, drumMachine, padSynth, harmSynth, samplerInstrument, micGain } = get()
            if (ch === 'bass' && bassSynth) bassSynth.setVolume(db)
            if (ch === 'lead' && leadSynth) leadSynth.setVolume(db)
            if (ch === 'drums' && drumMachine) drumMachine.setVolume(db)
            if (ch === 'pads' && padSynth?.synth?.volume) padSynth.synth.volume.value = db
            if (ch === 'harm' && harmSynth) harmSynth.setVolume(db)
            if (ch === 'sampler' && samplerInstrument) samplerInstrument.setVolume(db)
            if (ch === 'mic' && micGain) micGain.volume.value = db
        })
    },

    triggerPerformanceFx: (effect, active) => {
        const nodes = (window as any).masterFX
        if (!nodes) return

        if (effect === 'tapeStop') {
            if (active) {
                Tone.Transport.bpm.rampTo(10, 0.5)
                Tone.Destination.volume.rampTo(-Infinity, 0.5)
            } else {
                Tone.Transport.bpm.rampTo(get().bpm, 0.2)
                Tone.Destination.volume.rampTo(0, 0.2)
            }
        } else if (effect === 'washOut') {
            const wetVal = active ? 0.8 : get().fx.reverb.wet
            nodes.reverb.wet.rampTo(wetVal, active ? 0.1 : 1.0)
            nodes.delay.wet.rampTo(wetVal, active ? 0.1 : 1.0)
        } else if (effect === 'stutter') {
            if (active) {
                // Manual stutter via volume LFO or rapid ramp
                // For simplicity, let's use a quick repeat if it were a sampler, 
                // but globally we can just toggle destination volume
                const interval = setInterval(() => {
                    Tone.Destination.mute = !Tone.Destination.mute
                }, 100)
                    ; (window as any)._stutterInt = interval
            } else {
                clearInterval((window as any)._stutterInt)
                Tone.Destination.mute = false
            }
        } else if (effect === 'glitch') {
            if (active) {
                nodes.distortion.distortion = 0.9
                nodes.distortion.wet.value = 0.8
            } else {
                nodes.distortion.distortion = get().fx.distortion.amount
                nodes.distortion.wet.value = get().fx.distortion.wet
            }
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

    setFxParam: (effect: 'reverb' | 'delay' | 'distortion', params: Partial<{ wet: number, decay: number, feedback: number, amount: number, delayTime: string }>) => {
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
            if (params.delayTime !== undefined) nodes.delay.delayTime.value = params.delayTime
        } else if (effect === 'distortion') {
            if (params.wet !== undefined) nodes.distortion.wet.value = params.wet
            if (params.amount !== undefined) nodes.distortion.distortion = params.amount
        }
    },

    panic: () => {
        try {
            Tone.Transport.stop()
            Tone.Transport.cancel()

            const { bassSynth, fmBass, leadSynth, drumMachine, padSynth, harmSynth, samplerInstrument } = get()

            if (bassSynth) bassSynth.setVolume(-Infinity)
            if (leadSynth) leadSynth.setVolume(-Infinity)
            if (drumMachine) drumMachine.setVolume(-Infinity)
            if (padSynth?.synth?.volume) padSynth.synth.volume.value = -Infinity
            if (harmSynth) harmSynth.setVolume(-Infinity)
            if (samplerInstrument) samplerInstrument.setVolume(-Infinity)

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
        const { bassSynth, fmBass, leadSynth, drumMachine, padSynth, harmSynth, samplerInstrument } = get()
        Tone.Transport.stop()
        Tone.Transport.cancel()
        if (bassSynth && 'dispose' in bassSynth) (bassSynth as any).dispose()
        if (fmBass && 'dispose' in fmBass) (fmBass as any).dispose()
        if (samplerInstrument) samplerInstrument.dispose()

        const nodes = (window as any).masterFX
        if (nodes) {
            nodes.distortion.dispose()
            nodes.delay.dispose()
            nodes.reverb.dispose()
            nodes.masterBus.dispose()
        }

        sessionStorage.removeItem('midi_app_has_started')
        set({ isInitialized: false, hasStarted: false, isPlaying: false, bassSynth: null, fmBass: null, leadSynth: null, drumMachine: null, padSynth: null, harmSynth: null, samplerInstrument: null })
    },

    recalculateRouting: (edges: any[]) => {
        const state = get()
        if (!state.isInitialized) return

        const nodes = (window as any).masterFX
        if (!nodes) return

        console.log('[Audio] Recalculating Routing...', edges)

            // 2. Disconnect everything from everywhere to start fresh
            // Instruments
            ; (state.bassSynth as any)?.outputGain?.disconnect()
            ; (state.leadSynth as any)?.outputGain?.disconnect()
            ; (state.drumMachine as any)?.output?.disconnect()
        if (state.padSynth?.synth) state.padSynth.synth.disconnect()
            ; (state.harmSynth as any)?.outputGain?.disconnect()
            ; (state.samplerInstrument as any)?.volume?.disconnect()
        state.micGain?.disconnect()

        // Effects
        nodes.distortion.disconnect()
        nodes.delay.disconnect()
        nodes.reverb.disconnect()
        nodes.masterBus.disconnect()

        // 3. Map Node IDs to Tone Nodes
        const getToneNode = (id: string) => {
            if (id === 'drums') return (state.drumMachine as any)?.output
            if (id === 'bass') return (state.bassSynth as any)?.outputGain
            if (id === 'lead') return (state.leadSynth as any)?.outputGain
            if (id === 'pads') return state.padSynth?.synth
            if (id === 'harm') return (state.harmSynth as any)?.outputGain
            if (id === 'sampler') return (state.samplerInstrument as any)?.volume
            if (id === 'mic') return state.micGain
            if (id === 'distortion') return nodes.distortion
            if (id === 'delay') return nodes.delay
            if (id === 'reverb') return nodes.reverb
            if (id === 'master') return Tone.getDestination()
            return null
        }

        // 4. Apply connections from edges
        edges.forEach((edge: any) => {
            const source = getToneNode(edge.source)
            const target = getToneNode(edge.target)

            if (source && target) {
                try {
                    console.log(`[Audio] Connecting ${edge.source} -> ${edge.target}`)
                    source.connect(target)
                } catch (err) {
                    console.warn(`[Audio] Connection failed: ${edge.source} -> ${edge.target}`, err)
                }
            }
        })

        // 5. Connect untargeted instruments to Master by default? 
        // No, let the user decide. But we need a way to hear things if no edges.
        if (edges.length === 0) {
            // Restore default linear chain if no connections
            ; (state.bassSynth as any)?.outputGain?.connect(nodes.masterBus)
                ; (state.leadSynth as any)?.outputGain?.connect(nodes.masterBus)
                ; (state.drumMachine as any)?.output?.connect(nodes.masterBus)
                ; (state.padSynth as any)?.synth?.connect(nodes.masterBus)
                ; (state.harmSynth as any)?.outputGain?.connect(nodes.masterBus)
                ; (state.samplerInstrument as any)?.volume?.connect(nodes.masterBus)
            nodes.masterBus.chain(nodes.eqLow, nodes.eqLowMid, nodes.eqHighMid, nodes.eqHigh, nodes.distortion, nodes.delay, nodes.reverb, Tone.Destination)
        }
    },

    triggerSnapshot: (instId, index) => {
        set((state) => ({
            queuedSnapshots: { ...state.queuedSnapshots, [instId]: index }
        }))
    },

    commitSnapshots: () => {
        const { queuedSnapshots, activeSnapshots } = get()
        const newActive = { ...activeSnapshots }
        let changed = false

        Object.entries(queuedSnapshots).forEach(([instId, index]) => {
            if (index !== null) {
                newActive[instId] = index
                changed = true

                const params = SNAPSHOT_LIBRARY[instId]?.[index]
                if (!params) return

                // Apply to specific stores
                if (instId === 'drums') {
                    const ds = useDrumStore.getState()
                    if (params.kick) ds.setParams('kick', params.kick)
                    if (params.hihat) ds.setParams('hihat', params.hihat)
                    if (params.snare) ds.setParams('snare', params.snare)
                }
                if (instId === 'bass') useBassStore.getState().setParams(params)
                if (instId === 'pads') usePadStore.getState().setParams(params)
                if (instId === 'sampler') useSamplerStore.getState().setParam(params)
                if (instId === 'lead') {
                    useSequencerStore.getState().setTuringParam(params)
                }
            }
        })

        if (changed) {
            set({
                activeSnapshots: newActive,
                queuedSnapshots: { drums: null, bass: null, lead: null, pads: null, sampler: null, harm: null }
            })
        }
    },
}))
