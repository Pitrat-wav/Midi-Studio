import React from 'react'
import { useBassStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioKnob, StudioButton, StudioDisplay } from './StudioScreen'
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
                                min={50}
                                max={10000}
                                onChange={(v) => store.setCutoff(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Resonance"
                                value={store.resonance}
                                min={0.1}
                                max={20}
                                onChange={(v) => store.setResonance(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Morph"
                                value={store.morph}
                                min={0}
                                max={1}
                                onChange={(v) => store.setMorph(v)}
                                color="blue"
                            />
                            <StudioKnob
                                label="Distortion"
                                value={store.distortion}
                                min={0}
                                max={1}
                                onChange={(v) => store.setDistortion(v)}
                                color="blue"
                            />
                        </>
                    ) : (
                        <>
                            <StudioKnob
                                label="Harmonicity"
                                value={store.fmHarmonicity}
                                min={0.1}
                                max={5}
                                onChange={(v) => store.setParams({ fmHarmonicity: v })}
                                color="blue"
                            />
                            <StudioKnob
                                label="Mod Index"
                                value={store.fmModIndex}
                                min={0}
                                max={50}
                                onChange={(v) => store.setParams({ fmModIndex: v })}
                                color="blue"
                            />
                            <StudioKnob
                                label="Attack"
                                value={store.fmAttack}
                                min={0.001}
                                max={1}
                                onChange={(v) => store.setParams({ fmAttack: v })}
                                color="blue"
                            />
                            <StudioKnob
                                label="Decay"
                                value={store.fmDecay}
                                min={0.01}
                                max={2}
                                onChange={(v) => store.setParams({ fmDecay: v })}
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
                                onClick={() => {
                                    toggleStepParam(i, 'active')
                                    if (window.Telegram?.WebApp?.HapticFeedback) {
                                        window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
                                    }
                                }}
                                aria-label={`Step ${i + 1}`}
                                aria-pressed={step?.active}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
