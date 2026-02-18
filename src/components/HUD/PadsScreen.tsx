import React from 'react'
import { usePadStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioButton, StudioDisplay } from './StudioScreen'
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
            ledColor="blue"
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
                        color="blue"
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
                    <div className="pad-control-item">
                        <label>Brightness</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={store.brightness}
                            onChange={(e) => store.setParams({ brightness: parseFloat(e.target.value) })}
                            className="studio-slider-horizontal"
                        />
                        <span className="control-value">{Math.round(store.brightness * 100)}%</span>
                    </div>
                    <div className="pad-control-item">
                        <label>Complexity</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={store.complexity}
                            onChange={(e) => store.setParams({ complexity: parseFloat(e.target.value) })}
                            className="studio-slider-horizontal"
                        />
                        <span className="control-value">{Math.round(store.complexity * 100)}%</span>
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
