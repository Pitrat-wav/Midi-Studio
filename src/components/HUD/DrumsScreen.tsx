import React from 'react'
import { useDrumStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore' // Assuming this path
import './HUD.css'

export const DrumsScreen: React.FC = () => {
    const store = useDrumStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)

    const DRUMS = [
        { id: 'kick', label: 'Bass Drum', color: '#ff2244' },
        { id: 'snare', label: 'Snare', color: '#4466ff' },
        { id: 'hihat', label: 'Hi-Hat', color: '#ffff44' },
        { id: 'hihatOpen', label: 'Open Hat', color: '#ffaa22' },
        { id: 'clap', label: 'Clap', color: '#ff66ff' },
        { id: 'ride', label: 'Ride', color: '#44ffff' }
    ] as const

    const handleParamChange = (drum: any, field: string, value: number | boolean) => {
        store.setParams(drum, { [field]: value })
    }

    return (
        <div className="drums-screen hud-window">
            <div className="hud-header">
                <h2>DRUM LAB: {store.kit}</h2>
                <div className="hud-header-actions">
                    <button
                        className={`kit-toggle ${store.kit === '808' ? 'active' : ''}`}
                        onClick={() => store.setKit('808')}
                    >
                        808
                    </button>
                    <button
                        className={`kit-toggle ${store.kit === '909' ? 'active' : ''}`}
                        onClick={() => store.setKit('909')}
                    >
                        909
                    </button>
                    <button
                        className={`play-toggle ${store.isPlaying ? 'playing' : ''}`}
                        onClick={store.togglePlay}
                    >
                        {store.isPlaying ? 'STOP' : 'PLAY'}
                    </button>
                    <button className="hud-close" onClick={() => setFocusedInstrument(null)}>✕</button>
                </div>
            </div>

            <div className="drums-grid">
                {DRUMS.map((d) => {
                    const drumState = (store as any)[d.id]
                    return (
                        <div key={d.id} className="drum-channel" style={{ '--accent': d.color } as any}>
                            <div className="channel-header">
                                <span className="channel-name">{d.label}</span>
                                <button
                                    className={`mute-btn ${drumState.muted ? 'muted' : ''}`}
                                    onClick={() => handleParamChange(d.id, 'muted', !drumState.muted)}
                                >
                                    M
                                </button>
                            </div>

                            <div className="knob-row">
                                <div className="knob-group">
                                    <label>PITCH</label>
                                    <input
                                        type="range" min="0" max="1" step="0.01"
                                        value={drumState.pitch}
                                        onChange={(e) => handleParamChange(d.id, 'pitch', parseFloat(e.target.value))}
                                    />
                                    <span className="val">{Math.round(drumState.pitch * 100)}</span>
                                </div>
                                <div className="knob-group">
                                    <label>DECAY</label>
                                    <input
                                        type="range" min="0.01" max="1" step="0.01"
                                        value={drumState.decay}
                                        onChange={(e) => handleParamChange(d.id, 'decay', parseFloat(e.target.value))}
                                    />
                                    <span className="val">{Math.round(drumState.decay * 100)}</span>
                                </div>
                            </div>

                            <div className="knob-row">
                                <div className="knob-group">
                                    <label>VOLUME</label>
                                    <input
                                        type="range" min="-60" max="6" step="1"
                                        value={drumState.volume}
                                        onChange={(e) => handleParamChange(d.id, 'volume', parseFloat(e.target.value))}
                                    />
                                    <span className="val">{drumState.volume}dB</span>
                                </div>
                            </div>

                            <div className="seq-row">
                                <div className="seq-input">
                                    <label>STEPS</label>
                                    <input
                                        type="number" min="1" max="32"
                                        value={drumState.steps}
                                        onChange={(e) => handleParamChange(d.id, 'steps', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="seq-input">
                                    <label>PULSES</label>
                                    <input
                                        type="number" min="0" max={drumState.steps}
                                        value={drumState.pulses}
                                        onChange={(e) => handleParamChange(d.id, 'pulses', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Pattern Visualization */}
                            <div className="pattern-mini">
                                {store.activePatterns[d.id as keyof typeof store.activePatterns]?.map((active: boolean, i: number) => (
                                    <div key={i} className={`pt-cell ${active ? 'active' : ''}`} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
