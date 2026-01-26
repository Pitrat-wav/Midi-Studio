import * as Tone from 'tone'

export class DrumMachine {
    kick: Tone.Player
    snare: Tone.Player
    hihat: Tone.Player
    hihatOpen: Tone.Player
    clap: Tone.Player
    comp: Tone.Compressor
    currentKit: '808' | '909' = '808'

    private kits = {
        '808': {
            kick: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/808/kick.wav",
            snare: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/808/snare.wav",
            hihat: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/808/hihat.wav",
            hihatOpen: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/808/openhat.wav",
            clap: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/808/clap.wav"
        },
        '909': {
            kick: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/909/kick.wav",
            snare: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/909/snare.wav",
            hihat: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/909/hihat.wav",
            hihatOpen: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/909/openhat.wav",
            clap: "https://raw.githubusercontent.com/ryohey/signal/master/public/audio/909/clap.wav"
        }
    }

    constructor() {
        this.comp = new Tone.Compressor(-24, 4).toDestination()

        this.kick = new Tone.Player(this.kits['808'].kick).connect(this.comp)
        this.snare = new Tone.Player(this.kits['808'].snare).connect(this.comp)
        this.hihat = new Tone.Player(this.kits['808'].hihat).connect(this.comp)
        this.hihatOpen = new Tone.Player(this.kits['808'].hihatOpen).connect(this.comp)
        this.clap = new Tone.Player(this.kits['808'].clap).connect(this.comp)
    }

    setKit(kit: '808' | '909') {
        this.currentKit = kit
        this.kick.load(this.kits[kit].kick)
        this.snare.load(this.kits[kit].snare)
        this.hihat.load(this.kits[kit].hihat)
        this.hihatOpen.load(this.kits[kit].hihatOpen)
        this.clap.load(this.kits[kit].clap)
    }

    setDrumParams(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', pitch: number, decay: number) {
        const player = this[drum]
        // Pitch: 0.5 -> 1.0 (normal), 0 -> 0.5, 1 -> 2.0
        player.playbackRate = pitch * 2
        // Decay (using gain envelope simulation or just shortening the sample)
        // Simplified: we'll just use playbackRate for duration for now, 
        // or we could add a GrainPlayer/Envelope if needed.
        // For standard drum hits, pitch handles most of the feel.
    }

    triggerDrum(drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap', time: number, velocity: number = 0.8) {
        this[drum].start(time)
    }
}
