/**
 * Slider3D — Interactive 3D Slider Control
 */

import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

export interface Slider3DProps {
    position: [number, number, number]
    value: number // 0-1 normalized
    min: number
    max: number
    step?: number
    label: string
    onChange: (value: number) => void
    orientation?: 'horizontal' | 'vertical'
    length?: number
    color?: string
}

export function Slider3D({
    position,
    value,
    min,
    max,
    step = 0.01,
    label,
    onChange,
    orientation = 'horizontal',
    length = 1.5,
    color = '#3390ec'
}: Slider3DProps) {
    const handleRef = useRef<THREE.Mesh>(null!)
    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [showLabel, setShowLabel] = useState(false)
    const { camera, gl } = useThree()

    const normalizedValue = useMemo(() => {
        return (value - min) / (max - min)
    }, [value, min, max])

    const handlePosition: [number, number, number] = useMemo(() => {
        const pos = normalizedValue * length - length / 2
        return orientation === 'horizontal'
            ? [pos, 0, 0]
            : [0, pos, 0]
    }, [normalizedValue, length, orientation])

    const baseColor = useMemo(() => new THREE.Color(color), [color])

    const displayValue = useMemo(() => {
        if (Number.isInteger(min) && Number.isInteger(max)) {
            return Math.round(value).toString()
        }
        return value.toFixed(2)
    }, [value, min, max])

    useFrame(() => {
        if (handleRef.current) {
            const targetPos = new THREE.Vector3(...handlePosition)
            handleRef.current.position.lerp(targetPos, 0.2)

            const targetScale = (isHovered || isDragging) ? 1.2 : 1.0
            handleRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.15
            )
        }
    })

    const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setIsDragging(true)
        setShowLabel(true)
        gl.domElement.style.cursor = 'grabbing'

        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
        }
    }, [gl])

    const handlePointerMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !handleRef.current) return

        const rect = gl.domElement.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

        const mouse = new THREE.Vector2(x, y)
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mouse, camera)

        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        const intersectPoint = new THREE.Vector3()
        raycaster.ray.intersectPlane(plane, intersectPoint)

        const localPoint = intersectPoint.clone().sub(new THREE.Vector3(...position))
        const pos = orientation === 'horizontal' ? localPoint.x : localPoint.y
        let newNormalizedValue = (pos + length / 2) / length
        newNormalizedValue = Math.max(0, Math.min(1, newNormalizedValue))

        let newValue = min + newNormalizedValue * (max - min)
        if (step > 0) {
            newValue = Math.round(newValue / step) * step
        }

        if (newValue !== value) {
            onChange(newValue)
            if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                (window as any).Telegram.WebApp.HapticFeedback.selectionChanged()
            }
        }
    }, [isDragging, gl, camera, position, orientation, length, min, max, step, value, onChange])

    const handlePointerUp = useCallback(() => {
        setIsDragging(false)
        setShowLabel(false)
        gl.domElement.style.cursor = isHovered ? 'pointer' : 'auto'

        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
        }
    }, [isHovered, gl])

    useMemo(() => {
        if (isDragging) {
            const handleMove = (e: MouseEvent) => {
                e.preventDefault()
                handlePointerMove(e)
            }

            window.addEventListener('mousemove', handleMove)
            window.addEventListener('mouseup', handlePointerUp)

            return () => {
                window.removeEventListener('mousemove', handleMove)
                window.removeEventListener('mouseup', handlePointerUp)
            }
        }
    }, [isDragging, handlePointerMove, handlePointerUp])

    const railRotation: [number, number, number] = orientation === 'horizontal'
        ? [0, 0, Math.PI / 2]
        : [0, 0, 0]

    return (
        <group position={position}>
            <mesh rotation={railRotation}>
                <cylinderGeometry args={[0.02, 0.02, length, 16]} />
                <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
            </mesh>

            <mesh
                position={orientation === 'horizontal' ? [-length / 4 + handlePosition[0] / 2, 0, 0] : [0, -length / 4 + handlePosition[1] / 2, 0]}
                rotation={railRotation}
            >
                <cylinderGeometry args={[0.025, 0.025, normalizedValue * length, 16]} />
                <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
            </mesh>

            <mesh
                ref={handleRef}
                position={handlePosition}
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
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={isHovered || isDragging ? 1.0 : 0.3} metalness={0.9} roughness={0.2} />
            </mesh>

            {showLabel && (
                <group position={orientation === 'horizontal' ? [0, 0.4, 0] : [0.4, 0, 0]}>
                    <Text fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000000">
                        {label}
                    </Text>
                    <Text position={[0, -0.1, 0]} fontSize={0.1} color={color} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000000" fontWeight="bold">
                        {displayValue}
                    </Text>
                </group>
            )}
        </group>
    )
}
