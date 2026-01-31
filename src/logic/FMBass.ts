import * as Tone from 'tone'

export class FMBass {
    private synth: Tone.FMSynth | undefined
    private dist: Tone.Distortion | undefined
    private outputGain: Tone.Volume | undefined

    private _harmonicity = 1.5
    private _modulationIndex = 10
    private _volume = 0
    private _attack = 0.01
    private _decay = 0.2

    private initialized = false

    constructor() { }

    public init() {
        if (this.initialized) return

        try {
            this.synth = new Tone.FMSynth({
                harmonicity: this._harmonicity,
                modulationIndex: this._modulationIndex,
                oscillator: { type: "sine" },
                modulation: { type: "square" },
                envelope: {
                    attack: this._attack,
                    decay: this._decay,
                    sustain: 0.1,
                    release: 0.1
                },
                modulationEnvelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0,
                    release: 0.1
                }
            })

            this.dist = new Tone.Distortion(0.2)
            this.outputGain = new Tone.Volume(this._volume)

            this.synth.chain(this.dist, this.outputGain)
            this.initialized = true
        } catch (e) {
            console.error("FMBass: Failed to initialize", e)
        }
    }

    setHarmonicity(v: number) {
        this._harmonicity = v
        if (this.synth) this.synth.harmonicity.value = v
    }

    setModulationIndex(v: number) {
        this._modulationIndex = v
        if (this.synth) this.synth.modulationIndex.value = v
    }

    setParams(harmonicity: number, modIndex: number, attack: number, decay: number) {
        this._harmonicity = harmonicity
        this._modulationIndex = modIndex
        this._attack = attack
        this._decay = decay

        if (this.synth) {
            this.synth.harmonicity.value = harmonicity
            this.synth.modulationIndex.value = modIndex
            this.synth.envelope.attack = attack
            this.synth.envelope.decay = decay
        }
    }

    setVolume(db: number) {
        this._volume = db
        if (this.outputGain) this.outputGain.volume.value = db
    }

    triggerNote(note: string, duration: string, time: number, velocity: number = 0.8) {
        if (!this.initialized) this.init()
        if (!this.synth) return

        try {
            this.synth.triggerAttackRelease(note, duration, time, velocity)
        } catch (e) {
            console.error("FMBass: triggerNote error", e)
        }
    }
}
