import { create } from 'zustand'
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges
} from 'reactflow'

// Grid Contexts: Defines the environment the nodes are running in
export type GridContext = 'poly' | 'fx' | 'note'

export type NodeCategory = 'audio' | 'logic' | 'note' | 'io' | 'script' | 'ai' | 'visual'

export type NodeType =
    // Audio (Stereo by default)
    | 'audio_osc' | 'audio_filter' | 'audio_env' | 'audio_vca' | 'audio_mixer' | 'audio_spectral' | 'audio_lfo' | 'audio_delay' | 'audio_reverb' | 'audio_noise'
    // Logic
    | 'logic_math' | 'logic_clock' | 'logic_gate' | 'logic_seq' | 'logic_compare' | 'logic_random' | 'logic_value' | 'logic_op' | 'logic_sample_hold' | 'logic_euclidean'
    // Note (MIDI/Event)
    | 'note_quantizer' | 'note_scale' | 'note_chord' | 'note_arp' | 'note_delay'
    // FX
    | 'fx_dist' | 'fx_delay' | 'fx_chorus' | 'fx_reverb'
    // Inst
    | 'inst_kick' | 'inst_snare' | 'inst_hat'
    // IO
    | 'io_audio_in' | 'io_audio_out' | 'io_midi_in' | 'io_midi_out'
    // Visual
    | 'visual_scope'
    // Advanced
    | 'script_js' | 'ai_gen' | 'ai_chat'

export interface NodePort {
    id: string
    label: string
    type: 'audio' | 'signal' | 'data' | 'phase' // Added Phase for complex modulation
}

export interface NodeData {
    label: string
    type: NodeType
    category: NodeCategory
    inputs: NodePort[]
    outputs: NodePort[]
    params: Record<string, any>
    script?: string // For js nodes
    // React Flow specific
    [key: string]: any
}

interface NodeState {
    context: GridContext
    nodes: Node<NodeData>[]
    edges: Edge[]

    // React Flow handlers
    onNodesChange: OnNodesChange
    onEdgesChange: OnEdgesChange
    onConnect: OnConnect

    // Custom Actions
    setContext: (context: GridContext) => void
    addNode: (type: NodeType, x: number, y: number) => void
    removeNode: (id: string) => void
    updateNodeParam: (id: string, param: string, value: any) => void
    updateNodeScript: (id: string, code: string) => void

    // Device Management
    loadDevice: (deviceJson: string) => void
    saveDevice: () => string

    setNodes: (nodes: Node<NodeData>[]) => void
    setEdges: (edges: Edge[]) => void
}

const uuid = () => Math.random().toString(36).substring(2, 9)

// Expanded Node Definitions
const NODE_DEFS: Record<NodeType, Partial<NodeData>> = {
    // AUDIO (Stereo)
    'audio_osc': {
        label: 'Oscillator', category: 'audio',
        inputs: [{ id: 'freq', label: 'Freq', type: 'signal' }, { id: 'fm', label: 'FM', type: 'audio' }, { id: 'phase', label: 'Phase', type: 'phase' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { type: 'sine', frequency: 440, detune: 0, stereo_spread: 0 }
    },
    'audio_lfo': {
        label: 'LFO', category: 'audio',
        inputs: [{ id: 'freq', label: 'Rate', type: 'signal' }, { id: 'reset', label: 'Reset', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'signal' }],
        params: { type: 'sine', frequency: 1, min: -1, max: 1 }
    },
    'audio_noise': {
        label: 'Noise', category: 'audio',
        inputs: [],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { type: 'white' } // white, pink, brown
    },
    'audio_filter': {
        label: 'Filter', category: 'audio',
        inputs: [{ id: 'in', label: 'In', type: 'audio' }, { id: 'cutoff', label: 'Cutoff', type: 'signal' }, { id: 'q', label: 'Q', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { type: 'lowpass', frequency: 1000, Q: 1 }
    },
    'audio_env': {
        label: 'ADSR', category: 'audio',
        inputs: [{ id: 'gate', label: 'Gate', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Env', type: 'signal' }],
        params: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 1.0 }
    },
    'audio_vca': {
        label: 'VCA', category: 'audio',
        inputs: [{ id: 'in', label: 'In', type: 'audio' }, { id: 'cv', label: 'Gain', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { gain: 0.0, pan: 0.0 }
    },
    'audio_mixer': {
        label: 'Mixer (2ch)', category: 'audio',
        inputs: [{ id: 'in1', label: 'In 1', type: 'audio' }, { id: 'in2', label: 'In 2', type: 'audio' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { mix: 0.5 }
    },
    'audio_delay': {
        label: 'Delay', category: 'audio',
        inputs: [{ id: 'in', label: 'In', type: 'audio' }, { id: 'time', label: 'Time', type: 'signal' }, { id: 'feed', label: 'Fdbk', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { delayTime: 0.25, feedback: 0.4, wet: 0.5 }
    },
    'audio_reverb': {
        label: 'Reverb', category: 'audio',
        inputs: [{ id: 'in', label: 'In', type: 'audio' }, { id: 'size', label: 'Size', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { decay: 1.5, preDelay: 0.01, wet: 0.5 }
    },
    'audio_spectral': {
        label: 'Spectral Filter', category: 'audio',
        inputs: [{ id: 'in', label: 'In', type: 'audio' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }],
        params: { bin_size: 512, shift: 0 }
    },

    // LOGIC
    'logic_value': {
        label: 'Value', category: 'logic',
        inputs: [],
        outputs: [{ id: 'out', label: 'Out', type: 'signal' }],
        params: { value: 1.0 }
    },
    'logic_op': {
        label: 'Math Op', category: 'logic',
        inputs: [{ id: 'a', label: 'A', type: 'signal' }, { id: 'b', label: 'B', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'signal' }],
        params: { op: 'add' } // add, sub, mul, div, mod, pow
    },
    'logic_clock': {
        label: 'Clock', category: 'logic',
        inputs: [],
        outputs: [{ id: 'pulse', label: 'Pulse', type: 'signal' }, { id: 'phase', label: 'Phase', type: 'phase' }],
        params: { bpm: 120, div: 4 }
    },
    'logic_seq': {
        label: 'Sequencer (8)', category: 'logic',
        inputs: [{ id: 'clock', label: 'Clock', type: 'signal' }, { id: 'phase', label: 'Phase', type: 'phase' }], // Phase driven sequencer
        outputs: [{ id: 'cv', label: 'CV', type: 'signal' }, { id: 'gate', label: 'Gate', type: 'signal' }],
        params: { steps: Array(8).fill(0).map(() => ({ note: 60, active: true })) }
    },
    'logic_math': {
        label: 'Math Func', category: 'logic',
        inputs: [{ id: 'in', label: 'In', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'signal' }],
        params: { func: 'abs' } // abs, floor, ceil, sin, cos
    },
    'logic_gate': {
        label: 'Gate Logic', category: 'logic',
        inputs: [{ id: 'in', label: 'In', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'signal' }],
        params: { mode: 'probability', value: 0.5 }
    },
    'logic_compare': {
        label: 'Compare', category: 'logic',
        inputs: [{ id: 'a', label: 'A', type: 'signal' }, { id: 'b', label: 'B', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Bool', type: 'signal' }],
        params: { op: '>' }
    },
    'logic_random': {
        label: 'Random', category: 'logic',
        inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'signal' }],
        params: { min: 0, max: 1 }
    },
    'logic_sample_hold': {
        label: 'Sample & Hold', category: 'logic',
        inputs: [{ id: 'in', label: 'In', type: 'signal' }, { id: 'trig', label: 'Trig', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'signal' }],
        params: {}
    },

    // NOTE (New)
    'note_quantizer': {
        label: 'Quantizer', category: 'note',
        inputs: [{ id: 'pitch', label: 'Pitch', type: 'signal' }],
        outputs: [{ id: 'quantized', label: 'Out', type: 'signal' }],
        params: { scale: 'major', root: 'C' }
    },
    'note_scale': {
        label: 'Scale Snap', category: 'note',
        inputs: [{ id: 'in', label: 'Pitch', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Pitch', type: 'signal' }],
        params: { scale: 'minor' }
    },
    'note_chord': {
        label: 'Chord', category: 'note',
        inputs: [{ id: 'root', label: 'Root', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Chord', type: 'signal' }], // Multi-channel signal?
        params: { type: 'triad' }
    },
    'note_arp': {
        label: 'Arpeggiator', category: 'note',
        inputs: [{ id: 'chord', label: 'Chord', type: 'signal' }, { id: 'clock', label: 'Clock', type: 'signal' }],
        outputs: [{ id: 'pitch', label: 'Pitch', type: 'signal' }],
        params: { mode: 'up', octaves: 1 }
    },
    'note_delay': {
        label: 'Note Delay', category: 'note',
        inputs: [{ id: 'note', label: 'Note', type: 'signal' }, { id: 'gate', label: 'Gate', type: 'signal' }],
        outputs: [{ id: 'note_d', label: 'Note', type: 'signal' }, { id: 'gate_d', label: 'Gate', type: 'signal' }],
        params: { steps: 1 }
    },

    // IO
    'io_audio_in': {
        label: 'Audio In', category: 'io',
        inputs: [],
        outputs: [{ id: 'l', label: 'L', type: 'audio' }, { id: 'r', label: 'R', type: 'audio' }],
        params: { gain: 1.0 }
    },
    'io_audio_out': {
        label: 'Output', category: 'io',
        inputs: [{ id: 'l', label: 'L', type: 'audio' }, { id: 'r', label: 'R', type: 'audio' }],
        outputs: [],
        params: { gain: 1.0 }
    },
    'io_midi_in': {
        label: 'MIDI In', category: 'io',
        inputs: [],
        outputs: [{ id: 'note', label: 'Note', type: 'signal' }, { id: 'gate', label: 'Gate', type: 'signal' }, { id: 'vel', label: 'Vel', type: 'signal' }],
        params: { channel: 1 }
    },
    'io_midi_out': {
        label: 'MIDI Out', category: 'io',
        inputs: [{ id: 'note', label: 'Note', type: 'signal' }, { id: 'gate', label: 'Gate', type: 'signal' }],
        outputs: [],
        params: { channel: 1 }
    },

    // --- FX ---
    fx_dist: {
        label: 'Distortion', category: 'audio',
        params: { distortion: 0.4, wet: 1 },
        inputs: [{ id: 'in', label: 'In', type: 'audio' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }]
    },
    fx_delay: {
        label: 'Delay', category: 'audio',
        params: { delayTime: 0.25, feedback: 0.5, wet: 0.5 },
        inputs: [{ id: 'in', label: 'In', type: 'audio' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }]
    },
    fx_chorus: {
        label: 'Chorus', category: 'audio',
        params: { frequency: 4, delayTime: 2.5, depth: 0.5, wet: 0.5 },
        inputs: [{ id: 'in', label: 'In', type: 'audio' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }]
    },
    fx_reverb: {
        label: 'Reverb', category: 'audio',
        params: { decay: 1.5, preDelay: 0.01, wet: 0.5 },
        inputs: [{ id: 'in', label: 'In', type: 'audio' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }]
    },

    // --- INST (Modular Drums) ---
    inst_kick: {
        label: 'Kick', category: 'audio',
        params: { pitch: 'C1', decay: 0.3 },
        inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }]
    },
    inst_snare: {
        label: 'Snare', category: 'audio',
        params: { decay: 0.2, noise: 0.8 },
        inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }]
    },
    inst_hat: {
        label: 'HiHat', category: 'audio',
        params: { decay: 0.1, freq: 8000 },
        inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }],
        outputs: [{ id: 'out', label: 'Out', type: 'audio' }]
    },

    // --- ADVANCED ---
    visual_scope: {
        label: 'Oscilloscope',
        category: 'visual',
        params: { mode: 'waveform' },
        inputs: [{ id: 'in', label: 'Signal', type: 'audio' }],
        outputs: []
    },
    'logic_euclidean': {
        label: 'Euclidean Seq',
        category: 'logic',
        params: { steps: 16, pulses: 4, rotate: 0 },
        inputs: [{ id: 'clock', label: 'Clock', type: 'signal' }],
        outputs: [{ id: 'trig', label: 'Trig', type: 'signal' }]
    },
    'script_js': {
        label: 'Script PRO', category: 'script',
        inputs: [{ id: 'in1', label: 'In 1', type: 'data' }],
        outputs: [{ id: 'out1', label: 'Out 1', type: 'data' }],
        params: {},
        script: `// JSFX-Style Script
// Inputs: inputs[0] (Audio Buffer)
// Memory: memory[0]...memory[1024]
// API: gfx.rect(x,y,w,h)

function init() {
  memory[0] = 0; // State
}

function process(inputs, output) {
  // Simple Gain Example
  for (let i = 0; i < inputs.length; i++) {
     output[i] = inputs[i] * 0.5;
  }
}`
    },
    'ai_gen': {
        label: 'Texture Gen', category: 'ai',
        inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }],
        outputs: [{ id: 'url', label: 'URL', type: 'data' }],
        params: { prompt: 'liquid metal textures' }
    },
    'ai_chat': {
        label: 'AI Agent', category: 'ai',
        inputs: [{ id: 'trig', label: 'Trig', type: 'signal' }],
        outputs: [{ id: 'action', label: 'Action', type: 'data' }],
        params: { context: 'Create a bassline' }
    }
}

// Export Edge alias
export type NodeEdge = Edge

export const useNodeStore = create<NodeState>((set, get) => ({
    // Initial State
    context: 'poly', // Default context
    nodes: [],
    edges: [],

    setContext: (context) => set({ context }),

    // React Flow handlers
    onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
    onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
    onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),

    // Custom Actions
    addNode: (type, x, y) => {
        const def = NODE_DEFS[type]
        if (!def) return

        const id = uuid()
        const newNode: Node<NodeData> = {
            id,
            type: 'custom',
            position: { x, y },
            data: {
                label: def.label!,
                type: type,
                category: def.category!,
                inputs: def.inputs!,
                outputs: def.outputs!,
                params: { ...def.params },
                script: def.script
            }
        }

        set(state => ({ nodes: [...state.nodes, newNode] }))
    },

    removeNode: (id) => {
        set(state => ({
            nodes: state.nodes.filter(n => n.id !== id),
            edges: state.edges.filter(e => e.source !== id && e.target !== id)
        }))
    },

    updateNodeParam: (id, param, value) => {
        set(state => ({
            nodes: state.nodes.map(n => {
                if (n.id === id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            params: { ...n.data.params, [param]: value }
                        }
                    }
                }
                return n
            })
        }))
    },

    updateNodeScript: (id, code) => {
        set(state => ({
            nodes: state.nodes.map(n => {
                if (n.id === id) {
                    return {
                        ...n,
                        data: { ...n.data, script: code }
                    }
                }
                return n
            })
        }))
    },

    loadDevice: (json) => {
        try {
            const data = JSON.parse(json)
            set({ nodes: data.nodes || [], edges: data.edges || [], context: data.context || 'poly' })
        } catch (e) {
            console.error('Failed to load device', e)
        }
    },

    saveDevice: () => {
        const { nodes, edges, context } = get()
        return JSON.stringify({ context, nodes, edges })
    },

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
}))
