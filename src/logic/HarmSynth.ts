import * as Tone from 'tone'
import { BaseSynth } from './BaseSynth'

export type HarmOscType = 'sawtooth' | 'square' | 'triangle' | 'sine'

export interface ADSRParams {
    attack: number
    decay: number
    sustain: number
    release: number
}

interface VoiceUnit<T extends Tone.Oscillator | Tone.Noise> {
    osc: T
    env: Tone.AmplitudeEnvelope
    direct: Tone.Gain
    fx: Tone.Gain
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

    constructor(fxBus: Tone.ToneAudioNode, directBus: Tone.ToneAudioNode) {
        const u1 = this.createUnit<Tone.Oscillator>('sawtooth', fxBus, directBus)
        this.osc1 = u1.osc; this.osc1Env = u1.env; this.osc1Direct = u1.direct; this.osc1Fx = u1.fx

        const u2 = this.createUnit<Tone.Oscillator>('square', fxBus, directBus)
        this.osc2 = u2.osc; this.osc2Env = u2.env; this.osc2Direct = u2.direct; this.osc2Fx = u2.fx

        const u3 = this.createUnit<Tone.Oscillator>('triangle', fxBus, directBus)
        this.osc3 = u3.osc; this.osc3Env = u3.env; this.osc3Direct = u3.direct; this.osc3Fx = u3.fx

        const un = this.createUnit<Tone.Noise>('noise', fxBus, directBus)
        this.noise = un.osc; this.noiseEnv = un.env; this.noiseDirect = un.direct; this.noiseFx = un.fx

        // Complex Logic
        this.fmGain = new Tone.Gain(0)
        this.amGain = new Tone.Gain(0)
        this.amNode = new Tone.Gain(1)

        this.folder = new Tone.WaveShaper(undefined, 4096)
    }

    private createUnit<T extends Tone.Oscillator | Tone.Noise>(type: HarmOscType | 'noise', fxBus: Tone.ToneAudioNode, directBus: Tone.ToneAudioNode): VoiceUnit<T> {
        const osc = (type === 'noise' ? new Tone.Noise('white').start() : new Tone.Oscillator(440, type).start()) as T
        const env = new Tone.AmplitudeEnvelope()
        const direct = new Tone.Gain(1).connect(directBus)
        const fx = new Tone.Gain(0).connect(fxBus)

        osc.connect(env)
        env.connect(direct)
        env.connect(fx)

        return { osc, env, direct, fx }
    }

    trigger(note: string, duration: string, time: number, velocity: number, settings: any) {
        // Apply oscillator settings
        const oscUnits = [
            { unit: this.osc1, s: settings.osc1, env: this.osc1Env, fx: this.osc1Fx, direct: this.osc1Direct },
            { unit: this.osc2, s: settings.osc2, env: this.osc2Env, fx: this.osc2Fx, direct: this.osc2Direct },
            { unit: this.osc3, s: settings.osc3, env: this.osc3Env, fx: this.osc3Fx, direct: this.osc3Direct }
        ]

        oscUnits.forEach(u => {
            u.unit.type = u.s.type
            u.unit.detune.value = u.s.detune
            u.env.set(u.s.env)
            u.fx.gain.setValueAtTime(u.s.send, time)
            u.direct.gain.setValueAtTime(1 - u.s.send, time)
        })

        // Apply noise settings
        this.noiseEnv.set(settings.noise.env)
        this.noiseFx.gain.setValueAtTime(settings.noise.send, time)
        this.noiseDirect.gain.setValueAtTime(1 - settings.noise.send, time)

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
        const nodes = [
            this.osc1, this.osc1Env, this.osc1Direct, this.osc1Fx,
            this.osc2, this.osc2Env, this.osc2Direct, this.osc2Fx,
            this.osc3, this.osc3Env, this.osc3Direct, this.osc3Fx,
            this.noise, this.noiseEnv, this.noiseDirect, this.noiseFx,
            this.fmGain, this.amGain, this.amNode, this.folder
        ]
        nodes.forEach(n => n.dispose())
    }
}

export class HarmSynth extends BaseSynth {
    private voicePool: HarmVoice[] = []
    private activeVoices: Set<HarmVoice> = new Set()
    private maxVoices = 16

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

    private sharedCurve = new Float32Array(4096)
    private lastCurveParams = { timbre: -1, order: -1, harmonics: -1 }

    constructor() {
        super()
    }

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
        this.outputGain = new Tone.Volume(this._volume)

        this.directBus.chain(this.filter1, this.filter2, this.outputGain)
        this.fxBus.chain(this.distortion, this.phaser, this.chorus, this.delay, this.reverb, this.outputGain)

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

            this.updateWavefolder(voice, this.settings.complex.timbre, this.settings.complex.order, this.settings.complex.harmonics)

            voice.trigger(note, duration, time, velocity, this.settings)

            const release = Math.max(this.settings.osc1.env.release, this.settings.osc2.env.release, 0.5)
            const dur = Tone.Time(duration).toSeconds()

            setTimeout(() => {
                if (voice!.activeNote === note) this.activeVoices.delete(voice!)
            }, (dur + release) * 1000)
        }
    }

    private updateSharedCurve(timbre: number, order: number, harmonics: number) {
        if (timbre === this.lastCurveParams.timbre &&
            order === this.lastCurveParams.order &&
            harmonics === this.lastCurveParams.harmonics) {
            return
        }

        const cTimbre = Math.max(0, Math.min(1, timbre))
        const cOrder = Math.max(0, Math.min(1, order))
        const cHarmonics = Math.max(0, Math.min(1, harmonics))

        for (let i = 0; i < 4096; i++) {
            const val = (i / 4095) * 2 - 1
            let x = val * (1 + cTimbre * 10)
            const symmetry = (cHarmonics - 0.5) * 0.8
            x += symmetry
            for (let j = 0; j < 4; j++) {
                const stageIntensity = Math.max(0, Math.min(1, cOrder * 5 - j))
                if (stageIntensity > 0) {
                    let folded = x
                    if (folded > 1) folded = 2 - folded
                    if (folded < -1) folded = -2 - folded
                    x = (folded * stageIntensity) + (x * (1 - stageIntensity))
                }
            }
            this.sharedCurve[i] = x - symmetry
        }
        this.lastCurveParams = { timbre, order, harmonics }
    }

    private updateWavefolder(voice: HarmVoice, timbre: number, order: number, harmonics: number) {
        this.updateSharedCurve(timbre, order, harmonics)
        voice.folder.curve = this.sharedCurve
    }

    setDistortion(drive: number, wet: number) { if (this.distortion) { this.distortion.distortion = drive; this.distortion.wet.value = wet } }
    setPhaser(freq: number, depth: number, stages: number, wet: number) { if (this.phaser) { this.phaser.frequency.value = freq; this.phaser.octaves = stages; this.phaser.wet.value = wet } }
    setChorus(freq: number, delay: number, depth: number, wet: number) { if (this.chorus) { this.chorus.frequency.value = freq; this.chorus.delayTime = delay; this.chorus.depth = depth; this.chorus.wet.value = wet } }
    setDelay(time: string, feedback: number, wet: number) { if (this.delay) { this.delay.delayTime.value = time; this.delay.feedback.value = feedback; this.delay.wet.value = wet } }
    setReverb(decay: number, wet: number) { if (this.reverb) { this.reverb.decay = decay; this.reverb.wet.value = wet } }
    setFilter(idx: 1 | 2, freq: number, q: number, type: BiquadFilterType) { const f = idx === 1 ? this.filter1 : this.filter2; if (f) { f.frequency.value = freq; f.Q.value = q; f.type = type } }
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
        this.activeVoices.forEach(v => this.updateWavefolder(v, this.settings.complex.timbre, this.settings.complex.order, this.settings.complex.harmonics))
    }

    public override dispose() {
        this.voicePool.forEach(v => v.dispose())
        this.fxBus?.dispose()
        this.directBus?.dispose()
        this.filter1?.dispose()
        this.filter2?.dispose()
        this.distortion?.dispose()
        this.phaser?.dispose()
        this.chorus?.dispose()
        this.delay?.dispose()
        this.reverb?.dispose()
        super.dispose()
    }
}
