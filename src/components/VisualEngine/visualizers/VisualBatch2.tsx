import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

// 19: Hypercube
export function Hypercube() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.Group>(null!)
    useFrame((state) => {
        meshRef.current.rotation.x += 0.01 + intensity * 0.1
        meshRef.current.rotation.y += 0.01
    })
    return (
        <group ref={meshRef}>
            <mesh>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial wireframe color="#fff" />
            </mesh>
            <mesh scale={0.5}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial wireframe color="#3390ec" />
            </mesh>
        </group>
    )
}

// 20: Glitch World
export function GlitchWorld() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.Mesh>(null!)
    useFrame((state) => {
        if (intensity > 0.6) {
            meshRef.current.position.x = (Math.random() - 0.5) * 0.5
            meshRef.current.scale.y = 1 + Math.random()
        } else {
            meshRef.current.position.x = 0
            meshRef.current.scale.y = 1
        }
    })
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[2, 8, 8]} />
            <meshBasicMaterial wireframe color="#00ff00" />
        </mesh>
    )
}

// 21: Spiral Galaxy
export function SpiralGalaxy() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const pointsRef = useRef<THREE.Points>(null!)
    const COUNT = 5000
    const [pos] = useMemo(() => {
        const p = new Float32Array(COUNT * 3)
        for (let i = 0; i < COUNT; i++) {
            const angle = i * 0.1
            const dist = i * 0.002
            p[i * 3] = Math.cos(angle) * dist
            p[i * 3 + 1] = (Math.random() - 0.5) * 0.1
            p[i * 3 + 2] = Math.sin(angle) * dist
        }
        return [p]
    }, [])
    useFrame(() => {
        pointsRef.current.rotation.y += 0.002 + intensity * 0.02
    })
    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={COUNT} array={pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#8888ff" transparent opacity={0.6} />
        </points>
    )
}

// 22: Crystal Cave
export function CrystalCave() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 12 }).map((_, i) => (
                <mesh key={i} position={[Math.sin(i) * 4, Math.cos(i) * 4, -5]} rotation={[0, 0, i]}>
                    <coneGeometry args={[1, 5, 4]} />
                    <meshStandardMaterial color="#00ffff" metalness={1} roughness={0} emissive="#00ffff" emissiveIntensity={intensity * 2} />
                </mesh>
            ))}
        </group>
    )
}

// 23: Growth Tendrils
export function GrowthTendrils() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
                    <torusGeometry args={[2, 0.05, 16, 100, Math.PI * (0.5 + intensity)]} />
                    <meshBasicMaterial color="#44ff44" />
                </mesh>
            ))}
        </group>
    )
}

// 24: Geometric Chaos
export function GeometricChaos() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 50
    const tempMatrix = new THREE.Matrix4()
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const scale = 0.2 + intensity * Math.sin(t + i)
            tempMatrix.makeScale(scale, scale, scale)
            tempMatrix.setPosition(Math.sin(t + i) * 3, Math.cos(t * 0.5 + i) * 3, Math.sin(t * 0.2 + i) * 3)
            meshRef.current.setMatrixAt(i, tempMatrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshNormalMaterial />
        </instancedMesh>
    )
}

// 25: Solar Flare
export function SolarFlare() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <mesh>
                <sphereGeometry args={[2, 32, 32]} />
                <meshBasicMaterial color="#ffaa00" />
            </mesh>
            <mesh scale={1 + intensity * 2}>
                <sphereGeometry args={[2.1, 32, 32]} />
                <meshBasicMaterial color="#ff4400" transparent opacity={0.3} wireframe />
            </mesh>
            <pointLight intensity={20 * intensity} color="#ffaa00" />
        </group>
    )
}

// 26: Depth Rings
export function DepthRings() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 10 }).map((_, i) => (
                <mesh key={i} position={[0, 0, -i * 2]}>
                    <ringGeometry args={[2, 2.1, 64]} />
                    <meshBasicMaterial color="#3390ec" transparent opacity={1 - i / 10 + intensity * 0.5} />
                </mesh>
            ))}
        </group>
    )
}

// 27: Frequency 360
export function Frequency360() {
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const groupRef = useRef<THREE.Group>(null!)
    const COUNT = 32
    useFrame(() => {
        if (!fftData) return
        groupRef.current.children.forEach((child, i) => {
            const val = fftData[i * 4] / 255
            child.scale.y = 0.1 + val * 10 * intensity
        })
    })
    return (
        <group ref={groupRef}>
            {Array.from({ length: COUNT }).map((_, i) => (
                <mesh key={i} rotation={[0, (i / COUNT) * Math.PI * 2, 0]} position={[Math.sin((i / COUNT) * Math.PI * 2) * 5, 0, Math.cos((i / COUNT) * Math.PI * 2) * 5]}>
                    <boxGeometry args={[0.2, 1, 0.2]} />
                    <meshBasicMaterial color={new THREE.Color().setHSL(i / COUNT, 0.8, 0.5)} />
                </mesh>
            ))}
        </group>
    )
}

// 28: Triangle Rain
export function TriangleRain() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 100
    const tempMatrix = new THREE.Matrix4()
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const h = (10 - (t * (1 + intensity * 5) + i * 2) % 20) - 10
            tempMatrix.setPosition((i % 10) - 5, h, Math.floor(i / 10) - 5)
            tempMatrix.makeRotationZ(t + i)
            meshRef.current.setMatrixAt(i, tempMatrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <circleGeometry args={[0.2, 3]} />
            <meshBasicMaterial color="#ff3b30" side={THREE.DoubleSide} />
        </instancedMesh>
    )
}
