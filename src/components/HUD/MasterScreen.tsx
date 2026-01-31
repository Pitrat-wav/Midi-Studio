import React from 'react'
import { useAudioStore } from '../../store/audioStore'
import { useVisualStore } from '../../store/visualStore'
import './MasterScreen.css'

export const MasterScreen: React.FC = () => {
    const audioStore = useAudioStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)

    return (
        <div className="master-screen hud-window">
            <div className="hud-header">
                <h2>🎚️ MASTER CONTROL CENTER</h2>
                <div className="hud-header-actions">
                    <button className="hud-close" onClick={() => setFocusedInstrument(null)}>✕</button>
                </div>
            </div>

            <div className="master-container">
                {/* Transport */}
                <div className="master-transport">
                    <button
                        className={`transport-btn play ${audioStore.isPlaying ? 'active' : ''}`}
                        onClick={() => audioStore.togglePlay()}
                    >
                        {audioStore.isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
                    </button>
                    <button
                        className="transport-btn panic"
                        onClick={() => audioStore.panic()}
                    >
                        🔴 PANIC
                    </button>
                </div>

                {/* BPM Control */}
                <div className="master-bpm-section">
                    <div className="bpm-display">
                        <span className="bpm-label">BPM</span>
                        <span className="bpm-value">{Math.round(audioStore.bpm)}</span>
                    </div>
                    <input
                        type="range"
                        min="60"
                        max="200"
                        value={audioStore.bpm}
                        onChange={(e) => audioStore.setBpm(parseFloat(e.target.value))}
                        className="bpm-slider"
                    />
                    <div className="bpm-presets">
                        <button onClick={() => audioStore.setBpm(90)} className="bpm-preset">90</button>
                        <button onClick={() => audioStore.setBpm(120)} className="bpm-preset">120</button>
                        <button onClick={() => audioStore.setBpm(140)} className="bpm-preset">140</button>
                        <button onClick={() => audioStore.setBpm(174)} className="bpm-preset">174</button>
                    </div>
                </div>

                {/* Channel Mixer */}
                <div className="master-mixer-grid">
                    {Object.entries(audioStore.volumes).map(([channel, volume]) => (
                        <div key={channel} className="mixer-channel">
                            <div className="channel-label">{channel.toUpperCase()}</div>
                            <div className="channel-fader-container">
                                <div className="channel-meter">
                                    <div
                                        className="meter-fill"
                                        style={{ height: `${volume * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="channel-value">{Math.round(volume * 100)}</div>
                            <button
                                className={`channel-mute ${audioStore.mutes[channel as keyof typeof audioStore.mutes] ? 'active' : ''}`}
                                onClick={() => audioStore.toggleMute(channel as any)}
                            >
                                M
                            </button>
                        </div>
                    ))}
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
