import * as Tone from 'tone'
import { BaseSynth } from './BaseSynth'

export class PadSynth extends BaseSynth {
    synth: Tone.PolySynth | undefined
    filter: Tone.Filter | undefined
    reverb: Tone.Reverb | undefined
    public outputGain: Tone.Volume | undefined

    constructor() {
        super()
    }

    public init() {
        if (this.initialized) return

        this.filter = new Tone.Filter({
            type: 'lowpass',
            frequency: 1000,
            Q: 1
        })

        this.reverb = new Tone.Reverb({
            decay: 4,
            wet: 0.5
        })

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: 'fatsawtooth',
                count: 3,
                spread: 30
            },
            envelope: {
                attack: 2,
                decay: 1,
                sustain: 1,
                release: 3
            }
        })
        this.synth.maxPolyphony = 6

        this.outputGain = new Tone.Volume(this._volume)
        this.synth.chain(this.filter, this.reverb, this.outputGain)
        this.initialized = true
    }

    triggerChord(notes: string[], duration: string, time: number, velocity: number = 0.4) {
        if (!this.initialized) this.init()
        this.synth?.triggerAttackRelease(notes, duration, time, velocity)
    }

    setParams(brightness: number) {
        this.filter?.frequency.exponentialRampTo(brightness * 4000 + 200, 0.1)
    }

    public override dispose() {
        this.synth?.dispose()
        this.filter?.dispose()
        this.reverb?.dispose()
        super.dispose()
    }
}
