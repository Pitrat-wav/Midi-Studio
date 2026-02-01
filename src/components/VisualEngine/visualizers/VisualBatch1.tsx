import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'
import { Stars } from '@react-three/drei'

// 9: Aura Field
export function AuraField() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <fog attach="fog" args={['#000', 1, 10]} />
            <mesh>
                <sphereGeometry args={[10, 32, 32]} />
                <meshBasicMaterial color="#3390ec" side={THREE.BackSide} transparent opacity={0.1 + intensity * 0.2} />
            </mesh>
            <ambientLight intensity={intensity * 2} color="#ff00cc" />
        </group>
    )
}

// 10: Circuit City
export function CircuitCity() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const COUNT = 100
    const tempMatrix = new THREE.Matrix4()

    useFrame((state) => {
        const time = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const x = (i % 10) * 2 - 10
            const z = Math.floor(i / 10) * 2 - 10
            const h = 0.5 + Math.sin(time + i * 0.5) * intensity * 5
            tempMatrix.makeScale(0.8, h, 0.8)
            tempMatrix.setPosition(x, h / 2, z)
            meshRef.current.setMatrixAt(i, tempMatrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#00ffaa" emissive="#00ffaa" emissiveIntensity={0.5} />
        </instancedMesh>
    )
}

// 11: Voxel Waves
export function VoxelWaves() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const GRID = 15
    const COUNT = GRID * GRID
    const tempMatrix = new THREE.Matrix4()

    useFrame((state) => {
        const time = state.clock.getElapsedTime()
        let i = 0
        for (let x = 0; x < GRID; x++) {
            for (let z = 0; z < GRID; z++) {
                const id = i++
                const dist = Math.sqrt((x - GRID / 2) ** 2 + (z - GRID / 2) ** 2)
                const y = Math.sin(dist * 0.5 - time * 2) * intensity * 3
                tempMatrix.setPosition(x - GRID / 2, y, z - GRID / 2)
                meshRef.current.setMatrixAt(id, tempMatrix)
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#ffcc00" />
        </instancedMesh>
    )
}

// 12: String Theory
export function StringTheory() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const groupRef = useRef<THREE.Group>(null!)

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        groupRef.current.children.forEach((child, i) => {
            child.rotation.y = t * 0.5 + i
            child.scale.x = 1 + intensity * 5
        })
    })

    return (
        <group ref={groupRef}>
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh key={i} position={[0, (i - 10) * 0.5, 0]}>
                    <boxGeometry args={[10, 0.02, 0.02]} />
                    <meshBasicMaterial color="#fff" transparent opacity={0.5} />
                </mesh>
            ))}
        </group>
    )
}

// 13: Metablob
export function Metablob() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        meshRef.current.scale.setScalar(1 + intensity * 0.5)
        meshRef.current.rotation.x = t * 0.2
    })

    return (
        <mesh ref={meshRef}>
            <torusKnotGeometry args={[1.5, 0.5, 128, 32]} />
            <meshPhysicalMaterial color="#ff00ff" transmission={0.9} thickness={2} roughness={0} />
        </mesh>
    )
}

// 14: Prism Portal
export function PrismPortal() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <mesh rotation={[0, 0, Math.PI / 4]}>
                <octahedronGeometry args={[3, 0]} />
                <meshPhysicalMaterial color="#fff" transmission={1} thickness={5} roughness={0} />
            </mesh>
            <pointLight position={[0, 0, 0]} intensity={intensity * 20} color="#ff0000" />
        </group>
    )
}

// 15: Data Rain (Matrix)
export function DataRain() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 200
    const tempMatrix = new THREE.Matrix4()

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const x = (Math.sin(i) * 10)
            const z = (Math.cos(i) * 10)
            const y = (10 - (t * (2 + intensity * 10) + i) % 20)
            tempMatrix.setPosition(x, y, z)
            meshRef.current.setMatrixAt(i, tempMatrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshBasicMaterial color="#00ff41" />
        </instancedMesh>
    )
}

// 16: Nebula Cloud
export function NebulaCloud() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <Stars radius={50} depth={50} count={5000} factor={4} saturation={1} fade speed={2} />
            <mesh>
                <sphereGeometry args={[5, 32, 32]} />
                <meshBasicMaterial color="#4400ff" transparent opacity={intensity * 0.3} side={THREE.BackSide} />
            </mesh>
        </group>
    )
}

// 17: Hexagon Grid
export function HexagonGrid() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[5, 6]} />
            <meshStandardMaterial color="#3390ec" wireframe emissive="#3390ec" emissiveIntensity={intensity * 5} />
        </mesh>
    )
}

// 18: Lidar Scan
export function LidarScan() {
    const pointsRef = useRef<THREE.Points>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const COUNT = 10000
    const pos = useMemo(() => new Float32Array(COUNT * 3).map(() => (Math.random() - 0.5) * 10), [])

    useFrame(() => {
        pointsRef.current.rotation.y += 0.01 + intensity * 0.05
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={COUNT} array={pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.02} color="#ff3b30" />
        </points>
    )
}
