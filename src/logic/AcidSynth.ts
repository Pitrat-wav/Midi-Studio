import * as Tone from 'tone'

export class AcidSynth {
    private synth: Tone.PolySynth<Tone.MonoSynth> | undefined
    private dist: Tone.Distortion | undefined
    private outputGain: Tone.Volume | undefined

    private _cutoff = 400
    private _resonance = 1
    private _envMod = 0.5
    private _decay = 0.2
    private _oscType: "sawtooth" | "square" | "sine" = "sawtooth"
    private _volume = 0
    private _slideTime = 0.1
    private _distortionAmount = 0.4

    private initialized = false

    constructor() { }

    public init() {
        if (this.initialized) return
        console.log("AcidSynth: Initializing Tone.PolySynth engine")

        try {
            this.synth = new Tone.PolySynth(Tone.MonoSynth, {
                oscillator: {
                    type: this._oscType === 'sine' ? 'triangle' : this._oscType
                },
                envelope: {
                    attack: 0.005,
                    decay: this._decay,
                    sustain: 0.1,
                    release: 0.1
                },
                filter: {
                    Q: this._resonance,
                    type: "lowpass",
                    rolloff: -24
                },
                filterEnvelope: {
                    attack: 0.005,
                    decay: this._decay,
                    sustain: 0,
                    release: 0.1,
                    baseFrequency: this._cutoff,
                    octaves: this._envMod * 4,
                    exponent: 2
                }
            })

            this.synth.maxPolyphony = 8

            this.dist = new Tone.Distortion(this._distortionAmount)
            this.outputGain = new Tone.Volume(this._volume)

            this.synth.chain(this.dist, this.outputGain)
            this.initialized = true
        } catch (e) {
            console.error("AcidSynth: Failed to initialize", e)
        }
    }

    setOscillatorType(type: 'sawtooth' | 'square' | 'sine') {
        this._oscType = type
        if (this.synth) {
            this.synth.set({
                oscillator: {
                    type: type === 'sine' ? 'triangle' : type
                }
            })
        }
    }

    setCutoff(v: number) {
        this._cutoff = v
        if (this.synth) {
            this.synth.set({
                filterEnvelope: {
                    baseFrequency: v
                }
            })
            // Manually update filter frequency for all voices safely
            const polySynth = this.synth as any
            if (polySynth.voices) {
                polySynth.voices.forEach((vce: any) => {
                    if (vce.filter) vce.filter.frequency.value = v
                })
            }
        }
    }

    setResonance(v: number) {
        this._resonance = v
        if (this.synth) {
            this.synth.set({
                filter: {
                    Q: v
                }
            })
        }
    }

    setSlide(v: number) {
        this._slideTime = v
    }

    setDistortion(v: number) {
        this._distortionAmount = v
        if (this.dist) {
            this.dist.distortion = v
        }
    }

    setVolume(db: number) {
        this._volume = db
        if (this.outputGain) {
            this.outputGain.volume.value = db
        }
    }

    setParams(cutoff: number, resonance: number, envMod: number = 0.5, decay: number = 0.2) {
        this._cutoff = cutoff
        this._resonance = resonance
        this._envMod = envMod
        this._decay = decay

        if (this.synth) {
            this.synth.set({
                filter: { Q: resonance },
                filterEnvelope: {
                    baseFrequency: cutoff,
                    octaves: envMod * 4,
                    decay: decay
                },
                envelope: { decay: decay }
            })
            const polySynth = this.synth as any
            if (polySynth.voices) {
                polySynth.voices.forEach((vce: any) => {
                    if (vce.filter) vce.filter.frequency.value = cutoff
                })
            }
        }
    }

    triggerNote(note: string | string[], duration: string, time: number, velocity: number = 0.8, slide: boolean = false, accent: boolean = false, isContinuing: boolean = false) {
        if (!this.initialized) this.init()
        if (!this.synth) return

        const vel = accent ? Math.min(velocity * 1.5, 1) : velocity

        try {
            this.synth.triggerAttackRelease(note, duration, time, vel)

            if (accent && this.synth) {
                const originalCutoff = this._cutoff
                const polySynth = this.synth as any
                if (polySynth.voices) {
                    polySynth.voices.forEach((vce: any) => {
                        if (vce.filter) {
                            vce.filter.frequency.exponentialRampTo(originalCutoff * 3, 0.01, time)
                            vce.filter.frequency.exponentialRampTo(originalCutoff, 0.2, time + 0.01)
                        }
                    })
                }
            }
        } catch (e) {
            console.error("AcidSynth: triggerNote error", e)
        }
    }
}
