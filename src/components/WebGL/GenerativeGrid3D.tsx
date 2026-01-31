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
    console.log('🎨 GenerativeGrid3D render - pattern:', pattern, 'isArray:', Array.isArray(pattern), 'length:', pattern?.length)
    const groupRef = useRef<THREE.Group>(null!)

    // CRITICAL: Freeze pattern in useMemo to prevent race conditions
    const safePattern = useMemo(() => {
        console.log('🔒 useMemo check - pattern:', pattern)
        if (!pattern || !Array.isArray(pattern) || pattern.length === 0) {
            console.warn('⚠️ Invalid pattern, returning null')
            return null
        }
        // Create a COPY to freeze the data
        const copy = [...pattern]
        console.log('✅ Pattern frozen, length:', copy.length)
        return copy
    }, [pattern])

    console.log('🎯 safePattern:', safePattern)

    // If pattern is not valid, don't render anything
    if (!safePattern) {
        console.log('❌ safePattern is null, not rendering')
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

            {/* Scanning Beam */}
            <mesh position={[currentStep * 0.25 - 2, 0, 0.1]}>
                <planeGeometry args={[0.05, 0.4]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} />
            </mesh>
        </group>
    )
}

function StepCube({ index, active, isCurrent, color, position, onClick }: any) {
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame((state) => {
        if (meshRef.current) {
            const targetScale = isCurrent ? 1.5 : (active ? 1.1 : 0.8)
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2)
        }
    })

    return (
        <mesh
            ref={meshRef}
            position={position}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
        >
            <boxGeometry args={[0.2, 0.2, 0.1]} />
            <meshStandardMaterial
                color={active ? color : "#222"}
                emissive={active ? color : "#000"}
                emissiveIntensity={isCurrent ? 2 : (active ? 0.5 : 0)}
                metalness={0.9}
                roughness={0.1}
            />
        </mesh>
    )
}
