import * as Tone from 'tone'

export class DrumMachine {
    public kick: Tone.MembraneSynth
    public snare: Tone.NoiseSynth
    public hihat: Tone.NoiseSynth
    public hihatOpen: Tone.NoiseSynth
    public clap: Tone.NoiseSynth
    public ride: Tone.MetalSynth
    comp: Tone.Compressor
    public output: Tone.Volume

    constructor() {
        this.output = new Tone.Volume(0)
        this.comp = new Tone.Compressor(-24, 4).connect(this.output)

        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
        }).connect(this.comp)

        this.snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.2, sustain: 0.02 }
        }).connect(this.comp)

        this.hihat = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
            volume: -10
        }).connect(this.comp)

        this.hihatOpen = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.3 },
            volume: -10
        }).connect(this.comp)

        this.clap = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.005, decay: 0.3, sustain: 0 }
        }).connect(this.comp)

        this.ride = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 1.0, release: 0.2 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5,
            volume: -12
        }).connect(this.comp)
    }

    setVolume(db: number) {
        this.output.volume.value = db
    }

    setKit(kit: '808' | '909') {
        if (kit === '808') {
            this.kick.set({
                pitchDecay: 0.05,
                octaves: 10,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
            })
            this.snare.set({
                noise: { type: 'white' },
                envelope: { attack: 0.005, decay: 0.2, sustain: 0.02 }
            })
            this.hihat.set({ noise: { type: 'white' }, envelope: { decay: 0.05 } })
            this.hihatOpen.set({ noise: { type: 'white' }, envelope: { decay: 0.3 } })
            this.ride.set({ envelope: { decay: 1.0 }, harmonicity: 5.1 })
        } else {
            // 909 Settings
            this.kick.set({
                pitchDecay: 0.02,
                octaves: 4,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 1 }
            })
            this.snare.set({
                noise: { type: 'pink' }, // Pink noise for 909 snare body
                envelope: { attack: 0.001, decay: 0.15, sustain: 0 }
            })
            // 909 Hats are metallic/cymbal-like, but we use NoiseSynth. Use Pink for darker/thicker or modify envelope
            this.hihat.set({ noise: { type: 'pink' }, envelope: { decay: 0.03 } })
            this.hihatOpen.set({ noise: { type: 'pink' }, envelope: { decay: 0.2 } })
            this.ride.set({ envelope: { decay: 2.0 }, harmonicity: 5.1 })
        }
    }

    setDrumParams(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'ride', pitch: number, decay: number) {
        // Simplified mapping for synth params
        if (drum === 'kick') {
            this.kick.envelope.decay = decay
            // pitch mapping if needed
        }
        if (drum === 'hihat' || drum === 'hihatOpen') {
            this[drum].envelope.decay = decay * 0.5
        }
        if (drum === 'ride') {
            this.ride.envelope.decay = decay * 2
        }
    }

    setDrumVolume(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'ride', volume: number) {
        if (this[drum]) {
            this[drum].volume.value = volume
        }
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'ride', time: number, velocity: number = 0.8) {
        if (drum === 'kick') this.kick.triggerAttackRelease('C1', '8n', time, velocity)
        else if (drum === 'snare') this.snare.triggerAttackRelease('8n', time, velocity)
        else if (drum === 'hihat') this.hihat.triggerAttackRelease('32n', time, velocity)
        else if (drum === 'hihatOpen') this.hihatOpen.triggerAttackRelease('16n', time, velocity)
        else if (drum === 'clap') this.clap.triggerAttackRelease('8n', time, velocity)
        else if (drum === 'ride') this.ride.triggerAttackRelease('16n', time, velocity)
    }
}
