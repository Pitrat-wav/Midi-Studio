/**
 * WebGLScene — Main 3D Canvas
 * 
 * Renders all instruments in 3D space with camera management.
 */

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useVisualStore } from '../../store/visualStore'
import { AllInstruments3D } from './instruments/AllInstruments3D'
import { CameraController } from './CameraController'
import { GenerativeBackground } from './GenerativeBackground'
import { AudioReactiveObject } from './AudioReactiveObject'
import { InstrumentSelector3D } from './InstrumentSelector3D'
import { useAudioStore } from '../../store/audioStore'
import * as Tone from 'tone'
import * as THREE from 'three'
import { RadialMenu3D } from './controls/RadialMenu3D'
import { useGestureStore } from '../../logic/GestureManager'
import { useHandTracking } from '../../hooks/useHandTracking'
import { HandVision3D } from './HandVision3D'
import type { InstrumentType } from '../../lib/SpatialLayout'

interface WebGLSceneProps {
    focusInstrument?: InstrumentType | null
    cameraMode?: 'overview' | 'focus'
}

export function WebGLScene({ focusInstrument: externalFocus, cameraMode = 'overview' }: WebGLSceneProps) {
    const webglEnabled = useVisualStore(s => s.webglEnabled)
    const [internalFocus, setInternalFocus] = useState<InstrumentType | null>(null)

    // Use external focus if provided, otherwise use internal
    const focusInstrument = externalFocus ?? internalFocus

    // Don't render if WebGL disabled
    if (!webglEnabled) return null

    const gestures = useGestureStore()
    const radialPos = gestures.targetPosition || new THREE.Vector3(0, 0, 0)
    const audio = useAudioStore()
    const visual = useVisualStore()

    // Initialize Hand Tracking
    useHandTracking()

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 1,
                pointerEvents: 'auto'
            }}
            onPointerDown={(e) => {
                // If radial menu is open, handle selection logic here or via menu component
                gestures.onStart(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => {
                gestures.onMove(e.clientX, e.clientY)

                // Edge gesture effects
                if (gestures.isEdgeSwipe) {
                    if (gestures.edgeSide === 'top') {
                        audio.setMasterVolume(THREE.MathUtils.clamp(1 - (e.clientY / 200), 0, 1))
                    } else if (gestures.edgeSide === 'bottom') {
                        audio.setBpm(THREE.MathUtils.clamp(60 + (window.innerHeight - e.clientY) * 0.5, 60, 240))
                    }
                }
            }}
            onPointerUp={() => gestures.onEnd()}
        >
            {/* Global HUD for Edge Gestures */}
            {gestures.activeGesture === 'swipe' && gestures.isEdgeSwipe && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.8)',
                    color: gestures.edgeSide === 'top' ? '#3390ec' : '#ffcc33',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    zIndex: 10,
                    pointerEvents: 'none',
                    border: '1px solid currentColor'
                }}>
                    {gestures.edgeSide === 'top' ? `MASTER VOLUME: ${Math.round(audio.volumes.harm * 100)}%` : `GLOBAL BPM: ${Math.round(audio.bpm)}`}
                </div>
            )}
            <Canvas camera={{ position: [0, 15, 15], fov: 75 }}>
                <Suspense fallback={null}>
                    {/* Background gradient/noise */}
                    <GenerativeBackground />

                    {/* Audio-reactive ambient object */}
                    <AudioReactiveObject />

                    {/* All instruments in 3D space */}
                    <AllInstruments3D />

                    {/* Radial Context Menu */}
                    <RadialMenu3D
                        visible={gestures.isRadialMenuOpen}
                        position={radialPos}
                        items={[
                            { id: 'focus', label: 'FOCUS', color: '#3390ec' },
                            { id: 'overview', label: 'OVERVIEW', color: '#ffffff' },
                            { id: 'presets', label: 'PRESETS', color: '#ffcc33' },
                            { id: 'panic', label: 'PANIC', color: '#ff3b30' }
                        ]}
                        onSelect={(id) => {
                            if (id === 'focus' && gestures.targetPosition) {
                                // Find nearest instrument to targetPosition
                                // For now, we'll just use a simplified logic or let the user click
                                console.log('Focusing near:', gestures.targetPosition)
                            } else if (id === 'overview') {
                                setInternalFocus(null)
                            } else if (id === 'panic') {
                                audio.panic()
                            }
                            gestures.reset()
                        }}
                    />

                    {/* 3D Instrument Selector */}
                    <InstrumentSelector3D
                        currentInstrument={focusInstrument}
                        onSelect={setInternalFocus}
                    />

                    {/* Camera management */}
                    <CameraController
                        focusInstrument={focusInstrument}
                        mode={focusInstrument ? 'focus' : 'overview'}
                    />

                    {/* Hand Tracking Visualizer */}
                    <HandVision3D />
                </Suspense>
            </Canvas>

            {/* Hand Tracking Toggle */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 10
            }}>
                <button
                    onClick={() => visual.setHandTrackingEnabled(!visual.handTrackingEnabled)}
                    style={{
                        background: visual.handTrackingEnabled ? '#3390ec' : 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: '1px solid white',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                    }}
                >
                    {visual.handTrackingEnabled ? '🙌 VISION: ON' : '🙌 VISION: OFF'}
                </button>
            </div>

            {/* Status HUD */}
            {visual.statusMessage && (
                <div style={{
                    position: 'absolute',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.8)',
                    color: '#3390ec',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid #3390ec',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    pointerEvents: 'none',
                    zIndex: 20
                }}>
                    {visual.statusMessage}
                </div>
            )}
        </div>
    )
}
