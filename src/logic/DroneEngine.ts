import * as Tone from 'tone'

export class DroneEngine {
    private osc1: Tone.Oscillator | undefined
    private osc2: Tone.Oscillator | undefined
    private subOsc: Tone.Oscillator | undefined
    private fmModulator: Tone.Oscillator | undefined
    private fmGain: Tone.Gain | undefined

    private noise: Tone.Noise | undefined
    private noiseFilter: Tone.Filter | undefined
    private noiseGain: Tone.Gain | undefined

    private filter: Tone.Filter | undefined
    private distortion: Tone.Distortion | undefined
    private chorus: Tone.Chorus | undefined
    private delay: Tone.FeedbackDelay | undefined
    private reverb: Tone.Reverb | undefined
    private output: Tone.Volume | undefined

    // Modulation
    private lfoCutoff: Tone.LFO | undefined
    private lfoDetune: Tone.LFO | undefined
    private lfoPan: Tone.AutoPanner | undefined

    // v2.0 Chaos Mechanisms
    private loop: Tone.Loop | undefined
    private shValue: number = 0
    private initialized = false
    private baseFreq: number = 32.7

    constructor() { }

    public init() {
        if (this.initialized) return

        try {
            this.output = new Tone.Volume(-Infinity).toDestination()

            // 1. Core Synthesis Layer
            this.osc1 = new Tone.Oscillator(this.baseFreq, 'sawtooth').start()
            this.osc2 = new Tone.Oscillator(this.baseFreq * 1.414, 'square').start() // Tritone
            this.subOsc = new Tone.Oscillator(this.baseFreq * 0.5, 'sine').start() // Sub Octave

            // 2. FM Layer (Irrational modulation for metallic grit)
            this.fmModulator = new Tone.Oscillator(this.baseFreq * 2.718, 'sine').start() // e ratio
            this.fmGain = new Tone.Gain(0)
            this.fmModulator.connect(this.fmGain)
            this.fmGain.connect(this.osc1.frequency)
            this.fmGain.connect(this.osc2.frequency)

            // 3. Noise Texture
            this.noise = new Tone.Noise('pink').start()
            this.noiseFilter = new Tone.Filter(1000, 'bandpass')
            this.noiseGain = new Tone.Gain(0)
            this.noise.chain(this.noiseFilter, this.noiseGain)

            // 4. Global Scaping
            this.filter = new Tone.Filter(200, 'lowpass', -24)
            this.distortion = new Tone.Distortion(0.8)
            this.chorus = new Tone.Chorus(4, 2.5, 0.5).start()
            this.delay = new Tone.FeedbackDelay('4n', 0.6)
            this.reverb = new Tone.Reverb(10)
            this.reverb.ready.then(() => console.log("DroneEngine: Reverb ready"))
            this.lfoPan = new Tone.AutoPanner(0.1).start()

            // Routing
            this.osc1.connect(this.filter)
            this.osc2.connect(this.filter)
            this.subOsc.connect(this.filter)
            this.noiseGain.connect(this.filter)

            this.filter.chain(
                this.distortion,
                this.chorus,
                this.lfoPan,
                this.delay,
                this.reverb,
                this.output
            )

            // 5. Advanced Modulation
            this.lfoCutoff = new Tone.LFO(0.012, 100, 2000).start()
            this.lfoCutoff.connect(this.filter.frequency)

            this.lfoDetune = new Tone.LFO(0.05, -10, 10).start()
            this.lfoDetune.connect(this.osc2.detune)

            // 6. Bernoulli Gates & Sample & Hold Loop
            this.loop = new Tone.Loop((time) => {
                // S&H Logic for Cutoff Offset
                if (Math.random() < 0.3) {
                    const offset = Math.random() * 500
                    this.filter?.frequency.rampTo(200 + offset, 0.5)
                }

                // Bernoulli Gate for "Glitch" Distortion - fixed with Tone scheduling
                if (this.distortion && Math.random() < 0.1) {
                    const prevDist = this.distortion.distortion
                    this.distortion.distortion = 1.0

                    // Use Tone timing instead of setTimeout
                    Tone.Transport.scheduleOnce(() => {
                        if (this.distortion) this.distortion.distortion = prevDist
                    }, time + 0.1)
                }
            }, '2n').start(0)

            this.initialized = true
        } catch (e) {
            console.error('DroneEngine: init failed', e)
        }
    }

    public updateParams(params: { intensity: number, fmDepth: number, chaos: number, grit: number, nervousness: number }) {
        if (!this.initialized) return

        const { intensity, fmDepth, chaos, grit, nervousness } = params

        // Intensity (Global Macro)
        if (this.distortion) this.distortion.wet.value = 0.4 + (intensity * 0.6)
        if (this.reverb) this.reverb.wet.value = 0.3 + (intensity * 0.7)

        // FM Depth
        if (this.fmGain) this.fmGain.gain.rampTo(fmDepth * 200, 0.2)

        // Chaos (Loop Interval & Probability)
        if (this.loop) {
            const intervals = ['4n', '8n', '1n', '2n']
            const idx = Math.floor((1 - chaos) * 3)
            this.loop.interval = intervals[idx] || '2n'
        }

        // Grit (Noise & Filter resonance)
        if (this.noiseGain) this.noiseGain.gain.rampTo(grit * 0.2, 0.1)
        if (this.filter) this.filter.Q.value = 1 + (grit * 15)

        // Nervousness (Detune LFO speed)
        if (this.lfoDetune) {
            this.lfoDetune.frequency.rampTo(0.05 + (nervousness * 2), 0.5)
            this.lfoDetune.max = 5 + (nervousness * 45)
        }

        // Filter modulation speed
        if (this.lfoCutoff) {
            this.lfoCutoff.frequency.rampTo(0.01 + (intensity * 0.15) + (chaos * 0.1), 0.5)
        }
    }

    public setBaseNote(note: string) {
        const freq = Tone.Frequency(note).toFrequency()
        this.baseFreq = freq
        if (this.osc1) this.osc1.frequency.rampTo(freq, 2)
        if (this.osc2) this.osc2.frequency.rampTo(freq * 1.414, 2)
        if (this.subOsc) this.subOsc.frequency.rampTo(freq * 0.5, 2)
        if (this.fmModulator) this.fmModulator.frequency.rampTo(freq * 2.718, 5)
    }

    public setEnabled(enabled: boolean) {
        if (!this.initialized) this.init()
        if (this.output) {
            this.output.volume.rampTo(enabled ? 0 : -Infinity, enabled ? 1 : 2)
        }
    }


    public dispose() {
        // Stop loop first
        if (this.loop) {
            this.loop.stop()
            this.loop.dispose()
        }

        // Stop oscillators
        this.osc1?.stop()
        this.osc2?.stop()
        this.subOsc?.stop()
        this.fmModulator?.stop()
        this.noise?.stop()

        // Stop LFOs
        this.lfoCutoff?.stop()
        this.lfoDetune?.stop()

        // Dispose all nodes
        this.osc1?.dispose()
        this.osc2?.dispose()
        this.subOsc?.dispose()
        this.fmModulator?.dispose()
        this.fmGain?.dispose()
        this.noise?.dispose()
        this.noiseFilter?.dispose()
        this.noiseGain?.dispose()
        this.filter?.dispose()
        this.distortion?.dispose()
        this.chorus?.dispose()
        this.delay?.dispose()
        this.reverb?.dispose()
        this.lfoCutoff?.dispose()
        this.lfoDetune?.dispose()
        this.lfoPan?.dispose()
        this.output?.dispose()

        this.initialized = false
    }
}
