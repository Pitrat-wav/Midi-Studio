/**
 * InstrumentNavigation — Compact navigation buttons for quick instrument switching
 * 
 * Fixed position at bottom of screen with clear visual feedback
 */

import type { InstrumentType } from '../lib/SpatialLayout'
import { useVisualStore, VISUALIZER_REGISTRY } from '../store/visualStore'
import './InstrumentNavigation.css'

interface InstrumentNavigationProps {
    currentInstrument: InstrumentType | null
    onSelect: (instrument: InstrumentType | null) => void
}

const INSTRUMENTS = [
    { id: null, label: 'All', icon: '🌌', shortcut: '0', color: '#888888' },
    { id: 'drums' as InstrumentType, label: 'Drums', icon: '🥁', shortcut: '1', color: '#ff4444' },
    { id: 'bass' as InstrumentType, label: 'Bass', icon: '🎸', shortcut: '2', color: '#3390ec' },
    { id: 'harmony' as InstrumentType, label: 'Synth', icon: '🎹', shortcut: '3', color: '#44ff44' },
    { id: 'pads' as InstrumentType, label: 'Pads', icon: '☁️', shortcut: '4', color: '#ff9944' },
    { id: 'sequencer' as InstrumentType, label: 'Seq', icon: '🎛️', shortcut: '5', color: '#aa44ff' },
    { id: 'drone' as InstrumentType, label: 'Drone', icon: '☄️', shortcut: '6', color: '#8800ff' },
    { id: 'master' as InstrumentType, label: 'Master', icon: '🕹️', shortcut: '7', color: '#cccccc' },
    { id: 'sampler' as InstrumentType, label: 'Sampler', icon: '🎚️', shortcut: '8', color: '#00ffcc' },
    { id: 'buchla' as InstrumentType, label: 'Buchla', icon: '🧬', shortcut: '9', color: '#3390ec' },
]

export function InstrumentNavigation({ currentInstrument, onSelect }: InstrumentNavigationProps) {
    const appView = useVisualStore(s => s.appView)
    const setAppView = useVisualStore(s => s.setAppView)
    const visualizerIndex = useVisualStore(s => s.visualizerIndex)
    const setVisualizerIndex = useVisualStore(s => s.setVisualizerIndex)
    const visualizerQuickSlots = useVisualStore(s => s.visualizerQuickSlots)
    const setQuickSlot = useVisualStore(s => s.setQuickSlot)

    if (appView === 'VISUALIZER') {
        return (
            <div className="instrument-navigation" style={{ pointerEvents: 'none' }}>
                <div className="nav-buttons visualizer-nav" style={{ pointerEvents: 'auto' }}>
                    {/* Home/Studio Button */}
                    <button
                        className="nav-button"
                        onClick={() => setAppView('3D')}
                        style={{ '--button-color': '#888888' } as any}
                    >
                        <span className="nav-icon">🏛️</span>
                        <span className="nav-label">Studio</span>
                        <span className="nav-shortcut">0</span>
                    </button>

                    {visualizerQuickSlots.map((vid, i) => {
                        const v = VISUALIZER_REGISTRY.find(item => item.id === vid) || VISUALIZER_REGISTRY[0]
                        const isActive = visualizerIndex === v.id

                        return (
                            <button
                                key={`slot-${i}`}
                                className={`nav-button ${isActive ? 'active' : ''}`}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    e.currentTarget.classList.add('drag-over')
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('drag-over')
                                }}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    e.currentTarget.classList.remove('drag-over')
                                    const data = e.dataTransfer.getData('visualizerId')
                                    if (data) {
                                        setQuickSlot(i, parseInt(data))
                                        useVisualStore.getState().setStatus(`SLOT ${i + 1} UPDATED: ${v.name}`)
                                    }
                                }}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setVisualizerIndex(v.id)
                                }}
                                style={{
                                    '--button-color': '#3390ec',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                } as React.CSSProperties}
                            >
                                <span className="nav-icon">{v.icon}</span>
                                <span className="nav-label">{v.name.split(' ')[0]}</span>
                                <span className="nav-shortcut">{i + 1}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="instrument-navigation" style={{ pointerEvents: 'none' }}>
            <div className="nav-buttons" style={{ pointerEvents: 'auto' }}>
                {INSTRUMENTS.map((instrument) => {
                    const isActive = currentInstrument === instrument.id

                    return (
                        <button
                            key={instrument.id || 'all'}
                            className={`nav-button ${isActive ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onSelect(instrument.id)
                            }}
                            style={{
                                '--button-color': instrument.color
                            } as React.CSSProperties}
                            title={`${instrument.label} (${instrument.shortcut})`}
                        >
                            <span className="nav-icon">{instrument.icon}</span>
                            <span className="nav-label">{instrument.label}</span>
                            <span className="nav-shortcut">{instrument.shortcut}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
