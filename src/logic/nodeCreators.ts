import * as Tone from 'tone'
import { NodeData } from '../store/nodeStore'

export interface AudioNodeWrapper {
    node: Tone.ToneAudioNode | AudioNode | any
    inputs: Record<string, any>
    outputs?: Record<string, any> // Handle-specific outputs
    meters?: Record<string, Tone.Meter> // Meter for each output handle
    isLogic?: boolean
}

export interface CreationContext {
    createScriptNode: (code: string) => any
    registerAiGenNode: (id: string, meter: Tone.Meter) => void
}

export type NodeCreator = (id: string, data: NodeData, ctx: CreationContext) => AudioNodeWrapper | null

export const NODE_CREATORS: Record<string, NodeCreator> = {
    'audio_osc': (id, data) => {
        const osc = new Tone.Oscillator(data.params.frequency || 440, data.params.type || 'sine').start()
        return {
            node: osc,
            inputs: {
                'freq': osc.frequency,
                'detune': osc.detune,
                'phase': osc.phase as any,
                'fm': osc.frequency
            }
        }
    },
    'audio_filter': (id, data) => {
        const filt = new Tone.Filter(data.params.frequency || 1000, data.params.type || 'lowpass')
        return {
            node: filt,
            inputs: { 'in': filt, 'cutoff': filt.frequency, 'q': filt.Q }
        }
    },
    'audio_lfo': (id, data) => {
        const lfo = new Tone.LFO(data.params.frequency || 1, data.params.min ?? -1, data.params.max ?? 1).start()
        lfo.type = data.params.type || 'sine'
        return {
            node: lfo,
            inputs: { 'freq': lfo.frequency, 'reset': lfo as any }
        }
    },
    'audio_delay': (id, data) => {
        const delay = new Tone.FeedbackDelay(data.params.delayTime || 0.25, data.params.feedback || 0.5)
        return {
            node: delay,
            inputs: { 'in': delay, 'time': delay.delayTime, 'feed': delay.feedback }
        }
    },
    'audio_reverb': (id, data) => {
        const rev = new Tone.Reverb({ decay: data.params.decay || 1.5, preDelay: data.params.preDelay || 0.01 })
        rev.generate()
        return { node: rev, inputs: { 'in': rev } }
    },
    'audio_vca': (id, data) => {
        const gain = new Tone.Gain(data.params.gain || 0)
        return { node: gain, inputs: { 'in': gain, 'cv': gain.gain } }
    },
    'audio_mixer': (id, data) => {
        const merge = new Tone.Gain(1)
        return { node: merge, inputs: { 'in1': merge, 'in2': merge } }
    },
    'io_audio_out': () => ({
        node: Tone.getDestination(),
        inputs: { 'l': Tone.getDestination(), 'r': Tone.getDestination() }
    }),
    'script_js': (id, data, ctx) => {
        const scriptNode = ctx.createScriptNode(data.script || '')
        return { node: scriptNode, inputs: { 'in1': scriptNode } }
    },
    'fx_dist': (id, data) => {
        const dist = new Tone.Distortion(data.params.distortion || 0.4)
        dist.wet.value = data.params.wet || 1
        return { node: dist, inputs: { 'in': dist } }
    },
    'fx_delay': (id, data) => {
        const del = new Tone.FeedbackDelay(data.params.delayTime || 0.25, data.params.feedback || 0.5)
        del.wet.value = data.params.wet || 0.5
        return { node: del, inputs: { 'in': del } }
    },
    'fx_chorus': (id, data) => {
        const chorus = new Tone.Chorus(data.params.frequency || 4, data.params.delayTime || 2.5, data.params.depth || 0.5)
        chorus.start()
        chorus.wet.value = data.params.wet || 0.5
        return { node: chorus, inputs: { 'in': chorus } }
    },
    'fx_reverb': (id, data) => {
        const rev = new Tone.Reverb({ decay: data.params.decay || 1.5, preDelay: data.params.preDelay || 0.01 })
        rev.wet.value = data.params.wet || 0.5
        rev.generate()
        return { node: rev, inputs: { 'in': rev } }
    },
    'audio_phaser': (id, data) => {
        const phaser = new Tone.Phaser({
            frequency: data.params.frequency || 0.5,
            octaves: data.params.octaves || 3,
            baseFrequency: 350
        })
        phaser.wet.value = data.params.wet || 0.5
        return { node: phaser, inputs: { 'in': phaser, 'rate': phaser.frequency } }
    },
    'audio_bitcrusher': (id, data) => {
        const bc = new Tone.BitCrusher(data.params.bits || 4)
        bc.wet.value = data.params.wet || 0.5
        return { node: bc, inputs: { 'in': bc, 'bits': bc.bits } }
    },
    'audio_compressor': (id, data) => {
        const comp = new Tone.Compressor(data.params.threshold || -24, data.params.ratio || 4)
        comp.attack.value = data.params.attack || 0.003
        comp.release.value = data.params.release || 0.25
        return { node: comp, inputs: { 'in': comp } }
    },
    'audio_pan': (id, data) => {
        const panner = new Tone.Panner(data.params.pan || 0)
        return { node: panner, inputs: { 'in': panner, 'pan': panner.pan } }
    },
    'wasm_node': (id, data) => {
        const ctx = Tone.getContext().rawContext
        try {
            const node = new AudioWorkletNode(ctx, 'wasm-processor')
            if (data.params.url) {
                fetch(data.params.url)
                    .then(r => r.arrayBuffer())
                    .then(bytes => {
                        node.port.postMessage({ type: 'init', wasmBytes: bytes })
                    })
                    .catch(err => console.error('WASM Loading Error:', err))
            }
            return { node: node, inputs: { 'in': node } }
        } catch (e) {
            console.error('AudioWorkletNode Creation Error:', e)
            const fallback = new Tone.Gain(1)
            return { node: fallback, inputs: { 'in': fallback } }
        }
    },
    'inst_kick': (id, data) => {
        const kick = new Tone.MembraneSynth({
            pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: data.params.decay || 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
        })
        return { node: kick, inputs: { 'trig': kick } }
    },
    'inst_snare': (id, data) => {
        const snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: data.params.decay || 0.2, sustain: 0 }
        })
        return { node: snare, inputs: { 'trig': snare } }
    },
    'inst_hat': (id, data) => {
        const hat = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: data.params.decay || 0.1, release: 0.01 },
            harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
        })
        hat.frequency.value = data.params.freq || 200
        return { node: hat, inputs: { 'trig': hat } }
    },
    'logic_op': (id, data) => {
        const isMult = data.params.op === 'mul' || data.params.op === '*'
        if (isMult) {
            const mult = new Tone.Multiply(1)
            return { node: mult, inputs: { 'a': mult, 'b': mult.factor, 'in': mult }, isLogic: true }
        } else {
            const add = new Tone.Add(0)
            return { node: add, inputs: { 'a': add, 'b': add.addend, 'in': add }, isLogic: true }
        }
    },
    'logic_math': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            const funcMode = "${data.params.func || 'abs'}";
            function process(inputs, output) {
                 const inp = inputs[0];
                 if (!inp) return;
                 for(let i=0; i<inp.length; i++) {
                     let v = inp[i];
                     if (funcMode === 'abs') v = Math.abs(v);
                     else if (funcMode === 'floor') v = Math.floor(v);
                     else if (funcMode === 'ceil') v = Math.ceil(v);
                     else if (funcMode === 'round') v = Math.round(v);
                     else if (funcMode === 'sin') v = Math.sin(v);
                     else if (funcMode === 'cos') v = Math.cos(v);
                     output[0][i] = v;
                 }
            }
         `)
        return { node: script, inputs: { 'in': script } }
    },
    'logic_value': (id, data) => {
        const sig = new Tone.Signal(data.params.value || 1)
        return { node: sig, inputs: {} }
    },
    'io_midi_in': () => {
        const pitch = new Tone.Signal(0);
        const gate = new Tone.Signal(0);
        const vel = new Tone.Signal(0);
        const onDown = (e: KeyboardEvent) => {
            if (e.repeat) return
            if (e.key === 'a') { pitch.value = 60 / 127; gate.value = 1; vel.value = 0.8; }
            if (e.key === 's') { pitch.value = 62 / 127; gate.value = 1; vel.value = 0.8; }
            if (e.key === 'd') { pitch.value = 64 / 127; gate.value = 1; vel.value = 0.8; }
        }
        const onUp = (e: KeyboardEvent) => { if (['a', 's', 'd'].includes(e.key)) gate.value = 0; }
        window.addEventListener('keydown', onDown)
        window.addEventListener('keyup', onUp);
        (pitch as any)._onDown = onDown;
        (pitch as any)._onUp = onUp;
        return { node: pitch, inputs: {}, outputs: { 'note': pitch, 'gate': gate, 'vel': vel } }
    },
    'logic_clock': (id, data) => {
        const clock = new Tone.PulseOscillator(data.params.bpm ? data.params.bpm / 60 : 2, 0.5).start()
        return { node: clock, inputs: { 'bpm': clock.frequency } }
    },
    'logic_seq': (id, data, ctx) => {
        const seqScript = ctx.createScriptNode(`
            const steps = ${JSON.stringify(data.params.steps || [])};
            function process(inputs, output) {
                output[0][0] = steps[0] ? steps[0].note / 127.0 : 0;
            }
        `)
        return { node: seqScript, inputs: { 'clock': seqScript } }
    },
    'audio_env': (id, data, ctx) => {
        const envScript = ctx.createScriptNode(`
           let state = 0; let level = 0; const params = ${JSON.stringify(data.params)};
           function process(inputs, output) {
               const gate = inputs[0]; const ATTACK = params.attack * 44100; const DECAY = params.decay * 44100;
               for(let i=0; i<output[0].length; i++) {
                   if (gate[i] > 0.5 && state === 0) state = 1;
                   if (gate[i] < 0.5) state = 4;
                   if (state === 1) { level += 1.0 / ATTACK; if (level >= 1.0) { level = 1.0; state = 2; } }
                   else if (state === 2) { level -= (1.0 - params.sustain) / DECAY; if (level <= params.sustain) { level = params.sustain; state = 3; } }
                   else if (state === 4) { level *= 0.999; if (level < 0.001) { level = 0; state = 0; } }
                   output[0][i] = level;
               }
           }
        `)
        return { node: envScript, inputs: { 'gate': envScript } }
    },
    'note_quantizer': (id, data, ctx) => {
        const quantScript = ctx.createScriptNode(`
            function process(inputs, output) {
                for(let i=0; i<inputs[0].length; i++) {
                    const val = inputs[0][i]; output[0][i] = Math.round(val * 12) / 12;
                }
            }
        `)
        return { node: quantScript, inputs: { 'pitch': quantScript } }
    },
    'ai_gen': (id, data, ctx) => {
        const meter = new Tone.Meter({ normalRange: true })
        ctx.registerAiGenNode(id, meter)
        return { node: meter, inputs: { 'trig': meter } }
    },
    'logic_compare': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            function process(inputs, output) {
                const valA = inputs[0] ? inputs[0][0] : 0;
                const valB = inputs[1] ? inputs[1][0] : 0;
                output[0][0] = valA > valB ? 1 : 0;
            }
        `)
        const val = data.params.value || 0.5
        const wrapper = { node: script, inputs: { 'a': script } };
        (script as any)._userProcess = (inB: any, outB: any) => { outB[0][0] = inB[0][0] > val ? 1 : 0 }
        return wrapper
    },
    'logic_random': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let val = 0; let lastTrig = 0;
            function process(inputs, output) {
                const trig = inputs[0][0];
                if (trig > 0.5 && lastTrig < 0.5) val = Math.random();
                lastTrig = trig; output[0][0] = val;
            }
        `)
        return { node: script, inputs: { 'trig': script } }
    },
    'logic_sample_hold': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let val = 0; let lastTrig = 0;
            function process(inputs, output) {
                const trig = inputs[0][0];
                if (trig > 0.5 && lastTrig < 0.5) val = Math.random();
                lastTrig = trig; output[0][0] = val;
            }
        `)
        return { node: script, inputs: { 'trig': script } }
    },
    'note_delay': (id, data) => {
        const delay = new Tone.Delay(data.params.time || 0.25, 1.0)
        return { node: delay, inputs: { 'note': delay, 'time': delay.delayTime } }
    },
    'note_scale': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            function process(inputs, output) { output[0][0] = inputs[0][0]; }
         `)
        return { node: script, inputs: { 'in': script } }
    },
    'logic_euclidean': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let phase = 0; let bucket = 0; let lastClock = 0;
            function process(inputs, output) {
                const stepsC = ${data.params.steps || 16}; const pulsesC = ${data.params.pulses || 4}; const rotate = ${data.params.rotate || 0};
                for(let i=0; i<inputs[0].length; i++) {
                    const clk = inputs[0][i];
                    if (clk > 0.5 && lastClock <= 0.5) {
                        phase = (phase + 1) % stepsC;
                        bucket = ((phase + rotate) * pulsesC) % stepsC < pulsesC ? 1 : 0;
                    }
                    lastClock = clk; output[0][i] = bucket;
                }
            }
        `)
        return { node: script, inputs: { 'clock': script } }
    },
    'visual_scope': () => {
        const wave = new Tone.Waveform(512)
        return { node: wave, inputs: { 'in': wave } }
    },
    'logic_counter': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let count = 0; let lastTrig = 0; let lastReset = 0;
            function process(inputs, output) {
                const trig = inputs[0][0]; const reset = inputs[1] ? inputs[1][0] : 0; const max = ${data.params.max || 16};
                if (reset > 0.5 && lastReset <= 0.5) count = 0;
                if (trig > 0.5 && lastTrig <= 0.5) count = (count + 1) % max;
                lastTrig = trig; lastReset = reset; output[0][0] = count / max;
            }
        `)
        return { node: script, inputs: { 'trig': script, 'reset': script } }
    },
    'logic_toggle': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let state = 0; let lastTrig = 0;
            function process(inputs, output) {
                const trig = inputs[0][0];
                if (trig > 0.5 && lastTrig <= 0.5) state = state === 0 ? 1 : 0;
                lastTrig = trig; output[0][0] = state;
            }
        `)
        return { node: script, inputs: { 'trig': script } }
    },
    'logic_combine': (id, data, ctx) => {
        const mode = data.params.mode || 'AND';
        const script = ctx.createScriptNode(`
            function process(inputs, output) {
                const a = inputs[0][0] > 0.5; const b = inputs[1] ? inputs[1][0] > 0.5 : false;
                let res = false;
                if ("${mode}" === 'AND') res = a && b;
                else if ("${mode}" === 'OR') res = a || b;
                else if ("${mode}" === 'XOR') res = a !== b;
                else if ("${mode}" === 'NAND') res = !(a && b);
                output[0][0] = res ? 1 : 0;
            }
        `)
        return { node: script, inputs: { 'a': script, 'b': script } }
    },
    'note_transpose': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            function process(inputs, output) {
                const pitch = inputs[0][0]; const semi = ${data.params.semi || 0}; const oct = ${data.params.oct || 0};
                const totalShift = (semi + oct * 12) / 127.0;
                output[0][0] = Math.max(0, Math.min(1.0, pitch + totalShift));
            }
        `)
        return { node: script, inputs: { 'in': script } }
    },
    'note_velocity': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            function process(inputs, output) {
                const vel = inputs[0][0]; const gain = ${data.params.gain || 1.0}; const offset = ${data.params.offset || 0.0};
                output[0][0] = Math.max(0, Math.min(1.0, vel * gain + offset));
            }
        `)
        return { node: script, inputs: { 'in': script } }
    },
    'adv_wavefolder': (id, data) => {
        const shaper = new Tone.WaveShaper((val) => {
            const gain = data.params.gain || 2;
            let x = val * gain;
            return Math.sin(x); // Simple Sine Fold
        })
        return { node: shaper, inputs: { 'in': shaper, 'gain': shaper } }
    },
    'adv_chaos': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let x = 0.1, y = 0, z = 0;
            function process(inputs, output) {
                const dt = 0.01; const s = 10, r = 28, b = 2.66;
                const dx = (s * (y - x)) * dt;
                const dy = (x * (r - z) - y) * dt;
                const dz = (x * y - b * z) * dt;
                x += dx; y += dy; z += dz;
                output[0][0] = x * 0.05;
            }
        `)
        return { node: script, inputs: { 'rate': script }, outputs: { 'x': script, 'y': script } }
    },
    'adv_clock_div': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let count = 0; let lastTrigger = 0;
            function process(inputs, output) {
                const trig = inputs[0][0];
                if (trig > 0.5 && lastTrigger <= 0.5) count++;
                lastTrigger = trig;
                output[0][0] = (count % 2 === 0) ? 1 : 0;
            }
        `)
        return { node: script, inputs: { 'in': script }, outputs: { 'out1': script, 'out2': script, 'out3': script } }
    },
    'adv_bernoulli': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let lastTrig = 0; let gate = 0;
            function process(inputs, output) {
                const trig = inputs[0][0];
                if (trig > 0.5 && lastTrig <= 0.5) gate = Math.random() > ${data.params.probability || 0.5} ? 1 : 0;
                lastTrig = trig;
                output[0][0] = gate; // A
                output[1] ? output[1][0] = 1 - gate : null; // B
            }
        `)
        return { node: script, inputs: { 'trig': script }, outputs: { 'a': script, 'b': script } }
    },
    'adv_turing': (id, data, ctx) => {
        const script = ctx.createScriptNode(`
            let register = Array(16).fill(0).map(() => Math.random() > 0.5 ? 1 : 0);
            let lastClk = 0;
            function process(inputs, output) {
                if (inputs[0][0] > 0.5 && lastClk <= 0.5) {
                    if (Math.random() < ${data.params.probability || 0.1}) register[0] = 1 - register[0];
                    register.push(register.shift());
                }
                lastClk = inputs[0][0];
                output[0][0] = register.reduce((a,b) => a+b) / 16;
            }
        `)
        return { node: script, inputs: { 'clock': script } }
    },
    'fx_echo': (id, data) => {
        const echo = new Tone.FeedbackDelay(data.params.delayTime || 0.25, data.params.feedback || 0.5);
        return { node: echo, inputs: { 'in': echo } }
    },
    'fx_graindelay': (id, data) => {
        const gd = new Tone.PitchShift({
            pitch: data.params.pitch || 0,
            windowSize: data.params.grainSize || 0.1,
            feedback: data.params.feedback || 0.4
        });
        return { node: gd, inputs: { 'in': gd } }
    },
    'fx_saturator': (id, data) => {
        const dist = new Tone.Distortion(data.params.drive || 0.5);
        return { node: dist, inputs: { 'in': dist } }
    },
    'fx_limiter': (id, data) => {
        const limit = new Tone.Limiter(data.params.threshold || -1);
        return { node: limit, inputs: { 'in': limit } }
    },
    'fx_platereverb': (id, data) => {
        const plate = new Tone.Reverb({
            decay: data.params.decay || 3,
            preDelay: data.params.preDelay || 0.01
        }).generate();
        return { node: plate, inputs: { 'in': plate } }
    },
    'fx_reduce': (id, data) => {
        const bit = new Tone.BitCrusher(data.params.bits || 8);
        return { node: bit, inputs: { 'in': bit } }
    },
    'fx_phaser_pro': (id, data) => {
        const phaser = new Tone.Phaser({
            frequency: data.params.frequency || 0.5,
            octaves: data.params.stages || 4,
            baseFrequency: data.params.baseFreq || 400
        });
        return { node: phaser, inputs: { 'in': phaser } }
    },
    'fx_flanger': (id, data) => {
        const flanger = new Tone.FeedbackDelay(0.01, 0.5);
        return { node: flanger, inputs: { 'in': flanger } }
    },
    'fx_overdrive': (id, data) => {
        const drive = new Tone.Distortion(data.params.drive || 0.7);
        return { node: drive, inputs: { 'in': drive } }
    },
    'fx_hybrid': (id, data) => {
        const hybrid = new Tone.Reverb(data.params.decay || 4).generate();
        return { node: hybrid, inputs: { 'in': hybrid } }
    },
    'fx_filterdelay': (id, data) => {
        const fd = new Tone.FeedbackDelay(data.params.delayTime || 0.3, data.params.feedback || 0.6);
        const filter = new Tone.Filter(data.params.frequency || 2000, "lowpass");
        fd.connect(filter);
        return { node: fd, inputs: { 'in': fd } }
    },
    'fx_transient': (id, data) => {
        const comp = new Tone.Compressor({ threshold: -10, ratio: 2 });
        return { node: comp, inputs: { 'in': comp } }
    },
    'fx_env_follower': (id, data) => {
        const follower = new Tone.Follower(data.params.smoothing || 0.05);
        return { node: follower, inputs: { 'in': follower }, outputs: { 'cv': follower } }
    },
    'fx_freq_shifter': (id, data) => {
        const shifter = new Tone.PitchShift(data.params.shift / 100);
        return { node: shifter, inputs: { 'in': shifter } }
    },
    'fx_exciter': (id, data) => {
        const highPass = new Tone.Filter(4000, "highpass");
        const dist = new Tone.Distortion(0.5);
        highPass.connect(dist);
        return { node: highPass, inputs: { 'in': highPass } }
    },
    'fx_formant': (id, data) => {
        const filter = new Tone.Filter(1000, "bandpass");
        return { node: filter, inputs: { 'in': filter } }
    },
    'fx_subgen': () => {
        const sub = new Tone.Oscillator(60, "sine").start();
        return { node: sub, inputs: { 'in': new Tone.Gain(0) }, outputs: { 'out': sub } }
    },
    'fx_autopan': (id, data) => {
        const pan = new Tone.AutoPanner(data.params.rate || 0.5).start();
        return { node: pan, inputs: { 'in': pan } }
    },
    'fx_spectral_blur': () => {
        const reverb = new Tone.Freeverb({ roomSize: 0.9, dampening: 3000 });
        return { node: reverb, inputs: { 'in': reverb } }
    },
    'logic_bitwise': () => {
        const gain = new Tone.Gain(1);
        return { node: gain, inputs: { 'in1': gain, 'in2': gain } }
    },
    'visual_spectrum': (id, data) => {
        const analyzer = new Tone.Analyser("fft", data.params.fftSize || 1024);
        return { node: analyzer, inputs: { 'in': analyzer } }
    },
    'adv_macro': (id, data) => {
        const sig = new Tone.Signal(data.params.value || 0.5);
        return { node: sig, inputs: {}, outputs: { 'out1': sig, 'out2': sig } }
    },
    'lib_bass': (id, data) => createLibSynth(data),
    'lib_lead': (id, data) => createLibSynth(data),
    'lib_pad': (id, data) => createLibSynth(data),
    'adv_math_exp': (id, data) => {
        const ctx = Tone.getContext().rawContext
        try {
            const node = new AudioWorkletNode(ctx, 'expression-processor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [2]
            })
            ;(node as any).nodeRole = 'expression'
            node.port.postMessage({ type: 'compile', formula: data.script || 'in1' })
            return {
                node: node,
                inputs: {
                    'in1': node,
                    'in2': node,
                    'in3': node,
                    'in4': node
                }
            }
        } catch (e) {
            console.error('Expression Worklet error', e)
            const fallback = new Tone.Gain(0)
            return { node: fallback, inputs: { 'in': fallback } }
        }
    },
    'adv_fm_op': () => {
        const car = new Tone.Oscillator(440, 'sine').start();
        const mod = new Tone.Oscillator(440, 'sine').start();
        mod.connect(car.frequency);
        return { node: car, inputs: { 'freq': car.frequency, 'mod': mod.frequency } }
    }
}

function createLibSynth(data: NodeData): AudioNodeWrapper {
    const model = data.params.model || 1;
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: model === 1 ? 'sine' : model === 2 ? 'sawtooth' : 'square' } as any,
        envelope: { attack: data.type === 'lib_pad' ? 0.5 : 0.01, release: 1 }
    }).toDestination();
    return { node: synth, inputs: { 'trig': synth, 'note': synth } }
}
