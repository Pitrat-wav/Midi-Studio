import { useHarmStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export function HarmonyScreen() {
    const harmonyState = useHarmStore()
    const setFocus = useVisualStore(s => s.setFocusInstrument)

    const {
        setParam, loadPreset, togglePlay, isPlaying,
        osc1Enabled, osc1Type, osc1Detune,
        osc2Enabled, osc2Type, osc2Detune,
        osc3Enabled, osc3Type, osc3Detune,
        f1Freq, f1Q, f1Type, f1Enabled,
        complexMode, complexTimbre, complexFmIndex, complexAmIndex,
        distortionWet, distortionDrive, phaserWet, reverbWet, delayWet
    } = harmonyState

    const oscTypes = ['sine', 'sawtooth', 'square', 'triangle']

    return (
        <div className="harmony-screen-overlay">
            <div className="amber-rack">
                <div className="amber-screen">
                    <div className="screen-content">
                        {/* Header */}
                        <div className="rack-header">
                            <span className="rack-title">INDUSTRIAL_HARMONY_STATION_V2.5</span>
                            <span className="rack-close" onClick={() => setFocus(null)}>[ SHUTDOWN ]</span>
                        </div>

                        <div className="rack-grid">
                            {/* OSCILLATORS SECTION */}
                            <div className="rack-panel">
                                <div className="panel-label">OSCILLATOR_BANK</div>

                                <div className="osc-row">
                                    <div className={`osc-unit ${osc1Enabled ? 'on' : ''}`}>
                                        <div className="unit-header" onClick={() => setParam({ osc1Enabled: !osc1Enabled })}>
                                            OSC1 [{osc1Enabled ? 'ACTIVE' : 'OFF'}]
                                        </div>
                                        <select value={osc1Type} onChange={(e) => setParam({ osc1Type: e.target.value as any })}>
                                            {oscTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                        </select>
                                        <div className="range-wrap">
                                            <label>DTN {osc1Detune}</label>
                                            <input type="range" min="-50" max="50" value={osc1Detune} onChange={(e) => setParam({ osc1Detune: parseInt(e.target.value) })} />
                                        </div>
                                    </div>

                                    <div className={`osc-unit ${osc2Enabled ? 'on' : ''}`}>
                                        <div className="unit-header" onClick={() => setParam({ osc2Enabled: !osc2Enabled })}>
                                            OSC2 [{osc2Enabled ? 'ACTIVE' : 'OFF'}]
                                        </div>
                                        <select value={osc2Type} onChange={(e) => setParam({ osc2Type: e.target.value as any })}>
                                            {oscTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                        </select>
                                        <div className="range-wrap">
                                            <label>DTN {osc2Detune}</label>
                                            <input type="range" min="-1200" max="1200" value={osc2Detune} onChange={(e) => setParam({ osc2Detune: parseInt(e.target.value) })} />
                                        </div>
                                    </div>

                                    <div className={`osc-unit ${osc3Enabled ? 'on' : ''}`}>
                                        <div className="unit-header" onClick={() => setParam({ osc3Enabled: !osc3Enabled })}>
                                            OSC3 [{osc3Enabled ? 'ACTIVE' : 'OFF'}]
                                        </div>
                                        <select value={osc3Type} onChange={(e) => setParam({ osc3Type: e.target.value as any })}>
                                            {oscTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                        </select>
                                        <div className="range-wrap">
                                            <label>DTN {osc3Detune}</label>
                                            <input type="range" min="-1200" max="1200" value={osc3Detune} onChange={(e) => setParam({ osc3Detune: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BUCHLA / COMPLEX SECTION */}
                            <div className={`rack-panel complex-section ${complexMode ? 'on' : ''}`}>
                                <div className="panel-label">BUCHLA_259_CORE</div>
                                <div className="unit-header" onClick={() => setParam({ complexMode: !complexMode })}>
                                    FOLDING [{complexMode ? 'ENGAGED' : 'BYPASS'}]
                                </div>
                                <div className="control-column">
                                    <div className="range-wrap">
                                        <label>TIMBRE {complexTimbre.toFixed(2)}</label>
                                        <input type="range" min="0" max="1" step="0.01" value={complexTimbre} onChange={(e) => setParam({ complexTimbre: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="range-wrap">
                                        <label>FM_INDEX {complexFmIndex.toFixed(2)}</label>
                                        <input type="range" min="0" max="1" step="0.01" value={complexFmIndex} onChange={(e) => setParam({ complexFmIndex: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="range-wrap">
                                        <label>AM_INDEX {complexAmIndex.toFixed(2)}</label>
                                        <input type="range" min="0" max="1" step="0.01" value={complexAmIndex} onChange={(e) => setParam({ complexAmIndex: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            {/* FILTER SECTION */}
                            <div className={`rack-panel filter-section ${f1Enabled ? 'on' : ''}`}>
                                <div className="panel-label">ANALOG_FILTER_STRIP</div>
                                <div className="unit-header" onClick={() => setParam({ f1Enabled: !f1Enabled })}>
                                    MAIN_VCF [{f1Enabled ? 'ACTIVE' : 'OFF'}]
                                </div>
                                <div className="control-column">
                                    <div className="range-wrap">
                                        <label>CUTOFF {f1Freq.toFixed(0)} Hz</label>
                                        <input type="range" min="20" max="15000" step="10" value={f1Freq} onChange={(e) => setParam({ f1Freq: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="range-wrap">
                                        <label>RESONANCE {f1Q.toFixed(1)}</label>
                                        <input type="range" min="0.1" max="20" step="0.1" value={f1Q} onChange={(e) => setParam({ f1Q: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="type-toggles">
                                        {['lowpass', 'highpass', 'bandpass'].map(t => (
                                            <button key={t} className={f1Type === t ? 'active' : ''} onClick={() => setParam({ f1Type: t as any })}>
                                                {t.substring(0, 2).toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* FX RACK */}
                            <div className="rack-panel fx-rack">
                                <div className="panel-label">FX_SIGNAL_PROCESSOR</div>
                                <div className="fx-matrix">
                                    <div className="fx-slot">
                                        <label>DIST</label>
                                        <input type="range" min="0" max="1" step="0.01" value={distortionWet} onChange={(e) => setParam({ distortionWet: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="fx-slot">
                                        <label>PHAS</label>
                                        <input type="range" min="0" max="1" step="0.01" value={phaserWet} onChange={(e) => setParam({ phaserWet: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="fx-slot">
                                        <label>DELA</label>
                                        <input type="range" min="0" max="1" step="0.01" value={delayWet} onChange={(e) => setParam({ delayWet: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="fx-slot">
                                        <label>REVE</label>
                                        <input type="range" min="0" max="1" step="0.01" value={reverbWet} onChange={(e) => setParam({ reverbWet: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rack-footer">
                            <span className="status-blink">RUNNING</span>
                            <span className="voltage">INTERNAL_VOLTAGE: 14.2V</span>
                            <span className="system-time">CORE_TEMP: 38C</span>
                        </div>
                    </div>
                    {/* Visual noise/grain */}
                    <div className="amber-grain"></div>
                    <div className="amber-scanlines"></div>
                </div>
            </div>
        </div>
    )
}
