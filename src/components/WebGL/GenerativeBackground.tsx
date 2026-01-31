/**
 * GenerativeBackground — Animated 3D background
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioStore } from '../../store/audioStore'
import { useVisualStore } from '../../store/visualStore'

export function GenerativeBackground() {
    const isPlaying = useAudioStore(s => s.isPlaying)
    const triggers = useVisualStore(s => s.triggers)
    const decay = useVisualStore(s => s.decay)
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame((state) => {
        decay() // Global frame-rate based decay
        const t = state.clock.getElapsedTime()

        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1
            meshRef.current.rotation.y = Math.cos(t * 0.3) * 0.1

            // Pulse on kick/snare
            const pulse = triggers.kick * 0.2 + triggers.snare * 0.1
            meshRef.current.scale.set(1 + pulse, 1 + pulse, 1 + pulse)
        }
    })

    return (
        <group>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={isPlaying ? 2 : 0.5} />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#3390ec" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff3b30" />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef} position={[0, 0, -12]}>
                    <icosahedronGeometry args={[4, 15]} />
                    <MeshDistortMaterial
                        color="#111"
                        envMapIntensity={2}
                        clearcoat={1}
                        clearcoatRoughness={0}
                        metalness={0.9}
                        roughness={0.1}
                        distort={isPlaying ? 0.4 : 0.2}
                        speed={isPlaying ? 4 : 1}
                    />
                </mesh>
            </Float>
        </group>
    )
}
