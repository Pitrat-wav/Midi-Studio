import React, { useEffect, useState, useRef, useMemo, memo } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../../store/audioStore'
import { useArrangementStore, ArrangementClip } from '../../store/arrangementStore'
import { useVisualStore } from '../../store/visualStore'
import { useThemeStore } from '../../store/themeStore'
import { SNAPSHOT_LIBRARY } from '../../data/snapshotLibrary'
import { audioTrackManager } from '../../logic/AudioTrackManager'
import { indexedDbManager } from '../../logic/IndexedDbManager'
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

// --- HELPERS ---
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0'
}

// --- OPTIMIZED SUB-COMPONENTS ---

const ArrangementRuler = memo(({ TPP, markers, isLooping, loopStart, loopEnd, onRemoveMarker }: any) => {
    // 128 bars loop
    const bars = Array.from({ length: 128 })

    return (
        <div className="arr-ruler" onClick={(e: any) => {
            if (e.target.className === 'arr-ruler') {
                const rect = e.currentTarget.getBoundingClientRect()
                const tick = Math.floor((e.clientX - rect.left) / TPP)
                Tone.Transport.ticks = tick * 48
            }
        }}>
            {bars.map((_, barIdx) => {
                const x = barIdx * 16 * TPP
                return (
                    <React.Fragment key={barIdx}>
                        {/* Bar Marker */}
                        <div className="ruler-marker-pro bar" style={{ left: x }} />
                        <div className="ruler-label-pro" style={{ left: x }}>{barIdx + 1}</div>

                        {/* Quarter Beat Markers */}
                        {[4, 8, 12].map(beat => (
                            <div key={beat} className="ruler-marker-pro major" style={{ left: x + beat * TPP }} />
                        ))}
                    </React.Fragment>
                )
            })}

            {markers.map((m: any) => (
                <div key={m.id} className="song-marker-v7" style={{ left: m.tick * TPP }}>
                    <div className="marker-flag-v7" style={{ borderColor: m.color || '#555' }} onClick={() => Tone.Transport.ticks = m.tick * 48}>
                        <span>{m.label}</span>
                        <button className="marker-del-v7" onClick={(e) => { e.stopPropagation(); onRemoveMarker(m.id); }}>×</button>
                    </div>
                </div>
            ))}

            {isLooping && (
                <div className="loop-bracket" style={{ left: loopStart * TPP, width: (loopEnd - loopStart) * TPP }} />
            )}
        </div>
    )
})


const WaveformPreview = memo(({ peaks, color }: { peaks: number[], color: string }) => {
    if (!peaks || peaks.length === 0) return (
        <div className="preview-waves">
            {[30, 70, 40, 60].map((h, i) => <div key={i} className="wave-bar" style={{ height: `${h}%` }} />)}
        </div>
    )
    return (
        <svg className="waveform-svg" viewBox={`0 0 ${peaks.length} 100`} preserveAspectRatio="none">
            <path
                d={peaks.map((p, i) => `M ${i} ${50 - p * 50} L ${i} ${50 + p * 50}`).join(' ')}
                stroke={color}
                strokeWidth="1"
            />
        </svg>
    )
})

const ArrangementClipItem = memo(({ clip, isSelected, isGhost, trackColor, TPP, onDrag, onResize, onDelete }: any) => {
    const snapshot = clip.type === 'midi' ? (SNAPSHOT_LIBRARY[clip.trackId]?.[clip.snapshotId] || {}) : null

    return (
        <div
            className={`arr-clip-pro ${isSelected ? 'selected' : ''} ${isGhost ? 'is-ghost' : ''} clip-${clip.type}`}
            style={{
                left: clip.startTick * TPP,
                width: clip.durationTicks * TPP,
                '--track-color': trackColor,
                '--track-color-rgb': hexToRgb(trackColor)
            } as any}
            onMouseDown={!isGhost ? ((e) => onDrag(e, clip)) : undefined}
        >
            <div className="clip-hdr-pro">
                <span>{clip.type === 'audio' ? (clip.name || 'AUDIO SOURCE') : `PATTERN ${clip.snapshotId + 1}`}</span>
                {isSelected && !isGhost && (
                    <button className="clip-del-btn-pro" style={{ opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); onDelete(clip.id); }}>×</button>
                )}
            </div>

            <div className="clip-body-pro">
                {!isGhost && <div className="clip-handle-left" onMouseDown={(e) => onResize(e, clip, 'left')} />}

                <div className="clip-visualization">
                    {clip.type === 'audio' ? (
                        <div className="waveform-hdr">
                            <WaveformPreview peaks={clip.audioData?.peaks || []} color={trackColor} />
                        </div>
                    ) : (
                        <div className="midi-dots-preview">
                            {clip.type === 'midi' && snapshot?.kick?.pulses !== undefined && (
                                <div className="preview-row">
                                    {Array.from({ length: Math.min(24, clip.durationTicks / 4) }).map((_, i) => (
                                        <div key={i} className={`mini-dot ${i < (snapshot.kick.pulses * 3) ? 'active' : ''}`} style={{ background: trackColor, color: trackColor }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isGhost && <div className="clip-handle-right" onMouseDown={(e) => onResize(e, clip, 'right')} />}
            </div>
        </div>
    )
})

const TrackHeader = memo(({ track, settings, vuRef, onMute, onSolo, onVolume, onToggleAuto, onToggleCollapse }: any) => {
    const isGroup = settings.isGroup
    const isChild = !!settings.parentId

    return (
        <div className={`arr-track-header-v7 ${isGroup ? 'is-group' : ''} ${isChild ? 'is-child' : ''}`}>
            <div className="track-head-top">
                <div className="track-info">
                    {isGroup && (
                        <button className="group-fold-btn" onClick={() => onToggleCollapse(track.id)}>
                            <Anchor size={10} style={{ transform: settings.isCollapsed ? 'rotate(-90deg)' : 'none' }} />
                        </button>
                    )}
                    <div className="track-id-strip" style={{ background: track.color }} />
                    <span className="track-title-v7">{track.label}</span>
                </div>

                {!isGroup && (
                    <div className="track-mixer-v7">
                        <button className={`mixer-tgl m ${settings.mute ? 'active' : ''}`} onClick={() => onMute(track.id, !settings.mute)}>M</button>
                        <button className={`mixer-tgl s ${settings.solo ? 'active' : ''}`} onClick={() => onSolo(track.id, !settings.solo)}>S</button>
                        <div className="mini-fader-v7">
                            <div className="fader-fill-v7" style={{ width: `${settings.volume * 100}%`, background: track.color }} />
                            <input type="range" min="0" max="1" step="0.01" value={settings.volume} onChange={(e) => onVolume(track.id, Number(e.target.value))} />
                        </div>
                    </div>
                )}
            </div>

            <div className="track-head-bottom">
                {!isGroup && (
                    <div className="vu-meter-v7">
                        <div className="vu-fill-v7" ref={vuRef} style={{ width: '0%', background: track.color }} />
                    </div>
                )}
                <div className="track-utility-v7">
                    {!isGroup && <button className={`util-btn ${settings.isFrozen ? 'frozen' : ''}`} onClick={() => onMute(track.id, 'freeze')}><Clock size={10} /></button>}
                    {!isGroup && <button className={`util-btn ${settings.showAutomation ? 'active' : ''}`} onClick={() => onToggleAuto(track.id)}><Zap size={10} /></button>}
                </div>
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
        setZoom, setLooping, setTrackSetting, addClip, updateClip, removeClip, splitClip,
        setSelectedClips, moveSelectedClips, deleteSelectedClips, duplicateSelectedClips,
        addMarker, removeMarker, setAutomationPoint, toggleGroupCollapsed
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
        { id: 'group_drums', label: 'DRUM GROUP', color: '#00ffaa' },
        { id: 'drums', label: 'DRUMS', color: '#00ffaa' },
        { id: 'bass', label: 'BASS', color: '#00ccff' },
        { id: 'lead', label: 'LEAD', color: '#ffcc00' },
        { id: 'pads', label: 'PADS', color: '#ff00ff' },
        { id: 'sampler', label: 'SAMPLER', color: '#ffaa00' },
        { id: 'harm', label: 'HARMONY', color: '#ffffff' }
    ], [])

    // Seed initial group structure if not present
    useEffect(() => {
        if (!tracksState['group_drums']) {
            setTrackSetting('group_drums', { isGroup: true, isCollapsed: false } as any)
            setTrackSetting('drums', { parentId: 'group_drums' } as any)
        }
    }, [tracksState, setTrackSetting])

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
    }, [deleteSelectedClips, duplicateSelectedClips, markers])

    // Sync Audio Players with Clips
    useEffect(() => {
        const audioClips = clips.filter(c => c.type === 'audio')
        audioClips.forEach(clip => {
            audioTrackManager.createPlayer(clip)
        })
    }, [clips])

    const snapValue = (x: number) => {
        const snapMap: Record<string, number> = {
            '1n': 16, '4n': 4, '8n': 2, '16n': 1,
            '4t': 4 * (2 / 3), '8t': 2 * (2 / 3)
        }
        const resKey = snapRes as string
        const snap = snapMap[resKey] || 4
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
        const snapMap: Record<string, number> = {
            '1n': 16, '4n': 4, '8n': 2, '16n': 1,
            '4t': 4 * (2 / 3), '8t': 2 * (2 / 3)
        }
        const snap = snapMap[snapRes as string] || 4

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

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (!file || (!file.type.includes('audio') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav'))) return

        const rect = timelineRef.current!.getBoundingClientRect()
        const dropX = e.clientX - rect.left + timelineRef.current!.scrollLeft - 180
        const dropY = e.clientY - rect.top + timelineRef.current!.scrollTop
        const startTick = snapValue(dropX)
        const trackIdx = Math.floor(dropY / 80)
        const trackId = tracks[Math.min(tracks.length - 1, Math.max(0, trackIdx))].id

        const buffer = await file.arrayBuffer()
        const audioBuffer = await Tone.context.decodeAudioData(buffer)

        // Calculate peaks for waveform
        const rawData = audioBuffer.getChannelData(0)
        const samplesPerPixel = Math.floor(rawData.length / 100)
        const peaks = []
        for (let i = 0; i < 100; i++) {
            let max = 0
            for (let j = 0; j < samplesPerPixel; j++) {
                const val = Math.abs(rawData[i * samplesPerPixel + j])
                if (val > max) max = val
            }
            peaks.push(max)
        }

        const durationTicks = Math.ceil(audioBuffer.duration * (useAudioStore.getState().bpm / 60) * 4)

        // Generate persistent ID
        const blobId = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`
        await indexedDbManager.saveBlob(blobId, file)

        addClip({
            type: 'audio',
            trackId,
            startTick,
            durationTicks,
            name: file.name.toUpperCase(),
            audioData: {
                bufferUrl: URL.createObjectURL(file),
                blobId,
                originalBpm: useAudioStore.getState().bpm,
                warpMode: 'Stretch',
                peaks
            }
        } as any)
    }

    const inspectorClip = clips.find(c => c.id === inspectorClipId)

    return (
        <div className={`arrangement-overlay ${isScissorsMode ? 'scissors-mode' : ''}`}
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseDown={onMouseDown}>

            <div className="arr-header">
                <div className="arr-logo">
                    <div className="pro-badge">PRO</div>
                    <span className="arr-title">Arrangement Elite v6.0</span>
                </div>

                <div className="arr-transport-pro">
                    <div className="tool-palette-v6">
                        <button className={`tool-btn-v6 ${!isScissorsMode ? 'active' : ''}`} onClick={() => setIsScissorsMode(false)} title="Pointer Tool (V)">
                            <Play size={10} />
                        </button>
                        <button className={`tool-btn-v6 ${isScissorsMode ? 'active' : ''}`} onClick={() => setIsScissorsMode(true)} title="Scissors Tool (S)">
                            <Scissors size={10} />
                        </button>
                    </div>

                    <div className="v-separator" />

                    <button className={`arr-btn ${audioPlaying ? 'active' : ''}`} onClick={toggleAudioPlay}>
                        <Play size={16} fill={audioPlaying ? 'currentColor' : 'none'} />
                    </button>
                    <button className="arr-btn" onClick={() => Tone.Transport.stop()}>
                        <Square size={16} />
                    </button>

                    <div className="v-separator" />

                    <button className="arr-btn" onClick={() => setLooping(!isLooping)} title="Toggle Loop">
                        <Repeat size={14} color={isLooping ? 'var(--primary-neon)' : '#555'} />
                    </button>

                    <div className="snap-selector-v6">
                        <Anchor size={12} />
                        <select className="premium-select" value={snapRes} onChange={(e) => useArrangementStore.getState().setSnapResolution(e.target.value as any)}>
                            <option value="1n">1 Bar</option>
                            <option value="4n">1/4</option>
                            <option value="8n">1/8</option>
                            <option value="16n">1/16</option>
                            <option value="32n">1/32</option>
                        </select>
                    </div>

                    <div className="v-separator" />
                    <button className="arr-btn plus-marker" onClick={() => addMarker(Tone.Transport.ticks / 48, 'NEW MARKER')} title="Add Song Marker">
                        <Plus size={14} />
                    </button>
                    <div className="v-separator" />

                    <button className="arr-btn" onClick={duplicateSelectedClips} title="Duplicate (Cmd+D)"><Copy size={13} /></button>
                    <button className="arr-btn" onClick={deleteSelectedClips} title="Delete (Del)"><Trash2 size={13} /></button>
                </div>

                <div className="arr-zoom-controls">
                    <Minimize2 size={12} color="#444" />
                    <input type="range" min="2" max="32" step="1" value={TPP} onChange={(e) => setZoom(Number(e.target.value))} />
                    <Maximize2 size={12} color="#444" />
                </div>

                <button className="arr-btn close" onClick={onClose}>EXIT</button>
            </div>

            <div className="arr-main-layout">
                <div className="arr-main-container">
                    <div className="arr-track-list">
                        <div className="track-list-ruler-corner">
                            <div className="corner-info">TRACKS</div>
                        </div>
                        {tracks.map(t => {
                            const settings = tracksState[t.id] || {}
                            const parentSettings = settings.parentId ? tracksState[settings.parentId] : null
                            if (parentSettings?.isCollapsed) return null

                            return (
                                <TrackHeader
                                    key={t.id} track={t}
                                    settings={settings}
                                    vuRef={(el: any) => vuRefs.current[t.id] = el}
                                    onMute={(id: any, v: any) => {
                                        if (v === 'freeze') {
                                            useAudioStore.getState().freezeTrack(id)
                                        } else {
                                            setTrackSetting(id, { mute: v })
                                        }
                                    }}
                                    onSolo={(id: any, v: any) => setTrackSetting(id, { solo: v })}
                                    onVolume={(id: any, v: any) => setTrackSetting(id, { volume: v })}
                                    onToggleAuto={(id: any) => setTrackSetting(id, { showAutomation: !(tracksState[id]?.showAutomation) })}
                                    onToggleCollapse={(id: any) => toggleGroupCollapsed(id)}
                                />
                            )
                        })}
                    </div>

                    <div className="arr-timeline"
                        ref={timelineRef}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop}
                        style={{ '--tpp': TPP } as any}
                    >
                        <ArrangementRuler
                            TPP={TPP}
                            markers={markers}
                            isLooping={isLooping}
                            loopStart={loopStart}
                            loopEnd={loopEnd}
                            onRemoveMarker={removeMarker}
                        />

                        <div className="arr-lanes">
                            {tracks.map(t => {
                                const settings = tracksState[t.id] || {}
                                const parentSettings = settings.parentId ? tracksState[settings.parentId] : null
                                if (parentSettings?.isCollapsed) return null

                                const showAuto = settings.showAutomation
                                const param = settings.automationParam || 'volume'
                                const points = automations[t.id]?.[param] || []

                                // --- GHOST NOTES LOGIC ---
                                const otherSelectedTrackIds = Array.from(new Set(
                                    clips.filter(c => selectedIds.includes(c.id) && c.trackId !== t.id).map(c => c.trackId)
                                ))

                                return (
                                    <div key={t.id} className={`track-lane-pro ${showAuto ? 'show-auto' : ''} ${settings.isGroup ? 'group-lane' : ''} ${settings.isFrozen ? 'frozen-lane' : ''}`}>
                                        {/* Group Summary Blocks */}
                                        {settings.isGroup && (
                                            clips.filter(c => {
                                                const childSettings = tracksState[c.trackId]
                                                return childSettings?.parentId === t.id
                                            }).map(c => (
                                                <div
                                                    key={`summary-${c.id}`}
                                                    className="group-summary-clip"
                                                    style={{ left: c.startTick * TPP, width: c.durationTicks * TPP }}
                                                />
                                            ))
                                        )}

                                        {/* Ghost Notes Layer */}
                                        {!settings.isGroup && otherSelectedTrackIds.map(otherTid => (
                                            clips.filter(c => c.trackId === otherTid).map(c => (
                                                <ArrangementClipItem
                                                    key={`ghost-${c.id}`} clip={c}
                                                    isGhost={true}
                                                    trackColor={tracks.find(tr => tr.id === otherTid)?.color || '#555'}
                                                    TPP={TPP}
                                                />
                                            ))
                                        ))}

                                        {/* Actual Clips */}
                                        {!settings.isGroup && clips.filter(c => c.trackId === t.id).map(c => (
                                            <ArrangementClipItem
                                                key={c.id} clip={c} isSelected={selectedIds.includes(c.id)}
                                                trackColor={t.color} TPP={TPP}
                                                onDrag={(e: any, clip: any) => {
                                                    if (settings.isFrozen) return
                                                    if (isScissorsMode) {
                                                        const rect = timelineRef.current!.getBoundingClientRect()
                                                        splitClip(clip.id, snapValue(e.clientX - rect.left + timelineRef.current!.scrollLeft - 180))
                                                    } else {
                                                        interaction.current = { ...interaction.current, dragging: clip.id, startX: e.clientX, startY: e.clientY, oldStart: clip.startTick }
                                                        if (!selectedIds.includes(clip.id)) setSelectedClips(e.shiftKey ? [...selectedIds, clip.id] : [clip.id])
                                                    }
                                                }}
                                                onResize={(e: any, clip: any, side: any) => {
                                                    if (settings.isFrozen) return
                                                    e.stopPropagation()
                                                    interaction.current = { ...interaction.current, resizing: { id: clip.id, side }, startX: e.clientX, oldStart: clip.startTick, oldDur: clip.durationTicks }
                                                }}
                                                onDelete={removeClip}
                                            />
                                        ))}

                                        {showAuto && (
                                            <div className="automation-canvas">
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

                            {/* MASTER BUS LANE */}
                            <div className="track-lane-pro master">
                                <div className="master-label-pro">MASTER BUS OUTPUT</div>
                            </div>
                        </div>

                        {marqueeRect && <div className="marquee-box" style={marqueeRect} />}

                        <div className="arr-playhead-v6" ref={playheadRef}>
                            <div className="playhead-top-v6" />
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
                                    placeholder={`SN ${(inspectorClip as any).snapshotId + 1}`}
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
                            {inspectorClip.type === 'midi' && (
                                <div className="ins-row">
                                    <label>SNAPSHOT</label>
                                    <select
                                        value={(inspectorClip as any).snapshotId ?? 0}
                                        onChange={(e) => updateClip(inspectorClip.id, { snapshotId: Number(e.target.value) })}
                                    >
                                        {Object.keys(SNAPSHOT_LIBRARY[inspectorClip.trackId] || {}).map(snapId => (
                                            <option key={snapId} value={snapId}>Snapshot {Number(snapId) + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {inspectorClip.type === 'audio' && (
                                <>
                                    <div className="ins-row">
                                        <label>WARP MODE</label>
                                        <select
                                            value={inspectorClip.audioData?.warpMode}
                                            onChange={(e) => updateClip(inspectorClip.id, {
                                                audioData: { ...inspectorClip.audioData!, warpMode: e.target.value as any }
                                            })}
                                        >
                                            <option value="Stretch">STRETCH</option>
                                            <option value="Repitch">REPITCH</option>
                                            <option value="None">NONE</option>
                                        </select>
                                    </div>
                                    <div className="ins-row">
                                        <label>ORIGINAL BPM</label>
                                        <input
                                            type="number"
                                            value={inspectorClip.audioData?.originalBpm}
                                            onChange={(e) => updateClip(inspectorClip.id, {
                                                audioData: { ...inspectorClip.audioData!, originalBpm: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="arr-footer-pro">
                <div className="footer-stat">
                    <span>TRACKS: {tracks.length}</span>
                    <span style={{ marginLeft: '12px' }}>CLIPS: {clips.length}</span>
                    <span style={{ marginLeft: '12px' }}>SELECTED: {selectedIds.length}</span>
                </div>
                <div className="footer-msg">ENGINE V6.0 • HYPER-PREMIUM RENDERER</div>
                <div className="footer-seek-pro" ref={seekTextRef}>001 : 01 : 000</div>
            </div>
        </div>
    )
}
