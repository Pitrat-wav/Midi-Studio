import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'
import { Stars } from '@react-three/drei'

// 29: Vector Field
export function VectorField() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 125 // 5x5x5
    const tempMatrix = new THREE.Matrix4()
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        let i = 0
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                for (let z = 0; z < 5; z++) {
                    const id = i++
                    const posX = x - 2, posY = y - 2, posZ = z - 2
                    // Rotate based on audio/time
                    const rot = t + (posX + posY + posZ) * intensity
                    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot, rot, 0))
                    tempMatrix.makeRotationFromQuaternion(quat)
                    tempMatrix.setPosition(posX * 2, posY * 2, posZ * 2)
                    meshRef.current.setMatrixAt(id, tempMatrix)
                }
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <coneGeometry args={[0.1, 0.5, 4]} />
            <meshNormalMaterial />
        </instancedMesh>
    )
}

// 30: Electric Storm
export function ElectricStorm() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {intensity > 0.7 && Array.from({ length: 5 }).map((_, i) => (
                <mesh key={i} position={[(Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10]}>
                    <cylinderGeometry args={[0.02, 0.02, 20]} />
                    <meshBasicMaterial color="#fff" transparent opacity={0.8} />
                </mesh>
            ))}
            <ambientLight intensity={intensity * 5} color="#8888ff" />
        </group>
    )
}

// 31: Fluid Glass
export function FluidGlass() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <mesh>
            <sphereGeometry args={[2, 64, 64]} />
            <meshPhysicalMaterial
                color="#fff"
                transmission={1}
                thickness={2}
                roughness={0.1}
                clearcoat={1}
                emissive="#3390ec"
                emissiveIntensity={intensity * 2}
            />
        </mesh>
    )
}

// 32: Speed Warp
export function SpeedWarp() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <Stars radius={10} depth={50} count={2000} factor={10 + intensity * 50} saturation={0} fade speed={5 + intensity * 20} />
        </group>
    )
}

// 33: Abstract Solid
export function AbstractSolid() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <mesh>
            <icosahedronGeometry args={[2, 4]} />
            <meshStandardMaterial flatShading color="#444" emissive="#00ffcc" emissiveIntensity={intensity * 3} />
        </mesh>
    )
}

// 34: Laser Grid
export function LaserGrid() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <gridHelper args={[20, 20, '#ff00ff', '#333']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]} />
            <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[20, 20]} />
                <meshBasicMaterial color="#111" />
            </mesh>
        </group>
    )
}

// 35: Double Helix
export function DoubleHelix() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const groupRef = useRef<THREE.Group>(null!)
    useFrame((state) => {
        groupRef.current.rotation.y += 0.01 + intensity * 0.05
    })
    return (
        <group ref={groupRef}>
            {Array.from({ length: 40 }).map((_, i) => (
                <group key={i} position={[0, (i - 20) * 0.25, 0]} rotation={[0, i * 0.4, 0]}>
                    <mesh position={[1, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshBasicMaterial color="#ff00cc" />
                    </mesh>
                    <mesh position={[-1, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshBasicMaterial color="#00ffff" />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// 36: Pulsar Star
export function PulsarStar() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <mesh>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            {Array.from({ length: 5 }).map((_, i) => (
                <mesh key={i} scale={1 + (intensity * 10 * ((i + 1) / 5)) % 10}>
                    <ringGeometry args={[1, 1.05, 64]} />
                    <meshBasicMaterial color="#fff" transparent opacity={0.2} />
                </mesh>
            ))}
        </group>
    )
}

// 37: Fractal Forest
export function FractalForest() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group position={[0, -3, 0]}>
            <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.1, 0.2, 4]} />
                <meshStandardMaterial color="#332211" />
            </mesh>
            <mesh position={[0, 4, 0]} scale={1 + intensity}>
                <sphereGeometry args={[1.5, 16, 16]} />
                <meshStandardMaterial color="#225522" wireframe />
            </mesh>
        </group>
    )
}

// 38: Glass Shards
export function GlassShards() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 40
    const tempMatrix = new THREE.Matrix4()
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const rot = t * 0.2 + i
            tempMatrix.makeRotationY(rot)
            tempMatrix.setPosition(Math.sin(rot) * 3, Math.cos(rot) * 3, Math.sin(t + i) * 2)
            meshRef.current.setMatrixAt(i, tempMatrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <tetrahedronGeometry args={[0.5]} />
            <meshPhysicalMaterial color="#fff" transmission={1} thickness={1} />
        </instancedMesh>
    )
}
