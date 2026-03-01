import * as Tone from 'tone'

export abstract class BaseSynth {
    protected initialized = false
    protected _volume = 0
    public abstract outputGain: Tone.Volume | Tone.Gain | undefined

    public abstract init(): void

    public setVolume(db: number) {
        this._volume = db
        if (this.outputGain) {
            if (this.outputGain instanceof Tone.Volume) {
                this.outputGain.volume.rampTo(db, 0.1)
            } else if (this.outputGain instanceof Tone.Gain) {
                this.outputGain.gain.rampTo(Tone.dbToGain(db), 0.1)
            }
        }
    }

    public dispose() {
        this.outputGain?.dispose()
        this.initialized = false
    }
}
