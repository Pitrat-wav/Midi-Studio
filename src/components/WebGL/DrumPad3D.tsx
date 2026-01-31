import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshDistortMaterial } from '@react-three/drei'
import { useVisualStore } from '../../store/visualStore'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'

interface DrumPad3DProps {
    id: 'kick' | 'snare' | 'hihat' | 'clap'
    position: [number, number, number]
    color: string
    label: string
    onClick: () => void
}

export function DrumPad3D({ id, position, color, label, onClick }: DrumPad3DProps) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const materialRef = useRef<any>(null!)
    const bridge = useAudioVisualBridge()

    // Custom shader uniforms for "Energy"
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uTrigger: { value: 0 },
        uColor: { value: new THREE.Color(color) }
    }), [color])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        const trigger = bridge.getPulse(id)

        if (meshRef.current) {
            // Pulse on trigger
            const scale = 1 + trigger * 0.4
            meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2)

            // Floating animation
            meshRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.05
        }

        if (materialRef.current) {
            materialRef.current.distort = 0.2 + trigger * 0.5
            materialRef.current.speed = 1 + trigger * 10
            materialRef.current.emissiveIntensity = trigger * 2
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
            <boxGeometry args={[0.8, 0.8, 0.2]} />
            <MeshDistortMaterial
                ref={materialRef}
                color={color}
                roughness={0.1}
                metalness={0.8}
                distort={0.2}
                speed={2}
                emissive={color}
                emissiveIntensity={0}
            />
        </mesh>
    )
}
