/**
 * AudioReactiveObject — Torus that reacts to audio triggers
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshWobbleMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useVisualStore } from '../../store/visualStore'

export function AudioReactiveObject() {
    const interactionEnergy = useVisualStore(s => s.interactionEnergy)
    const triggers = useVisualStore(s => s.triggers)
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame((state) => {
        if (!meshRef.current) return

        const t = state.clock.getElapsedTime()
        // Combine audio pulse with interaction energy
        const scale = 1 + triggers.kick * 0.3 + interactionEnergy * 0.5
        meshRef.current.scale.set(scale, scale, scale)

        if (interactionEnergy > 0.1) {
            meshRef.current.rotation.z += 0.05
        }
    })

    return (
        <mesh ref={meshRef} position={[0, 0, -8]}>
            <torusGeometry args={[10, 0.05 + interactionEnergy * 0.1, 16, 128]} />
            <MeshWobbleMaterial
                color={interactionEnergy > 0.1 ? "#ff3b30" : "#3390ec"}
                speed={1 + interactionEnergy * 4}
                factor={0.4 + interactionEnergy}
            />
        </mesh>
    )
}
