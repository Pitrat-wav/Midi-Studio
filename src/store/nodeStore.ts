import { create } from 'zustand'
import {
    Connection,
    Edge,
    Node,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow'

export type NodeType =
    // Audio Core
    | 'audio_osc' | 'audio_lfo' | 'audio_noise' | 'audio_filter' | 'audio_env' | 'audio_vca' | 'audio_mixer'
    | 'audio_delay' | 'audio_reverb' | 'audio_spectral' | 'audio_phaser' | 'audio_bitcrusher' | 'audio_compressor' | 'audio_pan'
    // Logic
    | 'logic_value' | 'logic_op' | 'logic_clock' | 'logic_seq' | 'logic_math' | 'logic_gate' | 'logic_compare' | 'logic_random' | 'logic_sample_hold' | 'logic_counter' | 'logic_toggle' | 'logic_combine' | 'logic_bitwise'
    // Note Processors
    | 'note_quantizer' | 'note_scale' | 'note_chord' | 'note_arp' | 'note_delay' | 'note_transpose' | 'note_velocity'
    // Instruments & IO
    | 'inst_kick' | 'inst_snare' | 'inst_hat'
    | 'io_audio_in' | 'io_audio_out' | 'io_midi_in' | 'io_midi_out' | 'io_portal_send' | 'io_portal_receive'
    // Advanced/AI
    | 'script_js' | 'wasm_node' | 'ai_gen' | 'ai_chat' | 'visual_scope' | 'visual_spectrum' | 'logic_euclidean'
    | 'fx_echo' | 'fx_graindelay' | 'fx_saturator' | 'fx_limiter' | 'fx_platereverb' | 'fx_reduce' | 'fx_phaser_pro' | 'fx_flanger' | 'fx_overdrive' | 'fx_hybrid' | 'fx_filterdelay' | 'fx_delay' | 'fx_reverb' | 'fx_chorus' | 'fx_dist'
    | 'fx_transient' | 'fx_env_follower' | 'fx_freq_shifter' | 'fx_exciter' | 'fx_formant' | 'fx_subgen' | 'fx_autopan' | 'fx_spectral_blur'
    | 'adv_granular' | 'adv_fm_op' | 'adv_wavefolder' | 'adv_chaos' | 'adv_convolver'
    | 'adv_vocoder' | 'adv_spectral_freeze' | 'adv_clock_div' | 'adv_bernoulli' | 'adv_turing'
    | 'adv_prob_seq' | 'adv_math_exp' | 'adv_cv_scope' | 'adv_ai_melody' | 'adv_macro'
    // Generic Library Nodes (Consolidated)
    | 'lib_bass' | 'lib_lead' | 'lib_pad' | 'lib_keys' | 'lib_perc' | 'lib_fx_unit' | 'lib_drum_kit';

export interface NodePort {
    id: string
    label: string
    type: 'audio' | 'signal' | 'data' | 'phase'
}

export interface NodeData {
    label: string
    type: NodeType
    category: 'audio' | 'logic' | 'note' | 'io' | 'visual' | 'script' | 'ai'
    inputs: NodePort[]
    outputs: NodePort[]
    params: Record<string, any>
    script?: string
    macroMappings?: Record<string, number> // paramName -> macroId (0-7)
}

export interface MacroKnob {
    id: number // 0-7
    label: string
    value: number // 0..1
    targetNodeId: string | null
    targetParam: string | null
    range: [number, number] // [min, max]
}

export interface NodeState {
    nodes: Node<NodeData>[]
    edges: Edge[]
    macros: MacroKnob[]
    context: 'poly' | 'fx' | 'note'
    onNodesChange: OnNodesChange
    onEdgesChange: OnEdgesChange
    onConnect: (connection: Connection) => void
    addNode: (type: NodeType, x: number, y: number) => void
    removeNode: (id: string) => void
    updateNodeParam: (id: string, param: string, value: any) => void
    updateNodeScript: (id: string, code: string) => void
    setMacroValue: (id: number, value: number) => void
    assignMacro: (id: number, nodeId: string, param: string, range?: [number, number]) => void
    updateMacroLabel: (id: number, label: string) => void
    updateNodeInputs: (id: string, inputs: NodePort[]) => void
    setContext: (context: 'poly' | 'fx' | 'note') => void
    loadDevice: (json: string) => void
    saveDevice: () => string
    setNodes: (nodes: Node<NodeData>[]) => void
    setEdges: (edges: Edge[]) => void
}

export const NODE_DEFS: Record<string, Partial<NodeData>> = {
    // AUDIO CORE
    'audio_osc': { label: 'Oscillator Pro', category: 'audio', params: { frequency: 440, type: 'sine', detune: 0 }, inputs: [{ id: 'fm', label: 'FM', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_lfo': { label: 'LFO Pro', category: 'audio', params: { frequency: 1, type: 'sine', depth: 1 }, outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'audio_noise': { label: 'Noise Gen', category: 'audio', params: { type: 'white' }, outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_filter': { label: 'Filter Pro', category: 'audio', params: { frequency: 2000, Q: 1, type: 'lowpass' }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_env': { label: 'Envelope ADSR', category: 'audio', params: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }, inputs: [{ id: 'gate', label: 'Gate', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'audio_vca': { label: 'VCA', category: 'audio', params: { gain: 1 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }, { id: 'gain', label: 'Gain', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_mixer': { label: 'Mixer', category: 'audio', params: { ch1: 0.7, ch2: 0.7 }, inputs: [{ id: 'in1', label: '1', type: 'audio' }, { id: 'in2', label: '2', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_compressor': { label: 'Compressor', category: 'audio', params: { threshold: -20, ratio: 4 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_bitcrusher': { label: 'Bitcrusher', category: 'audio', params: { bits: 8 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_phaser': { label: 'Phaser Basic', category: 'audio', params: { rate: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'audio_pan': { label: 'Pan', category: 'audio', params: { pan: 0 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },

    // FX RACK
    'fx_limiter': { label: 'Limiter', category: 'audio', params: { threshold: -1 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_transient': { label: 'Transient Shaper', category: 'audio', params: { attack: 0, sustain: 0 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_env_follower': { label: 'Env Follower', category: 'audio', params: { attack: 0.01, release: 0.1 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'cv', label: 'CV Out', type: 'signal' }] },

    'fx_platereverb': { label: 'Plate Reverb', category: 'audio', params: { decay: 3 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_hybrid': { label: 'Hybrid Reverb', category: 'audio', params: { blend: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_echo': { label: 'Digital Echo', category: 'audio', params: { delayTime: 0.25, feedback: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_graindelay': { label: 'Grain Delay', category: 'audio', params: { grainSize: 0.1, feedback: 0.4 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_filterdelay': { label: 'Filter Delay', category: 'audio', params: { delayTime: 0.3, feedback: 0.6 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_reverb': { label: 'Reverb Pro', category: 'audio', params: { size: 0.7, damp: 3000 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_delay': { label: 'Simple Delay', category: 'audio', params: { delayTime: 0.4 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_autopan': { label: 'Auto Pan Pro', category: 'audio', params: { rate: 0.5, depth: 0.8 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_spectral_blur': { label: 'Spectral Blur', category: 'audio', params: { size: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },

    'fx_saturator': { label: 'Saturator', category: 'audio', params: { drive: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_overdrive': { label: 'Overdrive', category: 'audio', params: { drive: 0.7 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_dist': { label: 'Saturation', category: 'audio', params: { drive: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_reduce': { label: 'Redux (Bit)', category: 'audio', params: { bits: 12 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_exciter': { label: 'Exciter Pro', category: 'audio', params: { amount: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_formant': { label: 'Formant Filter', category: 'audio', params: { vowel: 0.5 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_subgen': { label: 'Sub Generator', category: 'audio', params: { amount: 0.7 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_freq_shifter': { label: 'Freq Shifter', category: 'audio', params: { shift: 100 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },

    'fx_phaser_pro': { label: 'Phaser Pro', category: 'audio', params: { rate: 0.1 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_flanger': { label: 'Flanger', category: 'audio', params: { feedback: 0.6 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'fx_chorus': { label: 'Chorus Pro', category: 'audio', params: { rate: 0.5, depth: 0.3 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },

    // LOGIC
    'logic_value': { label: 'Constant', category: 'logic', params: { value: 1.0 }, outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'logic_op': { label: 'Math Op', category: 'logic', params: { op: 'add' }, inputs: [{ id: 'a', label: 'A', type: 'signal' }, { id: 'b', label: 'B', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'logic_clock': { label: 'Clock', category: 'logic', params: { bpm: 120 }, outputs: [{ id: 'out', label: 'Pulse', type: 'signal' }] },
    'logic_seq': { label: 'Step Seq', category: 'logic', params: { steps: [1, 0, 1, 0] }, inputs: [{ id: 'clock', label: 'Clock', type: 'signal' }], outputs: [{ id: 'out', label: 'Gate', type: 'signal' }] },
    'logic_random': { label: 'Random Gen', category: 'logic', params: { range: 1 }, inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'logic_counter': { label: 'Counter', category: 'logic', params: { max: 16 }, inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }], outputs: [{ id: 'out', label: 'Val', type: 'signal' }] },
    'logic_toggle': { label: 'Flip-Flop', category: 'logic', params: { state: false }, inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'logic_compare': { label: 'Comparator', category: 'logic', params: { mode: '>' }, inputs: [{ id: 'a', label: 'A', type: 'signal' }, { id: 'b', label: 'B', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'logic_bitwise': { label: 'Bitwise Logic', category: 'logic', params: { mode: 'XOR' }, inputs: [{ id: 'a', label: 'A', type: 'signal' }, { id: 'b', label: 'B', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },
    'logic_euclidean': { label: 'Euclidean Seq', category: 'logic', params: { steps: 16, fills: 4 }, inputs: [{ id: 'clock', label: 'Clock', type: 'signal' }], outputs: [{ id: 'out', label: 'Trig', type: 'signal' }] },

    // NOTE PROCESSORS
    'note_quantizer': { label: 'Quantizer', category: 'note', params: { scale: 'major' }, inputs: [{ id: 'in', label: 'CV In', type: 'signal' }], outputs: [{ id: 'out', label: 'CV Out', type: 'signal' }] },
    'note_chord': { label: 'Chord Gen', category: 'note', params: { type: 'maj7' }, inputs: [{ id: 'root', label: 'Root', type: 'signal' }], outputs: [{ id: 'out', label: 'MIDI', type: 'data' }] },
    'note_arp': { label: 'Arpeggiator', category: 'note', params: { mode: 'up' }, inputs: [{ id: 'in', label: 'MIDI In', type: 'data' }], outputs: [{ id: 'out', label: 'MIDI Out', type: 'data' }] },
    'note_transpose': { label: 'Transpose', category: 'note', params: { semitones: 0 }, inputs: [{ id: 'in', label: 'MIDI In', type: 'data' }], outputs: [{ id: 'out', label: 'MIDI Out', type: 'data' }] },
    'note_delay': { label: 'Note Delay', category: 'note', params: { delay: 0.1 }, inputs: [{ id: 'in', label: 'MIDI In', type: 'data' }], outputs: [{ id: 'out', label: 'MIDI Out', type: 'data' }] },

    // ADVANCED
    'adv_granular': { label: 'Granular Engine', category: 'audio', params: { pos: 0, size: 0.1 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'adv_fm_op': { label: 'FM Operator', category: 'audio', params: { ratio: 1, depth: 100 }, inputs: [{ id: 'fm', label: 'FM', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'adv_turing': { label: 'Turing Machine', category: 'logic', params: { length: 16, prob: 0.5 }, inputs: [{ id: 'clock', label: 'Clock', type: 'signal' }], outputs: [{ id: 'out', label: 'Notes', type: 'signal' }] },
    'adv_vocoder': { label: 'Vocoder', category: 'audio', params: { bands: 16 }, inputs: [{ id: 'mod', label: 'Mod', type: 'audio' }, { id: 'car', label: 'Car', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'adv_chaos': { label: 'Chaos (Lorenz)', category: 'logic', params: { speed: 1 }, outputs: [{ id: 'x', label: 'X', type: 'signal' }, { id: 'y', label: 'Y', type: 'signal' }] },
    'adv_prob_seq': { label: 'Prob Seq', category: 'logic', params: { steps: 8 }, inputs: [{ id: 'clock', label: 'Clock', type: 'signal' }], outputs: [{ id: 'out', label: 'Gate', type: 'signal' }] },
    'adv_math_exp': { label: 'Math Expression', category: 'logic', params: {}, script: 'in1 * Math.sin(time * 2 * Math.PI)', inputs: [{ id: 'in1', label: '1', type: 'signal' }], outputs: [{ id: 'out', label: 'Out', type: 'signal' }] },

    // VISUAL & IO
    'visual_scope': { label: 'Oscilloscope', category: 'visual', params: {}, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [] },
    'visual_spectrum': { label: 'Spectrum Viz', category: 'visual', params: {}, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [] },
    'io_midi_in': { label: 'MIDI In', category: 'io', params: { channel: 1 }, outputs: [{ id: 'note', label: 'Note', type: 'signal' }, { id: 'gate', label: 'Gate', type: 'signal' }] },
    'io_audio_in': { label: 'Audio In', category: 'io', params: { gain: 1 }, outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'io_audio_out': { label: 'Audio Out', category: 'io', params: { gain: 1 }, inputs: [{ id: 'l', label: 'L', type: 'audio' }, { id: 'r', label: 'R', type: 'audio' }] },

    // AI
    'ai_gen': { label: 'AI Gen Lab', category: 'ai', params: { prompt: '' }, inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }], outputs: [{ id: 'out', label: 'Data', type: 'data' }] },
    'ai_chat': { label: 'AI Composer', category: 'ai', params: {}, outputs: [{ id: 'out', label: 'Midi', type: 'data' }] },
    'io_portal_send': { label: 'Portal Send', category: 'io', params: { portalId: 'portal-1' }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [] },
    'io_portal_receive': { label: 'Portal Receive', category: 'io', params: { portalId: 'portal-1' }, inputs: [], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },

    // SCRIPT
    'script_js': { label: 'JS Script PRO', category: 'script', params: {}, script: '// Write DSP here\nfunction process(ins, outs) {}' },
    'wasm_node': { label: 'WASM Plugin', category: 'script', params: { url: '', mix: 1 }, inputs: [{ id: 'in', label: 'In', type: 'audio' }], outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },

    // LIB
    'lib_bass': { label: 'Bass Preset', category: 'audio', params: { model: 'analog' }, outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'lib_lead': { label: 'Lead Preset', category: 'audio', params: { model: 'fm' }, outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'lib_pad': { label: 'Pad Synth', category: 'audio', params: { model: 'poly' }, outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
    'lib_perc': { label: 'Percussion', category: 'audio', params: { model: 'digital' }, outputs: [{ id: 'out', label: 'Out', type: 'audio' }] },
};

export const useNodeStore = create<NodeState>((set, get) => ({
    context: 'poly',
    nodes: [],
    edges: [],
    macros: Array.from({ length: 8 }, (_, i) => ({
        id: i,
        label: `Macro ${i + 1}`,
        value: 0.5,
        targetNodeId: null,
        targetParam: null,
        range: [0, 1]
    })),
    setContext: (context) => set({ context }),
    onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
    onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
    onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
    addNode: (type, x, y) => {
        const def = NODE_DEFS[type]
        if (!def) return
        const id = crypto.randomUUID()
        const defaultParams = {
            inputGain: 1.0,
            outputGain: 1.0,
            bypass: false,
            ...def.params
        }
        set(state => ({
            nodes: [...state.nodes, {
                id,
                type: type === 'adv_math_exp' ? 'math' :
                    type === 'io_portal_send' ? 'portal_send' :
                        type === 'io_portal_receive' ? 'portal_receive' :
                            'custom',
                position: { x, y },
                data: { label: def.label!, type: type as NodeType, category: def.category!, inputs: def.inputs || [], outputs: def.outputs || [], params: defaultParams, script: def.script }
            }]
        }))
    },
    removeNode: (id) => set(state => ({ nodes: state.nodes.filter(n => n.id !== id), edges: state.edges.filter(e => e.source !== id && e.target !== id) })),
    updateNodeParam: (id, param, value) => {
        set(state => ({
            nodes: state.nodes.map(n => n.id === id ? {
                ...n,
                data: { ...n.data, params: { ...n.data.params, [param]: value } }
            } : n)
        }))
    },
    updateNodeScript: (id, code) => set(state => ({ nodes: state.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, script: code } } : n) })),
    updateNodeInputs: (id, inputs) => set(state => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, inputs } } : n)
    })),

    setMacroValue: (id, value) => {
        set(state => {
            const macros = [...state.macros]
            const macro = { ...macros[id], value }
            macros[id] = macro

            // Update targeted node param
            if (macro.targetNodeId && macro.targetParam) {
                const node = state.nodes.find(n => n.id === macro.targetNodeId)
                if (node) {
                    const [min, max] = macro.range
                    // Handle log scale for freq
                    let targetValue
                    if (macro.targetParam.toLowerCase().includes('freq')) {
                        // Simple log interpolation for frequency
                        const logMin = Math.log(Math.max(1, min))
                        const logMax = Math.log(max)
                        targetValue = Math.exp(logMin + value * (logMax - logMin))
                    } else {
                        targetValue = min + value * (max - min)
                    }

                    // Trigger param update
                    setTimeout(() => get().updateNodeParam(macro.targetNodeId!, macro.targetParam!, targetValue), 0)
                }
            }

            return { macros }
        })
    },

    assignMacro: (id, nodeId, param, range) => {
        const node = get().nodes.find(n => n.id === nodeId)
        if (!node) return

        let defaultRange: [number, number] = range || [0, 1]

        // Auto-detect range for freq/gain if not provided
        if (!range) {
            const p = param.toLowerCase()
            if (p.includes('freq')) defaultRange = [20, 20000]
            if (p.includes('gain') || p.includes('mix')) defaultRange = [0, 1]
            if (p.includes('detune')) defaultRange = [-100, 100]
            if (p.includes('q')) defaultRange = [0.1, 10]
        }

        set(state => {
            const macros = [...state.macros]
            macros[id] = {
                ...macros[id],
                label: `${node.data.label.substring(0, 6)} ${param.toUpperCase()}`,
                targetNodeId: nodeId,
                targetParam: param,
                range: defaultRange
            }

            // Update node mapping for visual feedback
            const nodes = state.nodes.map(n => n.id === nodeId ? {
                ...n,
                data: {
                    ...n.data,
                    macroMappings: { ...(n.data.macroMappings || {}), [param]: id }
                }
            } : n)

            return { macros, nodes }
        })
    },

    updateMacroLabel: (id, label) => set(state => {
        const macros = [...state.macros]
        macros[id] = { ...macros[id], label }
        return { macros }
    }),

    loadDevice: (json) => { try { const d = JSON.parse(json); set({ nodes: d.nodes || [], edges: d.edges || [], context: d.context || 'poly', macros: d.macros || get().macros }) } catch (e) { } },
    saveDevice: () => JSON.stringify({ context: get().context, nodes: get().nodes, edges: get().edges, macros: get().macros }),
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
}))
