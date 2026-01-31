import React from 'react'
import { useSequencerStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import './SequencerScreen.css'

export const SequencerScreen: React.FC = () => {
    const store = useSequencerStore()
    const harmony = useHarmonyStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)

    return (
        <div className="sequencer-screen hud-window">
            <div className="hud-header">
                <h2>🎛️ ML-185 MODULAR SEQUENCER</h2>
                <div className="hud-header-actions">
                    <button className="hud-close" onClick={() => setFocusedInstrument(null)}>✕</button>
                </div>
            </div>

            <div className="ml185-container">
                {/* Harmony Context */}
                <div className="ml185-harmony-bar">
                    <div className="ml185-param-compact">
                        <label>ROOT</label>
                        <select
                            value={harmony.root}
                            onChange={(e) => harmony.setRoot(e.target.value)}
                            className="ml185-select"
                        >
                            {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="ml185-param-compact">
                        <label>SCALE</label>
                        <select
                            value={harmony.scale}
                            onChange={(e) => harmony.setScale(e.target.value as any)}
                            className="ml185-select"
                        >
                            {SCALES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                {/* Stage Editor */}
                <div className="ml185-stages-panel">
                    <div className="ml185-panel-header">STAGE SEQUENCER</div>
                    <div className="ml185-stages-grid">
                        {store.stages.map((stage, i) => (
                            <div
                                key={i}
                                className="ml185-stage-card"
                            >
                                <div className="stage-number">{i + 1}</div>
                                <div className="stage-params">
                                    <div className="stage-param-row">
                                        <span className="param-label">LEN</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={stage.length}
                                            onChange={(e) => store.setStage(i, { length: parseInt(e.target.value) })}
                                            className="stage-input"
                                        />
                                    </div>
                                    <div className="stage-param-row">
                                        <span className="param-label">PLS</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={stage.pulseCount}
                                            onChange={(e) => store.setStage(i, { pulseCount: parseInt(e.target.value) })}
                                            className="stage-input"
                                        />
                                    </div>
                                    <div className="stage-param-row">
                                        <span className="param-label">PITCH</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="127"
                                            value={stage.pitch}
                                            onChange={(e) => store.setStage(i, { pitch: parseInt(e.target.value) })}
                                            className="stage-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Turing Machine */}
                <div className="ml185-turing-panel">
                    <div className="ml185-panel-header">TURING MACHINE</div>
                    <div className="turing-controls">
                        <div className="turing-param">
                            <label>BITS: {store.turingBits}</label>
                            <div className="turing-binary">
                                <div className="binary-display">
                                    {store.turingRegister.toString(2).padStart(store.turingBits, '0').split('').map((bit, i) => (
                                        <span key={i} className={`binary-bit ${bit === '1' ? 'on' : 'off'}`}>
                                            {bit}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="turing-param">
                            <label>PROBABILITY: {Math.round(store.turingProbability * 100)}%</label>                        </div>
                    </div>
                </div>

                {/* Snake Pattern */}
                <div className="ml185-snake-panel">
                    <div className="ml185-panel-header">SNAKE PATTERN: {store.snakePattern.toUpperCase()}</div>
                </div>

                {/* Info */}
                <div className="ml185-info">
                    <div className="ml185-info-item">
                        <span className="info-label">SYSTEM:</span>
                        <span className="info-value">Make Noise Maths + Music Thing Turing Machine</span>
                    </div>
                    <div className="ml185-info-item">
                        <span className="info-label">ALGORITHM:</span>
                        <span className="info-value">Euclidean + Probabilistic Shift Register</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
