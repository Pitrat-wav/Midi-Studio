import { memo, useEffect, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeData, useNodeStore, NodePort } from '../../store/nodeStore'
import { X, Calculator } from 'lucide-react'
import { GraphEngine } from '../../logic/GraphEngine'
import { PortScope } from './PortScope'
import './CustomNode.css'

export const MathNode = memo(({ id, data, selected }: NodeProps<NodeData>) => {
    const updateScript = useNodeStore(s => s.updateNodeScript)
    const updateInputs = useNodeStore(s => s.updateNodeInputs)
    const removeNode = useNodeStore(s => s.removeNode)
    const [hoveredPort, setHoveredPort] = useState<string | null>(null)

    const formula = data.script || ''

    // Variable parsing logic
    useEffect(() => {
        const tokens = formula.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g) || []
        const reserved = ['Math', 'PI', 'sin', 'cos', 'tan', 'abs', 'sqrt', 'time', 'sampleRate', 'min', 'max', 'floor', 'ceil', 'round', 'log', 'pow', 'random']

        // Find unique variables that are not reserved, limit to 4
        // We also want to preserve the order of appearance
        const variables: string[] = []
        tokens.forEach(t => {
            if (!reserved.includes(t) && !variables.includes(t) && variables.length < 4) {
                variables.push(t)
            }
        })

        const newInputs: NodePort[] = variables.map(v => ({
            id: v,
            label: v.toUpperCase(),
            type: 'signal'
        }))

        // Deep equality check to prevent infinite update loops
        if (JSON.stringify(newInputs) !== JSON.stringify(data.inputs)) {
            updateInputs(id, newInputs)
        }
    }, [formula, id, data.inputs, updateInputs])

    return (
        <div className={`custom-node logic ${selected ? 'selected' : ''}`} style={{ minWidth: '180px' }}>
            <div className="node-header">
                <div className="node-icon">
                    <Calculator size={12} />
                </div>
                <span className="node-title">Math Expression</span>
                <button className="node-close" onClick={() => removeNode(id)}>
                    <X size={12} />
                </button>
            </div>

            <div className="node-body">
                <div className="io-column inputs">
                    {data.inputs.map((port) => (
                        <div
                            key={port.id}
                            className="io-port input"
                            onMouseEnter={() => {
                                setHoveredPort(port.id)
                                GraphEngine.connectRover(id, port.id)
                            }}
                            onMouseLeave={() => {
                                setHoveredPort(null)
                                GraphEngine.disconnectRover()
                            }}
                        >
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={port.id}
                                className="handle-signal"
                            />
                            <span className="port-label-inner">{port.label}</span>
                            {hoveredPort === port.id && <PortScope />}
                        </div>
                    ))}
                </div>

                <div className="node-content" style={{ padding: '4px' }}>
                    <textarea
                        className="math-textarea"
                        value={formula}
                        spellCheck={false}
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) => updateScript(id, e.target.value)}
                        placeholder="in1 * sin(time)..."
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            background: '#000',
                            color: '#0f0',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            padding: '4px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div className="io-column outputs">
                    <div
                        className="io-port output"
                        onMouseEnter={() => {
                            setHoveredPort('out')
                            GraphEngine.connectRover(id, 'out')
                        }}
                        onMouseLeave={() => {
                            setHoveredPort(null)
                            GraphEngine.disconnectRover()
                        }}
                    >
                        <span className="port-label-inner">RESULT</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="out"
                            className="handle-signal"
                        />
                        {hoveredPort === 'out' && <PortScope />}
                    </div>
                </div>
            </div>
        </div>
    )
})
