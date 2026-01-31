/**
 * Button3D — Interactive 3D Button
 * 
 * Pressable button с toggle/momentary modes.
 * Supports click, hover states, and haptic feedback.
 */

import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

export interface Button3DProps {
    position: [number, number, number]
    label: string
    onClick: () => void
    active?: boolean // для toggle buttons
    color?: string
    size?: number
    variant?: 'default' | 'danger' | 'success'
}

export function Button3D({
    position,
    label,
    onClick,
    active = false,
    color,
    size = 1,
    variant = 'default'
}: Button3DProps) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const { gl } = useThree()

    // Color based on variant
    const buttonColor = useMemo(() => {
        if (color) return color
        switch (variant) {
            case 'danger': return '#ff3b30'
            case 'success': return '#34c759'
            default: return '#3390ec'
        }
    }, [color, variant])

    const baseColor = useMemo(() => new THREE.Color(buttonColor), [buttonColor])
    const activeColor = useMemo(() => new THREE.Color(buttonColor).multiplyScalar(1.5), [buttonColor])

    // Animate press state
    useFrame(() => {
        if (meshRef.current) {
            const targetY = isPressed ? -0.05 * size : 0
            meshRef.current.position.y = THREE.MathUtils.lerp(
                meshRef.current.position.y,
                targetY,
                0.3
            )

            const targetScale = isHovered ? 1.05 : 1.0
            meshRef.current.scale.lerp(
                new THREE.Vector3(targetScale, 1, targetScale),
                0.15
            )
        }
    })

    const handleClick = () => {
        setIsPressed(true)
        onClick()

        // Haptic feedback
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
        }

        // Reset press state
        setTimeout(() => setIsPressed(false), 100)
    }

    return (
        <group position={position}>
            {/* Button Body */}
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
                    handleClick()
                }}
                userData={{ type: 'control', controlType: 'button', label }}
            >
                <boxGeometry args={[0.5 * size, 0.15 * size, 0.5 * size]} />
                <meshStandardMaterial
                    color={active ? activeColor : baseColor}
                    metalness={0.8}
                    roughness={0.3}
                    emissive={active ? activeColor : baseColor}
                    emissiveIntensity={active ? 0.8 : (isHovered ? 0.3 : 0.1)}
                />
            </mesh>

            {/* Label Text */}
            <Text
                position={[0, 0.1 * size, 0]}
                fontSize={0.1 * size}
                color={active ? '#ffffff' : '#e0e0e0'}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.005}
                outlineColor="#000000"
                fontWeight="bold"
            >
                {label}
            </Text>

            {/* Base Platform */}
            <mesh position={[0, -0.1 * size, 0]}>
                <boxGeometry args={[0.55 * size, 0.05 * size, 0.55 * size]} />
                <meshStandardMaterial
                    color="#222222"
                    metalness={0.5}
                    roughness={0.5}
                />
            </mesh>

            {/* Glow Ring (when active or hovered) */}
            {(active || isHovered) && (
                <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.3 * size, 0.35 * size, 32]} />
                    <meshBasicMaterial
                        color={buttonColor}
                        transparent
                        opacity={0.5}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
        </group>
    )
}
