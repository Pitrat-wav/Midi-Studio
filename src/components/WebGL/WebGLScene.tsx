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

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1,
            pointerEvents: 'auto'
        }}>
            <Canvas camera={{ position: [0, 15, 15], fov: 75 }}>
                <Suspense fallback={null}>
                    {/* Background gradient/noise */}
                    <GenerativeBackground />

                    {/* Audio-reactive ambient object */}
                    <AudioReactiveObject />

                    {/* All instruments in 3D space */}
                    <AllInstruments3D />

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
                </Suspense>
            </Canvas>
        </div>
    )
}
