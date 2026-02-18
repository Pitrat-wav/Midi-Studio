import React from 'react'
import { useAudioStore } from '../../store/audioStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioButton, StudioDisplay, StudioSlider, StudioKnob } from './StudioScreen'
import { FX_PRESETS } from '../../data/fxPresets'
import './MasterScreen.css'

export const MasterScreen: React.FC = () => {
    const audioStore = useAudioStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)
    const handleClose = () => setFocusedInstrument(null)

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        audioStore.loadFxPreset(e.target.value)
    }

    return (
        <StudioScreen
            title="Master Control Center"
            subtitle="Global Audio & FX"
            onClose={handleClose}
            ledColor="green"
            className="master-screen-studio"
        >
            <div className="master-screen-content">
                {/* Transport Controls */}
                <div className="master-transport-studio">
                    <StudioButton
                        label={audioStore.isPlaying ? 'PAUSE' : 'PLAY'}
                        onClick={() => audioStore.togglePlay()}
                        active={audioStore.isPlaying}
                        icon={audioStore.isPlaying ? '⏸' : '▶'}
                    />
                    <StudioButton
                        label="PANIC"
                        onClick={() => audioStore.panic()}
                        danger
                        icon="🔴"
                    />
                </div>

                {/* BPM Section */}
                <div className="master-bpm-studio">
                    <StudioDisplay
                        value={Math.round(audioStore.bpm)}
                        label="BPM"
                        color="green"
                        size="large"
                    />
                    <input
                        type="range"
                        min="60"
                        max="200"
                        step="0.1"
                        value={audioStore.bpm}
                        onChange={(e) => audioStore.setBpm(parseFloat(e.target.value))}
                        className="bpm-slider-studio"
                    />
                    <div className="bpm-presets-studio">
                        <button onClick={() => audioStore.setBpm(90)} className="bpm-preset-studio">90</button>
                        <button onClick={() => audioStore.setBpm(120)} className="bpm-preset-studio">120</button>
                        <button onClick={() => audioStore.setBpm(140)} className="bpm-preset-studio">140</button>
                        <button onClick={() => audioStore.setBpm(174)} className="bpm-preset-studio">174</button>
                    </div>
                </div>

                {/* Channel Mixer */}
                <div className="master-mixer-studio">
                    <h3 className="mixer-title">CHANNEL MIXER</h3>
                    <div className="mixer-channels-grid">
                        {Object.entries(audioStore.volumes).map(([channel, volume]) => (
                            <div key={channel} className="mixer-channel-studio">
                                <div className="channel-label-studio">{channel.toUpperCase()}</div>
                                <StudioSlider
                                    label=""
                                    value={volume * 100}
                                    min={0}
                                    max={100}
                                    onChange={(v) => audioStore.setVolume(channel as any, v / 100)}
                                    vertical
                                    color="green"
                                />
                                <div className="channel-value-studio">{Math.round(volume * 100)}%</div>
                                <button
                                    className={`channel-mute-studio ${audioStore.mutes[channel as keyof typeof audioStore.mutes] ? 'active' : ''}`}
                                    onClick={() => audioStore.toggleMute(channel as any)}
                                >
                                    M
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FX Rack */}
                <div className="master-fx-rack-studio">
                    <div className="fx-rack-header-studio">
                        <span className="fx-rack-title-studio">FX PROCESSOR</span>
                        <select
                            value={audioStore.activeFxPreset}
                            onChange={handlePresetChange}
                            className="fx-preset-select-studio"
                        >
                            {Object.keys(FX_PRESETS).map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="fx-modules-studio">
                        {audioStore.activeFxPreset && FX_PRESETS[audioStore.activeFxPreset as keyof typeof FX_PRESETS]?.modules?.map((module: any, i: number) => (
                            <div key={i} className="fx-module-studio">
                                <div className="fx-module-title-studio">{module.type}</div>
                                <div className="fx-knobs-studio">
                                    {Object.entries(module.params || {}).map(([param, value]: [string, any]) => (
                                        <StudioKnob
                                            key={param}
                                            label={param}
                                            value={typeof value === 'number' ? value : 50}
                                            min={0}
                                            max={100}
                                            onChange={(v) => {
                                                const newPresets = { ...FX_PRESETS }
                                                const preset = newPresets[audioStore.activeFxPreset as keyof typeof FX_PRESETS]
                                                if (preset?.modules?.[i]?.params) {
                                                    preset.modules[i].params[param] = v
                                                    audioStore.loadFxPreset(audioStore.activeFxPreset)
                                                }
                                            }}
                                            color="blue"
                                            size="small"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
                            >
                                M
                            </button>
                        </div>
                    ))}
                </div>

                {/* Master FX Rack */}
                <div className="master-fx-rack">
                    <div className="fx-rack-header">
                        <h3>MASTER FX CHAIN</h3>
                        <select className="fx-preset-select" onChange={handlePresetChange} defaultValue="Default">
                            <option value="" disabled>Load Preset...</option>
                            {Object.keys(FX_PRESETS).map(preset => (
                                <option key={preset} value={preset}>{preset}</option>
                            ))}
                        </select>
                    </div>

                    <div className="fx-modules-grid">
                        {/* EQ */}
                        <div className="fx-module">
                            <div className="fx-module-title">EQ (4-Band)</div>
                            <div className="fx-knobs-row">
                                <Knob label="LOW" value={audioStore.masterEQ.low} min={-20} max={10} onChange={(v) => audioStore.setMasterEQ('low', v)} size={40} />
                                <Knob label="LO-MID" value={audioStore.masterEQ.lowMid} min={-20} max={10} onChange={(v) => audioStore.setMasterEQ('lowMid', v)} size={40} />
                                <Knob label="HI-MID" value={audioStore.masterEQ.highMid} min={-20} max={10} onChange={(v) => audioStore.setMasterEQ('highMid', v)} size={40} />
                                <Knob label="HIGH" value={audioStore.masterEQ.high} min={-20} max={10} onChange={(v) => audioStore.setMasterEQ('high', v)} size={40} />
                            </div>
                        </div>

                        {/* Compressor */}
                        <div className="fx-module">
                            <div className="fx-module-title">COMPRESSOR</div>
                            <div className="fx-knobs-row">
                                <Knob label="THRESH" value={audioStore.fx.compressor.threshold} min={-60} max={0} step={1} onChange={(v) => audioStore.setFxParam('compressor', { threshold: v })} size={40} />
                                <Knob label="RATIO" value={audioStore.fx.compressor.ratio} min={1} max={20} step={0.5} onChange={(v) => audioStore.setFxParam('compressor', { ratio: v })} size={40} />
                                <Knob label="ATTACK" value={audioStore.fx.compressor.attack} min={0.001} max={1} step={0.01} onChange={(v) => audioStore.setFxParam('compressor', { attack: v })} size={40} />
                                <Knob label="RELEASE" value={audioStore.fx.compressor.release} min={0.01} max={2} step={0.01} onChange={(v) => audioStore.setFxParam('compressor', { release: v })} size={40} />
                            </div>
                        </div>

                        {/* Distortion */}
                        <div className="fx-module">
                            <div className="fx-module-title">DISTORTION</div>
                            <div className="fx-knobs-row">
                                <Knob label="AMOUNT" value={audioStore.fx.distortion.amount} min={0} max={1} onChange={(v) => audioStore.setFxParam('distortion', { amount: v })} size={40} />
                                <Knob label="MIX" value={audioStore.fx.distortion.wet} min={0} max={1} onChange={(v) => audioStore.setFxParam('distortion', { wet: v })} size={40} />
                            </div>
                        </div>

                        {/* Delay */}
                        <div className="fx-module">
                            <div className="fx-module-title">DELAY</div>
                            <div className="fx-knobs-row">
                                <div className="fx-select-container">
                                    <label>TIME</label>
                                    <select 
                                        value={audioStore.fx.delay.delayTime} 
                                        onChange={(e) => audioStore.setFxParam('delay', { delayTime: e.target.value })}
                                        className="fx-mini-select"
                                    >
                                        <option value="16n">1/16</option>
                                        <option value="8n">1/8</option>
                                        <option value="8n.">1/8d</option>
                                        <option value="4n">1/4</option>
                                        <option value="2n">1/2</option>
                                    </select>
                                </div>
                                <Knob label="FDBK" value={audioStore.fx.delay.feedback} min={0} max={0.9} onChange={(v) => audioStore.setFxParam('delay', { feedback: v })} size={40} />
                                <Knob label="MIX" value={audioStore.fx.delay.wet} min={0} max={1} onChange={(v) => audioStore.setFxParam('delay', { wet: v })} size={40} />
                            </div>
                        </div>

                        {/* Reverb */}
                        <div className="fx-module">
                            <div className="fx-module-title">REVERB</div>
                            <div className="fx-knobs-row">
                                <Knob label="DECAY" value={audioStore.fx.reverb.decay} min={0.1} max={10} onChange={(v) => audioStore.setFxParam('reverb', { decay: v })} size={40} />
                                <Knob label="MIX" value={audioStore.fx.reverb.wet} min={0} max={1} onChange={(v) => audioStore.setFxParam('reverb', { wet: v })} size={40} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="master-info">
                    <div className="master-info-item">
                        <span className="info-label">AUDIO ENGINE:</span>
                        <span className="info-value">Tone.js v15.0.4</span>
                    </div>
                    <div className="master-info-item">
                        <span className="info-label">STATUS:</span>
                        <span className="info-value">{audioStore.isPlaying ? 'PLAYING' : 'STOPPED'}</span>
                    </div>
                    <div className="master-info-item">
                        <span className="info-label">INITIALIZED:</span>
                        <span className="info-value">{audioStore.isInitialized ? 'YES' : 'NO'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
