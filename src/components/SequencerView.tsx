import { useSequencerStore, useHarmonyStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import * as Tone from 'tone'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Scale, Note, Chord } from '@tonaljs/tonal'
import { ErrorBoundary } from './ErrorBoundary'
import { motion } from 'framer-motion'
import { useMidiExport } from '../hooks/useMidiExport'
import { GridWalker } from '../logic/GridWalker'
import { ChordType } from '../logic/Scaler'
import { RefreshCw, Power, Send, Play, Square, Layers } from 'lucide-react'

const GATE_MODES = ['Mute', 'Single', 'Multi', 'Hold']
const CONDITIONS = [
    { id: 'none', label: '---' },
    { id: '1/2', label: '1/2' },
    { id: '2/2', label: '2/2' },
    { id: '1/4', label: '1/4' },
    { id: '2/4', label: '2/4' },
    { id: 'neighbor', label: 'Pre' },
    { id: 'not-neighbor', label: '!Pre' },
]

export function SequencerView() {
    const {
        stages, snakePattern, setSnakePattern, setStage, setStages,
        snakeGrid, currentStageIndex, currentSnakeIndex, snakeX, snakeY, setSnakeGrid, toggleSnakeStep, setSnakeCell, setSnakeNote,
        isStagesPlaying, isSnakePlaying, isTuringPlaying, toggleStagesPlay, toggleSnakePlay, toggleTuringPlay,
        snakeStartStep, snakeEndStep, setSnakeRange,
        turingProbability, turingIsLocked, turingRegister, turingBits, setTuringParam,
        smartChordEnabled, smartChordType, setSmartChordParam, lastChordNotes
    } = useSequencerStore()
    const { root, scale } = useHarmonyStore()
    const { exportMidi, isExporting } = useMidiExport()

    const [selectedCell, setSelectedCell] = useState<number | null>(null)

    // Memoized available notes in scale across octaves
    const allScaleNotes = useMemo(() => {
        const scaleData = Scale.get(`${root} ${scale}`)
        const notes = scaleData.notes
        if (!notes.length) return []
        const result: number[] = []
        for (let oct = 2; oct <= 6; oct++) {
            notes.forEach(note => {
                const midi = Note.midi(`${note}${oct}`)
                if (midi) result.push(midi)
            })
        }
        return result
    }, [root, scale])

    const getScaleNotes = () => allScaleNotes

    useEffect(() => {
        if (allScaleNotes.length > 0) {
            const newGrid = snakeGrid.map((cell, i) => {
                const midi = allScaleNotes[i % allScaleNotes.length]
                return { ...cell, note: midi || cell.note }
            })
            setSnakeGrid(newGrid)
        }
    }, [allScaleNotes])

    const randomizeParam = (param: 'pitch' | 'length' | 'pulseCount' | 'probability' | 'gateMode') => {
        try {
            const scaleNotes = getScaleNotes()
            const newStages = stages.map(s => {
                const updates: any = {}
                if (param === 'pitch') updates.pitch = scaleNotes[Math.floor(Math.random() * scaleNotes.length)] || 60
                if (param === 'length') updates.length = Math.floor(Math.random() * 4) + 1
                if (param === 'pulseCount') updates.pulseCount = Math.floor(Math.random() * 4) + 1
                if (param === 'probability') updates.probability = Math.random() > 0.3 ? 1 : Math.random()
                if (param === 'gateMode') updates.gateMode = Math.floor(Math.random() * 4)
                return { ...s, ...updates }
            })
            setStages(newStages)
        } catch (e) {
            console.error('Randomize param failed', e)
        }
    }

    const randomizeSnake = () => {
        try {
            const scaleNotes = getScaleNotes()
            const newGrid = snakeGrid.map(cell => ({
                note: scaleNotes[Math.floor(Math.random() * scaleNotes.length)] || 60,
                velocity: 0.6 + Math.random() * 0.4,
                probability: Math.random() > 0.3 ? 1.0 : Math.max(0.2, Math.random()),
                active: Math.random() > 0.2 // 80% chance active
            }))
            setSnakeGrid(newGrid)
        } catch (e) {
            console.error('Randomize snake failed', e)
        }
    }

    const handlePitchDrag = (e: React.PointerEvent, currentMidi: number, onChange: (n: number) => void) => {
        e.preventDefault()
        const startY = e.clientY
        const scaleNotes = getScaleNotes()
        if (!scaleNotes.length) return

        let currentIndex = scaleNotes.findIndex(n => n === currentMidi)
        if (currentIndex === -1) currentIndex = scaleNotes.findIndex(n => Math.abs(n - currentMidi) < 2)
        if (currentIndex === -1) currentIndex = Math.floor(scaleNotes.length / 2)

        const handleMove = (moveEvent: PointerEvent) => {
            try {
                const delta = Math.floor((startY - moveEvent.clientY) / 10)
                const newIndex = Math.max(0, Math.min(scaleNotes.length - 1, currentIndex + delta))
                const newNote = scaleNotes[newIndex]
                if (newNote !== undefined) {
                    onChange(newNote)
                }
            } catch (e) {
                console.error('Pitch drag move failed', e)
            }
        }

        const handleUp = () => {
            try {
                window.removeEventListener('pointermove', handleMove)
                window.removeEventListener('pointerup', handleUp)
            } catch (e) {
                console.error('Pitch drag up failed', e)
            }
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener('pointerup', handleUp)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ML-185 Sequencer */}
            <ErrorBoundary fallbackName="ML-185">
                <section className="card">
                    {/* ... existing content ... */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3>Секвенсор ML-185</h3>
                                <button
                                    onClick={() => { try { toggleStagesPlay() } catch (e) { console.error(e) } }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        background: isStagesPlaying ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.2)',
                                        color: isStagesPlaying ? 'white' : 'inherit',
                                        border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {isStagesPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
                                8 шагов степ-секвенсора
                            </p>
                        </div>
                        <button
                            onClick={() => exportMidi('seq185')}
                            disabled={isExporting}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px',
                                background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-link-color)', fontSize: '10px',
                                border: 'none', opacity: isExporting ? 0.5 : 1
                            }}
                        >
                            <Send size={12} />
                            {isExporting ? '...' : 'MIDI'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '32px' }}>
                            <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <button onClick={() => randomizeParam('pitch')} className="icon-button" style={{ width: '30px', height: '30px' }}><RefreshCw size={14} /></button>
                            </div>
                            <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--tg-theme-hint-color)', gap: '4px' }}>
                                LEN <button onClick={() => randomizeParam('length')} className="icon-button-small" style={{ width: '24px', height: '24px' }}><RefreshCw size={10} /></button>
                            </div>
                            <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--tg-theme-hint-color)', gap: '4px' }}>
                                PULS <button onClick={() => randomizeParam('pulseCount')} className="icon-button-small" style={{ width: '24px', height: '24px' }}><RefreshCw size={10} /></button>
                            </div>
                            <div style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--tg-theme-hint-color)', gap: '4px' }}>
                                PROB <button onClick={() => randomizeParam('probability')} className="icon-button-small" style={{ width: '24px', height: '24px' }}><RefreshCw size={10} /></button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--tg-theme-hint-color)', gap: '4px', minHeight: '52px' }}>
                                GATE <button onClick={() => randomizeParam('gateMode')} className="icon-button-small" style={{ width: '24px', height: '24px' }}><RefreshCw size={10} /></button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '12px' }}>
                            {stages.map((stage, i) => (
                                <div key={i} style={{
                                    minWidth: '60px', padding: '8px 4px', background: 'var(--tg-theme-bg-color)', borderRadius: '12px',
                                    display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
                                    border: currentStageIndex === i ? '2px solid var(--tg-theme-button-color)' : '1px solid var(--glass-border)',
                                    boxShadow: currentStageIndex === i ? '0 0 10px var(--tg-theme-button-color)' : 'none', opacity: stage.gateMode === 0 ? 0.6 : 1
                                }}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5 }}>#{i + 1}</span>
                                    <div onPointerDown={(e) => handlePitchDrag(e, stage.pitch, (n) => setStage(i, { pitch: n }))} style={{
                                        width: '100%', height: '32px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold',
                                        cursor: 'ns-resize', userSelect: 'none', border: '1px solid var(--glass-border)'
                                    }}>
                                        {(() => {
                                            try {
                                                return Tone.Frequency(stage.pitch, "midi").toNote()
                                            } catch (e) {
                                                return '?'
                                            }
                                        })()}
                                    </div>
                                    <Knob value={stage.length} min={1} max={8} step={1} onChange={(v) => setStage(i, { length: v })} size={44} showLabel={false} />
                                    <Knob value={stage.pulseCount} min={1} max={8} step={1} onChange={(v) => setStage(i, { pulseCount: v })} size={44} showLabel={false} />
                                    <Knob value={stage.probability} min={0} max={1} step={0.1} onChange={(v) => setStage(i, { probability: v })} size={44} showLabel={false} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                                        <button onClick={() => setStage(i, { gateMode: ((stage.gateMode + 1) % 4) as any })} style={{
                                            fontSize: '9px', padding: '4px', borderRadius: '4px', width: '100%',
                                            background: stage.gateMode > 0 ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                                            color: stage.gateMode > 0 ? 'white' : 'var(--tg-theme-text-color)', border: '1px solid var(--glass-border)'
                                        }}>{GATE_MODES[stage.gateMode]}
                                        </button>
                                        <select value={stage.condition} onChange={(e) => setStage(i, { condition: e.target.value as any })} style={{
                                            fontSize: '9px', padding: '2px', borderRadius: '4px', width: '100%',
                                            background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)', border: '1px solid var(--glass-border)'
                                        }}>
                                            {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </ErrorBoundary>

            {/* MDD Snake Grid */}
            <ErrorBoundary fallbackName="Snake Grid">
                <section className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3>Сетка MDD Snake</h3>
                                <button onClick={() => { try { toggleSnakePlay() } catch (e) { console.error(e) } }} style={{
                                    padding: '8px', borderRadius: '8px', border: 'none', transition: 'all 0.2s ease',
                                    background: isSnakePlaying ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.2)',
                                    color: isSnakePlaying ? 'white' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isSnakePlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </button>
                                <button onClick={() => exportMidi('snake')} disabled={isExporting} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: 'none',
                                    background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-link-color)', fontSize: '11px',
                                    opacity: isExporting ? 0.5 : 1, transition: 'all 0.2s ease'
                                }}>
                                    <Send size={14} />
                                    {isExporting ? '...' : 'MIDI'}
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>Интерактивная матрица нот</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px', background: 'var(--tg-theme-secondary-bg-color)', padding: '2px 8px', borderRadius: '10px', alignItems: 'center' }}>
                                <Knob label="START" value={snakeStartStep + 1} min={1} max={snakeEndStep + 1} step={1} onChange={(v) => setSnakeRange(v - 1, snakeEndStep)} size={32} />
                                <Knob label="END" value={snakeEndStep + 1} min={snakeStartStep + 1} max={16} step={1} onChange={(v) => setSnakeRange(snakeStartStep, v - 1)} size={32} />
                            </div>
                            <select value={snakePattern} onChange={(e) => setSnakePattern(e.target.value as any)} style={{
                                background: 'var(--tg-theme-secondary-bg-color)', border: '1px solid var(--glass-border)',
                                borderRadius: '8px', padding: '4px 8px', fontSize: '12px', color: 'var(--tg-theme-text-color)'
                            }}>
                                <option value="linear">Line</option>
                                <option value="zigzag">ZigZag</option>
                                <option value="zigzag-v">ZigZag V</option>
                                <option value="spiral">Spiral</option>
                                <option value="cartesian">Cartesian (X/Y)</option>
                                <option value="random">Rand</option>
                            </select>
                            <button onClick={randomizeSnake} className="icon-button" style={{ padding: '10px', borderRadius: '10px', background: 'var(--tg-theme-secondary-bg-color)' }}>
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', aspectRatio: '1', marginTop: '16px'
                    }}>
                        {snakeGrid.map((cell, i) => {
                            const x = i % 4
                            const y = Math.floor(i / 4)
                            const path = GridWalker.getPatternPath(snakePattern)
                            const activePath = path.slice(snakeStartStep, snakeEndStep + 1)
                            const isInRange = activePath.includes(i)
                            const isActive = currentSnakeIndex === i
                            const isSelected = selectedCell === i
                            const isInActiveX = snakePattern === 'cartesian' && x === snakeX
                            const isInActiveY = snakePattern === 'cartesian' && y === snakeY

                            return (
                                <div key={i} onPointerDown={(e) => {
                                    try {
                                        setSelectedCell(i)
                                        handlePitchDrag(e, cell.note, (n) => setSnakeNote(i, n))
                                    } catch (e) { console.error(e) }
                                }} className="snake-cell" style={{
                                    background: isActive ? 'var(--tg-theme-button-color)' : isSelected ? 'rgba(51, 144, 236, 0.2)' : (isInActiveX || isInActiveY) ? 'rgba(51, 144, 236, 0.08)' : isInRange ? 'rgba(51, 144, 236, 0.15)' : (cell.active ? 'var(--tg-theme-bg-color)' : 'rgba(0,0,0,0.05)'),
                                    borderRadius: '14px', border: isActive ? '2px solid white' : isSelected ? '2px solid var(--tg-theme-button-color)' : (isInActiveX || isInActiveY) ? '1px solid rgba(51, 144, 236, 0.3)' : (cell.active ? '1px solid var(--tg-theme-button-color)' : '1px dashed var(--tg-theme-hint-color)'),
                                    boxShadow: isActive ? '0 0 20px var(--tg-theme-button-color)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace', color: isActive ? 'white' : (cell.active ? 'var(--tg-theme-text-color)' : 'var(--tg-theme-hint-color)'),
                                    transition: 'all 0.2s ease', cursor: 'ns-resize', userSelect: 'none', position: 'relative', opacity: cell.active ? 1 : 0.7
                                }}>
                                    {(() => {
                                        try {
                                            return Tone.Frequency(cell.note, "midi").toNote()
                                        } catch (e) {
                                            return '?'
                                        }
                                    })()}
                                    {cell.active && <div style={{ position: 'absolute', bottom: '6px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--tg-theme-button-color)', opacity: cell.velocity }} />}
                                </div>
                            )
                        })}
                    </div>

                    {selectedCell !== null && (
                        <div style={{
                            marginTop: '24px', padding: '20px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '20px',
                            border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tg-theme-button-color)' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>ШАГ #{selectedCell + 1}</span>
                                </div>
                                <button onClick={() => setSelectedCell(null)} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', background: 'rgba(0,0,0,0.05)', color: 'var(--tg-theme-text-color)', border: 'none' }}>Закрыть</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--tg-theme-hint-color)', textTransform: 'uppercase' }}>Активность</label>
                                    <button onClick={() => toggleSnakeStep(selectedCell)} style={{ width: '50px', height: '50px', borderRadius: '50%', background: snakeGrid[selectedCell].active ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}><Power size={22} /></button>
                                </div>
                                <Knob label="Сила (Vel)" value={snakeGrid[selectedCell].velocity} min={0} max={1} step={0.01} onChange={(v) => setSnakeCell(selectedCell, { velocity: v })} size={52} />
                                <Knob label="Шанс (%)" value={snakeGrid[selectedCell].probability} min={0} max={1} step={0.01} onChange={(v) => setSnakeCell(selectedCell, { probability: v })} size={52} />
                            </div>
                        </div>
                    )}
                </section>
            </ErrorBoundary>

            {/* Turing Machine Sequencer */}
            <ErrorBoundary fallbackName="Turing Machine">
                <section className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ margin: 0 }}>Turing Machine</h3>
                                <button onClick={() => { try { toggleTuringPlay() } catch (e) { console.error(e) } }} style={{
                                    padding: '8px', borderRadius: '8px', background: isTuringPlaying ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.2)',
                                    color: isTuringPlaying ? 'white' : 'inherit', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
                                }}>
                                    {isTuringPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </button>
                                <button
                                    onClick={() => exportMidi('turing')}
                                    disabled={isExporting}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px',
                                        background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-link-color)', fontSize: '10px',
                                        border: 'none', opacity: isExporting ? 0.5 : 1
                                    }}
                                >
                                    <Send size={12} />
                                    {isExporting ? '...' : 'MIDI'}
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>Генеративный сдвиговый регистр</p>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '4px' }}>
                            {Array.from({ length: 16 }).map((_, i) => {
                                const bit = (turingRegister >> (15 - i)) & 1
                                return <div key={i} style={{ width: '8px', height: '16px', borderRadius: '2px', background: bit ? 'var(--tg-theme-button-color)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(0,0,0,0.1)', boxShadow: bit ? '0 0 6px var(--tg-theme-button-color)' : 'none', transition: 'all 0.1s ease' }} />
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-around', alignItems: 'center', padding: '16px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <Knob label="Эволюция (%)" value={turingProbability} min={0} max={1} step={0.01} onChange={(v) => setTuringParam({ turingProbability: v })} size={60} color="var(--tg-theme-button-color)" />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--tg-theme-hint-color)' }}>РЕЖИМ ПЕТЛИ</span>
                            <button onClick={() => setTuringParam({ turingIsLocked: !turingIsLocked })} style={{ width: '60px', height: '60px', borderRadius: '50%', background: turingIsLocked ? '#ff4d4d' : 'var(--tg-theme-button-color)', border: 'none', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: turingIsLocked ? '0 0 15px rgba(255,77,77,0.4)' : '0 4px 10px rgba(51, 144, 236, 0.3)', gap: '2px' }}>
                                <Power size={20} /><span style={{ fontSize: '8px', fontWeight: 'bold' }}>{turingIsLocked ? 'LOCKED' : 'FREE'}</span>
                            </button>
                        </div>
                        <Knob label="Размер (Bits)" value={turingBits} min={1} max={16} step={1} onChange={(v) => setTuringParam({ turingBits: v })} size={52} />
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11px', opacity: 0.5, textAlign: 'center', fontStyle: 'italic', color: turingIsLocked ? '#ff4d4d' : 'inherit' }}>
                        {turingIsLocked ? "Петля заморожена: паттерн будет повторяться бесконечно" : "Свободный режим: паттерн мутирует при вращении регистра"}
                    </div>
                </section>
            </ErrorBoundary>

            {/* Smart Chord MIDI FX (Schwarzonator) */}
            <ErrorBoundary fallbackName="Smart Chord FX">
                <section className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ margin: 0 }}>Smart Chord</h3>
                                <button onClick={() => { try { setSmartChordParam({ smartChordEnabled: !smartChordEnabled }) } catch (e) { console.error(e) } }} style={{
                                    padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s ease',
                                    background: smartChordEnabled ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.2)',
                                    color: smartChordEnabled ? 'white' : 'inherit'
                                }}>{smartChordEnabled ? 'ENABLED' : 'DISABLED'}
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '4px' }}>Математическая гармонизация (Schwarzonator)</p>
                        </div>
                        <Layers size={24} style={{ opacity: 0.5 }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Тип аккорда</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {(['triad', '7th', 'power', 'sus2', 'sus4'] as ChordType[]).map(t => (
                                    <button key={t} onClick={() => setSmartChordParam({ smartChordType: t })} style={{
                                        padding: '4px 8px', fontSize: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', textTransform: 'uppercase',
                                        background: smartChordType === t ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                                        color: smartChordType === t ? 'white' : 'inherit'
                                    }}>{t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Real-time Indicator */}
                        <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.5, textTransform: 'uppercase' }}>Аккордовый монитор</div>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--tg-theme-button-color)' }}>
                                    {(() => {
                                        if (lastChordNotes.length > 1) {
                                            try {
                                                const detected = Chord.detect(lastChordNotes.map(m => Tone.Frequency(m, 'midi').toNote()))
                                                return detected[0] || ''
                                            } catch (e) { return '' }
                                        }
                                        return ''
                                    })()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', minHeight: '30px', alignItems: 'center' }}>
                                {lastChordNotes.length > 0 ? (
                                    lastChordNotes.map((m, i) => {
                                        if (m === undefined || m === null || isNaN(m)) return null
                                        let noteName = ''
                                        try {
                                            noteName = Tone.Frequency(m, 'midi').toNote()
                                        } catch (e) { return null }

                                        return (
                                            <motion.div
                                                key={`${m}-${i}-${noteName}`}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'var(--tg-theme-button-color)',
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 2px 8px rgba(51, 144, 236, 0.3)'
                                                }}
                                            >
                                                {noteName}
                                            </motion.div>
                                        )
                                    })
                                ) : (
                                    <span style={{ fontSize: '11px', opacity: 0.3, fontStyle: 'italic' }}>Ожидание ноты...</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </ErrorBoundary>
        </div>
    )
}
