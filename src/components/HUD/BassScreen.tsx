import React from 'react'
import { useBassStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioKnob, StudioButton, StudioDisplay, StudioSlider } from './StudioScreen'
import './BassScreen.css'

export const BassScreen: React.FC = () => {
    const store = useBassStore()
    const harmony = useHarmonyStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)
    const handleClose = () => setFocusedInstrument(null)

    const toggleStepParam = (index: number, field: 'active' | 'accent' | 'slide') => {
        const newPattern = [...store.pattern]
        if (!newPattern[index]) return
        newPattern[index] = { ...newPattern[index], [field]: !newPattern[index][field] }
        store.setPattern(newPattern)
    }

    return (
        <StudioScreen
            title="Acid Bass Engine"
            subtitle={store.activeInstrument === 'acid' ? 'TB-303 Liquid' : 'FM Metallic'}
            onClose={handleClose}
            ledColor="blue"
            className="bass-screen-studio"
        >
            <div className="bass-screen-content">
                {/* Top Controls */}
                <div className="bass-top-controls">
                    <div className="engine-selector">
                        <StudioButton
                            label="ACID"
                            onClick={() => store.setInstrument('acid')}
                            active={store.activeInstrument === 'acid'}
                        />
                        <StudioButton
                            label="FM"
                            onClick={() => store.setInstrument('fm')}
                            active={store.activeInstrument === 'fm'}
                        />
                    </div>

                    <StudioDisplay
                        value={store.activeInstrument === 'acid' ? 'LIQUID' : 'METAL'}
                        color="blue"
                        size="small"
                    />
                </div>

                {/* Main Controls Grid */}
                <div className="bass-controls-grid">
                    {store.activeInstrument === 'acid' ? (
                        <>
                            <StudioKnob
                                label="Cutoff"
                                value={store.cutoff}
                                min={0}
                                max={100}
                                onChange={(v) => store.setCutoff(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Resonance"
                                value={store.resonance}
                                min={0}
                                max={100}
                                onChange={(v) => store.setResonance(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Accent"
                                value={store.accent}
                                min={0}
                                max={100}
                                onChange={(v) => store.setAccent(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Decay"
                                value={store.decay}
                                min={0}
                                max={100}
                                onChange={(v) => store.setDecay(v)}
                                color="blue"
                            />
                        </>
                    ) : (
                        <>
                            <StudioKnob
                                label="Modulator"
                                value={store.fmMod}
                                min={0}
                                max={100}
                                onChange={(v) => store.setFmMod(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Ratio"
                                value={store.fmRatio}
                                min={0}
                                max={100}
                                onChange={(v) => store.setFmRatio(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Feedback"
                                value={store.fmFeedback}
                                min={0}
                                max={100}
                                onChange={(v) => store.setFmFeedback(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Level"
                                value={store.level}
                                min={0}
                                max={100}
                                onChange={(v) => store.setLevel(v)}
                                color="blue"
                            />
                        </>
                    )}
                </div>

                {/* Harmony Section */}
                <div className="bass-harmony-section">
                    <div className="harmony-controls">
                        <label>Root</label>
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

                {/* Pattern Editor */}
                <div className="bass-pattern-editor">
                    <div className="pattern-steps">
                        {store.pattern.map((step, i) => (
                            <button
                                key={i}
                                className={`pattern-step ${step?.active ? 'active' : ''}`}
                                onClick={() => toggleStepParam(i, 'active')}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
                            <div className="parameter-value-large" style={{ fontSize: '1rem' }}>
                                {store.activeInstrument === 'acid' ? 'LIQUID CRYSTAL ACTIVE' : 'FERRO-FLUID METALLIC'}
                            </div>
                        </div>
                    </aside>

                    {/* Right Column: Parameters & Sequencer */}
                    <main className="magazine-column-right">
                        {store.activeInstrument === 'acid' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                {[
                                    { label: 'Cutoff Frequency', value: Math.round(store.cutoff), min: 50, max: 10000, key: 'cutoff' },
                                    { label: 'Silver Resonance', value: store.resonance.toFixed(1), min: 0.1, max: 20, key: 'resonance' },
                                    { label: 'Morph State', value: Math.round(store.morph * 100) + '%', min: 0, max: 1, key: 'morph', step: 0.01 },
                                    { label: 'Drive / Distort', value: Math.round(store.distortion * 100) + '%', min: 0, max: 1, key: 'distortion', step: 0.01 }
                                ].map(p => (
                                    <div key={p.key} className="parameter-display">
                                        <div className="parameter-label">{p.label}</div>
                                        <div className="parameter-value-large">{p.value}</div>
                                        <input
                                            type="range"
                                            className="magazine-range"
                                            min={p.min} max={p.max} step={p.step || 1}
                                            value={store[p.key as keyof typeof store] as number}
                                            onChange={(e) => store.setParams({ [p.key]: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                {[
                                    { label: 'Harmonic Content', value: store.fmHarmonicity.toFixed(1), min: 0.5, max: 8, key: 'fmHarmonicity', step: 0.1 },
                                    { label: 'Modulation Index', value: store.fmModIndex.toFixed(1), min: 0, max: 20, key: 'fmModIndex', step: 0.1 },
                                    { label: 'Attack Profile', value: Math.round(store.fmAttack * 1000) + 'ms', min: 0.001, max: 0.5, key: 'fmAttack', step: 0.001 },
                                    { label: 'Decay Envelope', value: Math.round(store.fmDecay * 1000) + 'ms', min: 0.01, max: 2, key: 'fmDecay', step: 0.01 }
                                ].map(p => (
                                    <div key={p.key} className="parameter-display">
                                        <div className="parameter-label">{p.label}</div>
                                        <div className="parameter-value-large">{p.value}</div>
                                        <input
                                            type="range"
                                            className="magazine-range"
                                            min={p.min} max={p.max} step={p.step || 1}
                                            value={store[p.key as keyof typeof store] as number}
                                            onChange={(e) => store.setParams({ [p.key]: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="parameter-display">
                            <div className="parameter-label">Rhythmic Pattern Editorial</div>
                            <div className="magazine-sequencer-editorial">
                                {store.pattern.map((step, i) => (
                                    <div
                                        key={i}
                                        className={`sequencer-bar ${step.active ? 'active' : ''}`}
                                        style={{
                                            height: step.accent ? '100%' : step.active ? '60%' : '15%',
                                            borderTop: step.slide ? '2px solid #fff' : 'none'
                                        }}
                                        onClick={(e) => {
                                            if (e.shiftKey) toggleStepParam(i, 'accent')
                                            else if (e.altKey) toggleStepParam(i, 'slide')
                                            else toggleStepParam(i, 'active')
                                        }}
                                    />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <div className="parameter-label" style={{ fontSize: '8px' }}>Press SHIFT for Accent</div>
                                <div className="parameter-label" style={{ fontSize: '8px' }}>Press ALT for Slide</div>
                            </div>
                        </div>
                    </main>
                </div>

                <footer className="magazine-footer">
                    <div>© 2026 PREMIUM AUDIO LABS</div>
                    <div>ISSUE NO. 04 — BASS & LOW END FREQUENCIES</div>
                    <div>VOL. 01 — LIQUID METAL SERIES</div>
                </footer>
            </div>
        </div>
    )
}
