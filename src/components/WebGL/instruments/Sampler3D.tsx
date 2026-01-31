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

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Instances, Instance, Cylinder } from '@react-three/drei'
import { useSamplerStore } from '../../../store/instrumentStore'
import { useAudioStore } from '../../../store/audioStore'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'

function Slice({ index, total, isActive, color, onClick }: { index: number, total: number, isActive: boolean, color: string, onClick: () => void }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [hovered, setHover] = useState(false)

    // Cylinder Sector Logic
    const anglePerSlice = (Math.PI * 2) / total
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
        if (isActive) {
            meshRef.current.material.emissiveIntensity = 2
        } else {
            meshRef.current.material.emissiveIntensity = hovered ? 0.5 : 0.1
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
                {/* Slice Geometry */}
                <cylinderGeometry args={[0.5, 0.5, 3, 16, 1, false, 0, anglePerSlice * 0.9]} />
                <meshStandardMaterial
                    color={isActive ? "#ffffff" : color}
                    emissive={color}
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    )
}

export function Sampler3D() {
    const { slices, playbackRate, volume, setParam, url, availableSamples, currentSampleIndex, nextSample, prevSample } = useSamplerStore()
    const audioStore = useAudioStore()
    const { position } = SPATIAL_LAYOUT.sampler

    const [activeSlice, setActiveSlice] = useState(-1)
    const timeoutRef = useRef<any>(null)

    // Reload Audio when URL changes
    useEffect(() => {
        if (!audioStore.samplerInstrument || !url) return
        audioStore.samplerInstrument.load(url).then(() => {
            console.log(`[Sampler3D] Loaded ${url}`)
        }).catch(err => {
            console.warn(`[Sampler3D] Failed to load ${url}`, err)
        })
    }, [url, audioStore.samplerInstrument])

    const handleTrigger = (index: number) => {
        // Audio Trigger
        audioStore.samplerInstrument?.triggerSlice(index, slices)

        // Visual Trigger
        setActiveSlice(index)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => setActiveSlice(-1), 200)
    }

    const currentSampleName = availableSamples[currentSampleIndex]?.name || "No Sample"

    return (
        <group position={position}>
            {/* Main Hologram */}
            <group rotation={[Math.PI / 4, 0, 0]}>
                {Array.from({ length: slices }).map((_, i) => (
                    <Slice
                        key={i}
                        index={i}
                        total={slices}
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
        </group>
    )
}
