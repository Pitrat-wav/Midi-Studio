import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function CyberTunnel() {
    const groupRef = useRef<THREE.Group>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const COUNT = 20
    const rings = useMemo(() => {
        return Array.from({ length: COUNT }).map((_, i) => ({
            z: -i * 5,
            rotation: Math.random() * Math.PI
        }))
    }, [])

    useFrame((state) => {
        if (groupRef.current) {
            const time = state.clock.getElapsedTime()
            groupRef.current.children.forEach((child, i) => {
                // Move rings towards camera
                child.position.z += 0.1 + intensity * 0.5
                if (child.position.z > 5) {
                    child.position.z = -((COUNT - 1) * 5)
                }

                // Pulsate scale and rotation
                const s = 1 + Math.sin(time + i) * 0.2 + intensity * 2
                child.scale.set(s, s, 1)
                child.rotation.z += 0.01 + intensity * 0.1
            })
        }
    })

    return (
        <group ref={groupRef}>
            {rings.map((ring, i) => (
                <mesh key={i} position={[0, 0, ring.z]} rotation={[0, 0, ring.rotation]}>
                    <ringGeometry args={[3, 3.2, 6]} />
                    <meshBasicMaterial
                        color={new THREE.Color().setHSL((i / COUNT) % 1, 0.8, 0.5)}
                        transparent
                        opacity={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    )
}

