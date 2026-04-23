import React from 'react'
import { useAudioStore } from '../../store/audioStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioButton, StudioDisplay, StudioSlider } from './StudioScreen'
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
                        onChange={(e) => {
                            audioStore.setBpm(parseFloat(e.target.value));
                            window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
                        }}
                        className="bpm-slider-studio"
                        aria-label="BPM Control"
                    />
                    <div className="bpm-presets-studio">
                        {[90, 120, 140, 174].map(bpm => (
                            <button
                                key={bpm}
                                onClick={() => {
                                    audioStore.setBpm(bpm);
                                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                }}
                                className="bpm-preset-studio"
                                aria-label={`Set BPM to ${bpm}`}
                            >
                                {bpm}
                            </button>
                        ))}
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
                                    label={channel.toUpperCase()}
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
                                    onClick={() => {
                                        audioStore.toggleMute(channel as any);
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                    }}
                                    aria-label={`Mute ${channel}`}
                                    aria-pressed={audioStore.mutes[channel as keyof typeof audioStore.mutes]}
                                >
                                    M
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
