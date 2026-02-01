import React, { useMemo } from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    Handle,
    Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useNodeStore } from '../../store/nodeStore'
import { useAudioStore } from '../../store/audioStore'
import { X, Play, Zap } from 'lucide-react'
import './NodeEditor.css'

// Custom Node Components
const InstrumentNode = ({ data }: { data: any }) => (
    <div className="custom-node instrument-node">
        <Handle type="target" position={Position.Left} />
        <div className="node-header">
            <Zap size={14} />
            <span>{data.label}</span>
        </div>
        <div className="node-content">SYNTH</div>
        <Handle type="source" position={Position.Right} />
    </div>
)

const EffectNode = ({ data }: { data: any }) => (
    <div className="custom-node effect-node">
        <Handle type="target" position={Position.Left} />
        <div className="node-header">
            <span>{data.label}</span>
        </div>
        <div className="node-content">FX</div>
        <Handle type="source" position={Position.Right} />
    </div>
)

const MasterNode = ({ data }: { data: any }) => (
    <div className="custom-node master-node">
        <Handle type="target" position={Position.Left} />
        <div className="node-header">
            <span>{data.label}</span>
        </div>
        <div className="node-content">OUT</div>
    </div>
)

const nodeTypes = {
    instrumentNode: InstrumentNode,
    effectNode: EffectNode,
    masterNode: MasterNode,
}

export function NodeEditor({ onClose }: { onClose: () => void }) {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useNodeStore()
    const recalculateRouting = useAudioStore(s => s.recalculateRouting)

    // Sync audio routing when connections change
    React.useEffect(() => {
        recalculateRouting(edges)
    }, [edges, recalculateRouting])

    return (
        <div className="node-editor-overlay">
            <div className="node-editor-container">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    className="neural-flow"
                >
                    <Panel position="top-right" className="node-panel-controls">
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </Panel>
                    <Background color="#333" gap={20} />
                    <Controls />
                    <MiniMap nodeStrokeColor="#555" maskColor="rgba(0,0,0,0.2)" />
                </ReactFlow>

                <div className="node-editor-hint">
                    TAB to Exit • Drag to connect • Neural Routing Active
                </div>
            </div>
        </div>
    )
}
