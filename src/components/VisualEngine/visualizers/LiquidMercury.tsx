import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'
import { MeshDistortMaterial } from '@react-three/drei'

export function LiquidMercury() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005
            meshRef.current.rotation.z += 0.002
            const material = meshRef.current.material as any
            material.distort = THREE.MathUtils.lerp(material.distort, 0.4 + intensity * 2.0, 0.1)
            material.speed = 1 + intensity * 5
        }
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[2, 128, 128]} />
            <MeshDistortMaterial
                color="#888"
                roughness={0.1}
                metalness={1}
                distort={0.4}
                speed={2}
            />
        </mesh>
    )
}
