import { useHarmStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export function Buchla259Screen() {
    const {
        setParam, complexTimbre, complexFmIndex,
        complexOrder, complexHarmonics, complexPitchMod, complexAmpMod, complexTimbreMod,
        complexModPitch, complexPrincipalPitch,
        complexModOscShape
    } = useHarmStore()

    const setFocus = useVisualStore(s => s.setFocusInstrument)

    return (
        <div className="buchla-overlay">
            <div className="buchla-panel">
                {/* Header Strip */}
                <div className="buchla-header">
                    <div className="header-text">PROGRAMMABLE COMPLEX WAVEFORM GENERATOR MODEL 259</div>
                    <button
                        className="header-close"
                        aria-label="Close Buchla 259 Panel"
                        onClick={() => {
                            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                            setFocus(null);
                        }}
                    >
                        CLOSE
                    </button>
                </div>

                <div className="buchla-grid">
                    {/* LEFT COLUMN: MODULATION OSCILLATOR */}
                    <div className="buchla-column mod-osc">
                        <div className="section-label">MODULATION OSCILLATOR</div>

                        <div className="knob-group freq-group">
                            <div className="large-blue-knob">
                                <input
                                    type="range" min="-1200" max="1200" value={complexModPitch}
                                    aria-label="Modulation Oscillator Frequency"
                                    onChange={(e) => {
                                        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                        setParam({ complexModPitch: parseInt(e.target.value) });
                                    }}
                                />
                                <div className="knob-marker"></div>
                            </div>
                            <div className="label">FREQUENCY (Hz)</div>
                        </div>

                        <div className="waveshape-selector">
                            <div className="label">WAVESHAPE</div>
                            <div className="shape-toggles">
                                {['sine', 'sawtooth', 'square'].map(shape => (
                                    <button
                                        key={shape}
                                        className={`shape-led ${complexModOscShape === shape ? 'on' : ''}`}
                                        aria-pressed={complexModOscShape === shape}
                                        aria-label={`${shape.toUpperCase()} Waveshape`}
                                        onClick={() => {
                                            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                            setParam({ complexModOscShape: shape as any });
                                        }}
                                    >
                                        <div className="led"></div>
                                        <span>{shape.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN: CONTROL SECTION */}
                    <div className="buchla-column control-section">
                        <div className="section-label">CONTROL</div>

                        <div className="mod-toggles">
                            <div className="toggle-row">
                                <button
                                    className={`toggle ${complexPitchMod ? 'on' : ''}`}
                                    aria-pressed={!!complexPitchMod}
                                    aria-label="Toggle Pitch Modulation"
                                    onClick={() => {
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                        setParam({ complexPitchMod: !complexPitchMod });
                                    }}
                                >
                                    <div className="switch"></div>
                                    <span>PITCH MOD.</span>
                                </button>
                            </div>
                            <div className="toggle-row">
                                <button
                                    className={`toggle ${complexAmpMod ? 'on' : ''}`}
                                    aria-pressed={!!complexAmpMod}
                                    aria-label="Toggle Amplitude Modulation"
                                    onClick={() => {
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                        setParam({ complexAmpMod: !complexAmpMod });
                                    }}
                                >
                                    <div className="switch"></div>
                                    <span>AMPL. MOD.</span>
                                </button>
                            </div>
                            <div className="toggle-row">
                                <button
                                    className={`toggle ${complexTimbreMod ? 'on' : ''}`}
                                    aria-pressed={!!complexTimbreMod}
                                    aria-label="Toggle Timbre Modulation"
                                    onClick={() => {
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                        setParam({ complexTimbreMod: !complexTimbreMod });
                                    }}
                                >
                                    <div className="switch"></div>
                                    <span>TIMBRE MOD.</span>
                                </button>
                            </div>
                        </div>

                        <div className="knob-group index-group">
                            <div className="medium-blue-knob">
                                <input
                                    type="range" min="0" max="1" step="0.01" value={complexFmIndex}
                                    aria-label="Modulation Index"
                                    onChange={(e) => {
                                        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                        setParam({ complexFmIndex: parseFloat(e.target.value) });
                                    }}
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
                                    aria-label="Principal Oscillator Pitch"
                                    onChange={(e) => {
                                        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                        setParam({ complexPrincipalPitch: parseInt(e.target.value) });
                                    }}
                                />
                                <div className="knob-marker"></div>
                            </div>
                            <div className="label">PITCH (Hz)</div>
                        </div>

                        <div className="shaping-grid">
                            <div className="knob-small">
                                <input
                                    type="range" min="0" max="1" step="0.01" value={complexTimbre}
                                    aria-label="Timbre Amount"
                                    onChange={(e) => {
                                        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                        setParam({ complexTimbre: parseFloat(e.target.value) });
                                    }}
                                />
                                <div className="label">TIMBRE</div>
                            </div>
                            <div className="knob-small">
                                <input
                                    type="range" min="0" max="1" step="0.01" value={complexHarmonics}
                                    aria-label="Harmonics Content"
                                    onChange={(e) => {
                                        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                        setParam({ complexHarmonics: parseFloat(e.target.value) });
                                    }}
                                />
                                <div className="label">HARMONICS</div>
                            </div>
                            <div className="knob-small">
                                <input
                                    type="range" min="0" max="1" step="0.01" value={complexOrder}
                                    aria-label="Wavefolding Order"
                                    onChange={(e) => {
                                        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                                        setParam({ complexOrder: parseFloat(e.target.value) });
                                    }}
                                />
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
