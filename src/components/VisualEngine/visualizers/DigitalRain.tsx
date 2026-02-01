import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function DigitalRain() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const GRID = 20
    const COUNT = GRID * GRID
    const tempMatrix = new THREE.Matrix4()
    const tempColor = new THREE.Color()

    const offsets = useMemo(() => {
        return Array.from({ length: COUNT }).map(() => Math.random() * 100)
    }, [])

    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime()
            let i = 0
            for (let x = 0; x < GRID; x++) {
                for (let z = 0; z < GRID; z++) {
                    const id = i++
                    const offset = offsets[id]
                    const y = ((offset + time * 2) % 20) - 10

                    const scale = 0.1 + intensity * 2.0 * (Math.sin(time + offset) * 0.5 + 0.5)

                    tempMatrix.setPosition(x - GRID / 2, -y, z - GRID / 2)
                    tempMatrix.scale(new THREE.Vector3(scale, scale, scale))
                    meshRef.current.setMatrixAt(id, tempMatrix)

                    const glow = Math.sin(time * 5.0 + offset) * 0.5 + 0.5
                    tempColor.setHSL(0.3, 1.0, glow * intensity)
                    meshRef.current.setColorAt(id, tempColor)
                }
            }
            meshRef.current.instanceMatrix.needsUpdate = true
            if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
        }
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial />
        </instancedMesh>
    )
}
