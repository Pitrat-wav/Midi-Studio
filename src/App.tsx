/**
 * App.tsx — Main Application (3D-Only Mode)
 * 
 * Полностью 3D UX:
 * - WebGL scene во весь экран
 * - 3D instrument selector для навигации
 * - Минимальный 2D overlay для критичных controls (play/stop, BPM)
 * - Все параметры управляются через 3D controls
 */

import { useEffect, useState } from 'react'
import { useAudioStore } from './store/audioStore'
import { useVisualStore } from './store/visualStore'
import { WebGLScene } from './components/WebGL/WebGLScene'
import { ErrorBoundary } from './components/ErrorBoundary'
import { InstrumentNavigation } from './components/InstrumentNavigation'
import { AudioVisualBridge } from './lib/AudioVisualBridge'
import type { InstrumentType } from './lib/SpatialLayout'
import './App.css'

function App() {
    const isInitialized = useAudioStore(s => s.isInitialized)
    const isPlaying = useAudioStore(s => s.isPlaying)
    const bpm = useAudioStore(s => s.bpm)
    const initAudioEngine = useAudioStore(s => s.initialize)
    const togglePlay = useAudioStore(s => s.togglePlay)
    const setBPM = useAudioStore(s => s.setBpm)

    const [focusedInstrument, setFocusedInstrument] = useState<InstrumentType | null>(null)
    const [showOverlay, setShowOverlay] = useState(true)

    // Initialize Audio Engine
    const handleInit = async () => {
        try {
            await initAudioEngine()
        } catch (err) {
            console.error('Failed to initialize audio engine:', err)
        }
    }

    // Initialize AudioVisualBridge when audio engine is ready
    useEffect(() => {
        if (isInitialized) {
            AudioVisualBridge.init().catch(err => {
                console.error('Failed to initialize AudioVisualBridge:', err)
            })
        }

        return () => {
            if (isInitialized) {
                AudioVisualBridge.dispose()
            }
        }
    }, [isInitialized])

    // BPM sync with AudioVisualBridge
    useEffect(() => {
        if (isInitialized) {
            AudioVisualBridge.setBPM(bpm)
        }
    }, [bpm, isInitialized])

    // Auto-hide overlay after initialization
    useEffect(() => {
        if (isInitialized && isPlaying) {
            const timer = setTimeout(() => {
                setShowOverlay(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isInitialized, isPlaying])

    // Keyboard shortcuts for instrument navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement) return

            switch (e.key) {
                case ' ':
                    e.preventDefault()
                    togglePlay()
                    break
                case 'h':
                case 'H':
                    e.preventDefault()
                    setShowOverlay(!showOverlay)
                    break
                case '0':
                    setFocusedInstrument(null)
                    break
                case '1':
                    setFocusedInstrument('drums')
                    break
                case '2':
                    setFocusedInstrument('bass')
                    break
                case '3':
                    setFocusedInstrument('harmony')
                    break
                case '4':
                    setFocusedInstrument('pads')
                    break
                case '5':
                    setFocusedInstrument('sequencer')
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [togglePlay, showOverlay])

    if (!isInitialized) {
        return (
            <div className="init-screen">
                <div className="init-content">
                    <h1>🎹 Telegram MIDI Studio</h1>
                    <p>Generative 3D Music Environment</p>
                    <button
                        onClick={handleInit}
                        className="init-button"
                    >
                        Launch Studio
                    </button>
                </div>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <div className="app-3d">
                {/* Full-screen WebGL Scene */}
                <WebGLScene
                    focusInstrument={focusedInstrument}
                    cameraMode={focusedInstrument ? 'focus' : 'overview'}
                />

                {/* Minimal 2D Overlay (показывается при hover или нажатии клавиши) */}
                {showOverlay && (
                    <div className="control-overlay">
                        <div className="transport-controls">
                            <button
                                onClick={togglePlay}
                                className={`play-button ${isPlaying ? 'playing' : ''}`}
                            >
                                {isPlaying ? '⏸' : '▶'}
                            </button>

                            <div className="bpm-control">
                                <label>BPM</label>
                                <input
                                    type="range"
                                    min="60"
                                    max="200"
                                    value={bpm}
                                    onChange={(e) => setBPM(parseInt(e.target.value))}
                                />
                                <span>{bpm}</span>
                            </div>
                        </div>

                        <button
                            className="overlay-toggle"
                            onClick={() => setShowOverlay(false)}
                            title="Hide controls (press H to show)"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Instrument Navigation Bar */}
                <InstrumentNavigation
                    currentInstrument={focusedInstrument}
                    onSelect={setFocusedInstrument}
                />

                {/* Help hint (bottom right) */}
                {!showOverlay && (
                    <div className="help-hint">
                        Press <kbd>H</kbd> for controls
                    </div>
                )}
            </div>
        </ErrorBoundary>
    )
}

export default App
