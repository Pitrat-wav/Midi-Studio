/**
 * Sampler3D — Holographic Waveform Slicer
 * 
 * Interactivity:
 * - Click slices to trigger
 * - Drag "Slices" knob to change resolution
 * 
 * Visuals:
 * - Warped Cylinder reflecting 'Time'
 * - Active slice glows
 */

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { useSamplerStore } from '../../../store/instrumentStore'
import { useAudioStore } from '../../../store/audioStore'

function Slice({ index, total, isActive, color, onClick }: { index: number, total: number, isActive: boolean, color: string, onClick: () => void }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [hovered, setHover] = useState(false)

    // Cylinder Sector Logic
    const anglePerSlice = (Math.PI * 2) / (total || 1)
    const startAngle = index * anglePerSlice
    const midAngle = startAngle + anglePerSlice / 2

    // Position instances in a circle
    const radius = 2
    const x = Math.cos(midAngle) * radius
    const z = Math.sin(midAngle) * radius

    useFrame((state) => {
        if (!meshRef.current) return
        const pulse = isActive ? 0.2 : 0
        meshRef.current.scale.setScalar(1 + pulse)

        if (meshRef.current.material && (meshRef.current.material as any).emissiveIntensity !== undefined) {
            (meshRef.current.material as any).emissiveIntensity = isActive ? 2 : (hovered ? 0.5 : 0.1)
        }
    })

    return (
        <group position={[x, 0, z]} rotation={[0, -midAngle, 0]}>
            <mesh
                ref={meshRef}
                onClick={(e) => { e.stopPropagation(); onClick() }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[0.5, 3, 0.1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.1}
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </group>
    )
}

export function Sampler3D({ position }: { position: [number, number, number] }) {
    const { slices, activeSlice, currentSampleIndex, availableSamples } = useSamplerStore()
    const { triggerSampler } = useAudioStore()
    const timeoutRef = useRef<any>(null)
    const [, setActiveSlice] = useState(-1) // Local visual feedback

    const handleTrigger = (index: number) => {
        triggerSampler(index)
        setActiveSlice(index)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setActiveSlice(-1), 200)
    }

    const currentSampleName = (availableSamples && availableSamples[currentSampleIndex]) ? availableSamples[currentSampleIndex].name : "No Sample"

    return (
        <group position={position}>
            {/* Main Hologram */}
            <group rotation={[Math.PI / 4, 0, 0]}>
                {Array.from({ length: Math.max(0, slices || 0) }).map((_, i) => (
                    <Slice
                        key={i}
                        index={i}
                        total={slices || 8}
                        isActive={i === activeSlice}
                        color="#00ffcc"
                        onClick={() => handleTrigger(i)}
                    />
                ))}

                {/* Center Core */}
                <mesh>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshBasicMaterial color="#000000" wireframe />
                </mesh>
            </group>

            <Text position={[0, 3, 0]} fontSize={0.5} color="#00ffcc">
                CHRONO SPLITTER
            </Text>
            <Text position={[0, -3, 0]} fontSize={0.2} color="#ffffff">
                {currentSampleName}
            </Text>
        </group>
    )
}
