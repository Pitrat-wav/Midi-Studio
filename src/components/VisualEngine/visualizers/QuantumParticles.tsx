import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function QuantumParticles() {
    const meshRef = useRef<THREE.Points>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const fftData = useVisualStore(s => s.fftData)

    const COUNT = 50000

    const [positions, initialPositions] = useMemo(() => {
        const pos = new Float32Array(COUNT * 3)
        const init = new Float32Array(COUNT * 3)
        for (let i = 0; i < COUNT; i++) {
            const phi = Math.acos(-1 + (2 * i) / COUNT)
            const theta = Math.sqrt(COUNT * Math.PI) * phi
            const x = Math.cos(theta) * Math.sin(phi) * 5
            const y = Math.sin(theta) * Math.sin(phi) * 5
            const z = Math.cos(phi) * 5

            pos[i * 3] = x
            pos[i * 3 + 1] = y
            pos[i * 3 + 2] = z

            init[i * 3] = x
            init[i * 3 + 1] = y
            init[i * 3 + 2] = z
        }
        return [pos, init]
    }, [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        const posArray = meshRef.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3
            const ix = initialPositions[i3]
            const iy = initialPositions[i3 + 1]
            const iz = initialPositions[i3 + 2]

            // Get audio data for this particle
            let s = 0
            if (fftData && fftData.length > 0) {
                const idx = Math.floor((i / COUNT) * (fftData.length / 2))
                s = (fftData[idx] / 255)
            }

            const noise = Math.sin(t + ix * 0.5) * Math.cos(t + iy * 0.5) * intensity * 2
            const freqOffset = s * 5.0 * intensity

            posArray[i3] = ix * (1 + noise + freqOffset)
            posArray[i3 + 1] = iy * (1 + noise + freqOffset)
            posArray[i3 + 2] = iz * (1 + noise + freqOffset)
        }

        meshRef.current.geometry.attributes.position.needsUpdate = true

        // Manual Rotation Control (Left Stick)
        const modifier = useVisualStore.getState().visualModifier

        meshRef.current.rotation.y += 0.002 + (modifier?.x || 0) * 0.05
        meshRef.current.rotation.x += (modifier?.y || 0) * 0.05
    })

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.02}
                color="#3390ec"
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}
