import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useVisualStore } from '../../store/visualStore'
import { FeedbackVortex } from './visualizers/FeedbackVortex'
import { QuantumParticles } from './visualizers/QuantumParticles'
import { FractalVision } from './visualizers/FractalVision'
import { SkeletonFlow } from './visualizers/SkeletonFlow'
import { Stars, OrbitControls } from '@react-three/drei'
import { usePoseTracking } from '../../hooks/usePoseTracking'

export function VisualEngine() {
    const index = useVisualStore(s => s.visualizerIndex)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    usePoseTracking()

    const getEngineName = () => {
        if (index === 0) return 'Feedback Vortex'
        if (index === 1) return 'Quantum Particles'
        if (index === 2) return 'Fractal Mirror'
        if (index === 3) return 'SKELETON FLOW'
        return 'Unknown'
    }

    return (
        <div className="visual-engine-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#000',
            zIndex: 5 // Higher than WebGLScene but lower than HUD
        }}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                gl={{
                    antialias: false,
                    powerPreference: 'high-performance',
                    alpha: false
                }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={['#000']} />

                    {index === 0 && <FeedbackVortex />}
                    {index === 1 && <QuantumParticles />}
                    {index === 2 && <FractalVision />}
                    {index === 3 && <SkeletonFlow />}

                    {/* Abstract lighting for the engine */}
                    <ambientLight intensity={0.1} />
                    <pointLight position={[10, 10, 10]} intensity={intensity * 5} color="#3390ec" />
                    <pointLight position={[-10, -10, -10]} intensity={intensity * 2} color="#ff3b30" />

                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    <OrbitControls enableZoom={false} enablePan={false} />
                </Suspense>
            </Canvas>

        </div>
    )
}
