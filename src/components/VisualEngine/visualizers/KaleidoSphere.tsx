import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function KaleidoSphere() {
    const groupRef = useRef<THREE.Group>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const COUNT = 12
    const shapes = useMemo(() => {
        return Array.from({ length: COUNT }).map((_, i) => ({
            rotation: [
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ],
            scale: 0.5 + Math.random() * 2
        }))
    }, [])

    useFrame((state) => {
        if (groupRef.current) {
            const t = state.clock.getElapsedTime()
            groupRef.current.rotation.y = t * 0.2
            groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.5

            groupRef.current.children.forEach((child, i) => {
                child.rotation.x += 0.01 + intensity * 0.2
                child.rotation.z += 0.01
                const s = shapes[i].scale * (1 + intensity * 1.5)
                child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, s, 0.1))
            })
        }
    })

    return (
        <group ref={groupRef}>
            {shapes.map((shape, i) => (
                <mesh key={i} rotation={shape.rotation as any}>
                    <icosahedronGeometry args={[2, 0]} />
                    <meshStandardMaterial
                        color={new THREE.Color().setHSL(i / COUNT, 0.7, 0.5)}
                        wireframe
                        emissive={new THREE.Color().setHSL(i / COUNT, 0.7, 0.5)}
                        emissiveIntensity={intensity * 10}
                    />
                </mesh>
            ))}
        </group>
    )
}
