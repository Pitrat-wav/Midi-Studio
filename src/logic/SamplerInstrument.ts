import * as Tone from 'tone'
import { BaseSynth } from './BaseSynth'

export class SamplerInstrument extends BaseSynth {
    player: Tone.GrainPlayer | undefined
    public outputGain: Tone.Volume | undefined
    loaded: boolean = false
    bufferDuration: number = 0
    url: string = ''

    constructor() {
        super()
    }

    public init() {
        if (this.initialized) return
        this.player = new Tone.GrainPlayer()
        this.outputGain = new Tone.Volume(this._volume)
        this.player.connect(this.outputGain)

        // Default granular settings
        this.player.grainSize = 0.1
        this.player.overlap = 0.1
        this.initialized = true
    }

    async load(url: string) {
        if (!this.initialized) this.init()
        if (this.url === url) return
        this.loaded = false
        const buffer = await new Tone.ToneAudioBuffer().load(url)
        if (this.player) this.player.buffer = buffer
        this.url = url
        this.loaded = true
        this.bufferDuration = buffer.duration
        console.log(`[Sampler] Loaded ${url}, duration: ${this.bufferDuration}s`)
    }

    triggerSlice(sliceIndex: number, totalSlices: number, time: number = Tone.now()) {
        if (!this.loaded || !this.player) return

        const sliceDuration = this.bufferDuration / totalSlices
        const offset = sliceIndex * sliceDuration

        // GrainPlayer start(time, offset, duration)
        this.player.start(time, offset, sliceDuration)
    }

    setPlaybackRate(rate: number) {
        if (this.player) this.player.playbackRate = rate
    }

    setGranularParams(params: { grainSize?: number, overlap?: number, detune?: number }) {
        if (!this.player) return
        if (params.grainSize !== undefined) this.player.grainSize = params.grainSize
        if (params.overlap !== undefined) this.player.overlap = params.overlap
        if (params.detune !== undefined) this.player.detune = params.detune
    }

    public override dispose() {
        this.player?.dispose()
        super.dispose()
    }
}
