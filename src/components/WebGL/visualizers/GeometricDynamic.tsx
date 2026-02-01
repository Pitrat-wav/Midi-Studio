import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

const COUNT = 1024

export function GeometricDynamic() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const dummy = useMemo(() => new THREE.Object3D(), [])

    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < COUNT; i++) {
            const phi = Math.acos(-1 + (2 * i) / COUNT)
            const theta = Math.sqrt(COUNT * Math.PI) * phi
            temp.push({
                pos: new THREE.Vector3(
                    Math.cos(theta) * Math.sin(phi),
                    Math.sin(theta) * Math.sin(phi),
                    Math.cos(phi)
                ),
                scale: 1,
                speed: 0.1 + Math.random() * 0.5
            })
        }
        return temp
    }, [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()

        particles.forEach((p, i) => {
            // Audio reactivity from FFT if available
            let s = 1.0
            if (fftData && fftData.length > 0) {
                const idx = Math.floor((i / COUNT) * (fftData.length / 2))
                s = 1.0 + (fftData[idx] / 255) * 5.0
            } else {
                s = 1.0 + Math.sin(t * p.speed + i) * 0.5 * intensity
            }

            const radius = 5 + Math.sin(t * 0.5 + i * 0.01) * 2 * intensity

            dummy.position.copy(p.pos).multiplyScalar(radius)
            dummy.scale.setScalar(s * 0.2)
            dummy.lookAt(0, 0, 0)

            // Rotation
            dummy.rotation.x += t * 0.1
            dummy.rotation.y += t * 0.2

            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true

        // Rotate the whole group
        meshRef.current.rotation.y += 0.005
        meshRef.current.rotation.z += 0.002
    })

    return (
        <instancedMesh ref={meshRef} args={[null!, null!, COUNT]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color="#00ffcc"
                emissive="#004433"
                emissiveIntensity={2}
                roughness={0}
                metalness={1}
            />
            <pointLight position={[0, 0, 0]} intensity={2 + intensity * 5} color="#00ffff" />
        </instancedMesh>
    )
}
