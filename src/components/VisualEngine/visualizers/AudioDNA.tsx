import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function AudioDNA() {
    const groupRef = useRef<THREE.Group>(null!)
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const COUNT = 64
    const bars = useMemo(() => {
        return Array.from({ length: COUNT }).map((_, i) => ({
            id: i,
            angle: (i / COUNT) * Math.PI * 8, // Multiple spirals
            y: (i / COUNT - 0.5) * 10
        }))
    }, [])

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.01 + intensity * 0.05

            groupRef.current.children.forEach((child, i) => {
                if (fftData && fftData[i]) {
                    const val = fftData[i] / 255
                    const targetScale = 0.1 + val * 4
                    child.scale.x = THREE.MathUtils.lerp(child.scale.x, targetScale, 0.2)
                }
            })
        }
    })

    return (
        <group ref={groupRef}>
            {bars.map((bar, i) => (
                <group key={i} position={[0, bar.y, 0]} rotation={[0, bar.angle, 0]}>
                    <mesh position={[2, 0, 0]}>
                        <boxGeometry args={[1, 0.05, 0.05]} />
                        <meshBasicMaterial color={new THREE.Color().setHSL(i / COUNT, 0.8, 0.5)} />
                    </mesh>
                    <mesh position={[-2, 0, 0]}>
                        <boxGeometry args={[1, 0.05, 0.05]} />
                        <meshBasicMaterial color={new THREE.Color().setHSL((i + 32) / COUNT, 0.8, 0.5)} />
                    </mesh>
                    {/* Connector */}
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.01, 0.01, 4]} />
                        <meshBasicMaterial color="#444" transparent opacity={0.3} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}
