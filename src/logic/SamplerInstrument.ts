import * as Tone from 'tone'

export class SamplerInstrument {
    player: Tone.GrainPlayer
    volume: Tone.Volume
    loaded: boolean = false
    bufferDuration: number = 0
    url: string = ''

    constructor() {
        this.player = new Tone.GrainPlayer()
        this.volume = new Tone.Volume(0)
        this.player.connect(this.volume)

        // Default granular settings
        this.player.grainSize = 0.1
        this.player.overlap = 0.1
    }

    async load(url: string) {
        if (this.url === url) return
        this.loaded = false
        const buffer = await new Tone.ToneAudioBuffer().load(url)
        this.player.buffer = buffer
        this.url = url
        this.loaded = true
        this.bufferDuration = buffer.duration
        console.log(`[Sampler] Loaded ${url}, duration: ${this.bufferDuration}s`)
    }

    triggerSlice(sliceIndex: number, totalSlices: number, time: number = Tone.now()) {
        if (!this.loaded) return

        const sliceDuration = this.bufferDuration / totalSlices
        const offset = sliceIndex * sliceDuration

        // GrainPlayer start(time, offset, duration)
        this.player.start(time, offset, sliceDuration)
    }

    setVolume(db: number) {
        this.volume.volume.rampTo(db, 0.1)
    }

    setPlaybackRate(rate: number) {
        this.player.playbackRate = rate
    }

    setGranularParams(params: { grainSize?: number, overlap?: number, detune?: number }) {
        if (params.grainSize !== undefined) this.player.grainSize = params.grainSize
        if (params.overlap !== undefined) this.player.overlap = params.overlap
        if (params.detune !== undefined) this.player.detune = params.detune
    }

    dispose() {
        this.player.dispose()
        this.volume.dispose()
    }
}
