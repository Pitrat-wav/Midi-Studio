/**
 * PlanetField — Decorative floating planets for 3D backgrounds
 * 
 * Renders multiple spheres with different sizes and orbits.
 * Supports "Real" (Shiny/PBR) and "Cartoon" (Flat) modes.
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MeshDistortMaterial, Float, useTexture } from '@react-three/drei'
import { useAIStore } from '../../store/aiStore'

interface PlanetProps {
    mode?: 'cosmic' | 'cartoon'
}

export function PlanetField({ mode = 'cosmic' }: PlanetProps) {
    // Generate 5-7 random planets
    const planets = useMemo(() => {
        const p = []
        const colors = mode === 'cartoon'
            ? ['#ff6666', '#ffff66', '#66ff66', '#6666ff', '#ff66ff']
            : ['#3390ec', '#ff00ff', '#00ff88', '#ffcc33', '#ffffff']

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2
            const distance = 30 + Math.random() * 40
            p.push({
                position: new THREE.Vector3(
                    Math.cos(angle) * distance,
                    (Math.random() - 0.5) * 40,
                    -30 - Math.random() * 30
                ),
                scale: 1 + Math.random() * 3,
                color: colors[i % colors.length],
                speed: 0.1 + Math.random() * 0.2,
                orbit: Math.random() * Math.PI * 2,
                distort: Math.random() * 0.4
            })
        }
        return p
    }, [mode])

    return (
        <group>
            {planets.map((p, i) => (
                <Planet key={i} data={p} mode={mode} />
            ))}
        </group>
    )
}

function Planet({ data, mode }: { data: any, mode: 'cosmic' | 'cartoon' }) {
    const currentTextureUrl = useAIStore(s => s.currentTextureUrl)

    if (currentTextureUrl) {
        return <PlanetWithTexture data={data} mode={mode} url={currentTextureUrl} />
    }

    return <PlanetContent data={data} mode={mode} texture={null} />
}

function PlanetWithTexture({ data, mode, url }: { data: any, mode: 'cosmic' | 'cartoon', url: string }) {
    const texture = useTexture(url)
    return <PlanetContent data={data} mode={mode} texture={texture} />
}

function PlanetContent({ data, mode, texture }: { data: any, mode: 'cosmic' | 'cartoon', texture: THREE.Texture | null }) {
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const t = clock.getElapsedTime()

        // Orbit animation
        const x = data.position.x + Math.sin(t * data.speed + data.orbit) * 2
        const y = data.position.y + Math.cos(t * data.speed + data.orbit) * 2

        // Quantization for South Park (Stop-motion effect)
        if (mode === 'cartoon') {
            meshRef.current.position.x = Math.floor(x * 12) / 12
            meshRef.current.position.y = Math.floor(y * 12) / 12
        } else {
            meshRef.current.position.set(x, y, data.position.z)
        }

        meshRef.current.rotation.y += 0.01
    })

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={meshRef} position={data.position.toArray()}>
                <sphereGeometry args={[1, 32, 32]} />
                {mode === 'cartoon' ? (
                    <meshStandardMaterial
                        color={data.color}
                        map={texture}
                        flatShading
                        toneMapped={false}
                    />
                ) : (
                    <MeshDistortMaterial
                        color={texture ? "#ffffff" : data.color}
                        map={texture}
                        metalness={texture ? 0.2 : 0.9}
                        roughness={texture ? 0.8 : 0.1}
                        distort={data.distort}
                        speed={data.speed * 5}
                    />
                )}
            </mesh>
        </Float>
    )
}
