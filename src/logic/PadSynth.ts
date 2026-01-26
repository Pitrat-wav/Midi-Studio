import * as Tone from 'tone'

export class PadSynth {
    synth: Tone.PolySynth
    filter: Tone.Filter
    reverb: Tone.Reverb

    constructor() {
        this.filter = new Tone.Filter({
            type: 'lowpass',
            frequency: 1000,
            Q: 1
        })

        this.reverb = new Tone.Reverb({
            decay: 4,
            wet: 0.5
        }).toDestination()

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

        this.synth.chain(this.filter, this.reverb)
    }

    triggerChord(notes: string[], duration: string, time: number, velocity: number = 0.4) {
        this.synth.triggerAttackRelease(notes, duration, time, velocity)
    }

    setParams(brightness: number) {
        this.filter.frequency.exponentialRampTo(brightness * 4000 + 200, 0.1)
    }
}
