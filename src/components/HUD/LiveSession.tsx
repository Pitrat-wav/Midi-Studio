import React, { useState, useRef } from 'react'
import { useAudioStore } from '../../store/audioStore'
import { useVisualStore } from '../../store/visualStore'
import { useSessionStore, InstrumentId } from '../../store/sessionStore'
import { Play, Square, Zap, RefreshCw, Layout, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './LiveSession.css'

export function LiveSession() {
    const audio = useAudioStore()
    const visual = useVisualStore()
    const session = useSessionStore()
    const [delayXy, setDelayXy] = useState({ x: 0.5, y: 0.5 })
    const [filterXy, setFilterXy] = useState({ x: 0.5, y: 0.5 })
    const delayRef = useRef<HTMLDivElement>(null)
    const filterRef = useRef<HTMLDivElement>(null)
    const fftData = useVisualStore(s => s.fftData)

    // Handle Delay XY Pad
    const handleDelayMove = (e: React.PointerEvent) => {
        if (!delayRef.current || e.buttons !== 1) return
        const rect = delayRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
        setDelayXy({ x, y })
        audio.setFxParam('delay', { delayTime: (x * 0.5).toFixed(2) + 's', feedback: y * 0.8 })
    }

    // Handle Filter XY Pad
    const handleFilterMove = (e: React.PointerEvent) => {
        if (!filterRef.current || e.buttons !== 1) return
        const rect = filterRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
        setFilterXy({ x, y })
        audio.setFxParam('distortion', { amount: x * 0.8, wet: y })
    }

    const instruments: { id: InstrumentId, label: string, color: string }[] = [
        { id: 'drums', label: 'DRUMS', color: '#00ffaa' },
        { id: 'bass', label: 'BASS', color: '#00ccff' },
        { id: 'harm', label: 'HARMONY', color: '#ffffff' },
        { id: 'pads', label: 'PADS', color: '#ff00ff' },
        { id: 'sampler', label: 'SAMPLER', color: '#ffaa00' }
    ]

    const perfFx = [
        { id: 'tapeStop', label: 'TAPE STOP' },
        { id: 'washOut', label: 'WASH OUT' },
        { id: 'stutter', label: 'STUTTER' },
        { id: 'glitch', label: 'GLITCH' },
        { id: 'noise', label: 'NOISE' },
        { id: 'riser', label: 'RISER' },
    ]

    return (
        <div className="live-session-overlay">
            <div className="live-header">
                <div className="live-logo">
                    <Zap className="neural-glow" />
                    <span>NEURAL LIVE PRO</span>
                </div>
                <div className="live-stats">
                    <div className="stat-item">BPM: <span>{audio.bpm}</span></div>
                    <div className="stat-item">VIEW: <span>PRO DASHBOARD</span></div>
                </div>
            </div>

            <div className="live-grid-pro">
                {/* COLUMN 1: CLIP LAUNCHER (NEW) */}
                <div className="live-card clip-launcher">
                    <div className="card-header-pro">
                        <h3>CLIP MATRIX</h3>
                        <div className="quant-indicator">
                            NEXT BAR: {4 - (audio.currentStep % 4)}
                        </div>
                    </div>
                    <div className="clip-matrix">
                        {instruments.map(inst => (
                            <div key={inst.id} className="clip-row">
                                <span className="row-label">{inst.label}</span>
                                <div className="clip-cells">
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                                        const clip = session.clips[inst.id][i]
                                        const isActive = session.activeClips[inst.id] === i
                                        const isPending = session.pendingClips[inst.id] === i
                                        const isStopping = session.pendingClips[inst.id] === -1 && isActive

                                        return (
                                            <button
                                                key={i}
                                                className={`clip-cell ${clip ? 'has-clip' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''} ${isStopping ? 'stopping' : ''}`}
                                                style={{ '--inst-color': inst.color } as any}
                                                onClick={() => {
                                                    if (clip) session.triggerClip(inst.id, i)
                                                    else session.captureClip(inst.id, i)
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault()
                                                    session.stopClip(inst.id)
                                                }}
                                            >
                                                {isActive && !isStopping && <div className="play-dot" />}
                                                {isPending && <div className="pending-ring" />}
                                                {!clip && <div className="empty-indicator">+</div>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Scene Launchers (Horizontal Row) */}
                    <div className="scene-launch-row">
                        <span className="row-label">SCENE</span>
                        <div className="scene-cells">
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                                <button
                                    key={i}
                                    className="scene-btn"
                                    onClick={() => session.triggerScene(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: MIXER PRO (UPDATED LAYOUT) */}
                <div className="live-card mixer-pro">
                    <h3>PRO MIXER</h3>
                    <div className="mixer-grid">
                        {instruments.map(inst => (
                            <div key={inst.id} className="mixer-strip">
                                <div className="strip-controls">
                                    <button
                                        className={`m-btn ${audio.mutes[inst.id as keyof typeof audio.mutes] ? 'active' : ''}`}
                                        onClick={() => audio.toggleMute(inst.id as any)}
                                    >M</button>
                                    <button
                                        className={`s-btn ${audio.solos[inst.id as keyof typeof audio.solos] ? 'active' : ''}`}
                                        onClick={() => audio.toggleSolo(inst.id as any)}
                                    >S</button>
                                </div>
                                <div className="fader-track-pro">
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.01"
                                        value={audio.volumes[inst.id as keyof typeof audio.volumes] || 0}
                                        onChange={(e) => audio.setVolume(inst.id as any, parseFloat(e.target.value))}
                                    />
                                    <div
                                        className="fader-fill-pro"
                                        style={{ height: `${(audio.volumes[inst.id as keyof typeof audio.volumes] || 0) * 100}%`, background: inst.color }}
                                    />
                                </div>
                                <span className="strip-label">{inst.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: FX MATRIX */}
                <div className="live-fx-matrix">
                    <div className="live-card pads-grid">
                        <h3>PERFORMANCE FX</h3>
                        <div className="fx-pads">
                            {perfFx.map(fx => (
                                <button
                                    key={fx.id}
                                    className="fx-pad-btn"
                                    onPointerDown={() => audio.triggerPerformanceFx(fx.id as any, true)}
                                    onPointerUp={() => audio.triggerPerformanceFx(fx.id as any, false)}
                                    onPointerLeave={() => audio.triggerPerformanceFx(fx.id as any, false)}
                                >
                                    {fx.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="live-card dual-xy">
                        <div className="xy-group">
                            <h3>SPACE (DELAY)</h3>
                            <div ref={delayRef} className="xy-pad-pro" onPointerMove={handleDelayMove} onPointerDown={handleDelayMove}>
                                <div className="xy-cross-pro" style={{ left: `${delayXy.x * 100}%`, bottom: `${delayXy.y * 100}%` }} />
                            </div>
                        </div>
                        <div className="xy-group">
                            <h3>TONE (FILT/DIST)</h3>
                            <div ref={filterRef} className="xy-pad-pro" onPointerMove={handleFilterMove} onPointerDown={handleFilterMove}>
                                <div className="xy-cross-pro" style={{ left: `${filterXy.x * 100}%`, bottom: `${filterXy.y * 100}%`, borderColor: '#00ffaa' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: MASTER & VISION */}
                <div className="live-master-column">
                    <div className="live-card visualizer-card">
                        <h3>SPECTRAL VISION</h3>
                        <div className="spectrum-container-pro">
                            {Array.from({ length: 32 }).map((_, i) => {
                                const val = fftData ? fftData[i * 4] : -100
                                return (
                                    <div
                                        key={i}
                                        className="spec-bar"
                                        style={{
                                            height: `${Math.max(5, (val + 110) * 0.8)}%`,
                                            opacity: 0.3 + (i / 32) * 0.7
                                        }}
                                    />
                                )
                            })}
                        </div>
                    </div>

                    <div className="live-card global-pro">
                        <h3>MASTER COMMANDS</h3>
                        <div className="master-btns">
                            <button className={`m-action-btn ${audio.isPlaying ? 'playing' : ''}`} onClick={audio.togglePlay}>
                                {audio.isPlaying ? <Square /> : <Play />}
                                <span>{audio.isPlaying ? 'STOP' : 'START'}</span>
                            </button>
                            <button className="m-action-btn panic-btn" onClick={audio.panic}>
                                <Zap /><span>PANIC</span>
                            </button>
                            <button className="m-action-btn" onClick={visual.cycleView}>
                                <Layout /><span>EXIT LIVE</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="live-footer">
                TAB TO CYCLE • PRO PERFORMANCE MODE ACTIVE
            </div>
        </div >
    )
}
