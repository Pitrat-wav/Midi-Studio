import * as Tone from 'tone'

export type HarmOscType = 'sawtooth' | 'square' | 'triangle' | 'sine'

export interface ADSRParams {
    attack: number
    decay: number
    sustain: number
    release: number
}

export interface BuchlaParams {
    complexMode: boolean
    fmIndex: number
    amIndex: number
    timbre: number
    order: number
    harmonics: number // symmetry/harmonics distribution
    pitchMod: boolean
    ampMod: boolean
    timbreMod: boolean
    modOscRange: 'low' | 'high'
    modOscShape: HarmOscType
    modPitch: number
    principalPitch: number
    vcaBypass: boolean
    phaseLock: boolean
}

class HarmVoice {
    public osc1: Tone.Oscillator
    public osc1Env: Tone.AmplitudeEnvelope
    public osc1Direct: Tone.Gain
    public osc1Fx: Tone.Gain

    public osc2: Tone.Oscillator
    public osc2Env: Tone.AmplitudeEnvelope
    public osc2Direct: Tone.Gain
    public osc2Fx: Tone.Gain

    public osc3: Tone.Oscillator
    public osc3Env: Tone.AmplitudeEnvelope
    public osc3Direct: Tone.Gain
    public osc3Fx: Tone.Gain

    public noise: Tone.Noise
    public noiseEnv: Tone.AmplitudeEnvelope
    public noiseDirect: Tone.Gain
    public noiseFx: Tone.Gain

    // Complex/Buchla nodes
    public folder: Tone.WaveShaper
    public fmGain: Tone.Gain
    public amGain: Tone.Gain
    public amNode: Tone.Gain

    constructor(fxBus: Tone.ToneAudioNode, directBus: Tone.ToneAudioNode) {
        // OSC 1
        this.osc1 = new Tone.Oscillator(440, 'sawtooth').start()
        this.osc1Env = new Tone.AmplitudeEnvelope()
        this.osc1Direct = new Tone.Gain(1).connect(directBus)
        this.osc1Fx = new Tone.Gain(0).connect(fxBus)
        this.osc1.connect(this.osc1Env)
        this.osc1Env.connect(this.osc1Direct)
        this.osc1Env.connect(this.osc1Fx)

        // OSC 2
        this.osc2 = new Tone.Oscillator(440, 'square').start()
        this.osc2Env = new Tone.AmplitudeEnvelope()
        this.osc2Direct = new Tone.Gain(1).connect(directBus)
        this.osc2Fx = new Tone.Gain(0).connect(fxBus)
        this.osc2.connect(this.osc2Env)
        this.osc2Env.connect(this.osc2Direct)
        this.osc2Env.connect(this.osc2Fx)

        // OSC 3
        this.osc3 = new Tone.Oscillator(440, 'triangle').start()
        this.osc3Env = new Tone.AmplitudeEnvelope()
        this.osc3Direct = new Tone.Gain(1).connect(directBus)
        this.osc3Fx = new Tone.Gain(0).connect(fxBus)
        this.osc3.connect(this.osc3Env)
        this.osc3Env.connect(this.osc3Direct)
        this.osc3Env.connect(this.osc3Fx)

        // Noise
        this.noise = new Tone.Noise('white').start()
        this.noiseEnv = new Tone.AmplitudeEnvelope()
        this.noiseDirect = new Tone.Gain(1).connect(directBus)
        this.noiseFx = new Tone.Gain(0).connect(fxBus)
        this.noise.connect(this.noiseEnv)
        this.noiseEnv.connect(this.noiseDirect)
        this.noiseEnv.connect(this.noiseFx)

        // Complex Logic
        this.fmGain = new Tone.Gain(0)
        this.amGain = new Tone.Gain(0)
        this.amNode = new Tone.Gain(1)

        // Wavefolder transfer function (approximating Buchla harmonics)
        this.folder = new Tone.WaveShaper((val) => {
            // Simple recursive folding logic
            let x = val * 5 // Increase Gain for more folds
            for (let i = 0; i < 3; i++) {
                if (x > 1) x = 2 - x
                if (x < -1) x = -2 - x
            }
            return x
        }, 4096)

        // Patching for Complex Mode will be done dynamically or in trig
    }

    trigger(note: string, duration: string, time: number, velocity: number, settings: any) {
        const freq = Tone.Frequency(note).toFrequency()
        const principalFreq = Tone.Frequency(note).transpose(settings.complex.principalPitch || 0).toFrequency()
        let modFreq = Tone.Frequency(note).transpose(settings.complex.modPitch || 0).toFrequency()

        if (settings.complex.modOscRange === 'low') {
            // LFO mode: 0.1Hz to 30Hz based on 'pitch' param
            modFreq = 0.1 + (Math.abs(settings.complex.modPitch) * 1.5)
        }

        this.osc1.frequency.setValueAtTime(principalFreq, time)
        this.osc2.frequency.setValueAtTime(modFreq, time)
        this.osc2.type = settings.complex.modOscShape || 'triangle'
        this.osc3.frequency.setValueAtTime(freq, time)

        if (settings.complex.phaseLock) {
            // Hard Sync approximation: reset phase of mod osc when principal triggers
            this.osc2.stop(time)
            this.osc2.start(time)
        }

        if (settings.complex.complexMode) {
            this.osc1.disconnect()
            this.osc2.disconnect()

            if (settings.complex.pitchMod) {
                this.fmGain.gain.setValueAtTime(settings.complex.fmIndex * 500 * (principalFreq / 440), time)
                this.osc2.connect(this.fmGain)
                this.fmGain.connect(this.osc1.frequency)
            } else {
                this.fmGain.disconnect()
            }

            if (settings.complex.ampMod) {
                this.amGain.gain.setValueAtTime(settings.complex.amIndex, time)
                this.osc2.connect(this.amGain)
                this.osc1.connect(this.amNode)
                this.amGain.connect(this.amNode.gain)
            } else {
                this.amGain.disconnect()
                this.amNode.gain.setValueAtTime(1, time)
                this.osc1.connect(this.amNode)
            }

            if (settings.complex.timbreMod) {
                const modGain = new Tone.Gain(settings.complex.fmIndex * 0.5)
                this.osc2.connect(modGain)
                modGain.connect(this.amNode)
            }

            this.amNode.connect(this.folder)

            if (settings.complex.vcaBypass) {
                this.folder.disconnect()
                // Open envelope indefinitely for droning
                this.osc1Env.triggerAttack(time)
                this.folder.connect(this.osc1Env)
            } else {
                this.folder.connect(this.osc1Env)
            }

        } else {
            // Normal Mode
            this.fmGain.disconnect()
            this.amGain.disconnect()
            this.amNode.disconnect()
            this.folder.disconnect()
            this.osc1.disconnect()
            this.osc2.disconnect()

            this.osc1.connect(this.osc1Env)
            this.osc2.connect(this.osc2Env)
        }

        if (!settings.complex.vcaBypass) {
            if (settings.osc1.enabled) this.osc1Env.triggerAttackRelease(duration, time, velocity)
        }

        if (!settings.complex.complexMode) {
            if (settings.osc2.enabled) this.osc2Env.triggerAttackRelease(duration, time, velocity)
            if (settings.osc3.enabled) this.osc3Env.triggerAttackRelease(duration, time, velocity)
        }
        if (settings.noise.enabled) this.noiseEnv.triggerAttackRelease(duration, time, velocity)
    }

    dispose() {
        this.osc1.dispose()
        this.osc1Env.dispose()
        this.osc1Direct.dispose()
        this.osc1Fx.dispose()
        this.osc2.dispose()
        this.osc2Env.dispose()
        this.osc2Direct.dispose()
        this.osc2Fx.dispose()
        this.osc3.dispose()
        this.osc3Env.dispose()
        this.osc3Direct.dispose()
        this.osc3Fx.dispose()
        this.noise.dispose()
        this.noiseEnv.dispose()
        this.noiseDirect.dispose()
        this.noiseFx.dispose()
    }
}

export class HarmSynth {
    private voices: Map<string, HarmVoice> = new Map()
    private maxVoices = 8
    private voicePool: HarmVoice[] = []

    // Global Routing Nodes
    private fxBus: Tone.Gain | undefined
    private directBus: Tone.Gain | undefined
    private filter1: Tone.Filter | undefined
    private filter2: Tone.Filter | undefined

    // Global FX Rack
    private distortion: Tone.Distortion | undefined
    private phaser: Tone.Phaser | undefined
    private chorus: Tone.Chorus | undefined
    private delay: Tone.FeedbackDelay | undefined
    private reverb: Tone.Reverb | undefined
    private outputGain: Tone.Volume | undefined

    // Global Settings (applied to all voices)
    private settings = {
        osc1: { type: 'sawtooth' as HarmOscType, detune: 0, env: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }, send: 0, enabled: true },
        osc2: { type: 'square' as HarmOscType, detune: 10, env: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }, send: 0, enabled: true },
        osc3: { type: 'triangle' as HarmOscType, detune: -10, env: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }, send: 0, enabled: true },
        noise: { env: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }, send: 0, enabled: true },
        f1: { freq: 2000, q: 1, type: 'lowpass' as BiquadFilterType, enabled: true },
        f2: { freq: 5000, q: 1, type: 'lowpass' as BiquadFilterType, enabled: true },
        complex: { // Complex Params
            complexMode: false,
            fmIndex: 0,
            amIndex: 0,
            timbre: 0.5,
            order: 0.5,
            harmonics: 0.5,
            pitchMod: true,
            ampMod: false,
            timbreMod: true,
            modOscRange: 'high' as 'low' | 'high',
            modPitch: 0,
            principalPitch: 0,
            modOscShape: 'triangle' as HarmOscType,
            vcaBypass: false,
            phaseLock: false
        }
    }

    private initialized = false

    constructor() { }

    public init() {
        if (this.initialized) return

        try {
            this.fxBus = new Tone.Gain(1)
            this.directBus = new Tone.Gain(1)

            this.filter1 = new Tone.Filter(this.settings.f1.freq, this.settings.f1.type)
            this.filter2 = new Tone.Filter(this.settings.f2.freq, this.settings.f2.type)

            this.distortion = new Tone.Distortion(0.4)
            this.phaser = new Tone.Phaser({ frequency: 0.5, octaves: 5, baseFrequency: 1000 })
            this.chorus = new Tone.Chorus(4, 2.5, 0.5).start()
            this.delay = new Tone.FeedbackDelay('8n', 0.5)
            this.reverb = new Tone.Reverb(2)

            this.outputGain = new Tone.Volume(0).toDestination()

            // Main routing: voices -> directBus -> filter1 -> filter2 -> output
            this.directBus.chain(this.filter1, this.filter2, this.outputGain)

            // FX routing: voices -> fxBus -> rack -> output
            this.fxBus.chain(this.distortion, this.phaser, this.chorus, this.delay, this.reverb, this.outputGain)

            // Pre-warm voice pool
            for (let i = 0; i < this.maxVoices; i++) {
                const v = new HarmVoice(this.fxBus, this.directBus)
                this.voicePool.push(v)
            }

            this.initialized = true
        } catch (e) {
            console.error('HarmSynth: init failed', e)
        }
    }

    private applyVoiceSettings(voice: HarmVoice) {
        // Apply Global OSC Settings to specific voice
        voice.osc1.type = this.settings.osc1.type
        voice.osc1.detune.value = this.settings.osc1.detune
        voice.osc1Env.set(this.settings.osc1.env)
        voice.osc1Fx.gain.setValueAtTime(this.settings.osc1.send, Tone.now())
        voice.osc1Direct.gain.setValueAtTime(1 - this.settings.osc1.send, Tone.now())

        voice.osc2.type = this.settings.osc2.type
        voice.osc2.detune.value = this.settings.osc2.detune
        voice.osc2Env.set(this.settings.osc2.env)
        voice.osc2Fx.gain.setValueAtTime(this.settings.osc2.send, Tone.now())
        voice.osc2Direct.gain.setValueAtTime(1 - this.settings.osc2.send, Tone.now())

        voice.osc3.type = this.settings.osc3.type
        voice.osc3.detune.value = this.settings.osc3.detune
        voice.osc3Env.set(this.settings.osc3.env)
        voice.osc3Fx.gain.setValueAtTime(this.settings.osc3.send, Tone.now())
        voice.osc3Direct.gain.setValueAtTime(1 - this.settings.osc3.send, Tone.now())

        voice.noiseEnv.set(this.settings.noise.env)
        voice.noiseFx.gain.setValueAtTime(this.settings.noise.send, Tone.now())
        voice.noiseDirect.gain.setValueAtTime(1 - this.settings.noise.send, Tone.now())

        // Complex settings
        if (this.settings.complex.complexMode) {
            const { timbre, order, harmonics } = this.settings.complex

            // Modulation Oscillator (OSC 2) Frequency Range
            if (this.settings.complex.modOscRange === 'low') {
                // scale down to LFO territory if range is low
                const currentFreq = voice.osc2.frequency.value as number
                voice.osc2.frequency.setValueAtTime(currentFreq * 0.01, Tone.now())
            }

            // Buchla 259 Timbre Circuit approximation
            this.updateWavefolder(voice, timbre, order, harmonics)
        }
    }

    private updateWavefolder(voice: HarmVoice, timbre: number, order: number, harmonics: number) {
        // Ensure inputs are clamped
        const cTimbre = Math.max(0, Math.min(1, timbre))
        const cOrder = Math.max(0, Math.min(1, order))
        const cHarmonics = Math.max(0, Math.min(1, harmonics))

        voice.folder.set({
            mapping: (val: number) => {
                let x = val * (1 + cTimbre * 10)
                let symmetry = (cHarmonics - 0.5) * 0.8
                x += symmetry

                // Multi-stage folding based on 'order'
                for (let i = 0; i < 4; i++) {
                    let stageIntensity = Math.max(0, Math.min(1, cOrder * 5 - i))
                    if (stageIntensity > 0) {
                        let folded = x
                        if (folded > 1) folded = 2 - folded
                        if (folded < -1) folded = -2 - folded
                        x = (folded * stageIntensity) + (x * (1 - stageIntensity))
                    }
                }
                return x - symmetry
            }
        })
    }

    triggerNote(note: string, duration: string, time: number, velocity: number = 0.8) {
        if (!this.initialized) this.init()

        // Find an unused voice (FIFO or simple recycle)
        const voice = this.voicePool.shift()
        if (voice) {
            // Only apply per-note dynamic settings here
            voice.osc1.type = this.settings.osc1.type
            voice.osc1.detune.value = this.settings.osc1.detune
            voice.osc1Env.set(this.settings.osc1.env)

            voice.osc2.type = this.settings.osc2.type
            voice.osc2.detune.value = this.settings.osc2.detune
            voice.osc2Env.set(this.settings.osc2.env)

            voice.osc3.type = this.settings.osc3.type
            voice.osc3.detune.value = this.settings.osc3.detune
            voice.osc3Env.set(this.settings.osc3.env)

            voice.noiseEnv.set(this.settings.noise.env)

            voice.trigger(note, duration, time, velocity, this.settings)

            // Put it back later (duration + release)
            const release = Math.max(
                this.settings.osc1.env.release,
                this.settings.osc2.env.release,
                this.settings.osc3.env.release,
                this.settings.noise.env.release
            )

            setTimeout(() => {
                this.voicePool.push(voice)
            }, (Tone.Time(duration).toSeconds() + release) * 1000)
        }
    }

    // Proxy setters for global modules
    setDistortion(drive: number, wet: number) {
        if (this.distortion) {
            this.distortion.distortion = drive
            this.distortion.wet.value = wet
        }
    }
    setPhaser(freq: number, depth: number, stages: number, wet: number) {
        if (this.phaser) {
            this.phaser.frequency.value = freq
            this.phaser.octaves = stages
            this.phaser.wet.value = wet
        }
    }
    setChorus(freq: number, delay: number, depth: number, wet: number) {
        if (this.chorus) {
            this.chorus.frequency.value = freq
            this.chorus.delayTime = delay
            this.chorus.depth = depth
            this.chorus.wet.value = wet
        }
    }
    setDelay(time: string, feedback: number, wet: number) {
        if (this.delay) {
            this.delay.delayTime.value = time
            this.delay.feedback.value = feedback
            this.delay.wet.value = wet
        }
    }
    setReverb(decay: number, wet: number) {
        if (this.reverb) {
            this.reverb.decay = decay
            this.reverb.wet.value = wet
        }
    }

    setFilter(idx: 1 | 2, freq: number, q: number, type: BiquadFilterType) {
        const f = idx === 1 ? this.filter1 : this.filter2
        if (f) {
            f.frequency.value = freq
            f.Q.value = q
            f.type = type
        }
    }

    toggleModule(id: 'osc1' | 'osc2' | 'osc3' | 'noise' | 'f1' | 'f2', enabled: boolean) {
        if (id === 'f1' && this.filter1) {
            this.settings.f1.enabled = enabled
            // Simple bypass logic: if disabled, set freq high and Q low (or reconnect around)
            // Re-rebuilding routing is safer
            this.rebuildBypass()
        }
        if (id === 'f2' && this.filter2) {
            this.settings.f2.enabled = enabled
            this.rebuildBypass()
        }
        // Oscllators are handled in applyVoiceSettings
        const oscMap = { osc1: 'osc1', osc2: 'osc2', osc3: 'osc3', noise: 'noise' }
        if (id in oscMap) {
            (this.settings as any)[id].enabled = enabled
        }
    }

    private rebuildBypass() {
        if (!this.directBus || !this.filter1 || !this.filter2 || !this.outputGain) return
        this.directBus.disconnect()
        this.filter1.disconnect()
        this.filter2.disconnect()

        let last: Tone.ToneAudioNode = this.directBus
        if (this.settings.f1.enabled) {
            last.connect(this.filter1)
            last = this.filter1
        }
        if (this.settings.f2.enabled) {
            last.connect(this.filter2)
            last = this.filter2
        }
        last.connect(this.outputGain)
    }

    setOscType(idx: 1 | 2 | 3, type: HarmOscType) {
        (this.settings as any)[`osc${idx}`].type = type
    }
    setOscDetune(idx: 1 | 2 | 3, detune: number) {
        (this.settings as any)[`osc${idx}`].detune = detune
    }
    setEnv(target: 'osc1' | 'osc2' | 'osc3' | 'noise', params: ADSRParams) {
        (this.settings as any)[target].env = params
    }
    setFxSend(idx: 'osc1' | 'osc2' | 'osc3' | 'noise', level: number) {
        (this.settings as any)[idx].send = level
    }
    setVolume(db: number) {
        this.outputGain?.volume.rampTo(db, 0.1)
    }

    setComplexParams(params: Partial<BuchlaParams>) {
        // Clamp critical values defensively
        const clamped = { ...params }
        if (clamped.fmIndex !== undefined) clamped.fmIndex = Math.max(0, Math.min(1, clamped.fmIndex))
        if (clamped.amIndex !== undefined) clamped.amIndex = Math.max(0, Math.min(1, clamped.amIndex))
        if (clamped.timbre !== undefined) clamped.timbre = Math.max(0, Math.min(1, clamped.timbre))
        if (clamped.order !== undefined) clamped.order = Math.max(0, Math.min(1, clamped.order))

        this.settings.complex = { ...this.settings.complex, ...clamped }

        // Update all voices in the pool and active voices
        const { timbre, order, harmonics } = this.settings.complex
        this.voicePool.forEach(v => this.updateWavefolder(v, timbre, order, harmonics))
        this.voices.forEach(v => this.updateWavefolder(v, timbre, order, harmonics))
    }
}
