import React from 'react'
import { usePadStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioKnob, StudioButton, StudioDisplay } from './StudioScreen'
import './PadsScreen.css'

export const PadsScreen: React.FC = () => {
    const store = usePadStore()
    const harmony = useHarmonyStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)
    const handleClose = () => setFocusedInstrument(null)

    return (
        <StudioScreen
            title="Ambient Stratosphere"
            subtitle="Atmospheric Pad Engine"
            onClose={handleClose}
            ledColor="purple"
            className="pads-screen-studio"
        >
            <div className="pads-screen-content">
                {/* Top Controls */}
                <div className="pads-top-controls">
                    <StudioButton
                        label={store.active ? 'ACTIVE' : 'STANDBY'}
                        onClick={() => store.setParams({ active: !store.active })}
                        active={store.active}
                        icon={store.active ? '◉' : '○'}
                    />
                    <StudioDisplay
                        value={`${Math.round(store.brightness * 100)}%`}
                        label="BRIGHTNESS"
                        color="purple"
                        size="small"
                    />
                </div>

                {/* Harmony Section */}
                <div className="pads-harmony-section">
                    <div className="harmony-controls">
                        <label>Root Note</label>
                        <select
                            value={harmony.root}
                            onChange={(e) => harmony.setRoot(e.target.value)}
                            className="studio-select"
                        >
                            {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="harmony-controls">
                        <label>Scale</label>
                        <select
                            value={harmony.scale}
                            onChange={(e) => harmony.setScale(e.target.value as any)}
                            className="studio-select"
                        >
                            {SCALES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="pads-controls-grid">
                    <StudioKnob
                        label="Brightness"
                        value={store.brightness * 100}
                        min={0}
                        max={100}
                        onChange={(v) => store.setParams({ brightness: v / 100 })}
                        color="purple"
                    />
                    <StudioKnob
                        label="Complexity"
                        value={store.complexity * 100}
                        min={0}
                        max={100}
                        onChange={(v) => store.setParams({ complexity: v / 100 })}
                        color="purple"
                    />
                    <StudioKnob
                        label="Spread"
                        value={store.spread * 100}
                        min={0}
                        max={100}
                        onChange={(v) => store.setParams({ spread: v / 100 })}
                        color="purple"
                    />
                    <StudioKnob
                        label="Modulation"
                        value={store.modulation * 100}
                        min={0}
                        max={100}
                        onChange={(v) => store.setParams({ modulation: v / 100 })}
                        color="purple"
                    />
                </div>

                {/* Voice Mode */}
                <div className="pads-voice-section">
                    <label>Voice Mode</label>
                    <div className="voice-mode-selector">
                        <StudioButton
                            label="Poly"
                            onClick={() => store.setParams({ voiceMode: 'poly' })}
                            active={store.voiceMode === 'poly'}
                        />
                        <StudioButton
                            label="Mono"
                            onClick={() => store.setParams({ voiceMode: 'mono' })}
                            active={store.voiceMode === 'mono'}
                        />
                        <StudioButton
                            label="Unison"
                            onClick={() => store.setParams({ voiceMode: 'unison' })}
                            active={store.voiceMode === 'unison'}
                        />
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
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
