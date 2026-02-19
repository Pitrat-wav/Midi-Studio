
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel,
    NodeTypes,
    ReactFlowInstance
} from 'reactflow'
import 'reactflow/dist/style.css'
import './ReactFlow.css'  // Studio 2026 theme
import { useNodeStore, NodeType, NODE_DEFS } from '../../store/nodeStore'
import { CustomNode } from '../Nodes/CustomNode'
import { MathNode } from '../Nodes/MathNode'
import { PortalSend, PortalReceive } from '../Nodes/PortalNodes'
import { ActiveEdge } from '../Nodes/ActiveEdge'
import { EdgeTypes, DefaultEdgeOptions } from 'reactflow'
import { X, Settings, Code, Bot, Calculator, Wand2, Music, Zap, Layers, Maximize2, Search } from 'lucide-react'
import './NodeEditor.css'
import { ContextMenu } from './ContextMenu'
import { NodeInspector } from './NodeInspector'

const nodeTypes: NodeTypes = {
    custom: CustomNode,
    math: MathNode,
    portal_send: PortalSend,
    portal_receive: PortalReceive
}

const edgeTypes: EdgeTypes = {
    active: ActiveEdge
}

const defaultEdgeOptions: DefaultEdgeOptions = {
    type: 'active'
}

function DraggableNode({ type, label, icon }: { type: NodeType, label: string, icon: any }) {
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

function NodeEditorContent({ onClose }: { onClose: () => void }) {
    const nodes = useNodeStore(state => state.nodes)
    const edges = useNodeStore(state => state.edges)
    const context = useNodeStore(state => state.context)
    const onNodesChange = useNodeStore(state => state.onNodesChange)
    const onEdgesChange = useNodeStore(state => state.onEdgesChange)
    const onConnect = useNodeStore(state => state.onConnect)
    const addNode = useNodeStore(state => state.addNode)
    const setContext = useNodeStore(state => state.setContext)

    const [menu, setMenu] = useState<{ x: number, y: number, nodeId: string | null } | null>(null)
    const [inspectorNodeId, setInspectorNodeId] = useState<string | null>(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const filteredNodes = useMemo(() =>
        Object.entries(NODE_DEFS).filter(([key, def]) =>
            def.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            key.toLowerCase().includes(searchQuery.toLowerCase())
        ), [searchQuery]
    )

    const onAddNodeFromSearch = useCallback((type: string) => {
        addNode(type as NodeType, 400, 300)
        setSearchOpen(false)
    }, [addNode])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !searchOpen && !inspectorNodeId) {
                e.preventDefault()
                setSearchOpen(true)
                setSearchQuery('')
                setSelectedIndex(0)
            }
            if (e.key === 'Escape') {
                setSearchOpen(false)
                setInspectorNodeId(null)
            }

            if (searchOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setSelectedIndex(i => (i + 1) % Math.max(1, filteredNodes.length))
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setSelectedIndex(i => (i - 1 + filteredNodes.length) % Math.max(1, filteredNodes.length))
                } else if (e.key === 'Enter') {
                    if (filteredNodes[selectedIndex]) {
                        onAddNodeFromSearch(filteredNodes[selectedIndex][0])
                    }
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [searchOpen, inspectorNodeId, selectedIndex, searchQuery, filteredNodes, onAddNodeFromSearch])

    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50)
        }
    }, [searchOpen])

    const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: any) => {
        setInspectorNodeId(node.id)
    }, [])

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
        event.preventDefault()
        setMenu({ x: event.clientX, y: event.clientY, nodeId: node.id })
    }, [])

    const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault()
        setMenu({ x: event.clientX, y: event.clientY, nodeId: null })
    }, [])

    const onMenuClose = useCallback(() => setMenu(null), [])

    const onDuplicate = useCallback(() => {
        if (menu?.nodeId) {
            const node = nodes.find(n => n.id === menu.nodeId)
            if (node) {
                addNode(node.type as NodeType, node.position.x + 20, node.position.y + 20)
            }
        }
        setMenu(null)
    }, [menu, nodes, addNode])

    const onDelete = useCallback(() => {
        if (menu?.nodeId) {
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
            <div className="node-sidebar">
                <header>
                    <h2>THE GRID</h2>
                    <span className="subtitle">MODULAR ENV</span>
                </header>

                <div className="context-switcher">
                    <button className={`btn-context ${context === 'poly' ? 'active' : ''}`} onClick={() => setContext('poly')}><Zap size={14} /> POLY</button>
                    <button className={`btn-context ${context === 'fx' ? 'active' : ''}`} onClick={() => setContext('fx')}><Layers size={14} /> FX</button>
                    <button className={`btn-context ${context === 'note' ? 'active' : ''}`} onClick={() => setContext('note')}><Music size={14} /> NOTE</button>
                </div>

                <div className="sidebar-scroll scrollbar-style">
                    {context === 'fx' && (
                        <div className="sidebar-fx-groups">
                            {[
                                { title: 'DYNAMICS', prefix: ['fx_limiter', 'audio_compressor', 'fx_transient', 'fx_env_follower'] },
                                { title: 'SPATIAL', prefix: ['fx_platereverb', 'fx_hybrid', 'fx_echo', 'fx_graindelay', 'fx_filterdelay', 'fx_reverb', 'fx_delay', 'fx_autopan', 'fx_spectral_blur'] },
                                { title: 'DRIVE & TONE', prefix: ['fx_saturator', 'fx_overdrive', 'fx_dist', 'fx_reduce', 'audio_bitcrusher', 'fx_exciter', 'fx_formant', 'fx_subgen', 'fx_freq_shifter'] },
                                { title: 'MODULATION', prefix: ['fx_phaser_pro', 'fx_flanger', 'fx_chorus', 'audio_phaser'] }
                            ].map(group => (
                                <div className="sidebar-section" key={group.title}>
                                    <h3>{group.title}</h3>
                                    <div className="lib-grid">
                                        {group.prefix.map(key => NODE_DEFS[key] && (
                                            <DraggableNode key={key} type={key as NodeType} label={NODE_DEFS[key].label!} icon={<Zap size={12} />} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {context === 'poly' && (
                        <div className="sidebar-section">
                            <h3>AUDIO SOURCES</h3>
                            <div className="lib-grid">
                                {Object.entries(NODE_DEFS)
                                    .filter(([key, def]) =>
                                        (key.startsWith('audio_') || key.startsWith('lib_') || (key.startsWith('adv_') && def.category === 'audio')) &&
                                        def.category === 'audio'
                                    )
                                    .map(([key, def]) => (
                                        <DraggableNode key={key} type={key as any} label={def.label!} icon={<Settings size={12} />} />
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {context === 'note' && (
                        <>
                            <div className="sidebar-section">
                                <h3>LOGIC & NOTES</h3>
                                <div className="lib-grid">
                                    {Object.entries(NODE_DEFS)
                                        .filter(([key, def]) =>
                                            key.startsWith('logic_') || key.startsWith('note_')
                                        )
                                        .map(([key, def]) => (
                                            <DraggableNode key={key} type={key as any} label={def.label!} icon={<Music size={12} />} />
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="sidebar-section">
                                <h3>ADVANCED & AI</h3>
                                <div className="lib-grid">
                                    {Object.entries(NODE_DEFS)
                                        .filter(([key, def]) =>
                                            key.startsWith('adv_') || key.startsWith('ai_') || key.startsWith('script_') || key.startsWith('io_') || key.startsWith('visual_')
                                        )
                                        .map(([key, def]) => (
                                            <DraggableNode key={key} type={key as any} label={def.label!} icon={<Code size={12} />} />
                                        ))
                                    }
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="sidebar-footer">
                    <button className="btn-close-studio" onClick={onClose}><X size={16} /> CLOSE STUDIO</button>
                </div>
            </div>

            <div className="node-canvas-wrapper" onDragOver={onDragOver} onDrop={onDrop}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onNodeContextMenu={onNodeContextMenu}
                    onPaneContextMenu={onPaneContextMenu}
                    fitView
                    className="react-flow-dark"
                >
                    <Background color="#111" gap={20} size={1} />
                    <Controls />
                    <Panel position="bottom-right">
                        <div className="studio-stats">
                            <span>NODES: {nodes.length}</span>
                            <span>EDGES: {edges.length}</span>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    nodeId={menu.nodeId}
                    onClose={onMenuClose}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                />
            )}

            {inspectorNodeId && (
                <NodeInspector
                    nodeId={inspectorNodeId}
                    onClose={() => setInspectorNodeId(null)}
                />
            )}

            {searchOpen && (
                <div className="search-overlay" onClick={() => setSearchOpen(false)}>
                    <div className="search-modal" onClick={e => e.stopPropagation()}>
                        <div className="search-header">
                            <span className="search-icon"><Search size={18} /></span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value)
                                    setSelectedIndex(0)
                                }}
                                placeholder="Search The Grid nodes..."
                                className="search-input"
                            />
                            <kbd className="esc-hint">ESC</kbd>
                        </div>
                        <div className="search-results scrollbar-style">
                            {filteredNodes.length === 0 ? (
                                <div className="search-empty">No nodes found</div>
                            ) : (
                                filteredNodes.map(([key, def], index) => (
                                    <div
                                        key={key}
                                        className={`search-item ${index === selectedIndex ? 'active' : ''}`}
                                        onClick={() => onAddNodeFromSearch(key)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <span className="item-name">{def.label}</span>
                                        <span className="item-key">{key}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="search-footer">
                            <span>Use <kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                            <span><kbd>↵</kbd> to select</span>
                        </div>
                    </div>
                </div>
            )}
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
