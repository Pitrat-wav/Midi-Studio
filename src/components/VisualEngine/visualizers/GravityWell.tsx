import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function GravityWell() {
    const pointsRef = useRef<THREE.Points>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const COUNT = 10000
    const [positions, velocities, colors] = useMemo(() => {
        const pos = new Float32Array(COUNT * 3)
        const vel = new Float32Array(COUNT * 3)
        const col = new Float32Array(COUNT * 3)
        for (let i = 0; i < COUNT; i++) {
            const r = 5 + Math.random() * 5
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
            pos[i * 3 + 2] = r * Math.cos(phi)

            vel[i * 3] = (Math.random() - 0.5) * 0.02
            vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02

            col[i * 3] = 0.2 + Math.random() * 0.8
            col[i * 3 + 1] = 0.2 + Math.random() * 0.8
            col[i * 3 + 2] = 1.0
        }
        return [pos, vel, col]
    }, [])

    useFrame(() => {
        const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3
            // Vector to center
            const x = posArray[i3]
            const y = posArray[i3 + 1]
            const z = posArray[i3 + 2]

            const dist = Math.sqrt(x * x + y * y + z * z)
            const force = 0.01 / (dist * dist + 0.1)

            // Gravity pull
            posArray[i3] -= x * force
            posArray[i3 + 1] -= y * force
            posArray[i3 + 2] -= z * force

            // Audio push
            if (intensity > 0.5) {
                const push = (intensity - 0.5) * 0.5
                posArray[i3] += x * push * Math.random()
                posArray[i3 + 1] += y * push * Math.random()
                posArray[i3 + 2] += z * push * Math.random()
            }

            // Boundary
            if (dist < 0.2) {
                const r = 5 + Math.random() * 2
                posArray[i3] = (Math.random() - 0.5) * r
                posArray[i3 + 1] = (Math.random() - 0.5) * r
                posArray[i3 + 2] = (Math.random() - 0.5) * r
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true
        pointsRef.current.rotation.y += 0.001
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={COUNT}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={COUNT}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.03} vertexColors transparent opacity={0.8} />
        </points>
    )
}
