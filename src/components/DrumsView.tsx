import { useDrumStore } from '../store/instrumentStore'
import { useAudioStore } from '../store/audioStore'
import { useMidiExport } from '../hooks/useMidiExport'
import { useVisualStore } from '../store/visualStore'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Float, Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { GenerativeGrid3D } from './WebGL/GenerativeGrid3D'
import { DrumPad3D } from './WebGL/DrumPad3D'
import { GenerativeKnob3D } from './WebGL/GenerativeKnob3D'
import { Play, Square, Send } from 'lucide-react'
import { Knob } from './Knob'
import { useState, useEffect } from 'react'

export function DrumsView() {
    console.log('🥁 DrumsView WebGL v4.0')
    const drumStore = useDrumStore()
    const [canRenderWebGL, setCanRenderWebGL] = useState(false)

    // CRITICAL: Extract data with optional chaining FIRST
    const activePatterns = drumStore?.activePatterns
    const kick = activePatterns?.kick
    const snare = activePatterns?.snare
    const hihat = activePatterns?.hihat
    const hihatOpen = activePatterns?.hihatOpen
    const clap = activePatterns?.clap
    const ride = activePatterns?.ride

    // Check if data is ready for WebGL rendering
    const isDataReady = kick && snare && hihat &&
        Array.isArray(kick) && kick.length > 0 &&
        Array.isArray(snare) && snare.length > 0 &&
        Array.isArray(hihat) && hihat.length > 0

    // Only enable WebGL when data has been ready for 100ms
    useEffect(() => {
        if (isDataReady) {
            const timer = setTimeout(() => {
                console.log('✅ Data stable, enabling WebGL')
                setCanRenderWebGL(true)
            }, 100)
            return () => clearTimeout(timer)
        } else {
            setCanRenderWebGL(false)
        }
    }, [isDataReady])

    // If data not ready, show loading
    if (!isDataReady || !drumStore || !canRenderWebGL) { // Modified to include canRenderWebGL
        return (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <h2>🥁 Loading Drums...</h2>
                <p style={{ opacity: 0.6 }}>Initializing WebGL environment</p>
            </div>
        )
    }

    const { isPlaying, togglePlay, setParams, kit, setKit } = drumStore
    const { currentStep, drumMachine } = useAudioStore()
    const { exportMidi, isExporting } = useMidiExport()
    const triggers = useVisualStore(s => s.triggers)

    const updateDrum = (drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'ride', params: any) => {
        setParams(drum, params)
        if (drumMachine) {
            const d = drumStore[drum]
            const finalParams = { ...d, ...params }
            if (params.pitch !== undefined || params.decay !== undefined) {
                drumMachine.setDrumParams(drum, finalParams.pitch, finalParams.decay)
            }
            if (params.volume !== undefined) {
                drumMachine.setDrumVolume(drum, params.volume)
            }
        }
    }

    const handleDrumTrigger = (drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'ride') => {
        if (drumMachine) {
            drumMachine.triggerDrum(drum)
        }
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
        }
    }

    const DRUMS = [
        { id: 'kick' as const, label: 'KICK', color: '#ff3b30', pos: [-1.2, 1, 0] },
        { id: 'snare' as const, label: 'SNARE', color: '#3390ec', pos: [0, 1, 0] },
        { id: 'hihat' as const, label: 'HI-HAT', color: '#f7ba2a', pos: [1.2, 1, 0] },
        { id: 'clap' as const, label: 'CLAP', color: '#9b59b6', pos: [0, -0.2, 0] }
    ]

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-l)',
            paddingBottom: '80px'
        }}>
            {/* MASTER CONTROLS */}
            <section className="card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-m)'
            }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>🥁 WEBGL DRUMS v4</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={togglePlay}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: isPlaying ? '#ff3b30' : '#34c759',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isPlaying ? <Square size={20} fill="white" /> : <Play size={20} fill="white" />}
                    </button>
                    <button
                        onClick={() => exportMidi('drums')}
                        disabled={isExporting}
                        style={{
                            padding: '0 20px',
                            height: '48px',
                            borderRadius: '24px',
                            background: 'var(--tg-theme-button-color)',
                            border: 'none',
                            color: 'var(--tg-theme-button-text-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        <Send size={16} />
                        MIDI
                    </button>
                </div>
            </section>

            {/* 3D DRUM PADS */}
            <section style={{
                width: '100%',
                height: '500px',
                borderRadius: 'var(--border-radius-large)',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            }}>
                <Canvas shadows gl={{ alpha: true, antialias: true }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        maxPolarAngle={Math.PI / 2}
                        minPolarAngle={Math.PI / 4}
                    />

                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3390ec" />

                    <EffectComposer>
                        <Bloom
                            intensity={1.5}
                            luminanceThreshold={0.2}
                            luminanceSmoothing={0.9}
                            height={300}
                        />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>

                    {DRUMS.map(d => {
                        const current = drumStore[d.id]
                        if (!current) return null

                        return (
                            <group key={d.id} position={d.pos as any}>
                                <DrumPad3D
                                    id={d.id}
                                    position={[0, 0, 0]}
                                    color={d.color}
                                    label={d.label}
                                    onClick={() => handleDrumTrigger(d.id)}
                                />
                                <GenerativeKnob3D
                                    value={current.pulses}
                                    min={0} max={16}
                                    label={`${d.id}-pulses`}
                                    position={[0.6, -0.6, 0.1]}
                                    color={d.color}
                                    onChange={(v) => updateDrum(d.id, { pulses: Math.round(v) })}
                                />
                                <GenerativeKnob3D
                                    value={current.decay}
                                    min={0} max={1}
                                    label={`${d.id}-decay`}
                                    position={[-0.6, -0.6, 0.1]}
                                    color={d.color}
                                    onChange={(v) => updateDrum(d.id, { decay: v })}
                                />
                                <Html position={[0, -1, 0]} center>
                                    <div style={{
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        letterSpacing: '2px',
                                        opacity: 0.6
                                    }}>{d.label}</div>
                                </Html>
                            </group>
                        )
                    })}
                </Canvas>
            </section>

            {/* PATTERN GRIDS */}
            <section style={{
                width: '100%',
                height: '400px',
                borderRadius: 'var(--border-radius-large)',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.02)'
            }}>
                <Canvas gl={{ alpha: true }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                    <OrbitControls enableZoom={false} enablePan={false} />
                    <ambientLight intensity={0.6} />
                    <pointLight position={[5, 5, 5]} intensity={0.8} />

                    <group position={[0, -2.5, 0]}>
                        <GenerativeGrid3D
                            pattern={kick}
                            currentStep={currentStep}
                            color="#ff3b30"
                            position={[0, 0.6, 0]}
                        />
                        <GenerativeGrid3D
                            pattern={snare}
                            currentStep={currentStep}
                            color="#3390ec"
                            position={[0, 0.3, 0]}
                        />
                        <GenerativeGrid3D
                            pattern={hihat}
                            currentStep={currentStep}
                            color="#f7ba2a"
                            position={[0, 0, 0]}
                        />
                    </group>

                    <EffectComposer>
                        <Bloom intensity={0.8} luminanceThreshold={0.3} luminanceSmoothing={0.9} height={300} />
                        <Vignette eskil={false} offset={0.15} darkness={0.8} />
                    </EffectComposer>
                </Canvas>
            </section>

            {/* CONTROLS */}
            <section className="card">
                <h3 style={{ marginBottom: 'var(--space-m)' }}>Kit</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {(['808', '909'] as const).map(k => (
                        <button
                            key={k}
                            onClick={() => setKit(k)}
                            style={{
                                flex: 1,
                                padding: '15px',
                                borderRadius: '10px',
                                border: 'none',
                                background: kit === k ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                                color: kit === k ? 'var(--tg-theme-button-text-color)' : 'var(--tg-theme-text-color)',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {k}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    )
}
