import React from 'react'
import { useBassStore, useHarmonyStore, ROOTS, SCALES } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export const BassScreen: React.FC = () => {
    const store = useBassStore()
    const harmony = useHarmonyStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)

    const toggleStepParam = (index: number, field: 'active' | 'accent' | 'slide') => {
        const newPattern = [...store.pattern]
        if (!newPattern[index]) return
        newPattern[index] = { ...newPattern[index], [field]: !newPattern[index][field] }
        store.setPattern(newPattern)
    }

    return (
        <div className="bass-screen hud-window">
            <div className="hud-header">
                <h2>LIQUID BASS CORE</h2>
                <div className="hud-header-actions">
                    <button className="hud-close" onClick={() => setFocusedInstrument(null)}>✕</button>
                </div>
            </div>

            <div className="liquid-container">
                {/* Global Harmony Controls */}
                <div className="liquid-grid" style={{ marginBottom: '10px' }}>
                    <div className="liquid-group">
                        <label>ROOT NOTE</label>
                        <select
                            value={harmony.root}
                            onChange={(e) => harmony.setRoot(e.target.value)}
                            style={{ background: '#000', color: '#3390ec', border: '1px solid #3390ec', width: '100%', padding: '5px' }}
                        >
                            {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="liquid-group">
                        <label>SCALE</label>
                        <select
                            value={harmony.scale}
                            onChange={(e) => harmony.setScale(e.target.value as any)}
                            style={{ background: '#000', color: '#3390ec', border: '1px solid #3390ec', width: '100%', padding: '5px' }}
                        >
                            {SCALES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>

                <div className="instrument-selector">
                    <button
                        className={`inst-tab ${store.activeInstrument === 'acid' ? 'active' : ''}`}
                        onClick={() => store.setInstrument('acid')}
                    >
                        ACID (LIQUID)
                    </button>
                    <button
                        className={`inst-tab ${store.activeInstrument === 'fm' ? 'active' : ''}`}
                        onClick={() => store.setInstrument('fm')}
                    >
                        FM (METALLIC)
                    </button>
                </div>

                {store.activeInstrument === 'acid' ? (
                    <div className="liquid-grid">
                        <div className="liquid-group">
                            <label>CUTOFF</label>
                            <input
                                type="range" min="50" max="10000" step="1"
                                value={store.cutoff}
                                onChange={(e) => store.setParams({ cutoff: parseFloat(e.target.value) })}
                            />
                            <span className="val">{Math.round(store.cutoff)}</span>
                        </div>
                        <div className="liquid-group">
                            <label>RESONANCE</label>
                            <input
                                type="range" min="0.1" max="20" step="0.1"
                                value={store.resonance}
                                onChange={(e) => store.setParams({ resonance: parseFloat(e.target.value) })}
                            />
                            <span className="val">{store.resonance.toFixed(1)}</span>
                        </div>
                        <div className="liquid-group">
                            <label>MORPH</label>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={store.morph}
                                onChange={(e) => store.setParams({ morph: parseFloat(e.target.value) })}
                            />
                            <span className="val">{Math.round(store.morph * 100)}</span>
                        </div>
                        <div className="liquid-group">
                            <label>DISTORTION</label>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={store.distortion}
                                onChange={(e) => store.setParams({ distortion: parseFloat(e.target.value) })}
                            />
                            <span className="val">{Math.round(store.distortion * 100)}</span>
                        </div>

                        <div className="liquid-group">
                            <label>MELODY</label>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={store.type}
                                onChange={(e) => store.setParams({ type: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="liquid-group">
                            <label>SLIDE-PROB</label>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={store.slide}
                                onChange={(e) => store.setParams({ slide: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className="liquid-group">
                            <label>SEED A</label>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={store.seedA}
                                onChange={(e) => store.setParams({ seedA: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="liquid-group">
                            <label>SEED B</label>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={store.seedB}
                                onChange={(e) => store.setParams({ seedB: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className="liquid-group" style={{ gridColumn: 'span 2' }}>
                            <label>DENSITY</label>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={store.density}
                                onChange={(e) => store.setDensity(parseFloat(e.target.value))}
                            />
                            <span className="val">{Math.round(store.density * 100)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="liquid-grid">
                        <div className="liquid-group">
                            <label>HARMONICITY</label>
                            <input
                                type="range" min="0.5" max="8" step="0.1"
                                value={store.fmHarmonicity}
                                onChange={(e) => store.setParams({ fmHarmonicity: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="liquid-group">
                            <label>MOD INDEX</label>
                            <input
                                type="range" min="0" max="20" step="0.1"
                                value={store.fmModIndex}
                                onChange={(e) => store.setParams({ fmModIndex: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="liquid-group">
                            <label>ATTACK</label>
                            <input
                                type="range" min="0.001" max="0.5" step="0.001"
                                value={store.fmAttack}
                                onChange={(e) => store.setParams({ fmAttack: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="liquid-group">
                            <label>DECAY</label>
                            <input
                                type="range" min="0.01" max="2" step="0.01"
                                value={store.fmDecay}
                                onChange={(e) => store.setParams({ fmDecay: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="liquid-group" style={{ gridColumn: 'span 2' }}>
                            <label>FM RHYTHM MODE</label>
                            <div className="hud-header-actions" style={{ marginTop: '5px' }}>
                                {(['offbeat', 'galloping', 'syncopated', 'random'] as const).map(m => (
                                    <button
                                        key={m}
                                        className={`inst-tab ${store.fmMode === m ? 'active' : ''}`}
                                        onClick={() => store.setParams({ fmMode: m })}
                                        style={{ fontSize: '0.65rem' }}
                                    >
                                        {m.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sequencer Patterns */}
                <div style={{ padding: '10px 0' }}>
                    <label style={{ fontSize: '0.6rem', color: '#88d0ff', marginBottom: '5px', display: 'block' }}>SEQUENCER (CLICK: STEP | SHIFT: ACCENT | ALT: SLIDE)</label>
                    <div className="pattern-mini" style={{ height: '30px', gap: '4px' }}>
                        {store.pattern.map((step, i) => (
                            <div
                                key={i}
                                className={`pt-cell ${step.active ? 'active' : ''}`}
                                onClick={(e) => {
                                    if (e.shiftKey) toggleStepParam(i, 'accent')
                                    else if (e.altKey) toggleStepParam(i, 'slide')
                                    else toggleStepParam(i, 'active')
                                }}
                                style={{
                                    cursor: 'pointer',
                                    opacity: step.active ? 1 : 0.1,
                                    borderTop: step.accent ? '4px solid gold' : '1px solid rgba(255,255,255,0.1)',
                                    borderBottom: step.slide ? '4px solid cyan' : '1px solid rgba(255,255,255,0.1)',
                                    background: step.active ? undefined : 'rgba(255,255,255,0.05)'
                                } as any}
                            />
                        ))}
                    </div>
                </div>

                {/* Decorative Visual Surface */}
                <div className="morph-surface" style={{ height: '60px' }}>
                    <div className="morph-ripple" style={{
                        opacity: 0.3 + (store.resonance / 20) * 0.7,
                        filter: `blur(${10 - (store.cutoff / 1000)}px)`
                    } as any} />
                    <span style={{ zIndex: 5, color: '#3390ec', fontWeight: 'bold', fontSize: '0.8rem', pointerEvents: 'none' }}>
                        {store.activeInstrument.toUpperCase()} ENGINE ACTIVE
                    </span>
                </div>
            </div>
        </div>
    )
}
