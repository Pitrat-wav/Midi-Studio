/**
 * InstrumentNavigation — Compact navigation buttons for quick instrument switching
 * 
 * Fixed position at bottom of screen with clear visual feedback
 */

import type { InstrumentType } from '../lib/SpatialLayout'
import { useVisualStore } from '../store/visualStore'
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

const VISUALIZERS = [
    { id: 'studio', label: 'Studio', icon: '🏛️', shortcut: '0', color: '#888888' },
    { id: 'feedback', label: 'Vortex', icon: '🌀', shortcut: '1', color: '#3390ec' },
    { id: 'quantum', label: 'Quantum', icon: '✨', shortcut: '2', color: '#ff3b30' },
    { id: 'fractal', label: 'Fractal', icon: '💎', shortcut: '3', color: '#00ffcc' },
]

export function InstrumentNavigation({ currentInstrument, onSelect }: InstrumentNavigationProps) {
    const appView = useVisualStore(s => s.appView)
    const setAppView = useVisualStore(s => s.setAppView)
    const visualizerIndex = useVisualStore(s => s.visualizerIndex)
    const setVisualizerIndex = useVisualStore(s => s.setVisualizerIndex)

    if (appView === 'VISUALIZER') {
        return (
            <div className="instrument-navigation">
                <div className="nav-buttons visualizer-nav">
                    {VISUALIZERS.map((v, i) => {
                        const isActive = (v.id === 'studio' && appView !== 'VISUALIZER') ||
                            (v.id !== 'studio' && visualizerIndex === i - 1)

                        return (
                            <button
                                key={v.id}
                                className={`nav-button ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    if (v.id === 'studio') setAppView('3D')
                                    else setVisualizerIndex(i - 1)
                                }}
                                style={{
                                    '--button-color': v.color
                                } as React.CSSProperties}
                            >
                                <span className="nav-icon">{v.icon}</span>
                                <span className="nav-label">{v.label}</span>
                                <span className="nav-shortcut">{v.shortcut}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="instrument-navigation">
            <div className="nav-buttons">
                {INSTRUMENTS.map((instrument) => {
                    const isActive = currentInstrument === instrument.id

                    return (
                        <button
                            key={instrument.id || 'all'}
                            className={`nav-button ${isActive ? 'active' : ''}`}
                            onClick={() => onSelect(instrument.id)}
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
