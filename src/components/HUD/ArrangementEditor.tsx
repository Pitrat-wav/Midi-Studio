import React, { useEffect, useState, useRef, useMemo, memo } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../../store/audioStore'
import { useArrangementStore, ArrangementClip } from '../../store/arrangementStore'
import { useVisualStore } from '../../store/visualStore'
import { useThemeStore } from '../../store/themeStore'
import { SNAPSHOT_LIBRARY } from '../../data/snapshotLibrary'
import {
    Clock,
    Play,
    Square,
    Trash2,
    Maximize2,
    Minimize2,
    Anchor,
    Repeat,
    Copy,
    Scissors,
    Zap,
    Plus
} from 'lucide-react'
import './ArrangementEditor.css'

// --- OPTIMIZED SUB-COMPONENTS ---

const ArrangementClipItem = memo(({ clip, isSelected, trackColor, TPP, onDrag, onResize, onDelete }: any) => {
    const snapshot = SNAPSHOT_LIBRARY[clip.trackId]?.[clip.snapshotId] || {}

    return (
        <div
            className={`arr-clip-pro ${isSelected ? 'selected' : ''}`}
            style={{
                left: clip.startTick * TPP,
                width: clip.durationTicks * TPP,
                '--track-color': trackColor,
                '--track-color-rgb': trackColor.replace('#', '')
            } as any}
            onMouseDown={(e) => onDrag(e, clip)}
        >
            <div className="clip-handle-left" onMouseDown={(e) => onResize(e, clip, 'left')} />

            <div className="clip-preview">
                {clip.trackId === 'drums' && snapshot.kick?.pulses !== undefined && (
                    <div className="preview-dots">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={`dot ${i < snapshot.kick.pulses ? 'active' : ''}`} />
                        ))}
                    </div>
                )}
                {clip.trackId !== 'drums' && (
                    <div className="preview-waves">
                        {[30, 70, 40, 60].map((h, i) => (
                            <div key={i} className="wave-bar" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                )}
            </div>

            <span className="clip-text">SN {clip.snapshotId + 1}</span>
            <div className="clip-handle-right" onMouseDown={(e) => onResize(e, clip, 'right')} />

            {isSelected && (
                <button className="clip-del-btn" onClick={(e) => { e.stopPropagation(); onDelete(clip.id); }}>×</button>
            )}
        </div>
    )
})

const TrackHeader = memo(({ track, settings, vuRef, onMute, onSolo, onVolume, onToggleAuto }: any) => {
    return (
        <div className="arr-track-header">
            <div className="track-info">
                <div className="track-dot" style={{ background: track.color }} />
                <span className="track-name">{track.label}</span>
                <div className="track-vu">
                    <div className="vu-bar" ref={vuRef} style={{ background: track.color }} />
                </div>
                <button
                    className={`auto-toggle ${settings.showAutomation ? 'active' : ''}`}
                    onClick={() => onToggleAuto(track.id)}
                    title="Toggle Automation"
                >
                    <Zap size={10} />
                </button>
            </div>
            <div className="track-mixer-mini">
                <button
                    className={`mixer-btn m ${settings.mute ? 'active' : ''}`}
                    onClick={() => onMute(track.id, !settings.mute)}
                >M</button>
                <button
                    className={`mixer-btn s ${settings.solo ? 'active' : ''}`}
                    onClick={() => onSolo(track.id, !settings.solo)}
                >S</button>
                <input
                    type="range"
                    className="mini-fader"
                    min="0" max="1" step="0.01"
                    value={settings.volume}
                    onChange={(e) => onVolume(track.id, Number(e.target.value))}
                />
            </div>
        </div>
    )
})

// --- MAIN COMPONENT ---

export function ArrangementEditor({ onClose }: { onClose: () => void }) {
    const audioPlaying = useAudioStore(s => s.isPlaying)
    const toggleAudioPlay = useAudioStore(s => s.togglePlay)

    const clips = useArrangementStore(s => s.clips)
    const selectedIds = useArrangementStore(s => s.selectedClipIds)
    const tracksState = useArrangementStore(s => s.tracks)
    const markers = useArrangementStore(s => s.markers)
    const automations = useArrangementStore(s => s.automations)
    const TPP = useArrangementStore(s => s.zoomLevel)
    const isLooping = useArrangementStore(s => s.isLooping)
    const snapRes = useArrangementStore(s => s.snapResolution)
    const loopStart = useArrangementStore(s => s.loopStart)
    const loopEnd = useArrangementStore(s => s.loopEnd)

    const {
        setZoom, setLooping, setTrackSetting, updateClip, removeClip, splitClip,
        setSelectedClips, moveSelectedClips, deleteSelectedClips, duplicateSelectedClips,
        addMarker, removeMarker, setAutomationPoint
    } = useArrangementStore.getState()

    const playheadRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null)
    const seekTextRef = useRef<HTMLDivElement>(null)
    const vuRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const [isScissorsMode, setIsScissorsMode] = useState(false)
    const [inspectorClipId, setInspectorClipId] = useState<string | null>(null)

    const interaction = useRef({
        dragging: null as string | null,
        resizing: null as { id: string, side: 'left' | 'right' } | null,
        startX: 0,
        startY: 0,
        oldStart: 0,
        oldDur: 0,
        marqueeStart: null as { x: number, y: number } | null
    })

    const [marqueeRect, setMarqueeRect] = useState<any>(null)

    const tracks = useMemo(() => [
        { id: 'drums', label: 'DRUMS', color: '#00ffaa' },
        { id: 'bass', label: 'BASS', color: '#00ccff' },
        { id: 'lead', label: 'LEAD', color: '#ffcc00' },
        { id: 'pads', label: 'PADS', color: '#ff00ff' },
        { id: 'sampler', label: 'SAMPLER', color: '#ffaa00' },
        { id: 'harm', label: 'HARMONY', color: '#ffffff' }
    ], [])

    useEffect(() => {
        // Initialize Theme
        const { currentTheme, setTheme } = useThemeStore.getState()
        setTheme(currentTheme.id)
    }, [])

    useEffect(() => {
        let rafId: number
        const loop = () => {
            const ticks = Tone.Transport.ticks
            const tickPos = Math.floor(ticks / 48)
            if (playheadRef.current) playheadRef.current.style.transform = `translateX(${tickPos * TPP}px)`
            if (seekTextRef.current) {
                const bar = Math.floor(tickPos / 16) + 1
                seekTextRef.current.innerText = `${bar} : ${(Math.floor(tickPos / 4) % 4) + 1} : ${tickPos % 4}`
            }
            const energy = useVisualStore.getState().energy
            Object.entries(vuRefs.current).forEach(([id, el]) => {
                if (el) el.style.height = `${(energy[id] || 0) * 100}%`
            })
            if (audioPlaying && timelineRef.current) {
                const scroll = timelineRef.current.scrollLeft
                const width = timelineRef.current.clientWidth
                const pos = (tickPos * TPP) + 180
                if (pos > scroll + width - 100) timelineRef.current.scrollLeft = pos - width + 200
            }
            rafId = requestAnimationFrame(loop)
        }
        rafId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(rafId)
    }, [audioPlaying, TPP])

    // Shortcuts
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 's' || e.key === 'S') setIsScissorsMode(true)
            if (e.key === 'Backspace' || e.key === 'Delete') deleteSelectedClips()
            if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                duplicateSelectedClips()
            }
            if (e.key === 'j' || e.key === 'J') {
                Tone.Transport.ticks = Math.max(0, Tone.Transport.ticks - 768) // Seek back 1 bar
            }
            if (e.key === 'l' || e.key === 'L') {
                Tone.Transport.ticks += 768 // Seek forward 1 bar
            }
            if (e.key === '[') {
                // Jump to prev marker
                const currentTick = Tone.Transport.ticks / 48
                const prev = [...markers].sort((a, b) => b.tick - a.tick).find(m => m.tick < currentTick - 1)
                if (prev) Tone.Transport.ticks = prev.tick * 48
            }
            if (e.key === ']') {
                // Jump to next marker
                const currentTick = Tone.Transport.ticks / 48
                const next = [...markers].sort((a, b) => a.tick - b.tick).find(m => m.tick > currentTick + 1)
                if (next) Tone.Transport.ticks = next.tick * 48
            }
        }
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === 's' || e.key === 'S') setIsScissorsMode(false)
        }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [deleteSelectedClips, duplicateSelectedClips])

    const snapValue = (x: number) => {
        const snap = {
            '1n': 16, '4n': 4, '8n': 2, '16n': 1,
            '4t': 4 * (2 / 3), '8t': 2 * (2 / 3)
        }[snapRes as any] || 4
        const ticks = Math.floor(x / TPP)
        return Math.floor(ticks / snap) * snap
    }

    const onMouseDown = (e: React.MouseEvent) => {
        if (!timelineRef.current) return
        const rect = timelineRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft - 180
        const y = e.clientY - rect.top + timelineRef.current.scrollTop

        if (isScissorsMode) {
            const splitTick = snapValue(x)
            clips.forEach(c => {
                if (splitTick > c.startTick && splitTick < c.startTick + c.durationTicks) splitClip(c.id, splitTick)
            })
            return
        }

        if (e.target === timelineRef.current || (e.target as HTMLElement).classList.contains('arr-lanes')) {
            interaction.current.marqueeStart = { x, y }
            if (!e.shiftKey) setSelectedClips([])
        }
    }

    const onMouseMove = (e: React.MouseEvent) => {
        const { dragging, resizing, marqueeStart, startX, startY, oldStart, oldDur } = interaction.current
        const snap = {
            '1n': 16, '4n': 4, '8n': 2, '16n': 1,
            '4t': 4 * (2 / 3), '8t': 2 * (2 / 3)
        }[snapRes as any] || 4

        if (dragging) {
            const deltaTicks = snapValue(e.clientX - startX)
            const deltaTrack = Math.round((e.clientY - startY) / 80)
            if (deltaTicks !== 0 || deltaTrack !== 0) {
                moveSelectedClips(deltaTicks, deltaTrack)
                if (deltaTicks !== 0) interaction.current.startX = e.clientX
                if (deltaTrack !== 0) interaction.current.startY = e.clientY
            }
            return
        }

        if (resizing) {
            const snappedTicks = snapValue(e.clientX - startX)
            if (resizing.side === 'right') {
                updateClip(resizing.id, { durationTicks: Math.max(snap, oldDur + snappedTicks) })
            } else {
                const newStart = Math.max(0, oldStart + snappedTicks)
                const newDur = oldDur - (newStart - oldStart)
                if (newDur >= snap) updateClip(resizing.id, { startTick: newStart, durationTicks: newDur })
            }
            return
        }

        if (marqueeStart) {
            const rect = timelineRef.current!.getBoundingClientRect()
            const x = e.clientX - rect.left + timelineRef.current!.scrollLeft - 180
            const y = e.clientY - rect.top + timelineRef.current!.scrollTop
            setMarqueeRect({
                left: Math.min(marqueeStart.x, x),
                top: Math.min(marqueeStart.y, y),
                width: Math.abs(marqueeStart.x - x),
                height: Math.abs(marqueeStart.y - y)
            })

            const newlySelected = clips.filter(c => {
                const cX1 = c.startTick * TPP, cX2 = (c.startTick + c.durationTicks) * TPP
                const tIdx = tracks.findIndex(t => t.id === c.trackId)
                const cY1 = tIdx * 80 + 40, cY2 = (tIdx + 1) * 80 + 40
                return cX1 < Math.max(marqueeStart.x, x) && cX2 > Math.min(marqueeStart.x, x) &&
                    cY1 < Math.max(marqueeStart.y, y) && cY2 > Math.min(marqueeStart.y, y)
            }).map(c => c.id)
            setSelectedClips(newlySelected)
        }
    }

    const onMouseUp = () => {
        interaction.current = { ...interaction.current, dragging: null, resizing: null, marqueeStart: null }
        setMarqueeRect(null)
    }

    const inspectorClip = clips.find(c => c.id === inspectorClipId)

    return (
        <div className={`arrangement-overlay ${isScissorsMode ? 'scissors-mode' : ''}`}
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseDown={onMouseDown}>

            <div className="arr-header">
                <div className="arr-logo">
                    <Clock size={16} className="arr-pulse" />
                    <span>ARRANGEMENT ELITE 4.0</span>
                </div>

                <div className="arr-transport-pro">
                    {/* THEME CONTROLS */}
                    <div className="theme-selector" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            style={{ background: 'transparent', color: 'var(--primary-color)', border: 'none', fontSize: '10px', fontWeight: 'bold', outline: 'none', maxWidth: '80px' }}
                            value={useThemeStore(s => s.currentTheme.id)}
                            onChange={(e) => useThemeStore.getState().setTheme(e.target.value)}
                        >
                            {useThemeStore.getState().presets.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <button className="arr-tool" onClick={() => useThemeStore.getState().randomizeTheme()} title="Shuffle Theme">
                            <Zap size={12} />
                        </button>
                    </div>
                    <div className="v-separator" />

                    <button className={`arr-tool ${isLooping ? 'active' : ''}`} onClick={() => {
                        setLooping(!isLooping)
                        Tone.Transport.loop = !isLooping
                        Tone.Transport.loopStart = loopStart * 48
                        Tone.Transport.loopEnd = loopEnd * 48
                    }}>
                        <Repeat size={14} /> LOOP
                    </button>
                    <div className="v-separator" />
                    <div className="snap-selector">
                        <Anchor size={12} />
                        <select value={snapRes} onChange={(e: any) => useArrangementStore.setState({ snapResolution: e.target.value })}>
                            <option value="1n">BAR</option>
                            <option value="4n">1/4</option>
                            <option value="4t">1/4T</option>
                            <option value="8n">1/8</option>
                            <option value="8t">1/8T</option>
                            <option value="16n">1/16</option>
                        </select>
                    </div>
                    <div className="v-separator" />
                    <button className="arr-btn play" onClick={toggleAudioPlay}>
                        {audioPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                    <div className="v-separator" />
                    <button className={`arr-tool ${isScissorsMode ? 'active' : ''}`} onClick={() => setIsScissorsMode(!isScissorsMode)} title="Scissors (S)">
                        <Scissors size={14} />
                    </button>
                    <button className="arr-tool" onClick={duplicateSelectedClips} title="Duplicate (Cmd+D)"><Copy size={14} /></button>
                    <button className="arr-tool" onClick={deleteSelectedClips} title="Delete (Del)"><Trash2 size={14} /></button>
                </div>

                <div className="arr-zoom-controls">
                    <Minimize2 size={12} />
                    <input type="range" min="2" max="32" step="1" value={TPP} onChange={(e) => setZoom(Number(e.target.value))} />
                    <Maximize2 size={12} />
                </div>

                <button className="arr-btn close" onClick={onClose}>EXIT</button>
            </div>

            <div className="arr-main-layout">
                <div className="arr-main-container">
                    <div className="arr-track-list">
                        <div className="track-list-ruler-corner">
                            <button className="add-marker-btn" onClick={() => addMarker(Tone.Transport.ticks / 48, 'NEW MARKER')}>
                                <Plus size={10} /> MARKER
                            </button>
                        </div>
                        {tracks.map(t => (
                            <TrackHeader
                                key={t.id} track={t}
                                settings={tracksState[t.id] || {}}
                                vuRef={(el: any) => vuRefs.current[t.id] = el}
                                onMute={(id: any, v: any) => setTrackSetting(id, { mute: v })}
                                onSolo={(id: any, v: any) => setTrackSetting(id, { solo: v })}
                                onVolume={(id: any, v: any) => setTrackSetting(id, { volume: v })}
                                onToggleAuto={(id: any) => setTrackSetting(id, { showAutomation: !(tracksState[id]?.showAutomation) })}
                            />
                        ))}
                    </div>

                    <div className="arr-timeline" ref={timelineRef}>
                        <div className="arr-ruler-pro" style={{ '--grid-size': `${16 * TPP}px` } as any}>
                            {Array.from({ length: 256 }).map((_, i) => i % 4 === 0 && (
                                <div key={i} className="ruler-number" style={{ left: i * TPP }}>
                                    {Math.floor(i / 16) + 1}.{(Math.floor(i / 4) % 4) + 1}
                                </div>
                            ))}
                            {markers.map(m => (
                                <div key={m.id} className="song-marker" style={{ left: m.tick * TPP, borderColor: m.color || '#555' }}>
                                    <span>{m.label}</span>
                                    <div className="marker-line" style={{ background: m.color || '#555' }} />
                                    <button className="marker-del" onClick={() => removeMarker(m.id)}>×</button>
                                </div>
                            ))}
                            {isLooping && <div className="loop-bracket" style={{ left: loopStart * TPP, width: (loopEnd - loopStart) * TPP }} />}
                        </div>

                        <div className="arr-lanes" style={{ '--grid-size': `${16 * TPP}px` } as any}>
                            {tracks.map(t => {
                                const showAuto = tracksState[t.id]?.showAutomation
                                const param = tracksState[t.id]?.automationParam || 'volume'
                                const points = automations[t.id]?.[param] || []

                                return (
                                    <div key={t.id} className={`track-lane-pro ${showAuto ? 'show-auto' : ''}`}>
                                        {clips.filter(c => c.trackId === t.id).map(c => (
                                            <ArrangementClipItem
                                                key={c.id} clip={c} isSelected={selectedIds.includes(c.id)}
                                                trackColor={t.color} TPP={TPP}
                                                onDrag={(e: any, clip: any) => {
                                                    if (isScissorsMode) {
                                                        const rect = timelineRef.current!.getBoundingClientRect()
                                                        splitClip(clip.id, snapValue(e.clientX - rect.left + timelineRef.current!.scrollLeft - 180))
                                                    } else {
                                                        interaction.current = { ...interaction.current, dragging: clip.id, startX: e.clientX, startY: e.clientY, oldStart: clip.startTick }
                                                        if (!selectedIds.includes(clip.id)) setSelectedClips(e.shiftKey ? [...selectedIds, clip.id] : [clip.id])
                                                    }
                                                }}
                                                onResize={(e: any, clip: any, side: any) => {
                                                    e.stopPropagation()
                                                    interaction.current = { ...interaction.current, resizing: { id: clip.id, side }, startX: e.clientX, oldStart: clip.startTick, oldDur: clip.durationTicks }
                                                }}
                                                onDelete={removeClip}
                                            />
                                        ))}

                                        {showAuto && (
                                            <div className="automation-canvas" onClick={(e) => {
                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                                const tick = snapValue(e.clientX - rect.left + timelineRef.current!.scrollLeft - 180)
                                                const value = 1 - (e.clientY - rect.top) / rect.height
                                                setAutomationPoint(t.id, param, tick, value)
                                            }}>
                                                <svg width="10000" height="80">
                                                    <path
                                                        d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.tick * TPP} ${(1 - p.value) * 80}`).join(' ')}
                                                        fill="none" stroke="#ffcc00" strokeWidth="2"
                                                    />
                                                    {points.map((p, i) => (
                                                        <circle key={i} cx={p.tick * TPP} cy={(1 - p.value) * 80} r="3" fill="#ffcc00" />
                                                    ))}
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {marqueeRect && <div className="marquee-box" style={marqueeRect} />}

                            <div className="arr-playhead-pro" ref={playheadRef}>
                                <div className="playhead-line" /><div className="playhead-top" />
                            </div>
                        </div>

                        {/* MASTER TRACK LANE */}
                        <div className="track-lane-pro master">
                            <div className="master-label">MASTER BUS</div>
                        </div>
                    </div>
                </div>

                {inspectorClip && (
                    <div className="arr-inspector glass">
                        <header>
                            <h3>CLIP INSPECTOR</h3>
                            <button onClick={() => setInspectorClipId(null)}>×</button>
                        </header>
                        <div className="inspector-body">
                            <div className="ins-row">
                                <label>ID</label>
                                <span>{inspectorClip.id}</span>
                            </div>
                            <div className="ins-row">
                                <label>NAME</label>
                                <input
                                    type="text"
                                    value={inspectorClip.name || ''}
                                    placeholder={`SN ${inspectorClip.snapshotId + 1}`}
                                    onChange={(e) => updateClip(inspectorClip.id, { name: e.target.value })}
                                />
                            </div>
                            <div className="ins-row">
                                <label>GAIN</label>
                                <input
                                    type="range" min="0" max="2" step="0.01"
                                    value={inspectorClip.gain ?? 1}
                                    onChange={(e) => updateClip(inspectorClip.id, { gain: Number(e.target.value) })}
                                />
                            </div>
                            <div className="ins-row">
                                <label>SNAPSHOT</label>
                                <select
                                    value={inspectorClip.snapshotId}
                                    onChange={(e) => updateClip(inspectorClip.id, { snapshotId: Number(e.target.value) })}
                                >
                                    {Object.keys(SNAPSHOT_LIBRARY[inspectorClip.trackId] || {}).map(id => (
                                        <option key={id} value={id}>Snapshot {Number(id) + 1}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="arr-footer-pro">
                <div className="footer-stat">
                    <span>TRACKS: {tracks.length}</span><span>CLIPS: {clips.length}</span><span>SELECTED: {selectedIds.length}</span>
                </div>
                <div className="footer-msg">STUDIO ELITE V5.0 • {isScissorsMode ? 'SCISSORS TOOL ACTIVE' : 'ARRANGEMENT MODE'}</div>
                <div className="footer-seek" ref={seekTextRef}>1 : 1 : 0</div>
            </div>
        </div>
    )
}
