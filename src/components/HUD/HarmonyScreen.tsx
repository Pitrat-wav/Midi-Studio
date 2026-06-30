import { useId } from 'react'
import { useHarmStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export function HarmonyScreen() {
    const harmonyState = useHarmStore()
    const setFocus = useVisualStore(s => s.setFocusInstrument)

    const osc1DtnId = useId()
    const osc2DtnId = useId()
    const osc3DtnId = useId()
    const timbreId = useId()
    const fmIndexId = useId()
    const amIndexId = useId()
    const cutoffId = useId()
    const resonanceId = useId()
    const distId = useId()
    const phasId = useId()
    const delayId = useId()
    const reverbId = useId()

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
                            <button
                                className="rack-close"
                                onClick={() => {
                                    setFocus(null);
                                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                }}
                                aria-label="Close Harmony Station"
                            >
                                [ SHUTDOWN ]
                            </button>
                        </div>

                        <div className="rack-grid">
                            {/* OSCILLATORS SECTION */}
                            <div className="rack-panel">
                                <div className="panel-label">OSCILLATOR_BANK</div>

                                <div className="osc-row">
                                    {[
                                        { id: 1, enabled: osc1Enabled, type: osc1Type, detune: osc1Detune, rangeId: osc1DtnId, min: -50, max: 50 },
                                        { id: 2, enabled: osc2Enabled, type: osc2Type, detune: osc2Detune, rangeId: osc2DtnId, min: -1200, max: 1200 },
                                        { id: 3, enabled: osc3Enabled, type: osc3Type, detune: osc3Detune, rangeId: osc3DtnId, min: -1200, max: 1200 }
                                    ].map(osc => (
                                        <div key={osc.id} className={`osc-unit ${osc.enabled ? 'on' : ''}`}>
                                            <button
                                                className="unit-header"
                                                onClick={() => {
                                                    setParam({ [`osc${osc.id}Enabled` as any]: !osc.enabled });
                                                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                                }}
                                                aria-pressed={osc.enabled}
                                            >
                                                OSC{osc.id} [{osc.enabled ? 'ACTIVE' : 'OFF'}]
                                            </button>
                                            <select value={osc.type} onChange={(e) => setParam({ [`osc${osc.id}Type` as any]: e.target.value as any })}>
                                                {oscTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                            </select>
                                            <div className="range-wrap">
                                                <label htmlFor={osc.rangeId}>DTN {osc.detune}</label>
                                                <input
                                                    id={osc.rangeId}
                                                    type="range" min={osc.min} max={osc.max} value={osc.detune}
                                                    onChange={(e) => {
                                                        setParam({ [`osc${osc.id}Detune` as any]: parseInt(e.target.value) });
                                                        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* BUCHLA / COMPLEX SECTION */}
                            <div className={`rack-panel complex-section ${complexMode ? 'on' : ''}`}>
                                <div className="panel-label">BUCHLA_259_CORE</div>
                                <button
                                    className="unit-header"
                                    onClick={() => {
                                        setParam({ complexMode: !complexMode });
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                    }}
                                    aria-pressed={complexMode}
                                >
                                    FOLDING [{complexMode ? 'ENGAGED' : 'BYPASS'}]
                                </button>
                                <div className="control-column">
                                    {[
                                        { label: 'TIMBRE', val: complexTimbre, id: timbreId, key: 'complexTimbre' },
                                        { label: 'FM_INDEX', val: complexFmIndex, id: fmIndexId, key: 'complexFmIndex' },
                                        { label: 'AM_INDEX', val: complexAmIndex, id: amIndexId, key: 'complexAmIndex' }
                                    ].map(p => (
                                        <div key={p.key} className="range-wrap">
                                            <label htmlFor={p.id}>{p.label} {p.val.toFixed(2)}</label>
                                            <input
                                                id={p.id}
                                                type="range" min="0" max="1" step="0.01" value={p.val}
                                                onChange={(e) => {
                                                    setParam({ [p.key]: parseFloat(e.target.value) });
                                                    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FILTER SECTION */}
                            <div className={`rack-panel filter-section ${f1Enabled ? 'on' : ''}`}>
                                <div className="panel-label">ANALOG_FILTER_STRIP</div>
                                <button
                                    className="unit-header"
                                    onClick={() => {
                                        setParam({ f1Enabled: !f1Enabled });
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                    }}
                                    aria-pressed={f1Enabled}
                                >
                                    MAIN_VCF [{f1Enabled ? 'ACTIVE' : 'OFF'}]
                                </button>
                                <div className="control-column">
                                    <div className="range-wrap">
                                        <label htmlFor={cutoffId}>CUTOFF {f1Freq.toFixed(0)} Hz</label>
                                        <input
                                            id={cutoffId}
                                            type="range" min="20" max="15000" step="10" value={f1Freq}
                                            onChange={(e) => {
                                                setParam({ f1Freq: parseFloat(e.target.value) });
                                                window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                            }}
                                        />
                                    </div>
                                    <div className="range-wrap">
                                        <label htmlFor={resonanceId}>RESONANCE {f1Q.toFixed(1)}</label>
                                        <input
                                            id={resonanceId}
                                            type="range" min="0.1" max="20" step="0.1" value={f1Q}
                                            onChange={(e) => {
                                                setParam({ f1Q: parseFloat(e.target.value) });
                                                window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                            }}
                                        />
                                    </div>
                                    <div className="type-toggles">
                                        {['lowpass', 'highpass', 'bandpass'].map(t => (
                                            <button
                                                key={t}
                                                className={f1Type === t ? 'active' : ''}
                                                onClick={() => {
                                                    setParam({ f1Type: t as any });
                                                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                                }}
                                            >
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
                                    {[
                                        { label: 'DIST', val: distortionWet, id: distId, key: 'distortionWet' },
                                        { label: 'PHAS', val: phaserWet, id: phasId, key: 'phaserWet' },
                                        { label: 'DELA', val: delayWet, id: delayId, key: 'delayWet' },
                                        { label: 'REVE', val: reverbWet, id: reverbId, key: 'reverbWet' }
                                    ].map(fx => (
                                        <div key={fx.key} className="fx-slot">
                                            <label htmlFor={fx.id}>{fx.label}</label>
                                            <input
                                                id={fx.id}
                                                type="range" min="0" max="1" step="0.01" value={fx.val}
                                                onChange={(e) => {
                                                    setParam({ [fx.key]: parseFloat(e.target.value) });
                                                    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                                }}
                                            />
                                        </div>
                                    ))}
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
