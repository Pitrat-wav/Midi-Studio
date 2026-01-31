import { useHarmStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export function Buchla259Screen() {
    const {
        setParam, complexTimbre, complexFmIndex, complexAmIndex,
        complexOrder, complexHarmonics, complexPitchMod, complexAmpMod, complexTimbreMod,
        osc1Detune, complexModPitch, complexPrincipalPitch,
        osc1Type, complexModOscShape
    } = useHarmStore()

    const setFocus = useVisualStore(s => s.setFocusInstrument)

    return (
        <div className="buchla-overlay">
            <div className="buchla-panel">
                {/* Header Strip */}
                <div className="buchla-header">
                    <div className="header-text">PROGRAMMABLE COMPLEX WAVEFORM GENERATOR MODEL 259</div>
                    <div className="header-close" onClick={() => setFocus(null)}>CLOSE</div>
                </div>

                <div className="buchla-grid">
                    {/* LEFT COLUMN: MODULATION OSCILLATOR */}
                    <div className="buchla-column mod-osc">
                        <div className="section-label">MODULATION OSCILLATOR</div>

                        <div className="knob-group freq-group">
                            <div className="large-blue-knob">
                                <input
                                    type="range" min="-1200" max="1200" value={complexModPitch}
                                    onChange={(e) => setParam({ complexModPitch: parseInt(e.target.value) })}
                                />
                                <div className="knob-marker"></div>
                            </div>
                            <div className="label">FREQUENCY (Hz)</div>
                        </div>

                        <div className="waveshape-selector">
                            <div className="label">WAVESHAPE</div>
                            <div className="shape-toggles">
                                {['sine', 'sawtooth', 'square'].map(shape => (
                                    <div
                                        key={shape}
                                        className={`shape-led ${complexModOscShape === shape ? 'on' : ''}`}
                                        onClick={() => setParam({ complexModOscShape: shape as any })}
                                    >
                                        <div className="led"></div>
                                        <span>{shape.toUpperCase()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN: CONTROL SECTION */}
                    <div className="buchla-column control-section">
                        <div className="section-label">CONTROL</div>

                        <div className="mod-toggles">
                            <div className="toggle-row">
                                <div className={`toggle ${complexPitchMod ? 'on' : ''}`} onClick={() => setParam({ complexPitchMod: !complexPitchMod })}>
                                    <div className="switch"></div>
                                    <span>PITCH MOD.</span>
                                </div>
                            </div>
                            <div className="toggle-row">
                                <div className={`toggle ${complexAmpMod ? 'on' : ''}`} onClick={() => setParam({ complexAmpMod: !complexAmpMod })}>
                                    <div className="switch"></div>
                                    <span>AMPL. MOD.</span>
                                </div>
                            </div>
                            <div className="toggle-row">
                                <div className={`toggle ${complexTimbreMod ? 'on' : ''}`} onClick={() => setParam({ complexTimbreMod: !complexTimbreMod })}>
                                    <div className="switch"></div>
                                    <span>TIMBRE MOD.</span>
                                </div>
                            </div>
                        </div>

                        <div className="knob-group index-group">
                            <div className="medium-blue-knob">
                                <input
                                    type="range" min="0" max="1" step="0.01" value={complexFmIndex}
                                    onChange={(e) => setParam({ complexFmIndex: parseFloat(e.target.value) })}
                                />
                                <div className="knob-marker"></div>
                            </div>
                            <div className="label">MOD. INDEX</div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PRINCIPAL OSCILLATOR */}
                    <div className="buchla-column principal-osc">
                        <div className="section-label">PRINCIPAL OSCILLATOR</div>

                        <div className="knob-group freq-group">
                            <div className="large-blue-knob">
                                <input
                                    type="range" min="-1200" max="1200" value={complexPrincipalPitch}
                                    onChange={(e) => setParam({ complexPrincipalPitch: parseInt(e.target.value) })}
                                />
                                <div className="knob-marker"></div>
                            </div>
                            <div className="label">PITCH (Hz)</div>
                        </div>

                        <div className="shaping-grid">
                            <div className="knob-small">
                                <input type="range" min="0" max="1" step="0.01" value={complexTimbre} onChange={(e) => setParam({ complexTimbre: parseFloat(e.target.value) })} />
                                <div className="label">TIMBRE</div>
                            </div>
                            <div className="knob-small">
                                <input type="range" min="0" max="1" step="0.01" value={complexHarmonics} onChange={(e) => setParam({ complexHarmonics: parseFloat(e.target.value) })} />
                                <div className="label">HARMONICS</div>
                            </div>
                            <div className="knob-small">
                                <input type="range" min="0" max="1" step="0.01" value={complexOrder} onChange={(e) => setParam({ complexOrder: parseFloat(e.target.value) })} />
                                <div className="label">ORDER</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="buchla-footer">
                    * Programmable Complex Waveform Generator *
                </div>
            </div>
        </div>
    )
}
