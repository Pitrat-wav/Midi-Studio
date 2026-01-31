import * as Tone from 'tone'

export class SamplerInstrument {
    player: Tone.Player
    volume: Tone.Volume
    loaded: boolean = false
    bufferDuration: number = 0

    constructor() {
        this.player = new Tone.Player()
        this.volume = new Tone.Volume(0)
        this.player.connect(this.volume)
    }

    async load(url: string) {
        this.loaded = false
        await this.player.load(url)
        this.loaded = true
        this.bufferDuration = this.player.buffer.duration
        console.log(`[Sampler] Loaded ${url}, duration: ${this.bufferDuration}s`)
    }

    triggerSlice(sliceIndex: number, totalSlices: number, time: number = Tone.now()) {
        if (!this.loaded) return

        const sliceDuration = this.bufferDuration / totalSlices
        const startTime = sliceIndex * sliceDuration

        // Restart if retriggered
        if (this.player.state === 'started') {
            this.player.stop(time)
        }

        this.player.start(time, startTime, sliceDuration)
    }

    setVolume(db: number) {
        this.volume.volume.rampTo(db, 0.1)
    }

    setPlaybackRate(rate: number) {
        this.player.playbackRate = rate
    }

    dispose() {
        this.player.dispose()
        this.volume.dispose()
    }
}
