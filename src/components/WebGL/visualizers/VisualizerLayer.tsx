import React from 'react'
import { useVisualStore } from '../../../store/visualStore'
import { FeedbackNebula } from './FeedbackNebula'
import { GeometricDynamic } from './GeometricDynamic'
import { Stars, Float, Center } from '@react-three/drei'

export function VisualizerLayer() {
    const index = useVisualStore(s => s.visualizerIndex)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    return (
        <group>
            {/* Background elements */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ff00ff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#00ffff" />

            <Float speed={2} rotationIntensity={intensity * 2} floatIntensity={intensity * 2}>
                <Center>
                    {index === 0 && <FeedbackNebula />}
                    {index === 1 && <GeometricDynamic />}
                </Center>
            </Float>

            {/* Fog for depth */}
            <fog attach="fog" args={['#000', 10, 50]} />
        </group>
    )
}
