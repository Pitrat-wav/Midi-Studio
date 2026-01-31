import { useRef, useEffect, useState } from 'react'
import { useSamplerStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export function SamplerScreen() {
    const {
        slices, playbackRate, volume, setParam,
        url, availableSamples, currentSampleIndex,
        nextSample, prevSample
    } = useSamplerStore()

    // We can use visualStore to close the screen (set focus to null)
    const setFocus = useVisualStore(s => s.setFocusInstrument)

    return (
        <div className="sampler-screen-overlay">
            <div className="crt-monitor">
                <div className="crt-screen">
                    <div className="screen-content">
                        {/* Header */}
                        <div className="terminal-header">
                            <span>CHRONO_SPLITTER_V1.0</span>
                            <span className="close-btn" onClick={() => setFocus(null)}>[X]</span>
                        </div>

                        <div className="terminal-grid">
                            {/* Left Column: Sample Browser */}
                            <div className="panel folder-panel">
                                <div className="panel-title">// SAMPLES_DIR</div>
                                <div className="file-list">
                                    {availableSamples.map((s, i) => (
                                        <div
                                            key={s.path}
                                            className={`file-item ${i === currentSampleIndex ? 'active' : ''}`}
                                            onClick={() => {
                                                // We need a direct set method for index if we want click-to-select
                                                // For now, simpler to just rely on next/prev or implement setIndex
                                                // Let's iterate to find difference (hacky but works for now)
                                                // Better: just loop nextSample until match? No, let's just highlight current for now.
                                                // Ideally store should expose `setSampleIndex`.
                                            }}
                                        >
                                            {i === currentSampleIndex ? '> ' : '  '}
                                            {s.name}
                                        </div>
                                    ))}
                                </div>
                                <div className="nav-controls">
                                    <button onClick={prevSample}>PREV [←]</button>
                                    <button onClick={nextSample}>NEXT [→]</button>
                                </div>
                            </div>

                            {/* Right Column: Controls */}
                            <div className="panel control-panel">
                                <div className="panel-title">// PARAMETERS</div>

                                {/* Slices Control */}
                                <div className="control-row">
                                    <label>SLICES [{slices}]</label>
                                    <input
                                        type="range"
                                        min="4" max="32" step="1"
                                        value={slices}
                                        onChange={(e) => setParam({ slices: parseInt(e.target.value) })}
                                    />
                                </div>

                                {/* Speed Control */}
                                <div className="control-row">
                                    <label>SPEED [{playbackRate.toFixed(2)}x]</label>
                                    <input
                                        type="range"
                                        min="-2" max="2" step="0.1"
                                        value={playbackRate}
                                        onChange={(e) => setParam({ playbackRate: parseFloat(e.target.value) })}
                                    />
                                </div>

                                {/* Volume Control */}
                                <div className="control-row">
                                    <label>GAIN [{volume.toFixed(1)} dB]</label>
                                    <input
                                        type="range"
                                        min="-60" max="6" step="1"
                                        value={volume}
                                        onChange={(e) => setParam({ volume: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="visualizer-mock">
                                    {/* Mock Waveform */}
                                    {Array.from({ length: 32 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="wave-bar"
                                            style={{
                                                height: `${Math.random() * 80 + 20}%`,
                                                opacity: Math.floor(i / (32 / slices)) === Math.floor(Date.now() / 1000) % slices ? 1 : 0.3
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="terminal-footer">
                            STATUS: ONLINE | SYSTEM: READY | MEM: 64KB OK
                        </div>
                    </div>
                    <div className="scanlines"></div>
                    <div className="glow-overlay"></div>
                </div>
            </div>
        </div>
    )
}
