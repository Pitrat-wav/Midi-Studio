/**
 * Knob3D — Interactive 3D Knob Control
 */

import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

export interface Knob3DProps {
    position: [number, number, number]
    value: number // 0-1 normalized
    min: number
    max: number
    step?: number
    label: string
    onChange: (value: number) => void
    color?: string
    size?: number // radius multiplier
}

export function Knob3D({
    position,
    value,
    min,
    max,
    step = 0.01,
    label,
    onChange,
    color = '#3390ec',
    size = 1
}: Knob3DProps) {
    const groupRef = useRef<THREE.Group>(null!)
    const meshRef = useRef<THREE.Mesh>(null!)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [showLabel, setShowLabel] = useState(false)

    const { gl } = useThree()
    const dragStartRef = useRef<{ x: number; y: number; initialValue: number } | null>(null)

    const normalizedValue = useMemo(() => {
        return (value - min) / (max - min)
    }, [value, min, max])

    const targetRotation = useMemo(() => {
        return (normalizedValue - 0.5) * Math.PI * 1.5
    }, [normalizedValue])

    const displayValue = useMemo(() => {
        if (Number.isInteger(min) && Number.isInteger(max)) {
            return Math.round(value).toString()
        }
        return value.toFixed(2)
    }, [value, min, max])

    const baseColor = useMemo(() => new THREE.Color(color), [color])
    const emissiveColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.5), [color])

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y = THREE.MathUtils.lerp(
                meshRef.current.rotation.y,
                targetRotation,
                0.15
            )

            const targetScale = (isHovered || isDragging) ? 1.1 : 1.0
            meshRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.1
            )
        }
    })

    const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setIsDragging(true)
        setShowLabel(true)

        const native = e.nativeEvent as any
        dragStartRef.current = {
            x: native.clientX ?? 0,
            y: native.clientY ?? 0,
            initialValue: value
        }

        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
        }

        gl.domElement.style.cursor = 'grabbing'
    }, [value, gl])

    const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !dragStartRef.current) return

        const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY

        const deltaY = dragStartRef.current.y - clientY
        const sensitivity = 0.005
        const deltaValue = deltaY * sensitivity * (max - min)

        let newValue = dragStartRef.current.initialValue + deltaValue
        if (step > 0) {
            newValue = Math.round(newValue / step) * step
        }
        newValue = Math.max(min, Math.min(max, newValue))

        if (newValue !== value) {
            onChange(newValue)
            if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                (window as any).Telegram.WebApp.HapticFeedback.selectionChanged()
            }
        }
    }, [isDragging, value, min, max, step, onChange])

    const handlePointerUp = useCallback(() => {
        setIsDragging(false)
        setShowLabel(false)
        dragStartRef.current = null
        gl.domElement.style.cursor = isHovered ? 'pointer' : 'auto'

        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
        }
    }, [isHovered, gl])

    useMemo(() => {
        if (isDragging) {
            const handleMove = (e: MouseEvent | TouchEvent) => {
                if ('preventDefault' in e) e.preventDefault()
                handlePointerMove(e)
            }

            window.addEventListener('mousemove', handleMove)
            window.addEventListener('touchmove', handleMove, { passive: false })
            window.addEventListener('mouseup', handlePointerUp)
            window.addEventListener('touchend', handlePointerUp)

            return () => {
                window.removeEventListener('mousemove', handleMove)
                window.removeEventListener('touchmove', handleMove)
                window.removeEventListener('mouseup', handlePointerUp)
                window.removeEventListener('touchend', handlePointerUp)
            }
        }
    }, [isDragging, handlePointerMove, handlePointerUp])

    return (
        <group ref={groupRef} position={position}>
            <mesh
                ref={meshRef}
                onPointerEnter={(e) => {
                    e.stopPropagation()
                    setIsHovered(true)
                    setShowLabel(true)
                    gl.domElement.style.cursor = 'pointer'
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation()
                    if (!isDragging) {
                        setIsHovered(false)
                        setShowLabel(false)
                        gl.domElement.style.cursor = 'auto'
                    }
                }}
                onPointerDown={handlePointerDown}
            >
                <cylinderGeometry args={[0.3 * size, 0.3 * size, 0.15 * size, 32]} />
                <meshStandardMaterial
                    color={baseColor}
                    metalness={0.9}
                    roughness={0.2}
                    emissive={emissiveColor}
                    emissiveIntensity={isHovered || isDragging ? 1.5 : 0.5}
                />
            </mesh>

            <mesh position={[0, 0.08 * size, 0.25 * size]} rotation={[0, targetRotation, 0]}>
                <boxGeometry args={[0.05 * size, 0.02 * size, 0.15 * size]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            <mesh position={[0, -0.1 * size, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.32 * size, 0.4 * size, 32]} />
                <meshStandardMaterial
                    color={baseColor}
                    metalness={0.7}
                    roughness={0.3}
                    opacity={0.5}
                    transparent
                />
            </mesh>

            {showLabel && (
                <group position={[0, 0.6 * size, 0]}>
                    <Text
                        fontSize={0.12 * size}
                        color="#ffffff"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.01}
                        outlineColor="#000000"
                    >
                        {label}
                    </Text>
                    <Text
                        position={[0, -0.15 * size, 0]}
                        fontSize={0.15 * size}
                        color={color}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.01}
                        outlineColor="#000000"
                        fontWeight="bold"
                    >
                        {displayValue}
                    </Text>
                </group>
            )}

            {(isHovered || isDragging) && (
                <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.45 * size, 0.5 * size, 32]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
        </group>
    )
}
