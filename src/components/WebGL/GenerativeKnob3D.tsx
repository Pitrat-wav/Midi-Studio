import { useRef } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../store/visualStore'

interface GenerativeKnob3DProps {
    value: number
    min: number
    max: number
    label: string
    position: [number, number, number]
    color: string
    onChange?: (value: number) => void
}

export function GenerativeKnob3D({ value, min, max, label, position, color, onChange }: GenerativeKnob3DProps) {
    const meshRef = useRef<THREE.Group>(null!)
    const setInteraction = useVisualStore(s => s.setInteraction)
    const activeParam = useVisualStore(s => s.activeParam)
    const interactionEnergy = useVisualStore(s => s.interactionEnergy)

    const isEditing = activeParam === label
    const normalizedValue = (value - min) / (max - min)
    const targetRotation = normalizedValue * Math.PI * 1.5 - Math.PI * 0.75

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation, 0.1)
            const scale = 1 + (isEditing ? interactionEnergy * 0.2 : 0)
            meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
        }
    })

    return (
        <group
            position={position}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                // In R3F e.target is Object3D, but for pointer capture we need the canvas element from nativeEvent
                if (e.nativeEvent && e.nativeEvent.target) {
                    (e.nativeEvent.target as HTMLElement).setPointerCapture(e.pointerId)
                }
                setInteraction(label, 1.0)
            }}
            onPointerUp={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                if (e.nativeEvent && e.nativeEvent.target) {
                    (e.nativeEvent.target as HTMLElement).releasePointerCapture(e.pointerId)
                }
                setInteraction(null, 0)
            }}
            onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                if (isEditing && e.buttons > 0) {
                    // Use movementY from nativeEvent
                    const delta = e.nativeEvent.movementY * -0.01
                    const newValue = Math.min(max, Math.max(min, value + delta * (max - min)))
                    onChange?.(newValue)
                    setInteraction(label, 1.0)
                }
            }}
        >
            <group ref={meshRef}>
                {/* Knob Body */}
                <mesh>
                    <cylinderGeometry args={[0.3, 0.35, 0.2, 32]} />
                    <meshStandardMaterial
                        color="#111"
                        metalness={0.9}
                        roughness={0.1}
                        emissive={color}
                        emissiveIntensity={isEditing ? 1 : 0.1}
                    />
                </mesh>
                {/* Indicator */}
                <mesh position={[0, 0.12, -0.2]}>
                    <boxGeometry args={[0.05, 0.05, 0.1]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            </group>

            {/* Halo Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <ringGeometry args={[0.4, 0.45, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={isEditing ? 0.8 : 0.2}
                />
            </mesh>
        </group>
    )
}
