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
    harmonics: number
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

    public activeNote: string | null = null
    public startTime: number = 0
    public currentCurve: Float32Array | null = null

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

        this.folder = new Tone.WaveShaper((val) => {
            let x = val * 5
            for (let i = 0; i < 3; i++) {
                if (x > 1) x = 2 - x
                if (x < -1) x = -2 - x
            }
            return x
        }, 4096)
    }

    trigger(note: string, duration: string, time: number, velocity: number, settings: any) {
        const freq = Tone.Frequency(note).toFrequency()
        const principalFreq = Tone.Frequency(note).transpose(settings.complex.principalPitch || 0).toFrequency()
        let modFreq = Tone.Frequency(note).transpose(settings.complex.modPitch || 0).toFrequency()

        if (settings.complex.modOscRange === 'low') {
            modFreq = 0.1 + (Math.abs(settings.complex.modPitch) * 1.5)
        }

        this.activeNote = note
        this.startTime = time

        this.osc1.frequency.setValueAtTime(principalFreq, time)
        this.osc2.frequency.setValueAtTime(modFreq, time)
        this.osc2.type = settings.complex.modOscShape || 'triangle'
        this.osc3.frequency.setValueAtTime(freq, time)

        this.applyComplexRouting(time, principalFreq, settings)

        if (!settings.complex.vcaBypass) {
            if (settings.osc1.enabled) this.osc1Env.triggerAttackRelease(duration, time, velocity)
        } else {
            this.osc1Env.triggerAttack(time, velocity)
        }

        if (!settings.complex.complexMode) {
            if (settings.osc2.enabled) this.osc2Env.triggerAttackRelease(duration, time, velocity)
            if (settings.osc3.enabled) this.osc3Env.triggerAttackRelease(duration, time, velocity)
        }
        if (settings.noise.enabled) this.noiseEnv.triggerAttackRelease(duration, time, velocity)
    }

    private applyComplexRouting(time: number, principalFreq: number, settings: any) {
        const s = settings.complex
        if (s.complexMode) {
            this.osc1.disconnect()
            this.osc2.disconnect()

            if (s.pitchMod) {
                this.fmGain.gain.setValueAtTime(s.fmIndex * 500 * (principalFreq / 440), time)
                this.osc2.connect(this.fmGain)
                this.fmGain.connect(this.osc1.frequency)
            } else {
                this.fmGain.disconnect()
            }

            if (s.ampMod) {
                this.amGain.gain.setValueAtTime(s.amIndex, time)
                this.osc2.connect(this.amGain)
                this.osc1.connect(this.amNode)
                this.amGain.connect(this.amNode.gain)
            } else {
                this.amGain.disconnect()
                this.amNode.gain.setValueAtTime(1, time)
                this.osc1.connect(this.amNode)
            }

            if (s.timbreMod) {
                const modGain = new Tone.Gain(s.fmIndex * 0.5)
                this.osc2.connect(modGain)
                modGain.connect(this.amNode)
            }

            this.amNode.connect(this.folder)
            this.folder.connect(this.osc1Env)
        } else {
            this.fmGain.disconnect()
            this.amGain.disconnect()
            this.amNode.disconnect()
            this.folder.disconnect()
            this.osc1.disconnect()
            this.osc2.disconnect()
            this.osc1.connect(this.osc1Env)
            this.osc2.connect(this.osc2Env)
        }
    }

    dispose() {
        this.osc1.dispose(); this.osc1Env.dispose(); this.osc1Direct.dispose(); this.osc1Fx.dispose()
        this.osc2.dispose(); this.osc2Env.dispose(); this.osc2Direct.dispose(); this.osc2Fx.dispose()
        this.osc3.dispose(); this.osc3Env.dispose(); this.osc3Direct.dispose(); this.osc3Fx.dispose()
        this.noise.dispose(); this.noiseEnv.dispose(); this.noiseDirect.dispose(); this.noiseFx.dispose()
        this.fmGain.dispose(); this.amGain.dispose(); this.amNode.dispose(); this.folder.dispose()
    }
}

export class HarmSynth {
    private voicePool: HarmVoice[] = []
    private activeVoices: Set<HarmVoice> = new Set()
    private maxVoices = 16
    private sharedCurve: Float32Array = new Float32Array(4096)
    private lastCurveParams = { timbre: -1, order: -1, harmonics: -1 }

    // Routing
    private fxBus: Tone.Gain | undefined
    private directBus: Tone.Gain | undefined
    private filter1: Tone.Filter | undefined
    private filter2: Tone.Filter | undefined
    public outputGain: Tone.Volume | undefined

    // FX
    private distortion: Tone.Distortion | undefined
    private phaser: Tone.Phaser | undefined
    private chorus: Tone.Chorus | undefined
    private delay: Tone.FeedbackDelay | undefined
    private reverb: Tone.Reverb | undefined

    private settings = {
        osc1: { type: 'sawtooth' as HarmOscType, detune: 0, env: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }, send: 0, enabled: true },
        osc2: { type: 'square' as HarmOscType, detune: 10, env: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }, send: 0, enabled: true },
        osc3: { type: 'triangle' as HarmOscType, detune: -10, env: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }, send: 0, enabled: true },
        noise: { env: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }, send: 0, enabled: true },
        f1: { freq: 2000, q: 1, type: 'lowpass' as BiquadFilterType, enabled: true },
        f2: { freq: 5000, q: 1, type: 'lowpass' as BiquadFilterType, enabled: true },
        complex: {
            complexMode: false, fmIndex: 0, amIndex: 0, timbre: 0.5, order: 0.5, harmonics: 0.5,
            pitchMod: true, ampMod: false, timbreMod: true, modOscRange: 'high' as any,
            modPitch: 0, principalPitch: 0, modOscShape: 'triangle' as any, vcaBypass: false, phaseLock: false
        }
    }

    private initialized = false
    constructor() { }

    public init() {
        if (this.initialized) return
        this.fxBus = new Tone.Gain(1)
        this.directBus = new Tone.Gain(1)
        this.filter1 = new Tone.Filter(this.settings.f1.freq, this.settings.f1.type)
        this.filter2 = new Tone.Filter(this.settings.f2.freq, this.settings.f2.type)
        this.distortion = new Tone.Distortion(0.4)
        this.phaser = new Tone.Phaser({ frequency: 0.5, octaves: 5, baseFrequency: 1000 })
        this.chorus = new Tone.Chorus(4, 2.5, 0.5).start()
        this.delay = new Tone.FeedbackDelay('8n', 0.5)
        this.reverb = new Tone.Reverb(2)
        this.outputGain = new Tone.Volume(0)

        this.directBus.chain(this.filter1, this.filter2, this.outputGain)
        this.fxBus.chain(this.distortion, this.phaser, this.chorus, this.delay, this.reverb, this.outputGain)

        this.recalculateCurve(this.settings.complex.timbre, this.settings.complex.order, this.settings.complex.harmonics)
        for (let i = 0; i < this.maxVoices; i++) {
            this.voicePool.push(new HarmVoice(this.fxBus, this.directBus))
        }
        this.initialized = true
    }

    triggerNote(note: string, duration: string, time: number, velocity: number = 0.8) {
        if (!this.initialized) this.init()

        let voice = this.voicePool.find(v => !this.activeVoices.has(v))

        if (!voice) {
            const sorted = Array.from(this.activeVoices).sort((a, b) => a.startTime - b.startTime)
            voice = sorted[0]
            if (voice) {
                voice.osc1Env.triggerRelease(time)
                this.activeVoices.delete(voice)
            }
        }

        if (voice) {
            this.activeVoices.add(voice)

            voice.osc1.type = this.settings.osc1.type
            voice.osc1.detune.value = this.settings.osc1.detune
            voice.osc1Env.set(this.settings.osc1.env)
            voice.osc1Fx.gain.setValueAtTime(this.settings.osc1.send, time)
            voice.osc1Direct.gain.setValueAtTime(1 - this.settings.osc1.send, time)

            voice.osc2.type = this.settings.osc2.type
            voice.osc2.detune.value = this.settings.osc2.detune
            voice.osc2Env.set(this.settings.osc2.env)
            voice.osc2Fx.gain.setValueAtTime(this.settings.osc2.send, time)
            voice.osc2Direct.gain.setValueAtTime(1 - this.settings.osc2.send, time)

            voice.osc3.type = this.settings.osc3.type
            voice.osc3.detune.value = this.settings.osc3.detune
            voice.osc3Env.set(this.settings.osc3.env)
            voice.osc3Fx.gain.setValueAtTime(this.settings.osc3.send, time)
            voice.osc3Direct.gain.setValueAtTime(1 - this.settings.osc3.send, time)

            voice.noiseEnv.set(this.settings.noise.env)
            voice.noiseFx.gain.setValueAtTime(this.settings.noise.send, time)
            voice.noiseDirect.gain.setValueAtTime(1 - this.settings.noise.send, time)

            this.updateWavefolder(voice, this.settings.complex.timbre, this.settings.complex.order, this.settings.complex.harmonics)

            voice.trigger(note, duration, time, velocity, this.settings)

            const release = Math.max(this.settings.osc1.env.release, this.settings.osc2.env.release, 0.5)
            const dur = Tone.Time(duration).toSeconds()

            setTimeout(() => {
                if (voice!.activeNote === note) this.activeVoices.delete(voice!)
            }, (dur + release) * 1000)
        }
    }

    private recalculateCurve(timbre: number, order: number, harmonics: number) {
        const cTimbre = Math.max(0, Math.min(1, timbre))
        const cOrder = Math.max(0, Math.min(1, order))
        const cHarmonics = Math.max(0, Math.min(1, harmonics))

        const intensities = new Float32Array(4)
        for (let i = 0; i < 4; i++) {
            intensities[i] = Math.max(0, Math.min(1, cOrder * 5 - i))
        }

        const gain = 1 + cTimbre * 10
        const symmetry = (cHarmonics - 0.5) * 0.8
        const curve = new Float32Array(4096)

        for (let j = 0; j < 4096; j++) {
            const val = (j / 2047.5) - 1
            let x = val * gain + symmetry
            for (let i = 0; i < 4; i++) {
                const stageIntensity = intensities[i]
                if (stageIntensity > 0) {
                    let folded = x
                    if (folded > 1) folded = 2 - folded
                    else if (folded < -1) folded = -2 - folded
                    x = (folded * stageIntensity) + (x * (1 - stageIntensity))
                } else {
                    break
                }
            }
            curve[j] = x - symmetry
        }
        this.sharedCurve = curve
        this.lastCurveParams = { timbre: cTimbre, order: cOrder, harmonics: cHarmonics }
    }

    private updateWavefolder(voice: HarmVoice, timbre: number, order: number, harmonics: number) {
        const cTimbre = Math.max(0, Math.min(1, timbre))
        const cOrder = Math.max(0, Math.min(1, order))
        const cHarmonics = Math.max(0, Math.min(1, harmonics))

        if (cTimbre !== this.lastCurveParams.timbre ||
            cOrder !== this.lastCurveParams.order ||
            cHarmonics !== this.lastCurveParams.harmonics) {
            this.recalculateCurve(cTimbre, cOrder, cHarmonics)
        }

        if (voice.currentCurve !== this.sharedCurve) {
            voice.folder.curve = this.sharedCurve
            voice.currentCurve = this.sharedCurve
        }
    }

    setDistortion(drive: number, wet: number) { if (this.distortion) { this.distortion.distortion = drive; this.distortion.wet.value = wet } }
    setPhaser(freq: number, depth: number, stages: number, wet: number) { if (this.phaser) { this.phaser.frequency.value = freq; this.phaser.octaves = stages; this.phaser.wet.value = wet } }
    setChorus(freq: number, delay: number, depth: number, wet: number) { if (this.chorus) { this.chorus.frequency.value = freq; this.chorus.delayTime = delay; this.chorus.depth = depth; this.chorus.wet.value = wet } }
    setDelay(time: string, feedback: number, wet: number) { if (this.delay) { this.delay.delayTime.value = time; this.delay.feedback.value = feedback; this.delay.wet.value = wet } }
    setReverb(decay: number, wet: number) { if (this.reverb) { this.reverb.decay = decay; this.reverb.wet.value = wet } }
    setFilter(idx: 1 | 2, freq: number, q: number, type: BiquadFilterType) { const f = idx === 1 ? this.filter1 : this.filter2; if (f) { f.frequency.value = freq; f.Q.value = q; f.type = type } }
    setVolume(db: number) { this.outputGain?.volume.rampTo(db, 0.1) }
    setOscType(idx: 1 | 2 | 3, type: HarmOscType) { (this.settings as any)[`osc${idx}`].type = type }
    setOscDetune(idx: 1 | 2 | 3, detune: number) { (this.settings as any)[`osc${idx}`].detune = detune }
    setEnv(target: 'osc1' | 'osc2' | 'osc3' | 'noise', params: ADSRParams) { (this.settings as any)[target].env = params }
    setFxSend(idx: 'osc1' | 'osc2' | 'osc3' | 'noise', level: number) { (this.settings as any)[idx].send = level }

    toggleModule(id: 'osc1' | 'osc2' | 'osc3' | 'noise' | 'f1' | 'f2', enabled: boolean) {
        if (id === 'f1' || id === 'f2') {
            (this.settings as any)[id].enabled = enabled
            this.rebuildBypass()
        } else (this.settings as any)[id].enabled = enabled
    }

    private rebuildBypass() {
        if (!this.directBus || !this.filter1 || !this.filter2 || !this.outputGain) return
        this.directBus.disconnect(); this.filter1.disconnect(); this.filter2.disconnect()
        let last: Tone.ToneAudioNode = this.directBus
        if (this.settings.f1.enabled) { last.connect(this.filter1); last = this.filter1 }
        if (this.settings.f2.enabled) { last.connect(this.filter2); last = this.filter2 }
        last.connect(this.outputGain)
    }

    setComplexParams(params: Partial<BuchlaParams>) {
        this.settings.complex = { ...this.settings.complex, ...params }
        this.recalculateCurve(this.settings.complex.timbre, this.settings.complex.order, this.settings.complex.harmonics)
        this.activeVoices.forEach(v => {
            v.folder.curve = this.sharedCurve
            v.currentCurve = this.sharedCurve
        })
    }
}
