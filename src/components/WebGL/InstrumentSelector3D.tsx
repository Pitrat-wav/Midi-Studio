/**
 * InstrumentSelector3D — 3D UI for selecting instruments
 * 
 * Floating radial menu в нижней части экрана
 */

import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { InstrumentType } from '../../lib/SpatialLayout'

interface InstrumentSelector3DProps {
    currentInstrument: InstrumentType | null
    onSelect: (instrument: InstrumentType) => void
}

const INSTRUMENTS: { id: InstrumentType; label: string; color: string }[] = [
    { id: 'drums', label: 'Drums', color: '#ff4444' },
    { id: 'bass', label: 'Bass', color: '#3390ec' },
    { id: 'harmony', label: 'Harmony', color: '#44ff44' },
    { id: 'pads', label: 'Pads', color: '#ff9944' },
    { id: 'sequencer', label: 'Sequencer', color: '#aa44ff' },
]

function InstrumentButton({
    instrument,
    position,
    isActive,
    onClick
}: {
    instrument: typeof INSTRUMENTS[0]
    position: [number, number, number]
    isActive: boolean
    onClick: () => void
}) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const { gl } = useThree()
    const [isHovered, setIsHovered] = React.useState(false)

    useFrame(() => {
        if (!meshRef.current) return

        const targetScale = isActive ? 1.3 : (isHovered ? 1.1 : 1.0)
        meshRef.current.scale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale),
            0.15
        )

        // Gentle rotation when active
        if (isActive) {
            meshRef.current.rotation.z += 0.02
        }
    })

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerEnter={(e) => {
                    e.stopPropagation()
                    setIsHovered(true)
                    gl.domElement.style.cursor = 'pointer'
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation()
                    setIsHovered(false)
                    gl.domElement.style.cursor = 'auto'
                }}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onClick()
                }}
            >
                <circleGeometry args={[0.4, 32]} />
                <meshBasicMaterial
                    color={instrument.color}
                    transparent
                    opacity={isActive ? 1.0 : (isHovered ? 0.8 : 0.6)}
                />
            </mesh>

            {/* Label */}
            <Text
                position={[0, -0.6, 0]}
                fontSize={0.15}
                color={isActive ? instrument.color : '#ffffff'}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#000000"
            >
                {instrument.label}
            </Text>

            {/* Active ring */}
            {isActive && (
                <mesh>
                    <ringGeometry args={[0.45, 0.5, 32]} />
                    <meshBasicMaterial
                        color={instrument.color}
                        transparent
                        opacity={0.5}
                    />
                </mesh>
            )}
        </group>
    )
}

export function InstrumentSelector3D({ currentInstrument, onSelect }: InstrumentSelector3DProps) {
    const { camera } = useThree()
    const groupRef = useRef<THREE.Group>(null!)

    // Position selector in screen space (bottom of view)
    useFrame(() => {
        if (!groupRef.current) return

        // Position relative to camera
        const distance = 5
        const offset = new THREE.Vector3(0, -2, -distance)
        offset.applyQuaternion(camera.quaternion)
        groupRef.current.position.copy(camera.position).add(offset)

        // Face camera
        groupRef.current.lookAt(camera.position)
    })

    // Arrange buttons in arc
    const radius = 2.5
    const angleStep = Math.PI / (INSTRUMENTS.length + 1)
    const startAngle = -Math.PI / 2 - angleStep * (INSTRUMENTS.length / 2)

    return (
        <group ref={groupRef}>
            {INSTRUMENTS.map((instrument, i) => {
                const angle = startAngle + angleStep * (i + 1)
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                return (
                    <InstrumentButton
                        key={instrument.id}
                        instrument={instrument}
                        position={[x, y, 0]}
                        isActive={currentInstrument === instrument.id}
                        onClick={() => onSelect(instrument.id)}
                    />
                )
            })}

            {/* Center "Overview" button */}
            <InstrumentButton
                instrument={{ id: 'drums' as InstrumentType, label: 'Overview', color: '#888888' }}
                position={[0, 0, 0]}
                isActive={currentInstrument === null}
                onClick={() => onSelect(null as any)}
            />
        </group>
    )
}
