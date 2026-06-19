import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeData, useNodeStore } from '../../store/nodeStore'
import { X, Wifi, WifiOff } from 'lucide-react'
import './CustomNode.css'

export const PortalSend = memo(({ id, data, selected }: NodeProps<NodeData>) => {
    const updateParam = useNodeStore(s => s.updateNodeParam)
    const removeNode = useNodeStore(s => s.removeNode)

    return (
        <div className={`custom-node io portal-node ${selected ? 'selected' : ''}`} style={{ borderLeft: '4px solid #f06595' }}>
            <div className="node-header">
                <div className="node-icon"><Wifi size={12} /></div>
                <span className="node-title" style={{ fontSize: '10px' }}>WIRELESS TX</span>
                <button className="node-close" aria-label="Close node" onClick={() => removeNode(id)}>
                    <X size={12} />
                </button>
            </div>
            <div className="node-body" style={{ padding: '8px 4px' }}>
                <div className="io-column inputs">
                    <div className="io-port input">
                        <Handle type="target" position={Position.Left} id="in" className="handle-audio" />
                    </div>
                </div>
                <div className="node-content">
                    <input
                        type="text"
                        className="portal-input"
                        value={data.params.portalId || ''}
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) => updateParam(id, 'portalId', e.target.value)}
                        placeholder="CHANNEL ID"
                        style={{
                            width: '100%',
                            background: '#000',
                            border: '1px solid #f06595',
                            color: '#f06595',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            borderRadius: '2px',
                            padding: '2px'
                        }}
                    />
                </div>
            </div>
        </div>
    )
})

export const PortalReceive = memo(({ id, data, selected }: NodeProps<NodeData>) => {
    const updateParam = useNodeStore(s => s.updateNodeParam)
    const removeNode = useNodeStore(s => s.removeNode)

    return (
        <div className={`custom-node io portal-node ${selected ? 'selected' : ''}`} style={{ borderRight: '4px solid #f06595' }}>
            <div className="node-header">
                <div className="node-icon"><WifiOff size={12} /></div>
                <span className="node-title" style={{ fontSize: '10px' }}>WIRELESS RX</span>
                <button className="node-close" aria-label="Close node" onClick={() => removeNode(id)}>
                    <X size={12} />
                </button>
            </div>
            <div className="node-body" style={{ padding: '8px 4px' }}>
                <div className="node-content">
                    <input
                        type="text"
                        className="portal-input"
                        value={data.params.portalId || ''}
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) => updateParam(id, 'portalId', e.target.value)}
                        placeholder="CHANNEL ID"
                        style={{
                            width: '100%',
                            background: '#000',
                            border: '1px solid #f06595',
                            color: '#f06595',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            borderRadius: '2px',
                            padding: '2px'
                        }}
                    />
                </div>
                <div className="io-column outputs">
                    <div className="io-port output">
                        <Handle type="source" position={Position.Right} id="out" className="handle-audio" />
                    </div>
                </div>
            </div>
        </div>
    )
})
