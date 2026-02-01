
import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel,
    NodeTypes
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useNodeStore, NodeType, GridContext } from '../../store/nodeStore'
import { CustomNode } from '../Nodes/CustomNode'
import { X, Settings, Code, Bot, Calculator, Wand2, Music, Zap, Layers, Maximize2 } from 'lucide-react'
import './NodeEditor.css'
import { ContextMenu } from './ContextMenu'

const nodeTypes: NodeTypes = {
    custom: CustomNode
}

function NodeEditorContent({ onClose }: { onClose: () => void }) {
    const {
        nodes, edges, context,
        onNodesChange, onEdgesChange, onConnect,
        addNode, setContext
    } = useNodeStore()

    const [menu, setMenu] = React.useState<{ x: number, y: number, nodeId: string | null } | null>(null)

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
        event.preventDefault()
        setMenu({ x: event.clientX, y: event.clientY, nodeId: node.id })
    }, [])

    const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault()
        setMenu({ x: event.clientX, y: event.clientY, nodeId: null })
    }, [])

    const onMenuClose = useCallback(() => setMenu(null), [])

    // Actions
    const onDuplicate = useCallback(() => {
        if (menu?.nodeId) {
            const node = nodes.find(n => n.id === menu.nodeId)
            if (node) {
                // Offset position slightly
                addNode(node.type as NodeType, node.position.x + 20, node.position.y + 20)
            }
        }
        setMenu(null)
    }, [menu, nodes, addNode])

    const onDelete = useCallback(() => {
        if (menu?.nodeId) {
            // Trigger removal via onNodesChange
            onNodesChange([{ type: 'remove', id: menu.nodeId } as any])
        }
        setMenu(null)
    }, [menu, onNodesChange])

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        const type = event.dataTransfer.getData('application/reactflow') as NodeType
        if (!type) return

        const position = { x: event.clientX - 300, y: event.clientY - 100 }
        addNode(type, position.x, position.y)
    }, [addNode])

    return (
        <div className="node-editor-layout">
            {/* SIDEBAR PALETTE */}
            <div className="node-sidebar">
                <header>
                    <h2>THE GRID</h2>
                    <span className="subtitle">MODULAR ENV</span>
                </header>

                <div className="context-switcher">
                    <button
                        className={`btn - context ${context === 'poly' ? 'active' : ''} `}
                        onClick={() => setContext('poly')}
                    ><Zap size={14} /> POLY</button>
                    <button
                        className={`btn - context ${context === 'fx' ? 'active' : ''} `}
                        onClick={() => setContext('fx')}
                    ><Layers size={14} /> FX</button>
                    <button
                        className={`btn - context ${context === 'note' ? 'active' : ''} `}
                        onClick={() => setContext('note')}
                    ><Music size={14} /> NOTE</button>
                </div>

                <div className="sidebar-scroll">
                    <div className="sidebar-section">
                        <h3>AUDIO (STEREO)</h3>
                        <DraggableNode type="audio_osc" label="Oscillator" icon={<Settings size={14} />} />
                        <DraggableNode type="audio_filter" label="Filter" icon={<Settings size={14} />} />
                        <DraggableNode type="audio_env" label="Envelope" icon={<Settings size={14} />} />
                        <DraggableNode type="audio_vca" label="VCA" icon={<Settings size={14} />} />
                        <DraggableNode type="audio_mixer" label="Mixer" icon={<Settings size={14} />} />
                        <DraggableNode type="audio_spectral" label="Spectral" icon={<Settings size={14} />} />
                    </div>

                    <div className="sidebar-section">
                        <h3>LOGIC</h3>
                        <DraggableNode type="logic_clock" label="Clock" icon={<Calculator size={14} />} />
                        <DraggableNode type="logic_seq" label="Sequencer" icon={<Calculator size={14} />} />
                        <DraggableNode type="logic_math" label="Math" icon={<Calculator size={14} />} />
                        <DraggableNode type="logic_gate" label="Gate" icon={<Calculator size={14} />} />
                        <DraggableNode type="logic_compare" label="Compare" icon={<Calculator size={14} />} />
                        <DraggableNode type="logic_random" label="Random" icon={<Calculator size={14} />} />
                    </div>

                    <div className="sidebar-section">
                        <h3>NOTE / MIDI</h3>
                        <DraggableNode type="note_quantizer" label="Quantizer" icon={<Music size={14} />} />
                        <DraggableNode type="note_scale" label="Scale Snap" icon={<Music size={14} />} />
                        <DraggableNode type="note_chord" label="Chord" icon={<Music size={14} />} />
                        <DraggableNode type="note_arp" label="Arpeggiator" icon={<Music size={14} />} />
                        <DraggableNode type="note_delay" label="Note Delay" icon={<Music size={14} />} />
                        <DraggableNode type="io_midi_in" label="MIDI In" icon={<Maximize2 size={14} />} />
                    </div>

                    <div className="sidebar-section">
                        <h3>FX RACK</h3>
                        <DraggableNode type="fx_dist" label="Distortion" icon={<Zap size={14} />} />
                        <DraggableNode type="fx_delay" label="Delay" icon={<Zap size={14} />} />
                        <DraggableNode type="fx_chorus" label="Chorus" icon={<Zap size={14} />} />
                        <DraggableNode type="fx_reverb" label="Reverb" icon={<Zap size={14} />} />
                    </div>

                    <div className="sidebar-section">
                        <h3>INSTRUMENTS</h3>
                        <DraggableNode type="inst_kick" label="Kick" icon={<Settings size={14} />} />
                        <DraggableNode type="inst_snare" label="Snare" icon={<Settings size={14} />} />
                        <DraggableNode type="inst_hat" label="HiHat" icon={<Settings size={14} />} />
                    </div>

                    <div className="sidebar-section">
                        <h3>ADVANCED</h3>
                        <DraggableNode type="script_js" label="Script PRO" icon={<Code size={14} />} />
                        <DraggableNode type="logic_euclidean" label="Euclidean Seq" icon={<Code size={14} />} />
                        <DraggableNode type="visual_scope" label="Oscilloscope" icon={<Wand2 size={14} />} />
                        <DraggableNode type="ai_gen" label="AI Generator" icon={<Wand2 size={14} />} />
                        <DraggableNode type="ai_chat" label="AI Agent" icon={<Bot size={14} />} />
                    </div>
                </div>
            </div>

            {/* MAIN CANVAS */}
            <div className="node-canvas-wrapper" onDragOver={onDragOver} onDrop={onDrop}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onNodeContextMenu={onNodeContextMenu}
                    onPaneContextMenu={onPaneContextMenu}
                    fitView
                    className="react-flow-dark"
                >
                    <Background color="#222" gap={20} size={1} />
                    <Controls />
                    <MiniMap
                        nodeColor={(n) => {
                            if (n.data.category === 'audio') return '#00aaff'
                            if (n.data.category === 'logic') return '#ffaa00'
                            return '#eee'
                        }}
                        style={{ background: '#111', height: 100 }}
                    />
                    <Panel position="top-right">
                        <button className="close-btn" onClick={onClose}>EXIT GRID</button>
                    </Panel>
                </ReactFlow>
                {menu && (
                    <ContextMenu
                        x={menu.x}
                        y={menu.y}
                        nodeId={menu.nodeId}
                        onClose={onMenuClose}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                    />
                )}
            </div>
        </div>
    )
}

function DraggableNode({ type, label, icon }: { type: NodeType, label: string, icon: React.ReactNode }) {
    const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.effectAllowed = 'move'
    }

    return (
        <div className="draggable-node" onDragStart={(event) => onDragStart(event, type)} draggable>
            {icon}
            <span>{label}</span>
        </div>
    )
}


export function NodeEditor(props: { onClose: () => void }) {
    return (
        <ReactFlowProvider>
            <NodeEditorContent {...props} />
        </ReactFlowProvider>
    )
}
