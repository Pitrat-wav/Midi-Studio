import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'

/**
 * ReactiveFloor
 * A grid that ripples based on the Kick drum / Low frequencies.
 */
export function ReactiveFloor() {
    const meshRef = useRef<THREE.Mesh>(null)
    const bridge = useAudioVisualBridge()

    const geometry = new THREE.PlaneGeometry(100, 100, 50, 50)

    useFrame((state) => {
        if (!meshRef.current) return

        const { uLowFreq, uTime } = bridge.getUniforms()
        const kickPulse = bridge.getPulse('kick')

        // Retrieve position attribute
        const pos = meshRef.current.geometry.attributes.position
        const count = pos.count

        for (let i = 0; i < count; i++) {
            const x = pos.getX(i)
            const y = pos.getY(i) // Actually Z since we rotate it
            // Dist from center
            const dist = Math.sqrt(x * x + y * y)

            // Ripple calc
            // Base ripple from time
            let z = Math.sin(dist * 0.5 - uTime * 2) * 0.5

            // Kick impact
            // If kick pulse is high, create a shockwave at a specific radius expanding outward
            // Simplified: modulate height by kick
            z += Math.sin(dist * 1.5 - uTime * 10) * kickPulse * 2

            // General low freq rumble
            z += (Math.random() - 0.5) * uLowFreq

            // Update Z (which is Y in world space after rotation)
            pos.setZ(i, z)
        }

        pos.needsUpdate = true

        // Pulse color
        const mat = meshRef.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.2 + kickPulse * 2
    })

    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -5, 0]}
            geometry={geometry}
        >
            <meshStandardMaterial
                color="#000000"
                wireframe
                emissive="#3390ec"
                emissiveIntensity={0.2}
                transparent
                opacity={0.3}
            />
        </mesh>
    )
}
