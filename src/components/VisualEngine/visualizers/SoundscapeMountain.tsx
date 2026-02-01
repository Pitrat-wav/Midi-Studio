import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function SoundscapeMountain() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const SIZE = 40
    const SEGMENTS = 60

    useFrame((state) => {
        if (meshRef.current && fftData) {
            const pos = meshRef.current.geometry.attributes.position
            const time = state.clock.getElapsedTime()

            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i)
                const y = pos.getY(i)

                // Use FFT for height based on distance from center
                const dist = Math.sqrt(x * x + y * y)
                const fftIdx = Math.floor((dist / SIZE) * (fftData.length / 2))
                const audioHeight = (fftData[fftIdx] || 0) / 255 * 5.0 * intensity

                const wave = Math.sin(dist * 0.5 - time * 2.0) * intensity * 2.0
                pos.setZ(i, audioHeight + wave)
            }
            pos.needsUpdate = true
        }
    })

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[SIZE, SIZE, SEGMENTS, SEGMENTS]} />
            <meshStandardMaterial
                color="#3390ec"
                wireframe
                emissive="#001133"
                emissiveIntensity={2}
            />
        </mesh>
    )
}
