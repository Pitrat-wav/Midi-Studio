import * as Tone from 'tone'
import { useNodeStore, NodeData, NodeType } from '../store/nodeStore'
import { Edge, Node } from 'reactflow'

// Map visual Node IDs to Tone AudioNodes AND their inputs
interface AudioNodeWrapper {
    node: Tone.ToneAudioNode | AudioNode | any
    inputs: Record<string, any>
    outputs?: Record<string, any> // Handle-specific outputs
    meters?: Record<string, Tone.Meter> // Meter for each output handle
    isLogic?: boolean
}

const audioNodes = new Map<string, AudioNodeWrapper>()

export class GraphEngine {
    static initialized = false
    private static roverAnalyser: Tone.Waveform | null = null
    private static currentRoverSource: any = null
    private static activeConnections = new Map<string, { sourceNode: any, targetInput: any }>()

    static getRoverAnalyser() {
        if (!this.roverAnalyser) this.roverAnalyser = new Tone.Waveform(128)
        return this.roverAnalyser
    }
    static async initWorklet() {
        const ctx = Tone.getContext().rawContext
        try {
            // Note: In development we use the source path. In build we might need a different strategy.
            await ctx.audioWorklet.addModule('/src/audio/worklets/WasmProcessor.js')
            await ctx.audioWorklet.addModule('/src/audio/worklets/ExpressionProcessor.js')
            console.log('✅ AudioWorklet: Engines loaded')
        } catch (e) {
            console.warn('⚠️ AudioWorklet: Failed to load WasmProcessor. WebGL Studio will fallback to JS DSP.', e)
        }
    }

    static unsubscribe: () => void

    static init() {
        if (this.initialized) return
        this.initialized = true
        console.log('🔌 GraphEngine: Initializing Deep Core DSP...')
        this.initWorklet()

        this.unsubscribe = useNodeStore.subscribe((state, prevState) => {
            // 1. Manage Nodes
            const currentIds = new Set(state.nodes.map(n => n.id))
            const prevIds = new Set(prevState.nodes.map(n => n.id))

            // Cleanup removed
            prevState.nodes.forEach(n => {
                if (!currentIds.has(n.id)) this.destroyNode(n.id)
            })

            // Create new
            state.nodes.forEach(n => {
                if (!prevIds.has(n.id)) {
                    this.createNode(n.id, n.data)
                } else {
                    // Update Params
                    const prevNode = prevState.nodes.find(p => p.id === n.id)
                    // Check params change
                    if (prevNode && JSON.stringify(prevNode.data.params) !== JSON.stringify(n.data.params)) {
                        this.updateParams(n.id, n.data.params)
                    }
                    // Check script change
                    if (prevNode && prevNode.data.script !== n.data.script) {
                        this.updateScript(n.id, n.data.script || '')
                    }
                }
            })

            // 2. Rebuild Connections
            const edgesChanged = JSON.stringify(state.edges) !== JSON.stringify(prevState.edges)
            const portalParamsChanged = state.nodes.some((n) => {
                const prev = prevState.nodes.find(p => p.id === n.id)
                return prev && (n.data.params.portalId !== prev.data.params.portalId)
            })

            if (edgesChanged || portalParamsChanged) {
                this.rebuildConnections(state.nodes, state.edges)
            }
        })
    }

    static createScriptNode(code: string) {
        const ctx = Tone.getContext().rawContext
        const scriptNode = ctx.createScriptProcessor(1024, 1, 1)
        const memory = new Float32Array(1024)

        try {
            // Create reusable process function from string
            const factory = new Function('memory', 'console', `
                ${code}
                return { init: typeof init !== 'undefined' ? init : null, process: typeof process !== 'undefined' ? process : null }
             `)
            const lib = factory(memory, console)
            if (lib.init && typeof lib.init === 'function') lib.init()
                ; (scriptNode as any)._userProcess = lib.process
        } catch (e) {
            console.error('Built-in Script Error', e)
        }

        (scriptNode as any)._memory = memory
        scriptNode.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0)
            const output = e.outputBuffer.getChannelData(0)
            const proc = (scriptNode as any)._userProcess
            if (proc) {
                try { proc(input, output) } catch (err) { (scriptNode as any)._userProcess = null }
            } else {
                output.set(input) // Passthrough if failed
            }
        }
        return scriptNode
    }

    static createNode(id: string, data: NodeData) {
        try {
            let wrapper: AudioNodeWrapper | null = null

            // --- AUDIO NODES ---
            if (data.type === 'audio_osc') {
                const osc = new Tone.Oscillator(data.params.frequency || 440, data.params.type || 'sine').start()
                wrapper = {
                    node: osc,
                    inputs: {
                        'freq': osc.frequency,
                        'detune': osc.detune,
                        'phase': osc.phase as any,
                        'fm': osc.frequency
                    }
                }
            }
            else if (data.type === 'audio_filter') {
                const filt = new Tone.Filter(data.params.frequency || 1000, data.params.type || 'lowpass')
                wrapper = {
                    node: filt,
                    inputs: { 'in': filt, 'cutoff': filt.frequency, 'q': filt.Q }
                }
            }
            else if (data.type === 'audio_lfo') {
                const lfo = new Tone.LFO(data.params.frequency || 1, data.params.min ?? -1, data.params.max ?? 1).start()
                lfo.type = data.params.type || 'sine'
                wrapper = {
                    node: lfo,
                    inputs: { 'freq': lfo.frequency, 'reset': lfo as any }
                }
            }
            else if (data.type === 'audio_delay') {
                const delay = new Tone.FeedbackDelay(data.params.delayTime || 0.25, data.params.feedback || 0.5)
                wrapper = {
                    node: delay,
                    inputs: { 'in': delay, 'time': delay.delayTime, 'feed': delay.feedback }
                }
            }
            else if (data.type === 'audio_reverb') {
                const rev = new Tone.Reverb({ decay: data.params.decay || 1.5, preDelay: data.params.preDelay || 0.01 })
                rev.generate()
                wrapper = { node: rev, inputs: { 'in': rev } }
            }
            else if (data.type === 'audio_vca') {
                const gain = new Tone.Gain(data.params.gain || 0)
                wrapper = { node: gain, inputs: { 'in': gain, 'cv': gain.gain } }
            }
            else if (data.type === 'audio_mixer') {
                const merge = new Tone.Gain(1)
                wrapper = { node: merge, inputs: { 'in1': merge, 'in2': merge } }
            }
            else if (data.type === 'io_audio_out') {
                wrapper = {
                    node: Tone.getDestination(),
                    inputs: { 'l': Tone.getDestination(), 'r': Tone.getDestination() }
                }
            }
            else if (data.type === 'script_js') {
                const scriptNode = this.createScriptNode(data.script || '')
                wrapper = { node: scriptNode, inputs: { 'in1': scriptNode } }
            }
            else if (data.type === 'fx_dist') {
                const dist = new Tone.Distortion(data.params.distortion || 0.4)
                dist.wet.value = data.params.wet || 1
                wrapper = { node: dist, inputs: { 'in': dist } }
            }
            else if (data.type === 'fx_delay') {
                const del = new Tone.FeedbackDelay(data.params.delayTime || 0.25, data.params.feedback || 0.5)
                del.wet.value = data.params.wet || 0.5
                wrapper = { node: del, inputs: { 'in': del } }
            }
            else if (data.type === 'fx_chorus') {
                const chorus = new Tone.Chorus(data.params.frequency || 4, data.params.delayTime || 2.5, data.params.depth || 0.5)
                chorus.start()
                chorus.wet.value = data.params.wet || 0.5
                wrapper = { node: chorus, inputs: { 'in': chorus } }
            }
            else if (data.type === 'fx_reverb') {
                const rev = new Tone.Reverb({ decay: data.params.decay || 1.5, preDelay: data.params.preDelay || 0.01 })
                rev.wet.value = data.params.wet || 0.5
                rev.generate()
                wrapper = { node: rev, inputs: { 'in': rev } }
            }
            else if (data.type === 'audio_phaser') {
                const phaser = new Tone.Phaser({
                    frequency: data.params.frequency || 0.5,
                    octaves: data.params.octaves || 3,
                    baseFrequency: 350
                })
                phaser.wet.value = data.params.wet || 0.5
                wrapper = { node: phaser, inputs: { 'in': phaser, 'rate': phaser.frequency } }
            }
            else if (data.type === 'audio_bitcrusher') {
                const bc = new Tone.BitCrusher(data.params.bits || 4)
                bc.wet.value = data.params.wet || 0.5
                wrapper = { node: bc, inputs: { 'in': bc, 'bits': bc.bits } }
            }
            else if (data.type === 'audio_compressor') {
                const comp = new Tone.Compressor(data.params.threshold || -24, data.params.ratio || 4)
                comp.attack.value = data.params.attack || 0.003
                comp.release.value = data.params.release || 0.25
                wrapper = { node: comp, inputs: { 'in': comp } }
            }
            else if (data.type === 'audio_pan') {
                const panner = new Tone.Panner(data.params.pan || 0)
                wrapper = { node: panner, inputs: { 'in': panner, 'pan': panner.pan } }
            }
            else if (data.type === 'wasm_node') {
                const ctx = Tone.getContext().rawContext
                try {
                    const node = new AudioWorkletNode(ctx, 'wasm-processor')
                    // Load WASM if URL provided
                    if (data.params.url) {
                        fetch(data.params.url)
                            .then(r => r.arrayBuffer())
                            .then(bytes => {
                                node.port.postMessage({ type: 'init', wasmBytes: bytes })
                            })
                            .catch(err => console.error('WASM Loading Error:', err))
                    }
                    wrapper = { node: node, inputs: { 'in': node } }
                } catch (e) {
                    console.error('AudioWorkletNode Creation Error:', e)
                    // Fallback to gain (silent or passthrough)
                    const fallback = new Tone.Gain(1)
                    wrapper = { node: fallback, inputs: { 'in': fallback } }
                }
            }
            else if (data.type === 'inst_kick') {
                const kick = new Tone.MembraneSynth({
                    pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' },
                    envelope: { attack: 0.001, decay: data.params.decay || 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
                })
                wrapper = { node: kick, inputs: { 'trig': kick } }
            }
            else if (data.type === 'inst_snare') {
                const snare = new Tone.NoiseSynth({
                    noise: { type: 'white' },
                    envelope: { attack: 0.005, decay: data.params.decay || 0.2, sustain: 0 }
                })
                wrapper = { node: snare, inputs: { 'trig': snare } }
            }
            else if (data.type === 'inst_hat') {
                const hat = new Tone.MetalSynth({
                    envelope: { attack: 0.001, decay: data.params.decay || 0.1, release: 0.01 },
                    harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5
                })
                hat.frequency.value = data.params.freq || 200
                wrapper = { node: hat, inputs: { 'trig': hat } }
            }
            else if (data.type === 'logic_op') {
                const isMult = data.params.op === 'mul' || data.params.op === '*'
                if (isMult) {
                    const mult = new Tone.Multiply(1)
                    wrapper = { node: mult, inputs: { 'a': mult, 'b': mult.factor, 'in': mult }, isLogic: true }
                } else {
                    const add = new Tone.Add(0)
                    wrapper = { node: add, inputs: { 'a': add, 'b': add.addend, 'in': add }, isLogic: true }
                }
            }
            else if (data.type === 'logic_math') {
                const script = this.createScriptNode(`
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
                wrapper = { node: script, inputs: { 'in': script } }
            }
            else if (data.type === 'logic_value') {
                const sig = new Tone.Signal(data.params.value || 1)
                wrapper = { node: sig, inputs: {} }
            }
            else if (data.type === 'io_midi_in') {
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
                wrapper = { node: pitch, inputs: {}, outputs: { 'note': pitch, 'gate': gate, 'vel': vel } }
            }
            else if (data.type === 'logic_clock') {
                const clock = new Tone.PulseOscillator(data.params.bpm ? data.params.bpm / 60 : 2, 0.5).start()
                wrapper = { node: clock, inputs: { 'bpm': clock.frequency } }
            }
            else if (data.type === 'logic_seq') {
                const seqScript = this.createScriptNode(`
                    const steps = ${JSON.stringify(data.params.steps || [])};
                    function process(inputs, output) {
                        output[0][0] = steps[0] ? steps[0].note / 127.0 : 0; 
                    }
                `)
                wrapper = { node: seqScript, inputs: { 'clock': seqScript } }
            }
            else if (data.type === 'audio_env') {
                const envScript = this.createScriptNode(`
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
                wrapper = { node: envScript, inputs: { 'gate': envScript } }
            }
            else if (data.type === 'note_quantizer') {
                const quantScript = this.createScriptNode(`
                    function process(inputs, output) {
                        for(let i=0; i<inputs[0].length; i++) {
                            const val = inputs[0][i]; output[0][i] = Math.round(val * 12) / 12; 
                        }
                    }
                `)
                wrapper = { node: quantScript, inputs: { 'pitch': quantScript } }
            }
            else if (data.type === 'ai_gen') {
                const meter = new Tone.Meter({ normalRange: true })
                const interval = setInterval(() => {
                    const val = meter.getValue() as number;
                    if (val > 0.5 && !(meter as any)._wasTriggered) {
                        (meter as any)._wasTriggered = true;
                        window.dispatchEvent(new CustomEvent('AI_GEN_TRIGGER', { detail: { id } }));
                    }
                    if (val < 0.5) (meter as any)._wasTriggered = false;
                }, 100)
                wrapper = { node: meter, inputs: { 'trig': meter } };
                (meter as any)._interval = interval
            }
            else if (data.type === 'logic_compare') {
                const script = this.createScriptNode(`
                    function process(inputs, output) {
                        const valA = inputs[0] ? inputs[0][0] : 0;
                        const valB = inputs[1] ? inputs[1][0] : 0; 
                        output[0][0] = valA > valB ? 1 : 0;
                    }
                `)
                const val = data.params.value || 0.5
                wrapper = { node: script, inputs: { 'a': script } };
                (script as any)._userProcess = (inB: any, outB: any) => { outB[0][0] = inB[0][0] > val ? 1 : 0 }
            }
            else if (data.type === 'logic_random') {
                const script = this.createScriptNode(`
                    let val = 0; let lastTrig = 0;
                    function process(inputs, output) {
                        const trig = inputs[0][0];
                        if (trig > 0.5 && lastTrig < 0.5) val = Math.random();
                        lastTrig = trig; output[0][0] = val;
                    }
                `)
                wrapper = { node: script, inputs: { 'trig': script } }
            }
            else if (data.type === 'logic_sample_hold') {
                const script = this.createScriptNode(`
                    let val = 0; let lastTrig = 0;
                    function process(inputs, output) {
                        const trig = inputs[0][0];
                        if (trig > 0.5 && lastTrig < 0.5) val = Math.random();
                        lastTrig = trig; output[0][0] = val;
                    }
                `)
                wrapper = { node: script, inputs: { 'trig': script } }
            }
            else if (data.type === 'note_delay') {
                const delay = new Tone.Delay(data.params.time || 0.25, 1.0)
                wrapper = { node: delay, inputs: { 'note': delay, 'time': delay.delayTime } }
            }
            else if (data.type === 'note_scale') {
                const script = this.createScriptNode(`
                    function process(inputs, output) { output[0][0] = inputs[0][0]; }
                 `)
                wrapper = { node: script, inputs: { 'in': script } }
            }
            else if (data.type === 'logic_euclidean') {
                const script = this.createScriptNode(`
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
                wrapper = { node: script, inputs: { 'clock': script } }
            }
            else if (data.type === 'visual_scope') {
                const wave = new Tone.Waveform(512)
                wrapper = { node: wave, inputs: { 'in': wave } }
            }
            else if (data.type === 'logic_counter') {
                const script = this.createScriptNode(`
                    let count = 0; let lastTrig = 0; let lastReset = 0;
                    function process(inputs, output) {
                        const trig = inputs[0][0]; const reset = inputs[1] ? inputs[1][0] : 0; const max = ${data.params.max || 16};
                        if (reset > 0.5 && lastReset <= 0.5) count = 0;
                        if (trig > 0.5 && lastTrig <= 0.5) count = (count + 1) % max;
                        lastTrig = trig; lastReset = reset; output[0][0] = count / max; 
                    }
                `)
                wrapper = { node: script, inputs: { 'trig': script, 'reset': script } }
            }
            else if (data.type === 'logic_toggle') {
                const script = this.createScriptNode(`
                    let state = 0; let lastTrig = 0;
                    function process(inputs, output) {
                        const trig = inputs[0][0];
                        if (trig > 0.5 && lastTrig <= 0.5) state = state === 0 ? 1 : 0;
                        lastTrig = trig; output[0][0] = state;
                    }
                `)
                wrapper = { node: script, inputs: { 'trig': script } }
            }
            else if (data.type === 'logic_combine') {
                const mode = data.params.mode || 'AND';
                const script = this.createScriptNode(`
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
                wrapper = { node: script, inputs: { 'a': script, 'b': script } }
            }
            else if (data.type === 'note_transpose') {
                const script = this.createScriptNode(`
                    function process(inputs, output) {
                        const pitch = inputs[0][0]; const semi = ${data.params.semi || 0}; const oct = ${data.params.oct || 0};
                        const totalShift = (semi + oct * 12) / 127.0;
                        output[0][0] = Math.max(0, Math.min(1.0, pitch + totalShift));
                    }
                `)
                wrapper = { node: script, inputs: { 'in': script } }
            }
            else if (data.type === 'note_velocity') {
                const script = this.createScriptNode(`
                    function process(inputs, output) {
                        const vel = inputs[0][0]; const gain = ${data.params.gain || 1.0}; const offset = ${data.params.offset || 0.0};
                        output[0][0] = Math.max(0, Math.min(1.0, vel * gain + offset));
                    }
                `)
                wrapper = { node: script, inputs: { 'in': script } }
            }
            else if (data.type === 'adv_wavefolder') {
                const shaper = new Tone.WaveShaper((val) => {
                    const gain = data.params.gain || 2;
                    let x = val * gain;
                    return Math.sin(x); // Simple Sine Fold
                })
                wrapper = { node: shaper, inputs: { 'in': shaper, 'gain': shaper } }
            }
            else if (data.type === 'adv_chaos') {
                const script = this.createScriptNode(`
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
                wrapper = { node: script, inputs: { 'rate': script }, outputs: { 'x': script, 'y': script } }
            }
            else if (data.type === 'adv_clock_div') {
                const script = this.createScriptNode(`
                    let count = 0; let lastTrigger = 0;
                    function process(inputs, output) {
                        const trig = inputs[0][0];
                        if (trig > 0.5 && lastTrigger <= 0.5) count++;
                        lastTrigger = trig;
                        output[0][0] = (count % 2 === 0) ? 1 : 0;
                    }
                `)
                wrapper = { node: script, inputs: { 'in': script }, outputs: { 'out1': script, 'out2': script, 'out3': script } }
            }
            else if (data.type === 'adv_bernoulli') {
                const script = this.createScriptNode(`
                    let lastTrig = 0; let gate = 0;
                    function process(inputs, output) {
                        const trig = inputs[0][0];
                        if (trig > 0.5 && lastTrig <= 0.5) gate = Math.random() > ${data.params.probability || 0.5} ? 1 : 0;
                        lastTrig = trig;
                        output[0][0] = gate; // A
                        output[1] ? output[1][0] = 1 - gate : null; // B
                    }
                `)
                wrapper = { node: script, inputs: { 'trig': script }, outputs: { 'a': script, 'b': script } }
            }
            else if (data.type === 'adv_turing') {
                const script = this.createScriptNode(`
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
                wrapper = { node: script, inputs: { 'clock': script } }
            }
            else if (data.type === 'fx_echo') {
                const echo = new Tone.FeedbackDelay(data.params.delayTime || 0.25, data.params.feedback || 0.5);
                wrapper = { node: echo, inputs: { 'in': echo } }
            }
            else if (data.type === 'fx_graindelay') {
                const gd = new Tone.PitchShift({
                    pitch: data.params.pitch || 0,
                    windowSize: data.params.grainSize || 0.1,
                    feedback: data.params.feedback || 0.4
                });
                wrapper = { node: gd, inputs: { 'in': gd } }
            }
            else if (data.type === 'fx_saturator') {
                const dist = new Tone.Distortion(data.params.drive || 0.5);
                wrapper = { node: dist, inputs: { 'in': dist } }
            }
            else if (data.type === 'fx_limiter') {
                const limit = new Tone.Limiter(data.params.threshold || -1);
                wrapper = { node: limit, inputs: { 'in': limit } }
            }
            else if (data.type === 'fx_platereverb') {
                const plate = new Tone.Reverb({
                    decay: data.params.decay || 3,
                    preDelay: data.params.preDelay || 0.01
                }).generate();
                wrapper = { node: plate, inputs: { 'in': plate } }
            }
            else if (data.type === 'fx_reduce') {
                const bit = new Tone.BitCrusher(data.params.bits || 8);
                wrapper = { node: bit, inputs: { 'in': bit } }
            }
            else if (data.type === 'fx_phaser_pro') {
                const phaser = new Tone.Phaser({
                    frequency: data.params.frequency || 0.5,
                    octaves: data.params.stages || 4,
                    baseFrequency: data.params.baseFreq || 400
                });
                wrapper = { node: phaser, inputs: { 'in': phaser } }
            }
            else if (data.type === 'fx_flanger') {
                const flanger = new Tone.FeedbackDelay(0.01, 0.5); // Using Delay for manual Flanger
                wrapper = { node: flanger, inputs: { 'in': flanger } }
            }
            else if (data.type === 'fx_overdrive') {
                const drive = new Tone.Distortion(data.params.drive || 0.7);
                wrapper = { node: drive, inputs: { 'in': drive } }
            }
            else if (data.type === 'fx_hybrid') {
                const hybrid = new Tone.Reverb(data.params.decay || 4).generate();
                wrapper = { node: hybrid, inputs: { 'in': hybrid } }
            }
            else if (data.type === 'fx_filterdelay') {
                const fd = new Tone.FeedbackDelay(data.params.delayTime || 0.3, data.params.feedback || 0.6);
                const filter = new Tone.Filter(data.params.frequency || 2000, "lowpass");
                fd.connect(filter);
                wrapper = { node: fd, inputs: { 'in': fd } }
            }
            else if (data.type === 'fx_transient') {
                const comp = new Tone.Compressor({ threshold: -10, ratio: 2 });
                wrapper = { node: comp, inputs: { 'in': comp } }
            }
            else if (data.type === 'fx_env_follower') {
                const follower = new Tone.Follower(data.params.smoothing || 0.05);
                wrapper = { node: follower, inputs: { 'in': follower }, outputs: { 'cv': follower } }
            }
            else if (data.type === 'fx_freq_shifter') {
                const shifter = new Tone.PitchShift(data.params.shift / 100);
                wrapper = { node: shifter, inputs: { 'in': shifter } }
            }
            else if (data.type === 'fx_exciter') {
                const highPass = new Tone.Filter(4000, "highpass");
                const dist = new Tone.Distortion(0.5);
                highPass.connect(dist);
                wrapper = { node: highPass, inputs: { 'in': highPass } }
            }
            else if (data.type === 'fx_formant') {
                const filter = new Tone.Filter(1000, "bandpass");
                wrapper = { node: filter, inputs: { 'in': filter } }
            }
            else if (data.type === 'fx_subgen') {
                const sub = new Tone.Oscillator(60, "sine").start();
                wrapper = { node: sub, inputs: { 'in': new Tone.Gain(0) }, outputs: { 'out': sub } }
            }
            else if (data.type === 'fx_autopan') {
                const pan = new Tone.AutoPanner(data.params.rate || 0.5).start();
                wrapper = { node: pan, inputs: { 'in': pan } }
            }
            else if (data.type === 'fx_spectral_blur') {
                const reverb = new Tone.Freeverb({ roomSize: 0.9, dampening: 3000 });
                wrapper = { node: reverb, inputs: { 'in': reverb } }
            }
            else if (data.type === 'logic_bitwise') {
                const gain = new Tone.Gain(1);
                wrapper = { node: gain, inputs: { 'in1': gain, 'in2': gain } }
            }
            else if (data.type === 'visual_spectrum') {
                const analyzer = new Tone.Analyser("fft", data.params.fftSize || 1024);
                wrapper = { node: analyzer, inputs: { 'in': analyzer } }
            }
            else if (data.type === 'adv_macro') {
                const sig = new Tone.Signal(data.params.value || 0.5);
                wrapper = { node: sig, inputs: {}, outputs: { 'out1': sig, 'out2': sig } }
            }
            else if (data.type === 'lib_bass' || data.type === 'lib_lead' || data.type === 'lib_pad') {
                const model = data.params.model || 1;
                const synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: model === 1 ? 'sine' : model === 2 ? 'sawtooth' : 'square' } as any,
                    envelope: { attack: data.type === 'lib_pad' ? 0.5 : 0.01, release: 1 }
                }).toDestination();
                wrapper = { node: synth, inputs: { 'trig': synth, 'note': synth } }
            }

            else if (data.type === 'adv_math_exp') {
                const ctx = Tone.getContext().rawContext
                try {
                    const node = new AudioWorkletNode(ctx, 'expression-processor', {
                        numberOfInputs: 1,
                        numberOfOutputs: 1,
                        outputChannelCount: [2]
                    })
                        ; (node as any).nodeRole = 'expression'
                    // Initial compile
                    node.port.postMessage({ type: 'compile', formula: data.script || 'in1' })
                    wrapper = {
                        node: node,
                        inputs: {
                            'in1': node, // For ReactFlow we might need to map different handles to different WORKLET inputs
                            'in2': node,
                            'in3': node,
                            'in4': node
                        }
                    }
                } catch (e) {
                    console.error('Expression Worklet error', e)
                    const fallback = new Tone.Gain(0)
                    wrapper = { node: fallback, inputs: { 'in': fallback } }
                }
            }
            else if (data.type === 'adv_fm_op') {
                const car = new Tone.Oscillator(440, 'sine').start();
                const mod = new Tone.Oscillator(440, 'sine').start();
                mod.connect(car.frequency);
                wrapper = { node: car, inputs: { 'freq': car.frequency, 'mod': mod.frequency } }
            }
            else if (data.type.includes('adv_') || (data.type as string).includes('logic_') || (data.type as string).includes('note_')) {
                const pass = new Tone.Gain(1)
                wrapper = { node: pass, inputs: { 'in': pass } }
            }

            if (wrapper) {
                this.attachMeters(wrapper)
                audioNodes.set(id, wrapper)
            }
        } catch (e) {
            console.error(`GraphEngine Create Error ${id}`, e)
        }
    }

    private static attachMeters(wrapper: AudioNodeWrapper) {
        wrapper.meters = {}
        if (wrapper.node instanceof Tone.ToneAudioNode) {
            const meter = new Tone.Meter()
            wrapper.node.connect(meter)
            wrapper.meters['default'] = meter
        }
        if (wrapper.outputs) {
            Object.keys(wrapper.outputs).forEach(handle => {
                const outNode = wrapper.outputs![handle]
                if (outNode instanceof Tone.ToneAudioNode) {
                    const meter = new Tone.Meter()
                    outNode.connect(meter)
                    wrapper.meters![handle] = meter
                }
            })
        }
    }

    static getNode(id: string): AudioNodeWrapper | undefined {
        return audioNodes.get(id);
    }

    static destroyNode(id: string) {
        const wrap = audioNodes.get(id)
        if (wrap) {
            // Dispose meters
            if (wrap.meters) {
                Object.values(wrap.meters).forEach(m => m.dispose())
            }

            if ((wrap.node as any)._onDown) {
                window.removeEventListener('keydown', (wrap.node as any)._onDown)
                window.removeEventListener('keyup', (wrap.node as any)._onUp)
            }
            if ((wrap.node as any)._interval) clearInterval((wrap.node as any)._interval)
            if (wrap.node instanceof Tone.ToneAudioNode) wrap.node.dispose()
            else if (wrap.node instanceof AudioNode) wrap.node.disconnect()
            audioNodes.delete(id)
        }
    }

    static updateParams(id: string, params: Record<string, any>) {
        const wrap = audioNodes.get(id)
        if (!wrap) return
        const n = wrap.node

        // COMMON GAIN/BYPASS HANDLING
        if (params.bypass !== undefined) {
            if (n instanceof Tone.ToneAudioNode && (n as any).wet) {
                (n as any).wet.value = params.bypass ? 0 : (params.mix || 1);
            }
        }
        if (params.outputGain !== undefined && n instanceof Tone.ToneAudioNode) {
            // If the node has it, use it, otherwise we could add a gain node. 
            // For now, let's map to standard volume if it exists.
            if ((n as any).volume) (n as any).volume.value = Tone.gainToDb(params.outputGain);
        }

        if (n instanceof Tone.Oscillator) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.05)
            if (params.type) n.set({ oscillator: { type: params.type } } as any)
            if (params.detune) n.detune.value = params.detune
            if (params.phase) n.phase = params.phase
        }
        else if (n instanceof Tone.Filter) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.05)
            if (params.Q) n.Q.rampTo(params.Q, 0.05)
            if (params.type) n.type = params.type
            if (params.slope) n.set({ rolloff: params.slope } as any)
        }
        else if (n instanceof Tone.Envelope) {
            if (params.attack) n.attack = params.attack
            if (params.decay) n.decay = params.decay
            if (params.sustain) n.sustain = params.sustain
            if (params.release) n.release = params.release
            if (params.attackCurve) n.attackCurve = params.attackCurve
        }
        else if (n instanceof Tone.Compressor) {
            if (params.threshold) n.threshold.value = params.threshold
            if (params.ratio) n.ratio.value = params.ratio
            if (params.attack) n.attack.value = params.attack
            if (params.release) n.release.value = params.release
            if (params.knee) n.knee.value = params.knee
        }
        else if (n instanceof Tone.FeedbackDelay) {
            if (params.delayTime) n.delayTime.rampTo(params.delayTime, 0.05)
            if (params.feedback) n.feedback.rampTo(params.feedback, 0.05)
            if (params.mix !== undefined) n.wet.value = params.mix;
        }
        else if (n instanceof Tone.Reverb) {
            if (params.decay) n.decay = params.decay
            if (params.mix !== undefined) n.wet.value = params.mix
        }
        else if (n instanceof Tone.PitchShift) {
            if (params.pitch !== undefined) n.pitch = params.pitch;
            if (params.windowSize) n.windowSize = params.windowSize;
            if (params.feedback) n.feedback.value = params.feedback;
        }
        else if (n instanceof Tone.Distortion) {
            if (params.drive !== undefined) n.distortion = params.drive;
            if (params.wet !== undefined) n.wet.value = params.wet;
        }
        else if (n instanceof Tone.Limiter) {
            if (params.threshold !== undefined) n.threshold.value = params.threshold;
        }
        else if (n instanceof Tone.BitCrusher) {
            if (params.bits !== undefined) n.bits.value = params.bits;
            if (params.wet !== undefined) n.wet.value = params.wet;
        }
        else if (n instanceof Tone.Phaser) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.05)
            if (params.wet !== undefined) n.wet.value = params.wet
        }
    }

    static updateScript(id: string, code: string) {
        const wrap = audioNodes.get(id)
        if (!wrap) return

        if (wrap.node instanceof AudioWorkletNode && (wrap.node as any).nodeRole === 'expression') {
            wrap.node.port.postMessage({ type: 'compile', formula: code })
            return
        }

        if (!(wrap.node instanceof ScriptProcessorNode)) return
        try {
            const factory = new Function('memory', 'console', `
                ${code}
                return { init: typeof init !== 'undefined' ? init : null, process: typeof process !== 'undefined' ? process : null }
            `)
            const lib = factory((wrap.node as any)._memory, console)
            if (lib.init && typeof lib.init === 'function') lib.init()
                ; (wrap.node as any)._userProcess = lib.process
        } catch (e) {
            console.error('Script Update Failed', e)
        }
    }

    private static isReachable(start: string, target: string, adj: Map<string, string[]>): boolean {
        if (start === target) return true
        const visited = new Set<string>()
        const queue = [start]
        visited.add(start)

        while (queue.length > 0) {
            const curr = queue.shift()!
            const neighbors = adj.get(curr) || []
            for (const neighbor of neighbors) {
                if (neighbor === target) return true
                if (!visited.has(neighbor)) {
                    visited.add(neighbor)
                    queue.push(neighbor)
                }
            }
        }
        return false
    }

    static getSignalLevel(nodeId: string, handleId?: string): number {
        const wrap = audioNodes.get(nodeId)
        if (!wrap || !wrap.meters) return 0
        const meter = wrap.meters[handleId || 'out'] || wrap.meters['default']
        if (!meter) return 0
        const val = meter.getValue()
        if (Array.isArray(val)) return Math.max(...val.map(v => Math.abs(v)))
        return Math.abs(val as number)
    }

    static connectRover(nodeId: string, handleId?: string) {
        const wrap = audioNodes.get(nodeId)
        if (!wrap) return
        let source = wrap.node
        if (handleId && wrap.outputs && wrap.outputs[handleId]) {
            source = wrap.outputs[handleId]
        }
        if (source instanceof Tone.ToneAudioNode || source instanceof AudioNode) {
            try {
                source.connect(this.getRoverAnalyser() as any)
                this.currentRoverSource = source
            } catch (e) { }
        }
    }

    static disconnectRover() {
        if (this.currentRoverSource && this.roverAnalyser) {
            try {
                this.currentRoverSource.disconnect(this.roverAnalyser as any)
            } catch (e) { }
            this.currentRoverSource = null
        }
    }

    static getRoverData(): Float32Array {
        if (!this.roverAnalyser) return new Float32Array(0)
        return this.roverAnalyser.getValue() as Float32Array
    }

    static rebuildConnections(nodes: Node<NodeData>[], edges: Edge<any>[]) {
        // 1. Collect Virtual Edges from Portals
        const portals: Record<string, { senders: string[], receivers: string[] }> = {}
        nodes.forEach(n => {
            if (n.data.type === 'io_portal_send') {
                const pid = n.data.params.portalId || 'default'
                if (!portals[pid]) portals[pid] = { senders: [], receivers: [] }
                portals[pid].senders.push(n.id)
            } else if (n.data.type === 'io_portal_receive') {
                const pid = n.data.params.portalId || 'default'
                if (!portals[pid]) portals[pid] = { senders: [], receivers: [] }
                portals[pid].receivers.push(n.id)
            }
        })

        const virtualEdges: Edge<any>[] = []
        Object.values(portals).forEach(p => {
            p.senders.forEach(sId => {
                p.receivers.forEach(rId => {
                    virtualEdges.push({ id: `v-${sId}-${rId}`, source: sId, target: rId })
                })
            })
        })

        // 2. Combine with Visual Edges and check for cycles
        const allEdges = [...edges, ...virtualEdges]
        const safeEdges: Edge<any>[] = []
        const nodeIds = Array.from(audioNodes.keys())

        // Optimized incremental cycle detection
        const adj = new Map<string, string[]>()
        nodeIds.forEach(id => adj.set(id, []))

        allEdges.forEach(edge => {
            // Check if adding this edge creates a cycle
            if (!this.isReachable(edge.target, edge.source, adj)) {
                safeEdges.push(edge)
                if (adj.has(edge.source)) adj.get(edge.source)!.push(edge.target)
            } else {
                console.warn(`🚫 GraphEngine: Blocked feedback loop (possibly wireless) involving ${edge.source}`)
            }
        })

        // 3. Diff and update physical connections
        const newConnections = new Map<string, { sourceNode: any, targetInput: any }>()

        safeEdges.forEach(edge => {
            const srcWrap = audioNodes.get(edge.source)
            const destWrap = audioNodes.get(edge.target)
            if (srcWrap && destWrap) {
                let sourceNode = srcWrap.node
                if (srcWrap.outputs && edge.sourceHandle && srcWrap.outputs[edge.sourceHandle]) {
                    sourceNode = srcWrap.outputs[edge.sourceHandle]
                }
                const targetHandleName = edge.targetHandle || 'in'
                const targetInput = destWrap.inputs[targetHandleName]

                if (targetInput) {
                    const connKey = `${edge.source}:${edge.sourceHandle || ''}->${edge.target}:${edge.targetHandle || ''}`
                    newConnections.set(connKey, { sourceNode, targetInput })
                }
            }
        })

        // Remove connections that are no longer in safeEdges
        this.activeConnections.forEach((conn, key) => {
            if (!newConnections.has(key)) {
                try {
                    // Only disconnect if the source node hasn't been disposed
                    if (conn.sourceNode && (conn.sourceNode as any).disposed !== true) {
                        conn.sourceNode.disconnect(conn.targetInput)
                    }
                } catch (e) {
                    // Native AudioNodes or already disconnected
                }
            }
        })

        // Add new connections
        newConnections.forEach((conn, key) => {
            if (!this.activeConnections.has(key)) {
                try {
                    if (conn.sourceNode instanceof Tone.ToneAudioNode) {
                        // @ts-ignore
                        conn.sourceNode.connect(conn.targetInput)
                    } else if (conn.sourceNode instanceof AudioNode) {
                        // @ts-ignore
                        conn.sourceNode.connect(conn.targetInput)
                    }
                } catch (e) { }
            }
        })

        this.activeConnections = newConnections
    }

    static dispose() {
        if (this.unsubscribe) this.unsubscribe()
        audioNodes.forEach(w => {
            if (w.node instanceof Tone.ToneAudioNode) w.node.dispose()
            else if (w.node instanceof AudioNode) w.node.disconnect()
        })
        audioNodes.clear()
        this.initialized = false
    }
}
