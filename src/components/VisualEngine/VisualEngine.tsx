import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useVisualStore } from '../../store/visualStore'
import { FeedbackVortex } from './visualizers/FeedbackVortex'
import { QuantumParticles } from './visualizers/QuantumParticles'
import { Stars, OrbitControls } from '@react-three/drei'

export function VisualEngine() {
    const index = useVisualStore(s => s.visualizerIndex)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

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

                    {/* Abstract lighting for the engine */}
                    <ambientLight intensity={0.1} />
                    <pointLight position={[10, 10, 10]} intensity={intensity * 5} color="#3390ec" />
                    <pointLight position={[-10, -10, -10]} intensity={intensity * 2} color="#ff3b30" />

                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    <OrbitControls enableZoom={false} enablePan={false} />
                </Suspense>
            </Canvas>

            {/* Internal HUD for the engine */}
            <div className="engine-hud" style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(51, 144, 236, 0.8)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                pointerEvents: 'none'
            }}>
                Visual Engine v1.0 — {index === 0 ? 'Feedback Vortex' : 'Quantum Particles'} — Intensity: {Math.round(intensity * 100)}%
            </div>
        </div>
    )
}
