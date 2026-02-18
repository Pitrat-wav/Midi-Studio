/**
 * WebGLScene — Main 3D Canvas
 *
 * Renders all instruments in 3D space with camera management.
 * Includes resize handler for proper canvas sizing.
 */

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
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
import { GlobalHUD } from './GlobalHUD'
import { SpectrumAnalyzer3D } from './visualizers/SpectrumAnalyzer3D'
import { WaveformScope3D } from './visualizers/WaveformScope3D'
// Postprocessing library removed due to crashes - using custom shaders instead
import type { InstrumentType } from '../../lib/SpatialLayout'

// ============================================================================
// RESIZE HANDLER COMPONENT
// ============================================================================

function ResizeHandler() {
    const { size, camera, gl } = useThree()

    useEffect(() => {
        // Update camera aspect ratio on resize (works for PerspectiveCamera)
        if ('aspect' in camera) {
            camera.aspect = size.width / size.height
            camera.updateProjectionMatrix()
        }

        // Update renderer size
        gl.setSize(size.width, size.height, false)

        // Set pixel ratio for sharp rendering
        const pixelRatio = Math.min(window.devicePixelRatio, 2)
        gl.setPixelRatio(pixelRatio)
    }, [size.width, size.height, camera, gl])

    return null
}

interface WebGLSceneProps {
    focusInstrument?: InstrumentType | null
    cameraMode?: 'overview' | 'focus'
}

export function WebGLScene({ focusInstrument: externalFocus, cameraMode = 'overview' }: WebGLSceneProps) {
    const webglEnabled = useVisualStore(s => s.webglEnabled)
    const internalFocus = useVisualStore(s => s.focusInstrument)
    const setInternalFocus = useVisualStore(s => s.setFocusInstrument)
    const aestheticTheme = useVisualStore(s => s.aestheticTheme)
    const appView = useVisualStore(s => s.appView)

    // Use external focus if provided, otherwise use internal (Store)
    const focusInstrument = externalFocus ?? internalFocus

    // Don't render if WebGL disabled
    if (!webglEnabled) return null

    const gestures = useGestureStore()
    const cycleFocusInstrument = useVisualStore(s => s.cycleFocusInstrument)
    const lastGesture = useRef(gestures.activeGesture)

    const radialPos = gestures.targetPosition || new THREE.Vector3(0, 0, 0)

    // Handle Two-Swipe Navigation
    useEffect(() => {
        if (gestures.activeGesture === 'two-swipe' && lastGesture.current !== 'two-swipe') {
            const pts = Object.values(gestures.pointers)
            if (pts.length >= 2) {
                const dx = (pts[0].currentX - pts[0].startX + pts[1].currentX - pts[1].startX) / 2
                // GestureManager uses 50px dist, so dx will likely be significant.
                // We use a safe threshold here to trigger navigation.
                cycleFocusInstrument(dx > 0 ? 1 : -1)
                if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                    (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
                }
            }
        }
        lastGesture.current = gestures.activeGesture
    }, [gestures.activeGesture, gestures.pointers, cycleFocusInstrument])

    // Actions needed for interaction (stable references)
    const setMasterVolume = useAudioStore(s => s.setMasterVolume)
    const setBpm = useAudioStore(s => s.setBpm)
    const panic = useAudioStore(s => s.panic)

    // Hand tracking initialization (effect only)
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
                gestures.onStart(e.clientX, e.clientY, undefined, e.pointerId)
            }}
            onPointerMove={(e) => {
                gestures.onMove(e.clientX, e.clientY, e.pointerId)

                // Edge gesture effects
                if (gestures.isEdgeSwipe && gestures.pointerCount === 1) {
                    if (gestures.edgeSide === 'top') {
                        setMasterVolume(THREE.MathUtils.clamp(1 - (e.clientY / 200), 0, 1))
                    } else if (gestures.edgeSide === 'bottom') {
                        setBpm(THREE.MathUtils.clamp(60 + (window.innerHeight - e.clientY) * 0.5, 60, 240))
                    }
                }
            }}
            onPointerUp={(e) => gestures.onEnd(e.pointerId)}
        >
            <GlobalHUD />

            <Canvas
                camera={{ position: [0, 15, 15], fov: 75 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: false,
                    powerPreference: 'high-performance'
                }}
                dpr={[1, 2]}
                resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
            >
                <Suspense fallback={null}>
                    {/* Resize handler for proper canvas sizing */}
                    <ResizeHandler />

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
                                console.log('Focusing near:', gestures.targetPosition)
                            } else if (id === 'overview') {
                                setInternalFocus(null)
                            } else if (id === 'panic') {
                                panic()
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

                    {/* Hand Tracking Visualizer (Enabled in both modes if user wants) */}
                    <HandVision3D />

                </Suspense>

                {/* Post-Processing disabled due to @react-three/postprocessing library crash */}
                {/* Pixel effect will be implemented via custom shaders in materials instead */}
            </Canvas>
        </div>
    )
}
