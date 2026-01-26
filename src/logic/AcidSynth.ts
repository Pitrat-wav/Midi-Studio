import * as Tone from 'tone'

export class AcidSynth {
    synth: Tone.MonoSynth
    filter: Tone.Filter
    dist: Tone.Distortion

    constructor() {
        this.filter = new Tone.Filter({
            type: 'lowpass',
            frequency: 400,
            rolloff: -24, // 24dB/oct for that steep acid filter sound
            Q: 1
        })

        this.dist = new Tone.Distortion({
            distortion: 0.5,
            wet: 0.5
        })

        this.synth = new Tone.MonoSynth({
            oscillator: {
                type: 'sawtooth' // Classic acid waveshape
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.1,
                release: 0.1
            },
            filterEnvelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0,
                release: 0.2,
                baseFrequency: 200,
                octaves: 4,
                exponent: 2
            }
        })

        // Connect chain: Synth -> Filter -> Distortion -> Master
        this.synth.chain(this.filter, this.dist, Tone.Destination)
    }

    setOscillatorType(type: 'sawtooth' | 'square') {
        this.synth.oscillator.type = type
    }

    triggerNote(note: string, duration: string, time: number, velocity: number = 0.8, slide: boolean = false, accent: boolean = false, isContinuing: boolean = false) {
        if (accent) {
            this.synth.triggerAttackRelease(note, duration, time, 1.0)
            const originalDecay = Number(this.synth.filterEnvelope.decay)
            this.synth.filterEnvelope.decay = originalDecay * 0.5
            Tone.Draw.schedule(() => {
                this.synth.filterEnvelope.decay = originalDecay
            }, time + 0.1)
        } else if (slide || isContinuing) {
            this.synth.setNote(note, time)
        } else {
            this.synth.triggerAttackRelease(note, duration, time, velocity)
        }
    }

    setParams(cutoff: number, resonance: number, envMod: number, decay: number) {
        this.filter.frequency.value = cutoff
        this.filter.Q.value = resonance
        this.synth.filterEnvelope.octaves = envMod
        this.synth.filterEnvelope.decay = decay
    }
}
