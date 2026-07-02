import React, { useState, useEffect, useRef, useId, useCallback } from 'react'
import { useSamplerStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import { useAudioStore } from '../../store/audioStore'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'
import './CMISampler.css'

export function CMISamplerView() {
    const {
        slices, playbackRate, volume, setParam,
        grainSize, overlap, detune,
        grid, toggleStep, availableSamples, currentSampleIndex,
        nextSample, prevSample
    } = useSamplerStore()

    const volId = useId()
    const rateId = useId()
    const sliceId = useId()
    const grainId = useId()
    const overlapId = useId()
    const detuneId = useId()

    const setFocus = useVisualStore(s => s.setFocusInstrument)
    const isPlaying = useAudioStore(s => s.isPlaying)
    const bpm = useAudioStore(s => s.bpm)
    const bridge = useAudioVisualBridge()

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [activeStep, setActiveStep] = useState(0)

    const handleHaptic = useCallback((type: 'light' | 'selection' = 'light') => {
        if (type === 'selection') {
            window.Telegram?.WebApp?.HapticFeedback?.selectionChanged()
        } else {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type)
        }
    }, [])

    const handleClose = () => {
        handleHaptic('light')
        setFocus(null)
    }

    const handleStepToggle = (step: number) => {
        handleHaptic('light')
        toggleStep(step)
    }

    const handleParamChange = (param: any, isContinuous = true) => {
        if (isContinuous) handleHaptic('selection')
        else handleHaptic('light')
        setParam(param)
    }

    const handlePrev = () => {
        handleHaptic('light')
        prevSample()
    }

    const handleNext = () => {
        handleHaptic('light')
        nextSample()
    }

    // Синхронизация с глобальным временем для визуализации шагов
    useEffect(() => {
        let rafId: number
        const updateStep = () => {
            const stepTime = (60 / bpm) / 4
            const currentTime = performance.now() / 1000
            const currentStep = Math.floor(currentTime / stepTime) % 16
            setActiveStep(currentStep)
            rafId = requestAnimationFrame(updateStep)
        }

        if (isPlaying) {
            updateStep()
        }

        return () => cancelAnimationFrame(rafId)
    }, [isPlaying, bpm])

    // Логика 2D Векторного осциллографа
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let rafId: number
        const draw = () => {
            const data = bridge.getFFTData()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.beginPath()
            ctx.strokeStyle = '#00ff66'
            ctx.lineWidth = 2

            if (data) {
                const step = canvas.width / 64
                for (let i = 0; i < 64; i++) {
                    const x = i * step
                    const y = (canvas.height / 2) - (data[i] / 255) * (canvas.height / 2)
                    if (i === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
            } else {
                ctx.moveTo(0, canvas.height / 2)
                ctx.lineTo(canvas.width, canvas.height / 2)
            }
            ctx.stroke()
            rafId = requestAnimationFrame(draw)
        }

        draw()
        return () => cancelAnimationFrame(rafId)
    }, [bridge])

    return (
        <div className="sampler-screen-overlay">
            <div className="cmi-container">
                <div className="cmi-screen">
                    <div className="cmi-header">
                        <span>СТРАНИЦА-Р — РЕАЛЬНОЕ ВРЕМЯ</span>
                        <button
                            className="cmi-close"
                            onClick={handleClose}
                            aria-label="Выйти из семплера"
                        >
                            ВЫХОД [X]
                        </button>
                    </div>

                    <div className="cmi-main-layout">
                        {/* Сетка Page R */}
                        <div className="pager-grid-container">
                            <div className="pager-grid">
                                {Array.from({ length: 8 }).map((_, slice) => (
                                    Array.from({ length: 16 }).map((_, step) => {
                                        const isOn = grid[step] && slice === 0
                                        const isActive = step === activeStep

                                        if (slice === 0) {
                                            return (
                                                <button
                                                    key={`${slice}-${step}`}
                                                    className={`pager-cell ${isOn ? 'on' : ''} ${isActive ? 'active-step' : ''}`}
                                                    onClick={() => handleStepToggle(step)}
                                                    aria-label={`Шаг ${step + 1}`}
                                                    aria-pressed={isOn}
                                                />
                                            )
                                        }

                                        return (
                                            <div
                                                key={`${slice}-${step}`}
                                                className={`pager-cell ${isActive ? 'active-step' : ''}`}
                                            />
                                        )
                                    })
                                ))}
                            </div>

                            <div className="cmi-panel">
                                <div className="cmi-panel-title">ВЕКТОРНЫЙ ОСЦИЛЛОГРАФ</div>
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={100}
                                    className="cmi-vector-canvas"
                                />
                            </div>

                            <div className="cmi-panel">
                                <div className="cmi-panel-title">СТАТУС СИСТЕМЫ</div>
                                <div className="cmi-status-row">
                                    <span>ТЕМП: {bpm} BPM</span>
                                    <span>ШАГИ: 16</span>
                                    <span>РЕЖИМ: ГРАНУЛЯРНЫЙ</span>
                                </div>
                            </div>
                        </div>

                        {/* Панель управления на боковой панели */}
                        <div className="cmi-sidebar">
                            <div className="cmi-panel">
                                <div className="cmi-panel-title">БИБЛИОТЕКА СЕМПЛОВ</div>
                                <div className="cmi-sample-list">
                                    {availableSamples.map((s, i) => (
                                        <div
                                            key={s.path}
                                            className={`cmi-sample-item ${i === currentSampleIndex ? 'active' : ''}`}
                                        >
                                            {i === currentSampleIndex ? '> ' : ''}{s.name.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                                <div className="cmi-nav-btns">
                                    <button onClick={handlePrev}>НАЗАД</button>
                                    <button onClick={handleNext}>ВПЕРЕД</button>
                                </div>
                            </div>

                            <div className="cmi-panel">
                                <div className="cmi-panel-title">ПАРАМЕТРЫ СЕМПЛА</div>
                                <div className="cmi-control-row">
                                    <label htmlFor={volId}>ГРОМКОСТЬ: {volume} dB</label>
                                    <input
                                        id={volId}
                                        type="range" min="-60" max="6" step="1" value={volume}
                                        onChange={(e) => handleParamChange({ volume: parseFloat(e.target.value) })}
                                        aria-valuetext={`${volume} dB`}
                                    />
                                </div>
                                <div className="cmi-control-row">
                                    <label htmlFor={rateId}>СКОРОСТЬ: {playbackRate.toFixed(2)}x</label>
                                    <input
                                        id={rateId}
                                        type="range" min="0.1" max="4.0" step="0.1" value={playbackRate}
                                        onChange={(e) => handleParamChange({ playbackRate: parseFloat(e.target.value) })}
                                        aria-valuetext={`${playbackRate.toFixed(2)}x`}
                                    />
                                </div>
                                <div className="cmi-control-row">
                                    <label htmlFor={sliceId}>СЛАЙСЫ: {slices}</label>
                                    <input
                                        id={sliceId}
                                        type="range" min="4" max="32" step="1" value={slices}
                                        onChange={(e) => handleParamChange({ slices: parseInt(e.target.value) }, false)}
                                        aria-valuetext={`${slices} слайсов`}
                                    />
                                </div>
                            </div>

                            <div className="cmi-panel">
                                <div className="cmi-panel-title">ГРАНУЛЯРНЫЙ ДВИЖОК</div>
                                <div className="cmi-control-row">
                                    <label htmlFor={grainId}>ЗЕРНО: {(grainSize * 1000).toFixed(0)} ms</label>
                                    <input
                                        id={grainId}
                                        type="range" min="0.01" max="0.5" step="0.01" value={grainSize}
                                        onChange={(e) => handleParamChange({ grainSize: parseFloat(e.target.value) })}
                                        aria-valuetext={`${(grainSize * 1000).toFixed(0)} миллисекунд`}
                                    />
                                </div>
                                <div className="cmi-control-row">
                                    <label htmlFor={overlapId}>НАХЛЁСТ: {(overlap * 100).toFixed(0)}%</label>
                                    <input
                                        id={overlapId}
                                        type="range" min="0.01" max="1.0" step="0.01" value={overlap}
                                        onChange={(e) => handleParamChange({ overlap: parseFloat(e.target.value) })}
                                        aria-valuetext={`${(overlap * 100).toFixed(0)}%`}
                                    />
                                </div>
                                <div className="cmi-control-row">
                                    <label htmlFor={detuneId}>ДЕТЮН: {detune.toFixed(0)}</label>
                                    <input
                                        id={detuneId}
                                        type="range" min="-1200" max="1200" step="10" value={detune}
                                        onChange={(e) => handleParamChange({ detune: parseFloat(e.target.value) })}
                                        aria-valuetext={`${detune.toFixed(0)}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cmi-footer">
                        <span>СИСТЕМА FAIRLIGHT CMI IIx v3.6.1</span>
                        <span>ГОТОВ. ВВЕДИТЕ КОМАНДУ ИЛИ ИСПОЛЬЗУЙТЕ СВЕТОВОЕ ПЕРО.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
