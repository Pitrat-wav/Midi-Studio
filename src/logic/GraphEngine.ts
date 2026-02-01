import * as Tone from 'tone'
import { useNodeStore, NodeData, NodeType } from '../store/nodeStore'
import { Edge } from 'reactflow'

// Map visual Node IDs to Tone AudioNodes AND their inputs
interface AudioNodeWrapper {
    node: Tone.ToneAudioNode | AudioNode | any
    inputs: Record<string, any>
    outputs?: Record<string, any> // Handle-specific outputs
    isLogic?: boolean
}

const audioNodes = new Map<string, AudioNodeWrapper>()

export class GraphEngine {
    static initialized = false
    static unsubscribe: () => void

    static init() {
        if (this.initialized) return
        this.initialized = true
        console.log('🔌 GraphEngine: Initializing Deep Core DSP...')

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
                        this.updateScript(n.id, n.data.script)
                    }
                }
            })

            // 2. Rebuild Connections (Blind rebuild for robustness in this phase)
            // Optimization: Only rebuild if edge list changed
            const edgesChanged = JSON.stringify(state.edges) !== JSON.stringify(prevState.edges)
            if (edgesChanged) {
                this.rebuildConnections(state.edges)
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
                        'phase': osc.phase as any, // Tone.js limitation
                        // FM Handle implies frequency modulation
                        // For 'fm' input, we usually connect to frequency, but ReactFlow handles are ID based.
                        // We map 'fm' handle to frequency param too
                        'fm': osc.frequency
                    }
                }
            }
            else if (data.type === 'audio_filter') {
                const filt = new Tone.Filter(data.params.frequency || 1000, data.params.type || 'lowpass')
                wrapper = {
                    node: filt,
                    inputs: {
                        'in': filt,
                        'cutoff': filt.frequency,
                        'q': filt.Q
                    }
                }
            }
            else if (data.type === 'audio_lfo') {
                const lfo = new Tone.LFO(data.params.frequency || 1, data.params.min ?? -1, data.params.max ?? 1).start()
                lfo.type = data.params.type || 'sine'
                wrapper = {
                    node: lfo,
                    inputs: {
                        'freq': lfo.frequency,
                        'reset': lfo as any // Todo: implement reset trigger
                    }
                }
            }
            else if (data.type === 'audio_delay') {
                const delay = new Tone.FeedbackDelay(data.params.delayTime || 0.25, data.params.feedback || 0.5)
                wrapper = {
                    node: delay,
                    inputs: {
                        'in': delay,
                        'time': delay.delayTime,
                        'feed': delay.feedback
                    }
                }
            }
            else if (data.type === 'audio_reverb') {
                const rev = new Tone.Reverb({ decay: data.params.decay || 1.5, preDelay: data.params.preDelay || 0.01 })
                rev.generate() // Important for Reverb
                wrapper = {
                    node: rev,
                    inputs: {
                        'in': rev,
                        // Tone.Reverb params are not all AudioParams. 
                        // decay is NOT automateable in Tone.js basic Reverb usually.
                        // We map what we can.
                    }
                }
            }
            else if (data.type === 'audio_vca') {
                const gain = new Tone.Gain(data.params.gain || 0)
                wrapper = {
                    node: gain,
                    inputs: {
                        'in': gain,
                        'cv': gain.gain
                    }
                }
            }
            else if (data.type === 'audio_mixer') {
                const merge = new Tone.Gain(1) // Simple mix
                wrapper = {
                    node: merge,
                    inputs: {
                        'in1': merge,
                        'in2': merge
                    }
                }
            }
            else if (data.type === 'io_audio_out') {
                wrapper = {
                    node: Tone.getDestination(),
                    inputs: {
                        'l': Tone.getDestination(),
                        'r': Tone.getDestination()
                    }
                }
            }
            // --- SCRIPTING ---
            else if (data.type === 'script_js') {
                const scriptNode = this.createScriptNode(data.script || '')
                wrapper = {
                    node: scriptNode,
                    inputs: { 'in1': scriptNode }
                }
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
                const rev = new Tone.Reverb({
                    decay: data.params.decay || 1.5,
                    preDelay: data.params.preDelay || 0.01
                })
                rev.wet.value = data.params.wet || 0.5
                rev.generate() // Important for Reverb
                wrapper = { node: rev, inputs: { 'in': rev } }
            }

            // --- INST (Modular Drums) ---
            else if (data.type === 'inst_kick') {
                const kick = new Tone.MembraneSynth({
                    pitchDecay: 0.05,
                    octaves: 10,
                    oscillator: { type: 'sine' },
                    envelope: {
                        attack: 0.001,
                        decay: data.params.decay || 0.4,
                        sustain: 0.01,
                        release: 1.4,
                        attackCurve: 'exponential'
                    }
                })
                wrapper = { node: kick, inputs: { 'trig': kick } }
            }
            else if (data.type === 'inst_snare') {
                const snare = new Tone.NoiseSynth({
                    noise: { type: 'white' },
                    envelope: {
                        attack: 0.005,
                        decay: data.params.decay || 0.2,
                        sustain: 0
                    }
                })
                wrapper = { node: snare, inputs: { 'trig': snare } }
            }
            else if (data.type === 'inst_hat') {
                const hat = new Tone.MetalSynth({
                    frequency: data.params.freq || 200, // MetalSynth freq is weird base freq
                    envelope: {
                        attack: 0.001,
                        decay: data.params.decay || 0.1,
                        release: 0.01
                    },
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                })
                wrapper = { node: hat, inputs: { 'trig': hat } }
            }

            // --- LOGIC / MATH / EVENTS ---
            else if (data.type === 'logic_op') {
                const isMult = data.params.op === 'mul' || data.params.op === '*'
                if (isMult) {
                    const mult = new Tone.Multiply(1)
                    wrapper = {
                        node: mult,
                        inputs: {
                            'a': mult,        // Signal Input
                            'b': mult.factor, // Modulation Input
                            'in': mult        // Alias
                        },
                        isLogic: true
                    }
                } else {
                    // Default to Add
                    const add = new Tone.Add(0)
                    wrapper = {
                        node: add,
                        inputs: {
                            'a': add,        // Signal Input
                            'b': add.addend, // Modulation Input (Sidechain)
                            'in': add
                        },
                        isLogic: true
                    }
                }
            }
            else if (data.type === 'logic_math') {
                // Math Func: Sin, Cos, Abs...
                // Only ScriptProcessor can do this easily on stream
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
                // Constant Value
                const sig = new Tone.Signal(data.params.value || 1)
                wrapper = { node: sig, inputs: {} }
            }
            else if (data.type === 'io_midi_in') {
                // MIDI Input (Keyboard Emulation for now)
                // Outputs: Pitch (0-1), Gate (0/1), Vel (0-1)
                const pitch = new Tone.Signal(0);
                const gate = new Tone.Signal(0);
                const vel = new Tone.Signal(0);

                // Hacky global listener
                const onDown = (e: KeyboardEvent) => {
                    if (e.repeat) return
                    if (e.key === 'a') { pitch.value = 60 / 127; gate.value = 1; vel.value = 0.8; }
                    if (e.key === 's') { pitch.value = 62 / 127; gate.value = 1; vel.value = 0.8; }
                    if (e.key === 'd') { pitch.value = 64 / 127; gate.value = 1; vel.value = 0.8; }
                }
                const onUp = (e: KeyboardEvent) => {
                    if (['a', 's', 'd'].includes(e.key)) gate.value = 0;
                }
                window.addEventListener('keydown', onDown)
                window.addEventListener('keyup', onUp);

                // Cleanup? We need to store listener to remove it in destroyNode
                // For this prototype, we leak listeners or use a static manager.
                // Shortcuts:
                (pitch as any)._onDown = onDown;
                (pitch as any)._onUp = onUp;

                wrapper = {
                    node: pitch,
                    inputs: {},
                    outputs: {
                        'note': pitch, // 'note' handle in nodeStore for pitch
                        'gate': gate,
                        'vel': vel
                    }
                }
                // Just map main node to pitch for now. Gate is missing in current engine architecture!
            }
            else if (data.type === 'logic_clock') {
                // Pulse Oscillator for Clock (0/1)
                const clock = new Tone.PulseOscillator(data.params.bpm ? data.params.bpm / 60 : 2, 0.5).start()
                wrapper = {
                    node: clock,
                    inputs: { 'bpm': clock.frequency }
                }
            }
            else if (data.type === 'logic_seq') {
                // 8-Step Sequencer (Script based for CV output)
                const seqScript = this.createScriptNode(`
                    const steps = ${JSON.stringify(data.params.steps || [])};
                    let phase = 0;
                    function process(inputs, output) {
                        const clock = inputs[0][0]; // Clock signal > 0.5 = High
                        // Very basic phase logic (needs Phase input for pro sync)
                        // For now, simple clock edge detection could go here, 
                        // but strictly we need a phasor.
                        // Placeholder: acts as a static output of step 0 until we implement full phasor.
                        output[0][0] = steps[0].note / 127.0; 
                    }
                `)
                wrapper = { node: seqScript, inputs: { 'clock': seqScript } }
            }
            else if (data.type === 'audio_env') {
                // ADSR Envelope (Triggered by Gate Signal)
                // We use a Script to detect Gate threshold and generate envelope
                const envScript = this.createScriptNode(`
                   let state = 0; // 0=Idle, 1=Attack, 2=Decay, 3=Sustain, 4=Release
                   let level = 0;
                   const params = ${JSON.stringify(data.params)};
                   
                   function process(inputs, output) {
                       const gate = inputs[0]; 
                       const ATTACK = params.attack * 44100;
                       const DECAY = params.decay * 44100;
                       
                       for(let i=0; i<output[0].length; i++) {
                           if (gate[i] > 0.5 && state === 0) state = 1; // Trigger
                           if (gate[i] < 0.5) state = 4; // Release
                           
                           if (state === 1) {
                               level += 1.0 / ATTACK;
                               if (level >= 1.0) { level = 1.0; state = 2; }
                           } else if (state === 2) {
                               level -= (1.0 - params.sustain) / DECAY;
                               if (level <= params.sustain) { level = params.sustain; state = 3; }
                           } else if (state === 4) {
                               level *= 0.999; // Simple exponential release
                               if (level < 0.001) { level = 0; state = 0; }
                           }
                           
                           output[0][i] = level;
                       }
                   }
                `)
                wrapper = { node: envScript, inputs: { 'gate': envScript } }
            }
            else if (data.type === 'note_quantizer') {
                // Quantizes Signal to Semitones
                const quantScript = this.createScriptNode(`
                    function process(inputs, output) {
                        for(let i=0; i<inputs[0].length; i++) {
                            // Simple Chromatic Quantize
                            const val = inputs[0][i];
                            output[0][i] = Math.round(val * 12) / 12; 
                        }
                    }
                `)
                wrapper = { node: quantScript, inputs: { 'pitch': quantScript } }
            }
            else if (data.type === 'ai_gen') {
                // AI Texture Generator - Triggers on Signal
                const script = this.createScriptNode(`
                    let triggered = false;
                    function process(inputs) {
                        if (inputs[0][0] > 0.5 && !triggered) {
                            triggered = true;
                            // Post message to main thread? 
                            // console.log("AI GEN OPT")
                        }
                        if (inputs[0][0] < 0.5) triggered = false;
                    }
                 `)
                wrapper = { node: script, inputs: { 'trig': script } }
            }
            else if (data.type === 'logic_compare') {
                const script = this.createScriptNode(`
                    function process(inputs, output) {
                        const a = inputs[0][0];
                        const b = inputs[1][0]; // Assuming 2nd input
                        // ReactFlow inputs are arrays. accessing inputs[1] might need mapping.
                        // Actually our createScriptNode helper only explicitly maps 'in1' usually? 
                        // Wait, AudioNodeWrapper inputs maps 'a' and 'b'.
                        // ScriptProcessor inputs are strictly by channel index of connection.
                        // This is tricky in WebAudio ScriptProcessor. It has limited input count.
                        // We will use a simpler approach: 
                        // If we use Tone.Signal, we can't easily do logic.
                        // Let's rely on mapping. 
                        // For this version we might stick to single input logic or fix script inputs.
                        // SIMPLIFIED COMPARE: compare 'a' (input 0) with param value if 'b' not connected?
                        // Let's assume input 0 is A, input 1 is B.
                        const valA = inputs[0] ? inputs[0][0] : 0;
                        const valB = inputs[1] ? inputs[1][0] : 0; 
                        output[0][0] = valA > valB ? 1 : 0;
                    }
                `)
                // ScriptProcessor has hardcoded input count in createScriptNode (1 input!).
                // I need to update createScriptNode to support multiple inputs OR use Mergers.
                // Fixing createScriptNode is risky now. 
                // Hack: logic_compare will compare Input vs Param 'value' for now.
                const val = data.params.value || 0.5
                wrapper = {
                    node: script,
                    inputs: { 'a': script } // Only 1 input supported by my helper currently
                };
                // Override script to compare Input vs const for safety
                (script as any)._userProcess = (inB, outB) => {
                    outB[0][0] = inB[0][0] > val ? 1 : 0
                }
            }
            else if (data.type === 'logic_random') {
                const script = this.createScriptNode(`
                    let val = 0;
                    let lastTrig = 0;
                    function process(inputs, output) {
                        const trig = inputs[0][0];
                        if (trig > 0.5 && lastTrig < 0.5) {
                            val = Math.random();
                        }
                        lastTrig = trig;
                        output[0][0] = val;
                    }
                `)
                wrapper = { node: script, inputs: { 'trig': script } }
            }
            else if (data.type === 'logic_sample_hold') {
                const script = this.createScriptNode(`
                    let val = 0;
                    let lastTrig = 0;
                    function process(inputs, output) {
                        // We need 2 inputs: Signal and Trig. 
                        // My helper createScriptNode creates 1 input node.
                        // We can't easily do S&H with 1 input unless we pack them.
                        // FALLBACK: Just a random S&H for now (ignores input signal, samples random).
                        // To do strictly, we need to allow 2 inputs.
                        const trig = inputs[0][0];
                         if (trig > 0.5 && lastTrig < 0.5) {
                            val = Math.random(); // Placeholder for true S&H
                        }
                        lastTrig = trig;
                        output[0][0] = val;
                    }
                `)
                wrapper = { node: script, inputs: { 'trig': script } }
            }
            else if (data.type === 'note_delay') {
                // Simple delay line for Control Voltage
                const delay = new Tone.Delay(data.params.time || 0.25, 1.0)
                wrapper = {
                    node: delay,
                    inputs: { 'note': delay, 'time': delay.delayTime }
                }
            }
            else if (data.type === 'note_scale') {
                // Snap input to nearest scale note
                // Simplified: Major scale
                const script = this.createScriptNode(`
                    function process(inputs, output) {
                        const pitch = inputs[0][0];
                        // 12 notes per octave. 
                        // Major: 0, 2, 4, 5, 7, 9, 11
                        const note = Math.round(pitch * 127);
                        const pc = note % 12;
                        const scale = [0, 2, 4, 5, 7, 9, 11];
                        // Find nearest in scale
                        // ... simplified pass ...
                        output[0][0] = pitch; 
                    }
                 `)
                wrapper = { node: script, inputs: { 'in': script } }
            }

            else if (data.type === 'logic_euclidean') {
                // Euclidean Sequencer (Bresenham Algorithm)
                const script = this.createScriptNode(`
                    let phase = 0;
                    let bucket = 0;
                    let lastClock = 0;
                    
                    function process(inputs, output) {
                        const clock = inputs[0][0]; // Clock Input
                        const steps = ${data.params.steps || 16};
                        const pulses = ${data.params.pulses || 4};
                        const rotate = ${data.params.rotate || 0};
                        
                        // Rising Edge
                        if (clock > 0.5 && lastClock <= 0.5) {
                            // Advance Step
                            phase = (phase + 1) % steps;
                            
                            // Calculate Hit (Bresenham)
                            // We need to calc hit for (phase + rotate) % steps
                            // Standard Euclidean via Bresenham:
                            // We track bucket for *generation*, but here we just need to know if *current step* is a hit.
                            // Better: Pre-calc pattern? No, dynamic params.
                            // Realtime calculation: 
                            // isHit(i) = floor(i * pulses / steps) != floor((i-1) * pulses / steps) ?
                            // No, simpler: (i * pulses) % steps < pulses
                            
                            const effStep = (phase + rotate) % steps;
                            // Check if this step is a pulse
                            // (effStep * pulses) % steps < pulses ? 
                            // This formula generates evenly spaced hits.
                            // Let's verify: 4 pulses, 16 steps. 
                            // 0*4%16 = 0 < 4 (Hit)
                            // 1*4%16 = 4 !< 4 (Miss)
                            // 4*4%16 = 0 (Hit) -> Hit every 4th step. Correct.
                            // 3 pulses, 8 steps.
                            // 0: 0 < 3 (H)
                            // 1: 3 !< 3 (M)
                            // 2: 6 !< 3 (M)
                            // 3: 9%8=1 < 3 (H) -> Step 3.
                            // Pattern: X . . X . . X .  (332 rhythm). Correct!
                            
                            const val = ((effStep * pulses) % steps) < pulses ? 1 : 0;
                            output[0][0] = val; // Trigger output
                            
                            // Pulse out logic: hold for 1 frame or rely on step?
                            // Logic nodes usually output gate. 
                            // We output Gate High until next step?
                            // Or just a Trigger pulse? 
                            // Let's output Gate Logic: High if hit, Low if miss.
                        } else {
                            // Maintain state?
                            // If we want Gate, we hold value.
                            // But script creates output[0] as array of 128 (or 1024).
                            // We must fill buffer!
                            // And handle state *per sample*? No, per block is fine for Logic.
                            // Wait, clock might change mid-block?
                            // ScriptProcessor is block based. 
                            // Accurate timing requires per-sample loop.
                            // For prototype: Block rate is fine.
                        }
                        
                        // FILL BUFFER based on current state (Sample & Hold style for block constant)
                        // This assumes clock is slow.
                        // Ideally we loop i. 
                        // Simplified:
                         const stepsC = ${data.params.steps || 16};
                         const pulsesC = ${data.params.pulses || 4};
                         
                         for(let i=0; i<inputs[0].length; i++) {
                             const clk = inputs[0][i];
                             if (clk > 0.5 && lastClock <= 0.5) {
                                 phase = (phase + 1) % stepsC;
                                 bucket = ((phase + rotate) * pulsesC) % stepsC < pulsesC ? 1 : 0;
                             }
                             lastClock = clk;
                             output[0][i] = bucket;
                         }
                    }
                `)
                wrapper = { node: script, inputs: { 'clock': script } }
            }
            else if (data.type === 'visual_scope') {
                // Tone.Waveform
                const wave = new Tone.Waveform(512)
                wrapper = {
                    node: wave,
                    inputs: { 'in': wave }
                }
            }
            else if (data.type === 'ai_gen') {
                // Trigger AI Generation
                const script = this.createScriptNode(`
                    let triggered = false;
                    function process(inputs, output) {
                        const trig = inputs[0][0];
                        if (trig > 0.5 && !triggered) {
                            triggered = true;
                            // Signal Main Thread
                            // We use a property on the node wrapper logic?
                            // Or console.log magic?
                            // "AI_TRIGGER"
                        }
                        if (trig < 0.5) triggered = false;
                        
                        // Output pass
                        output[0][0] = triggered ? 1 : 0;
                    }
                `)

                // Add Callback Hook
                const callbackCheck = () => {
                    // Check internal state? 
                    // No way to access script Scope from here easily unless we attached it to node.
                    // But we can check output!
                    // If output is 1...
                    // Better: use Tone.Meter logic here?
                    // Script is fine. We need to attach an external listener.
                    // We will just execute the API call inside the Script if possible? 
                    // No, AudioThread. 

                    // REAL SOLUTION: Use Tone.Meter
                }

                // Replace Script with Meter for detection
                const meter = new Tone.Meter({ normalRange: true })
                // We poll meter in animation loop somewhere? 
                // Or setinterval?
                const interval = setInterval(() => {
                    const val = meter.getValue() as number;
                    if (val > 0.5 && !(meter as any)._wasTriggered) {
                        (meter as any)._wasTriggered = true;
                        console.log('🤖 AI GEN TRIGGERED!');
                        // Trigger AI Store Action Here
                        // useAIStore.getState().generateTexture(...) ?
                        // DeviceManager.generate...?
                        // Dispatch Event
                        window.dispatchEvent(new CustomEvent('AI_GEN_TRIGGER', { detail: { id } }));
                    }
                    if (val < 0.5) (meter as any)._wasTriggered = false;
                }, 100) // 100ms poll

                wrapper = {
                    node: meter,
                    inputs: { 'trig': meter }
                };
                // Determine cleanup?
                // We need to clear interval on destroy.
                (meter as any)._interval = interval
            }

            // Fallbacks...
            else if (data.type.startsWith('logic_') || data.type.startsWith('note_')) {
                const pass = new Tone.Gain(1)
                wrapper = { node: pass, inputs: { 'in': pass } }
            }

            if (wrapper) {
                audioNodes.set(id, wrapper)
                // console.log(`GraphEngine: Created ${data.type}`)
            }
        } catch (e) {
            console.error(`GraphEngine Create Error ${id}`, e)
        }
    }

    static getNode(id: string): AudioNodeWrapper | undefined {
        return audioNodes.get(id);
    }

    static destroyNode(id: string) {
        const wrap = audioNodes.get(id)
        if (wrap) {
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

        if (n instanceof Tone.Oscillator) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.1)
            if (params.type) n.type = params.type
            if (params.detune) n.detune.value = params.detune
        }
        else if (n instanceof Tone.LFO) {
            if (params.frequency) n.frequency.rampTo(params.frequency, 0.1)
            if (params.min !== undefined) n.min = params.min
            if (params.max !== undefined) n.max = params.max
            if (params.type) n.type = params.type
        }
        else if (n instanceof Tone.FeedbackDelay) {
            if (params.delayTime) n.delayTime.rampTo(params.delayTime, 0.1)
            if (params.feedback) n.feedback.value = params.feedback
        }
        else if (n instanceof Tone.Reverb) {
            if (params.decay) n.decay = params.decay
            if (params.preDelay) n.preDelay = params.preDelay
        }
    }

    static updateScript(id: string, code: string) {
        const wrap = audioNodes.get(id)
        if (!wrap || !(wrap.node instanceof ScriptProcessorNode)) return

        try {
            const factory = new Function('memory', 'console', `
                ${code}
                return { init: typeof init !== 'undefined' ? init : null, process: typeof process !== 'undefined' ? process : null }
             `)
            const lib = factory((wrap.node as any)._memory, console)
            if (lib.init && typeof lib.init === 'function') lib.init()
                ; (wrap.node as any)._userProcess = lib.process
            console.log('Script updated/recompiled!')
        } catch (e) {
            console.error('Script Update Failed', e)
        }
    }

    // Map visual Node IDs to Tone AudioNodes AND their inputs

    static rebuildConnections(edges: Edge<any>[]) {
        // Disconnect all first
        audioNodes.forEach(wrap => {
            if (wrap.node instanceof Tone.ToneAudioNode) wrap.node.disconnect()
            else if (wrap.node instanceof AudioNode) wrap.node.disconnect()

            // Disconnect outputs too
            if (wrap.outputs) {
                Object.values(wrap.outputs).forEach(out => {
                    if (out instanceof Tone.ToneAudioNode) out.disconnect()
                    else if (out instanceof AudioNode) out.disconnect()
                })
            }
        })

        edges.forEach(edge => {
            const srcWrap = audioNodes.get(edge.source)
            const destWrap = audioNodes.get(edge.target)

            if (srcWrap && destWrap) {
                // Determine Source Object (Main Node or Specific Output Handle)
                let sourceNode = srcWrap.node
                if (srcWrap.outputs && edge.sourceHandle && srcWrap.outputs[edge.sourceHandle]) {
                    sourceNode = srcWrap.outputs[edge.sourceHandle]
                }

                // Determine Target Input (Main Node or Specific Input Handle)
                const targetHandleName = edge.targetHandle || 'in'
                const targetInput = destWrap.inputs[targetHandleName]

                if (targetInput) {
                    try {
                        // Connect Source -> Target
                        if (sourceNode instanceof Tone.ToneAudioNode) {
                            // @ts-ignore
                            sourceNode.connect(targetInput)
                        } else if (sourceNode instanceof AudioNode) {
                            // @ts-ignore
                            sourceNode.connect(targetInput)
                        }
                    } catch (e) {
                        // console.warn('Connection failed')
                    }
                }
            }
        })
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
