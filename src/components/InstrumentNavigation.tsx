/**
 * InstrumentNavigation — Compact navigation buttons for quick instrument switching
 * 
 * Fixed position at bottom of screen with clear visual feedback
 */

import type { InstrumentType } from '../lib/SpatialLayout'
import './InstrumentNavigation.css'

interface InstrumentNavigationProps {
    currentInstrument: InstrumentType | null
    onSelect: (instrument: InstrumentType | null) => void
}

const INSTRUMENTS = [
    { id: null, label: 'All', icon: '🎹', shortcut: '0', color: '#888888' },
    { id: 'drums' as InstrumentType, label: 'Drums', icon: '🥁', shortcut: '1', color: '#ff4444' },
    { id: 'bass' as InstrumentType, label: 'Bass', icon: '🎸', shortcut: '2', color: '#3390ec' },
    { id: 'harmony' as InstrumentType, label: 'Synth', icon: '🎹', shortcut: '3', color: '#44ff44' },
    { id: 'pads' as InstrumentType, label: 'Pads', icon: '☁️', shortcut: '4', color: '#ff9944' },
    { id: 'sequencer' as InstrumentType, label: 'Sequencer', icon: '🎛️', shortcut: '5', color: '#aa44ff' },
]

export function InstrumentNavigation({ currentInstrument, onSelect }: InstrumentNavigationProps) {
    return (
        <div className="instrument-navigation">
            <div className="nav-hint">Switch instruments:</div>
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
