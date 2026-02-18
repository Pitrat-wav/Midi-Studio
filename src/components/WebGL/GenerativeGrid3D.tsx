import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Float } from '@react-three/drei'
import { useVisualStore } from '../../store/visualStore'

interface GenerativeGrid3DProps {
    pattern: boolean[]
    currentStep: number
    color: string
    position: [number, number, number]
    onToggleStep?: (index: number) => void
}

export function GenerativeGrid3D({ pattern, currentStep, color, position, onToggleStep }: GenerativeGrid3DProps) {
    const groupRef = useRef<THREE.Group>(null!)

    // CRITICAL: Freeze pattern in useMemo to prevent race conditions
    const safePattern = useMemo(() => {
        if (!pattern || !Array.isArray(pattern) || pattern.length === 0) {
            return null
        }
        // Create a COPY to freeze the data
        const copy = [...pattern]
        return copy
    }, [pattern])

    // If pattern is not valid, don't render anything
    if (!safePattern) {
        return null
    }

    return (
        <group ref={groupRef} position={position}>
            {safePattern.map((active, i) => (
                <StepCube
                    key={i}
                    index={i}
                    active={active}
                    isCurrent={currentStep === i}
                    color={color}
                    position={[i * 0.25 - 2, 0, 0]}
                    onClick={() => onToggleStep?.(i)}
                />
            ))}
        </group>
    )
}

function StepCube({ active, isCurrent, color, position, onClick }: any) {
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        if (meshRef.current) {
            // Pulse animation for current step
            if (isCurrent) {
                meshRef.current.scale.setScalar(1 + Math.sin(t * 10) * 0.1)
            } else {
                meshRef.current.scale.setScalar(1)
            }
        }
    })

    return (
        <mesh
            ref={meshRef}
            position={position}
            onClick={onClick}
            scale={active ? 1.1 : 0.8}
        >
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial
                color={active ? color : '#333333'}
                emissive={active ? color : '#000000'}
                emissiveIntensity={active ? 0.5 : 0}
            />
        </mesh>
    )
}
