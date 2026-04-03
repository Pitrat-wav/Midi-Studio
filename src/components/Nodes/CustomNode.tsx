import { memo, useState, useEffect, useRef } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { NodeData } from '../../store/nodeStore'
import { useNodeStore } from '../../store/nodeStore'
import { X, Code, Sparkles, Play, Settings, Terminal, Maximize2 } from 'lucide-react'
import './CustomNode.css'
import { GraphEngine } from '../../logic/GraphEngine'
import { PortScope } from './PortScope'

export const CustomNode = memo(({ id, data, selected }: NodeProps<NodeData>) => {
    const updateParam = useNodeStore(s => s.updateNodeParam)
    const updateScript = useNodeStore(s => s.updateNodeScript)
    const removeNode = useNodeStore(s => s.removeNode)
    const [isExpanded, setIsExpanded] = useState(false)
    const [hoveredPort, setHoveredPort] = useState<string | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // JSFX-style Graphics Loop
    useEffect(() => {
        if ((data.type !== 'script_js' && data.type !== 'visual_scope' && data.type !== 'audio_osc') || !canvasRef.current) return

        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        let frame = 0
        const loop = () => {
            frame++
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, 140, 60)
            ctx.lineWidth = 1.5
            ctx.strokeStyle = '#0f0'
            ctx.beginPath()

            // Get Real Node Data
            const wrapper = GraphEngine.getNode(id)
            if (wrapper && wrapper.node) {
                if (data.type === 'visual_scope') {
                    // Tone.Waveform
                    const wave = wrapper.node as any // Tone.Waveform
                    if (wave.getValue) {
                        const values = wave.getValue() // Float32Array
                        // Draw Waveform
                        // Scale x: buffer len -> 140px
                        // Scale y: -1..1 -> 0..60px (center 30)
                        const len = values.length
                        const step = Math.ceil(len / 140)

                        for (let i = 0; i < 140; i++) {
                            const val = values[i * step] || 0
                            const y = 30 - (val * 28) // Scale amplitude (nearly full height)
                            if (i === 0) ctx.moveTo(i, y)
                            else ctx.lineTo(i, y)
                        }
                    }
                }
                else if (data.type === 'audio_osc' && wrapper.inputs['freq']) {
                    // Fallback to animation for Osc
                    for (let i = 0; i < 140; i++) {
                        ctx.lineTo(i, 30 + Math.sin(i * 0.2 + frame * 0.2) * 20)
                    }
                }
                else {
                    // Script or other
                    for (let i = 0; i < 140; i++) {
                        ctx.lineTo(i, 30 + Math.sin(i * 0.1 + frame * 0.1) * 20)
                    }
                }
            } else {
                // Offline fallback
                for (let i = 0; i < 140; i++) {
                    ctx.lineTo(i, 30 + Math.sin(i * 0.1 + frame * 0.1) * 20)
                }
            }

            ctx.stroke()
            requestAnimationFrame(loop)
        }
        const animId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(animId)
    }, [data.type, id])

    // Render logic based on node type
    const renderContent = () => {
        return (
            <div className="node-params">
                {/* CANVAS for Visual Feedback (JSFX style) */}
                {(data.type === 'script_js' || data.type === 'audio_osc') && (
                    <canvas ref={canvasRef} width={140} height={60} className="node-canvas" />
                )}

                {Object.entries(data.params).map(([key, value]) => {
                    const type = typeof value

                    // Specific UI for certain keys
                    if (key === 'type' || key === 'mode' || key === 'op' || key === 'scale' || key === 'func') {
                        let options: string[] = []

                        // Define Options based on Key + NodeType
                        if (key === 'type') {
                            if (data.type === 'audio_filter') options = ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'peaking', 'lowshelf', 'highshelf']
                            else options = ['sine', 'square', 'sawtooth', 'triangle', 'pwm', 'pulse'] // Osc/LFO
                        }
                        else if (key === 'mode') options = ['probability', 'toggle', 'hold', 'trigger']
                        else if (key === 'op') {
                            if (data.type === 'logic_compare') options = ['>', '<', '===', '!==', '>=', '<=']
                            else options = ['add', 'sub', 'mul', 'div', 'mod', 'pow', 'max', 'min']
                        }
                        else if (key === 'func') options = ['abs', 'floor', 'ceil', 'round', 'sin', 'cos', 'tan', 'sqrt', 'log']
                        else if (key === 'scale') options = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'chromatic']

                        if (options.length > 0) {
                            return (
                                <div key={key} className="param-row">
                                    <label>{key.toUpperCase()}</label>
                                    <select
                                        className="param-select"
                                        value={String(value)}
                                        onPointerDown={(e) => e.stopPropagation()} // Prevent node drag
                                        onChange={(e) => updateParam(id, key, e.target.value)}
                                    >
                                        {options.map(opt => (
                                            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            )
                        }

                        // Fallback for unmapped enums
                        return (
                            <div key={key} className="param-row">
                                <label>{key}</label>
                                <span className="param-value">{String(value)}</span>
                            </div>
                        )
                    }

                    if (type === 'number') {
                        let min = 0, max = 1, step = 0.01;
                        if (key === 'frequency' || key === 'freq') { min = 20; max = 5000; step = 1; }
                        else if (key === 'detune') { min = -100; max = 100; step = 1; }
                        else if (key === 'bits') { min = 1; max = 16; step = 1; }
                        else if (key === 'semi') { min = -24; max = 24; step = 1; }
                        else if (key === 'oct') { min = -4; max = 4; step = 1; }
                        else if (key === 'steps' || key === 'pulses' || key === 'max') { min = 1; max = 64; step = 1; }
                        else if (key === 'rotate') { min = 0; max = 64; step = 1; }
                        else if (key === 'decay') { min = 0.1; max = 10; step = 0.1; }
                        else if (key === 'gain') { min = 0; max = 4; step = 0.05; }
                        else if (key === 'threshold') { min = -60; max = 0; step = 1; }
                        else if (key === 'ratio') { min = 1; max = 20; step = 1; }
                        else if (key === 'pan') { min = -1; max = 1; step = 0.01; }

                        return (
                            <div key={key} className="param-row">
                                <label>{key}</label>
                                <input
                                    type="range"
                                    min={min} max={max} step={step}
                                    value={value as number}
                                    onChange={(e) => updateParam(id, key, parseFloat(e.target.value))}
                                />
                                <span className="param-value-small">{String(value)}</span>
                            </div>
                        )
                    }

                    if (type === 'string' && key === 'prompt') {
                        return (
                            <div key={key} className="param-row full">
                                <textarea
                                    defaultValue={value as string}
                                    placeholder="Enter prompt..."
                                    className="param-text-area"
                                    onChange={(e) => updateParam(id, key, e.target.value)}
                                />
                            </div>
                        )
                    }

                    // Array Param (Sequencer Steps)
                    if (Array.isArray(value)) {
                        return (
                            <div key={key} className="param-group">
                                <label>STEPS</label>
                                <div className="seq-steps">
                                    {value.map((step: any, i: number) => (
                                        <div key={i} className="step-slider">
                                            <input
                                                type="range"
                                                min={0} max={127}
                                                value={step.note || 60}
                                                onChange={(e) => {
                                                    const newSteps = [...value]
                                                    newSteps[i] = { ...newSteps[i], note: parseInt(e.target.value) }
                                                    updateParam(id, key, newSteps)
                                                }}
                                            />
                                            <div className="step-val">{step.note}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }



                    return null
                })}

                {data.type === 'script_js' && (
                    <div className="node-action-group">
                        <button className="btn-action" onClick={() => setIsExpanded(!isExpanded)}>
                            <Code size={12} /> {isExpanded ? 'CLOSE' : 'EDIT CODE'}
                        </button>
                    </div>
                )}

                {isExpanded && data.type === 'script_js' && (
                    <div className="script-editor-overlay">
                        <div className="script-header">
                            <span>JSFX SCRIPT EDITOR</span>
                            <button aria-label="Close script editor" onClick={() => setIsExpanded(false)}><X size={12} /></button>
                        </div>
                        <textarea
                            className="code-input"
                            defaultValue={data.script}
                            onChange={(e) => updateScript(id, e.target.value)}
                        />
                        <div className="script-footer">
                            <button className="btn-compile"><Play size={10} /> COMPILE (Cmd+S)</button>
                        </div>
                    </div>
                )}

                {data.type === 'ai_gen' && (
                    <div className="node-action">
                        <button className="btn-action magic">
                            <Sparkles size={12} /> GENERATE
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={`custom-node ${data.category} ${selected ? 'selected' : ''}`}>
            {/* Header */}
            <div className="node-header">
                <div className="node-icon">
                    {data.category === 'audio' && <Settings size={12} />}
                    {data.category === 'script' && <Terminal size={12} />}
                    {data.category === 'ai' && <Sparkles size={12} />}
                    {data.category === 'logic' && <Play size={10} />}
                    {data.category === 'note' && <Maximize2 size={10} />}
                </div>
                <span className="node-title">{data.label}</span>
                <button className="node-close" aria-label="Close node" onClick={() => removeNode(id)}>
                    <X size={12} />
                </button>
            </div>

            {/* Body */}
            <div className="node-body">
                <div className="io-column inputs">
                    {data.inputs.map((port, i) => (
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
                                className={`handle-${port.type}`}
                            />
                            {hoveredPort === port.id && <PortScope />}
                        </div>
                    ))}
                </div>

                <div className="node-content">
                    {renderContent()}
                </div>

                <div className="io-column outputs">
                    {data.outputs.map((port, i) => (
                        <div
                            key={port.id}
                            className="io-port output"
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
                                type="source"
                                position={Position.Right}
                                id={port.id}
                                className={`handle-${port.type}`}
                            />
                            {hoveredPort === port.id && <PortScope />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
})
