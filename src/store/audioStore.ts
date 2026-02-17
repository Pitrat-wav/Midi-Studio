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
import { useArrangementStore } from './arrangementStore'
import sampleManifest from '../data/sampleManifest.json'
import { SNAPSHOT_LIBRARY } from '../data/snapshotLibrary'
import { audioTrackManager } from '../logic/AudioTrackManager'

/**
 * Yields control to the UI to allow for painting and responsiveness during heavy operations.
 * Prioritizes Scheduler.postTask, then requestAnimationFrame, and finally setTimeout(0).
 */
const yieldToUI = async () => {
    if (typeof window !== 'undefined' && (window as any).scheduler?.postTask) {
        return (window as any).scheduler.postTask(() => { }, { priority: 'user-blocking' })
    }
    return new Promise(resolve => {
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(resolve)
        } else {
            setTimeout(resolve, 0)
        }
    })
}

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
    // Routing & Effects
    channels: Record<string, Tone.Channel>
    buses: { reverb: Tone.Channel, delay: Tone.Channel }
    sidechain: Tone.Compressor | null
    // Audio Tracks
    audioPlayers: Record<string, Tone.GrainPlayer | Tone.Player>
    addAudioPlayer: (clipId: string, player: Tone.GrainPlayer | Tone.Player) => void
    removeAudioPlayer: (clipId: string) => void
    syncAudioClips: () => void
    // Methods
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
    freezeTrack: (trackId: string) => Promise<void>
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

    channels: {},
    buses: { reverb: null as any, delay: null as any },
    sidechain: null,

    activeSnapshots: { drums: 0, bass: 0, lead: 0, pads: 0, sampler: 0, harm: 0 },
    queuedSnapshots: { drums: null, bass: null, lead: null, pads: null, sampler: null, harm: null },

    masterEQ: { low: 0, lowMid: 0, highMid: 0, high: 0 },

    // Audio Tracks Implementation
    audioPlayers: {},
    addAudioPlayer: (clipId, player) => set(state => ({
        audioPlayers: { ...state.audioPlayers, [clipId]: player }
    })),
    removeAudioPlayer: (clipId) => set(state => {
        const player = state.audioPlayers[clipId]
        if (player) player.dispose()
        const newPlayers = { ...state.audioPlayers }
        delete newPlayers[clipId]
        return { audioPlayers: newPlayers }
    }),
    syncAudioClips: () => {
        const { clips } = useArrangementStore.getState()
        const { audioPlayers, bpm } = get()
        clips.forEach(clip => {
            if (clip.type === 'audio' && audioPlayers[clip.id]) {
                const player = audioPlayers[clip.id]
                player.sync().start(clip.startTick * (60 / bpm / 4))
            }
        })
    },

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

            // 1. Master Bus & Channels
            const masterBus = new Tone.Gain(1)

            // Create Channels for each instrument
            const channelNames = ['drums', 'bass', 'lead', 'pads', 'harm', 'sampler', 'mic']
            const channels: Record<string, Tone.Channel> = {}
            channelNames.forEach(name => {
                channels[name] = new Tone.Channel().connect(masterBus)
                const vol = (get().volumes as any)[name] || 1
                channels[name].volume.value = Tone.gainToDb(vol)
            })

            // 2. Effect Buses (Send/Return)
            const reverbBus = new Tone.Channel().connect(masterBus)
            const delayBus = new Tone.Channel().connect(masterBus)

            const reverb = new Tone.Reverb({ decay: get().fx.reverb.decay, preDelay: 0.01 })
            await reverb.ready
            reverb.generate()
            reverb.connect(reverbBus)

            const delay = new Tone.FeedbackDelay(get().fx.delay.delayTime, get().fx.delay.feedback)
            delay.connect(delayBus)

            // 3. Sidechain Ducking (Kick -> Bass)
            // Compressor on Bass channel, input 0 is audio, input 1 is sidechain
            const sidechain = new Tone.Compressor({
                threshold: -30,
                ratio: 12,
                attack: 0.01,
                release: 0.2
            })
            // In Tone.js, to use sidechain on a compressor, we need to bypass the internal connection 
            // or use a native AudioNode if Tone doesn't expose it easily. 
            // Actually, Tone.Compressor has a 'sidechain' source but it's tricky.
            // A common way in Tone is to use a Gain node modulated by a signal, but a real compressor is better.
            // Let's use Tone.Compressor and connect the kick signal to its 'threshold' or similar? 
            // No, Tone.Compressor doesn't have a direct sidechain input port in the standard way.
            // However, we can use a native compressor node.

            const bassChannel = channels['bass']
            // Insert compressor into bass channel
            // channel -> sidechain (static comp) -> (sidechainGain will be connected in kick block)
            bassChannel.disconnect()
            bassChannel.connect(sidechain)
            // Note: sidechain is connected to masterBus (or sidechainGain) later in the initializer

            // 4-Band EQ Chain (on Master)
            const eqLow = new Tone.Filter(150, "lowshelf")
            const eqLowMid = new Tone.Filter(400, "peaking")
            const eqHighMid = new Tone.Filter(2500, "peaking")
            const eqHigh = new Tone.Filter(8000, "highshelf")

            const distortion = new Tone.Distortion(get().fx.distortion.amount)
            distortion.wet.value = get().fx.distortion.wet

            // Update Master Chain: masterBus -> EQ -> Dist -> Destination
            masterBus.chain(eqLow, eqLowMid, eqHighMid, eqHigh, distortion, Tone.getDestination())

            // Initialize Microphone Chain
            // Mic -> Gate (remove background noise) -> Compressor (even levels) -> Gain -> MasterBus
            const mic = new Tone.UserMedia()
            const micGate = new Tone.Gate(-50) // Open only when louder than -50db
            const micComp = new Tone.Compressor(-20, 3)
            const micGain = new Tone.Volume(0)

            mic.chain(micGate, micComp, micGain)
            micGain.connect(channels['mic'])

                // Store nodes on window for global access
                ; (window as any).masterFX = {
                    distortion, delay, reverb, masterBus, mic, micGate, micGain,
                    eqLow, eqLowMid, eqHighMid, eqHigh, channels, reverbBus, delayBus, sidechain
                }

            console.log('[Audio] Step 5: Instruments')
            // ... (Rest of init)
            set({ loadingStep: 'Constructing Synths (Bass)...' })
            await yieldToUI()
            const bass = new AcidSynth()
            bass.init()

            set({ loadingStep: 'Constructing Synths (FM)...' })
            await yieldToUI()
            const fm = new FMBass()
            fm.init()

            set({ loadingStep: 'Constructing Synths (Lead)...' })
            await yieldToUI()
            const lead = new AcidSynth()
            lead.init()

            set({ loadingStep: 'Constructing Synths (Drums)...' })
            await yieldToUI()
            const drums = new DrumMachine()

            set({ loadingStep: 'Constructing Synths (Pads)...' })
            await yieldToUI()
            const pads = new PadSynth()

            set({ loadingStep: 'Constructing Synths (Harm)...' })
            await yieldToUI()
            const harm = new HarmSynth()
            harm.init()

            set({ loadingStep: 'Constructing Synths (Sampler)...' })
            await yieldToUI()
            const sampler = new SamplerInstrument()
            await sampler.load(useSamplerStore.getState().url)

            set({ loadingStep: 'Connecting Modules...' })
            console.log('[Audio] Step 6: Connecting Modules')

            // Connect instruments to their respective channels
            if ((bass as any).outputGain) (bass as any).outputGain.connect(channels['bass'])
            if ((lead as any).outputGain) (lead as any).outputGain.connect(channels['lead'])

            // Drums - Connect main output to drums channel
            if ((drums as any).output) (drums as any).output.connect(channels['drums'])

            // Sidechain connection: Kick -> sidechain compressor
            // We use the raw kick signal to drive the compressor
            if (drums.kick) {
                // To drive a compressor's sidechain in web audio, we connect to the 'threshold' or use a dedicated node.
                const sidechainGain = new Tone.Gain(1)
                sidechain.connect(sidechainGain)
                sidechainGain.connect(masterBus)

                const follower = new Tone.Follower(0.1)
                const inverter = new Tone.Gain(-1)
                const offset = new Tone.Signal(1)

                drums.kick.connect(follower)
                follower.connect(inverter)
                inverter.connect(sidechainGain.gain)
                offset.connect(sidechainGain.gain)

                    ; (window as any).masterFX.sidechainNodes = { follower, inverter, offset, sidechainGain }
            } else {
                sidechain.connect(masterBus)
            }

            // Pads
            if (pads?.synth) pads.synth.connect(channels['pads'])

            // Harm
            if ((harm as any).outputGain) (harm as any).outputGain.connect(channels['harm'])
            else if ((harm as any).output) (harm as any).output.connect(channels['harm'])

            // Sampler
            sampler.volume.connect(channels['sampler'])


            // Apply initial volumes (already set during channel creation, but let's be sure for instrument internal levels)
            bass?.setVolume(0) // Let channels handle the actual mix
            lead?.setVolume(0)
            drums?.setVolume(0)
            if (pads?.synth?.volume) pads.synth.volume.value = 0
            harm?.setVolume(0)
            sampler.setVolume(0)

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
                micGain: micGain,
                channels: channels,
                buses: { reverb: reverbBus, delay: delayBus },
                sidechain: sidechain
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
        const { isPlaying, syncAudioClips } = get()
        if (isPlaying) {
            Tone.Transport.pause()
            set({ isPlaying: false })
        } else {
            syncAudioClips()
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
        const { channels, mutes } = get()
        if (mutes[channel]) return
        const db = Tone.gainToDb(value)
        if (channels[channel]) {
            channels[channel].volume.rampTo(db, 0.1)
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
        const { channels } = get()
        if (channels[channel]) {
            channels[channel].mute = newMutes[channel]
        }
    },

    toggleSolo: (channel) => {
        const currentSolos = get().solos
        const newSolos = { ...currentSolos, [channel]: !currentSolos[channel] }
        set({ solos: newSolos })

        const { channels } = get()
        Object.keys(newSolos).forEach(ch => {
            if (channels[ch]) {
                channels[ch].solo = newSolos[ch as keyof typeof newSolos]
            }
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

    setBpm: (bpm) => {
        set({ bpm })
        Tone.Transport.bpm.value = bpm
        const { clips } = useArrangementStore.getState()
        audioTrackManager.onBpmChange(bpm, clips)
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

            const { channels } = get()
            Object.values(channels).forEach(ch => {
                ch.volume.rampTo(-Infinity, 0.05)
            })

            Tone.Destination.volume.rampTo(-Infinity, 0.05)
            set({ isPlaying: false, currentStep: 0 })
            setTimeout(() => {
                Tone.Destination.volume.value = 0
            }, 100)
        } catch (e) {
            console.error('Panic failed', e)
        }
    },

    dispose: () => {
        const { bassSynth, fmBass, leadSynth, drumMachine, padSynth, harmSynth, samplerInstrument, channels, buses, sidechain } = get()
        Tone.Transport.stop()
        Tone.Transport.cancel()
        if (bassSynth && 'dispose' in bassSynth) (bassSynth as any).dispose()
        if (fmBass && 'dispose' in fmBass) (fmBass as any).dispose()
        if (samplerInstrument) samplerInstrument.dispose()

        Object.values(channels).forEach(ch => ch.dispose())
        buses.reverb.dispose()
        buses.delay.dispose()
        sidechain?.dispose()

        const nodes = (window as any).masterFX
        if (nodes) {
            nodes.distortion.dispose()
            nodes.delay.dispose()
            nodes.reverb.dispose()
            nodes.masterBus.dispose()
            if (nodes.sidechainNodes) {
                Object.values(nodes.sidechainNodes).forEach((n: any) => n.dispose?.())
            }
        }

        sessionStorage.removeItem('midi_app_has_started')
        set({ isInitialized: false, hasStarted: false, isPlaying: false, bassSynth: null, fmBass: null, leadSynth: null, drumMachine: null, padSynth: null, harmSynth: null, samplerInstrument: null })
    },

    recalculateRouting: (edges: any[]) => {
        const state = get()
        if (!state.isInitialized) return

        const nodes = (window as any).masterFX
        if (!nodes) return

        // --- CYCLE DETECTION HELPER ---
        const hasCycle = (edgesToTest: any[]): boolean => {
            const adj = new Map<string, string[]>()
            edgesToTest.forEach(e => {
                if (!adj.has(e.source)) adj.set(e.source, [])
                adj.get(e.source)!.push(e.target)
            })

            const visited = new Set<string>()
            const recStack = new Set<string>()

            const check = (v: string): boolean => {
                if (!visited.has(v)) {
                    visited.add(v)
                    recStack.add(v)
                    for (const neighbor of (adj.get(v) || [])) {
                        if (!visited.has(neighbor) && check(neighbor)) return true
                        if (recStack.has(neighbor)) return true
                    }
                }
                recStack.delete(v)
                return false
            }
            for (const source of adj.keys()) {
                if (check(source)) return true
            }
            return false
        }
        // ------------------------------

        console.log('[Audio] Recalculating Routing...', edges)

        // 1. Disconnect channels from masterBus to start fresh
        Object.values(state.channels).forEach(ch => ch.disconnect())
        nodes.reverbBus.disconnect()
        nodes.delayBus.disconnect()

        // 2. Map Node IDs to Tone Nodes
        const getToneNode = (id: string) => {
            if (state.channels[id]) return state.channels[id]
            if (id === 'reverb') return nodes.reverbBus
            if (id === 'delay') return nodes.delayBus
            if (id === 'master') return Tone.getDestination()
            return null
        }

        // 3. Apply connections from edges (with safety check)
        if (edges.length > 0) {
            const safeEdges: any[] = []
            edges.forEach(edge => {
                const testEdges = [...safeEdges, edge]
                if (!hasCycle(testEdges)) {
                    safeEdges.push(edge)
                } else {
                    console.warn(`[Audio] Blocked feedback loop: ${edge.source} -> ${edge.target}`)
                }
            })

            safeEdges.forEach((edge: any) => {
                const source = getToneNode(edge.source)
                const target = getToneNode(edge.target)

                if (source && target) {
                    try {
                        source.connect(target)
                    } catch (err) {
                        console.warn(`[Audio] Connection failed: ${edge.source} -> ${edge.target}`, err)
                    }
                }
            })
        } else {
            // Default routing: all channels to master, buses to master
            Object.values(state.channels).forEach(ch => ch.connect(nodes.masterBus))
            nodes.reverbBus.connect(nodes.masterBus)
            nodes.delayBus.connect(nodes.masterBus)
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

    freezeTrack: async (trackId) => {
        const { clips, setTrackFrozen } = useArrangementStore.getState()
        const { bpm } = get()
        const trackClips = clips.filter(c => c.trackId === trackId && c.type === 'midi')
        if (trackClips.length === 0) return

        const totalLengthTicks = useArrangementStore.getState().totalLengthTicks
        const totalLengthSeconds = (60 / bpm) * 4 * (totalLengthTicks / 16)

        console.log(`❄️ Freezing track ${trackId} (${totalLengthSeconds.toFixed(2)}s)...`)

        try {
            const buffer = await Tone.Offline(async () => {
                let synth: any
                if (trackId === 'bass') synth = new AcidSynth()
                else if (trackId === 'lead') synth = new AcidSynth()
                else if (trackId === 'pads') synth = new PadSynth()
                else if (trackId === 'harm') synth = new HarmSynth()
                else if (trackId === 'drums') synth = new DrumMachine()

                if (synth && 'init' in synth) synth.init()
                if (synth) {
                    const out = synth.outputGain || synth.output || synth.synth || synth.volume
                    if (out) out.toDestination()
                }

                trackClips.forEach(clip => {
                    const startTime = clip.startTick * (60 / bpm / 4)
                    const snapshot = SNAPSHOT_LIBRARY[trackId]?.[clip.snapshotId ?? 0]
                    if (snapshot && synth && 'setParams' in synth) {
                        Tone.Transport.schedule(() => {
                            synth.setParams(snapshot)
                        }, startTime)
                    }
                })
            }, totalLengthSeconds)

            const wavBlob = await bufferToWav(buffer as any)
            const url = URL.createObjectURL(wavBlob)
            setTrackFrozen(trackId, true, url)
        } catch (e) {
            console.error('Freeze failed', e)
        }
    }
}))

async function bufferToWav(buffer: AudioBuffer): Promise<Blob> {
    const worker = new Worker(new URL('../logic/WavWorker.js', import.meta.url))
    return new Promise((resolve) => {
        worker.onmessage = (e) => resolve(e.data)
        const channelData = []
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channelData.push(buffer.getChannelData(i))
        }
        worker.postMessage({ channelData, sampleRate: buffer.sampleRate })
    })
}
