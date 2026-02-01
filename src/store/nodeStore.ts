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

export type NodeType = 'sequencer' | 'instrument' | 'effect' | 'master'

export interface NodeData {
    label: string
    type: NodeType
    instrumentId?: string
    effectId?: string
}

interface NodeState {
    nodes: Node<NodeData>[]
    edges: Edge[]
    onNodesChange: OnNodesChange
    onEdgesChange: OnEdgesChange
    onConnect: OnConnect
    setNodes: (nodes: Node<NodeData>[]) => void
    setEdges: (edges: Edge[]) => void
    addNode: (node: Node<NodeData>) => void
    removeNode: (id: string) => void
}

const initialNodes: Node<NodeData>[] = [
    {
        id: 'master',
        type: 'masterNode',
        data: { label: 'MASTER', type: 'master' },
        position: { x: 800, y: 300 },
    },
    {
        id: 'drums',
        type: 'instrumentNode',
        data: { label: 'DRUMS', type: 'instrument', instrumentId: 'drums' },
        position: { x: 400, y: 100 },
    },
    {
        id: 'bass',
        type: 'instrumentNode',
        data: { label: 'BASS', type: 'instrument', instrumentId: 'bass' },
        position: { x: 400, y: 250 },
    },
    {
        id: 'lead',
        type: 'instrumentNode',
        data: { label: 'LEAD', type: 'instrument', instrumentId: 'lead' },
        position: { x: 400, y: 400 },
    },
    {
        id: 'reverb',
        type: 'effectNode',
        data: { label: 'REVERB', type: 'effect', effectId: 'reverb' },
        position: { x: 600, y: 400 },
    },
    {
        id: 'delay',
        type: 'effectNode',
        data: { label: 'DELAY', type: 'effect', effectId: 'delay' },
        position: { x: 600, y: 250 },
    },
    {
        id: 'distortion',
        type: 'effectNode',
        data: { label: 'DISTORTION', type: 'effect', effectId: 'distortion' },
        position: { x: 600, y: 100 },
    }
]

const initialEdges: Edge[] = [
    { id: 'e-drums-distortion', source: 'drums', target: 'distortion' },
    { id: 'e-distortion-master', source: 'distortion', target: 'master' },
    { id: 'e-bass-delay', source: 'bass', target: 'delay' },
    { id: 'e-delay-reverb', source: 'delay', target: 'reverb' },
    { id: 'e-lead-reverb', source: 'lead', target: 'reverb' },
    { id: 'e-reverb-master', source: 'reverb', target: 'master' }
]

export const useNodeStore = create<NodeState>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,

    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        })
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        })
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        })
    },

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    addNode: (node) => set({ nodes: [...get().nodes, node] }),
    removeNode: (id) => set({
        nodes: get().nodes.filter(n => n.id !== id),
        edges: get().edges.filter(e => e.source !== id && e.target !== id)
    }),
}))
