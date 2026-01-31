import React from 'react'
import { usePadStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import './PadsScreen.css'

export const PadsScreen: React.FC = () => {
    const store = usePadStore()
    const harmony = useHarmonyStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)

    return (
        <div className="pads-screen hud-window">
            <div className="hud-header">
                <h2>☁️ AMBIENT STRATOSPHERE</h2>
                <div className="hud-header-actions">
                    <button className="hud-close" onClick={() => setFocusedInstrument(null)}>✕</button>
                </div>
            </div>

            <div className="ambient-container">
                {/* Global Harmony */}
                <div className="ambient-harmony-row">
                    <div className="ambient-param">
                        <label>ROOT NOTE</label>
                        <select
                            value={harmony.root}
                            onChange={(e) => harmony.setRoot(e.target.value)}
                            className="ambient-select"
                        >
                            {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="ambient-param">
                        <label>SCALE</label>
                        <select
                            value={harmony.scale}
                            onChange={(e) => harmony.setScale(e.target.value as any)}
                            className="ambient-select"
                        >
                            {SCALES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="ambient-main-controls">
                    <div className="ambient-toggle"
                        onClick={() => store.setParams({ active: !store.active })}
                    >
                        <div className={`ambient-power-icon ${store.active ? 'active' : ''}`}>
                            {store.active ? '◉' : '○'}
                        </div>
                        <span>{store.active ? 'ATMOSPHERE ACTIVE' : 'ATMOSPHERE STANDBY'}</span>
                    </div>

                    <div className="ambient-sliders">
                        <div className="ambient-slider-group">
                            <label>BRIGHTNESS</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={store.brightness}
                                onChange={(e) => store.setParams({ brightness: parseFloat(e.target.value) })}
                                className="ambient-slider"
                            />
                            <span className="ambient-value">{Math.round(store.brightness * 100)}%</span>
                        </div>

                        <div className="ambient-slider-group">
                            <label>COMPLEXITY</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={store.complexity}
                                onChange={(e) => store.setParams({ complexity: parseFloat(e.target.value) })}
                                className="ambient-slider"
                            />
                            <span className="ambient-value">{Math.round(store.complexity * 100)}%</span>
                        </div>
                    </div>
                </div>

                {/* Chord Display */}
                <div className="ambient-chord-display">
                    <div className="ambient-chord-label">CURRENT PROGRESSION</div>
                    <div className="ambient-chord-grid">
                        {[1, 4, 5, 6].map(degree => (
                            <div key={degree} className="ambient-chord-card">
                                <div className="chord-degree">{degree}</div>
                                <div className="chord-quality">
                                    {store.complexity < 0.5 ? 'TRIAD' : '7TH'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visual Wave */}
                <div className="ambient-wave-container">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div
                            key={i}
                            className="ambient-wave-bar"
                            style={{
                                height: `${20 + Math.sin(i * 0.3 + (store.active ? Date.now() / 500 : 0)) * 15}px`,
                                background: `linear-gradient(180deg, #ff9944 0%, #ffcc66 100%)`,
                                opacity: store.active ? 0.8 : 0.3
                            }}
                        />
                    ))}
                </div>

                {/* Info Footer */}
                <div className="ambient-info">
                    <div className="ambient-info-item">
                        <span className="info-label">TYPE:</span>
                        <span className="info-value">Generative Pad Synth</span>
                    </div>
                    <div className="ambient-info-item">
                        <span className="info-label">ALGORITHM:</span>
                        <span className="info-value">Modal Chord Progression</span>
                    </div>
                    <div className="ambient-info-item">
                        <span className="info-label">INSPIRATION:</span>
                        <span className="info-value">Brian Eno / Ambient 1</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
