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
import { LandingPage } from './components/LandingPage'
import { useAudioStore } from './store/audioStore'
import { useVisualStore } from './store/visualStore'
import { WebGLScene } from './components/WebGL/WebGLScene'
import { ErrorBoundary } from './components/ErrorBoundary'
import { InstrumentNavigation } from './components/InstrumentNavigation'
import { KeyboardController } from './components/KeyboardController'
import { FAQ } from './components/FAQ'
import { AudioVisualBridge } from './lib/AudioVisualBridge'
import { useCompositionManager } from './logic/CompositionManager'
import type { InstrumentType } from './lib/SpatialLayout'
import { InstrumentSearch } from './components/InstrumentSearch'
import { VisualizerSearch } from './components/VisualizerSearch'
import { SamplerScreen } from './components/HUD/SamplerScreen'
import { AIPanel } from './components/HUD/AIPanel'
import { HarmonyScreen } from './components/HUD/HarmonyScreen'
import { Buchla259Screen } from './components/HUD/Buchla259Screen'
import { DrumsScreen } from './components/HUD/DrumsScreen'
import { BassScreen } from './components/HUD/BassScreen'
import { PadsScreen } from './components/HUD/PadsScreen'
import { SequencerScreen } from './components/HUD/SequencerScreen'
import { DroneScreen } from './components/HUD/DroneScreen'
import { MasterScreen } from './components/HUD/MasterScreen'
import { GamepadManager } from './lib/GamepadManager'
import { NodeEditor } from './components/HUD/NodeEditor'
import { LiveSession } from './components/HUD/LiveSession'
import { ArrangementEditor } from './components/HUD/ArrangementEditor'
import { useNodeStore } from './store/nodeStore'
import { ReferenceOverlay } from './components/HUD/ReferenceOverlay'
import { GamepadOverlay } from './components/HUD/GamepadOverlay'
import { GraphEngine } from './logic/GraphEngine'
import { VisualEngine } from './components/VisualEngine/VisualEngine'
import { launchControlXL } from './lib/controllers/LaunchControlXL'
import { VisualizerShop } from './components/VisualEngine/VisualizerShop'
import './App.css'

function App() {
    const isInitialized = useAudioStore(s => s.isInitialized)
    const isPlaying = useAudioStore(s => s.isPlaying)
    const bpm = useAudioStore(s => s.bpm)
    const initAudioEngine = useAudioStore(s => s.initialize)
    const togglePlay = useAudioStore(s => s.togglePlay)
    const setBPM = useAudioStore(s => s.setBpm)
    const activeView = useVisualStore(s => s.appView)
    const cycleView = useVisualStore(s => s.cycleView)

    const loadingStep = useAudioStore(s => s.loadingStep)
    const isInitializing = useAudioStore(s => s.isInitializing)

    const focusedInstrument = useVisualStore(s => s.focusInstrument)
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)
    const aestheticTheme = useVisualStore(s => s.aestheticTheme)

    const [showOverlay, setShowOverlay] = useState(true)
    const [showFAQ, setShowFAQ] = useState(false)
    const recalculateRouting = useAudioStore(s => s.recalculateRouting)
    const edges = useNodeStore(s => s.edges)

    // Sync Node Routing on Init
    useEffect(() => {
        if (isInitialized) {
            recalculateRouting(edges)
        }
    }, [isInitialized, recalculateRouting, edges])

    // Toggle South Park theme class on body
    useEffect(() => {
        if (aestheticTheme === 'southpark') {
            document.body.classList.add('southpark-theme')
        } else {
            document.body.classList.remove('southpark-theme')
        }
        return () => {
            document.body.classList.remove('southpark-theme')
        }
    }, [aestheticTheme])

    // Pyodide Bridge
    useCompositionManager()

    const micEnabled = useVisualStore(s => s.micEnabled)

    // Sync Microphone State
    useEffect(() => {
        if (isInitialized) {
            AudioVisualBridge.toggleMic(micEnabled)
        }
    }, [micEnabled, isInitialized])

    // Initialize Audio Engine
    const handleInit = async () => {
        try {
            await initAudioEngine()
        } catch (err) {
            console.error('Failed to initialize audio engine:', err)
        }
    }

    // Initialize Gamepad Manager & MIDI Controllers & Graph Engine
    useEffect(() => {
        GamepadManager.init()
        launchControlXL.init()
        GraphEngine.init() // Initialize graph without direct edges arg
        return () => GraphEngine.dispose()
    }, [])

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

    if (!isInitialized) {
        return (
            <div className="init-screen">
                <div className="init-content">
                    <h1>🌌 MIDI Studio Pro 3D</h1>
                    <p>Immersive Generative Music Environment</p>

                    {!isInitializing ? (
                        <button
                            onClick={handleInit}
                            className="init-button"
                        >
                            Launch Studio
                        </button>
                    ) : (
                        <div className="loading-status">
                            <div className="spinner"></div>
                            <p>{loadingStep || "Initializing..."}</p>
                        </div>
                    )}

                    <p style={{ marginTop: '1.5rem', opacity: 0.6, fontSize: '0.9rem' }}>
                        SPACE to Play/Stop • 1-7 to Navigate • ? for Help
                    </p>
                </div>
            </div>
        )
    }

    const toggleGamepadHelp = useVisualStore(s => s.toggleGamepadHelp)

    return (
        <ErrorBoundary>
            <div className="app-3d">
                {/* Keyboard Shortcuts Control */}
                <KeyboardController
                    showOverlay={showOverlay}
                    onToggleOverlay={() => setShowOverlay(!showOverlay)}
                    onToggleFAQ={() => setShowFAQ(!showFAQ)}
                />

                {/* Full-screen WebGL Scene / Visual Engine */}
                <div className={`scene-container ${activeView !== '3D' && activeView !== 'VISUALIZER' ? 'view-blur' : ''}`}>
                    {activeView === 'VISUALIZER' ? (
                        <VisualEngine />
                    ) : (
                        <WebGLScene
                            focusInstrument={focusedInstrument}
                            cameraMode={focusedInstrument ? 'focus' : 'overview'}
                        />
                    )}
                </div>

                {/* Minimal 2D Overlay */}
                {showOverlay && (
                    <div className="control-overlay">
                        <div className="transport-controls">
                            <button
                                onClick={togglePlay}
                                className={`play-button ${isPlaying ? 'playing' : ''}`}
                                title="Play/Stop (Space)"
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

                            <button
                                className="help-button-circle"
                                onClick={() => setShowFAQ(true)}
                                title="FAQ & Help (?)"
                            >
                                ?
                            </button>
                        </div>

                        <button
                            className="overlay-toggle"
                            onClick={() => setShowOverlay(false)}
                            title="Hide HUD (H)"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* FAQ Overlay */}
                {showFAQ && <FAQ onClose={() => setShowFAQ(false)} />}

                {/* Unified Reference HUD */}
                <ReferenceOverlay />

                {/* Gamepad Control Map */}
                <GamepadOverlay />

                {/* Node-Based Routing Editor */}
                {activeView === 'NODES' && <NodeEditor onClose={() => cycleView()} />}

                {/* Live Session Dashboard */}
                {activeView === 'LIVE' && <LiveSession />}

                {/* Arrangement Timeline Editor */}
                {activeView === 'ARRANGE' && <ArrangementEditor onClose={() => cycleView()} />}

                {/* AI Generation Tools */}
                <AIPanel />

                {/* CMD+K Search HUD */}
                <InstrumentSearch onSelect={setFocusedInstrument} />
                <VisualizerSearch />
                <VisualizerShop />

                {/* Instrument Navigation Bar (Holographic Quick-Bar) */}
                {activeView !== 'NODES' && activeView !== 'ARRANGE' && activeView !== 'LIVE' && (
                    <InstrumentNavigation
                        currentInstrument={focusedInstrument}
                        onSelect={setFocusedInstrument}
                    />
                )}

                {/* Gamepad Toggle Button (Bottom Left) */}
                <button
                    className="gamepad-toggle-btn"
                    onClick={toggleGamepadHelp}
                    title="Gamepad Reference"
                >
                    🎮
                </button>

                {/* 2D HUDs */}
                {focusedInstrument === 'bass' && <BassScreen />}
                {focusedInstrument === 'drums' && <DrumsScreen />}
                {focusedInstrument === 'sampler' && <SamplerScreen />}
                {focusedInstrument === 'harmony' && <HarmonyScreen />}
                {focusedInstrument === 'buchla' && <Buchla259Screen />}
                {focusedInstrument === 'pads' && <PadsScreen />}
                {(focusedInstrument === 'sequencer' || focusedInstrument === 'ml185') && <SequencerScreen />}
                {focusedInstrument === 'drone' && <DroneScreen />}
                {focusedInstrument === 'master' && <MasterScreen />}

                {/* Help hint (bottom right) */}
            </div>
        </ErrorBoundary>
    )
}

export default App
