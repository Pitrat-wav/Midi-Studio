import React, { useId } from 'react'
import { usePadStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioButton, StudioDisplay } from './StudioScreen'
import './PadsScreen.css'

export const PadsScreen: React.FC = () => {
    const store = usePadStore()
    const harmony = useHarmonyStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)
    const handleClose = () => setFocusedInstrument(null)

    const rootId = useId()
    const scaleId = useId()
    const brightnessId = useId()
    const complexityId = useId()

    const handleHaptic = () => {
        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged()
    }

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
                        <label htmlFor={rootId}>Root Note</label>
                        <select
                            id={rootId}
                            value={harmony.root}
                            onChange={(e) => {
                                harmony.setRoot(e.target.value);
                                handleHaptic();
                            }}
                            className="studio-select"
                        >
                            {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="harmony-controls">
                        <label htmlFor={scaleId}>Scale</label>
                        <select
                            id={scaleId}
                            value={harmony.scale}
                            onChange={(e) => {
                                harmony.setScale(e.target.value as any);
                                handleHaptic();
                            }}
                            className="studio-select"
                        >
                            {SCALES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="pads-controls-grid">
                    <div className="pad-control-item">
                        <label htmlFor={brightnessId}>Brightness</label>
                        <input
                            id={brightnessId}
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={store.brightness}
                            onChange={(e) => {
                                store.setParams({ brightness: parseFloat(e.target.value) });
                                handleHaptic();
                            }}
                            className="studio-slider-horizontal"
                            aria-label="Pad Brightness"
                            aria-valuetext={`${Math.round(store.brightness * 100)}%`}
                        />
                        <span className="control-value" aria-hidden="true">{Math.round(store.brightness * 100)}%</span>
                    </div>
                    <div className="pad-control-item">
                        <label htmlFor={complexityId}>Complexity</label>
                        <input
                            id={complexityId}
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={store.complexity}
                            onChange={(e) => {
                                store.setParams({ complexity: parseFloat(e.target.value) });
                                handleHaptic();
                            }}
                            className="studio-slider-horizontal"
                            aria-label="Pad Complexity"
                            aria-valuetext={`${Math.round(store.complexity * 100)}%`}
                        />
                        <span className="control-value" aria-hidden="true">{Math.round(store.complexity * 100)}%</span>
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
