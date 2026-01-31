/**
 * SouthParkWorld.tsx  
 * Complete 2.5D parallax environment for South Park theme
 * Features layered depth with mountains, buildings, road, and crowd
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../store/visualStore'
import { CharacterSprite } from './CharacterSprite'

// Parallax depth constants
const DEPTH = {
    MOUNTAINS: -60,
    BUILDINGS: -30,
    ROAD: -10,
    CHARACTERS: -5,
    FOREGROUND: 5
}

// Parallax layer component
function ParallaxLayer({
    texturePath,
    position,
    size,
    parallaxFactor = 0.1,
    opacity = 1
}: {
    texturePath: string
    position: [number, number, number]
    size: [number, number]
    parallaxFactor?: number
    opacity?: number
}) {
    const meshRef = useRef<THREE.Mesh>(null!)

    const texture = useMemo(() => {
        const tex = new THREE.TextureLoader().load(texturePath)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        return tex
    }, [texturePath])

    useFrame(({ camera }) => {
        if (!meshRef.current) return
        // Parallax effect based on camera position
        meshRef.current.position.x = position[0] + camera.position.x * parallaxFactor
    })

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={size} />
            <meshBasicMaterial
                map={texture}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                toneMapped={false}
            />
        </mesh>
    )
}

// Crowd sprite component
function CrowdSprite({ position, index }: { position: [number, number, number]; index: number }) {
    return (
        <CharacterSprite
            texturePath="/assets/visuals/sp_crowd.png"
            position={position}
            scale={2}
            audioChannel="hihat"
            reactivity={0.3}
            enableSquash={false}
        />
    )
}

export function SouthParkWorld() {
    const theme = useVisualStore((s) => s.aestheticTheme)

    if (theme !== 'southpark') return null

    // Generate random crowd positions
    const crowdPositions = useMemo(() => {
        const positions: [number, number, number][] = []
        for (let i = 0; i < 30; i++) {
            positions.push([
                (Math.random() - 0.5) * 40, // X: -20 to 20
                -8 + Math.random() * 2, // Y: -8 to -6 (ground level)
                -8 + Math.random() * 4 // Z: -10 to -6 (behind main chars)
            ])
        }
        return positions
    }, [])

    return (
        <group>
            {/* Sky - Solid South Park Blue */}
            <color attach="background" args={['#42B4E6']} />

            {/* Ambient light only (no PBR) */}
            <ambientLight intensity={1.5} />

            {/* Layer 4: Mountains (Furthest, slowest parallax) */}
            <ParallaxLayer
                texturePath="/assets/visuals/sp_mountains.png"
                position={[0, 0, DEPTH.MOUNTAINS]}
                size={[300, 100]}
                parallaxFactor={0.05}
            />

            {/* Layer 3: Town Buildings */}
            <ParallaxLayer
                texturePath="/assets/visuals/sp_town.png"
                position={[0, -5, DEPTH.BUILDINGS]}
                size={[200, 60]}
                parallaxFactor={0.15}
            />

            {/* Layer 2: Road/Ground */}
            <mesh position={[0, -10, DEPTH.ROAD]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 100]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>

            {/* Road stripe */}
            <mesh position={[0, -9.9, DEPTH.ROAD]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 20]} />
                <meshBasicMaterial color="#444444" toneMapped={false} />
            </mesh>

            <mesh position={[0, -9.85, DEPTH.ROAD]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 0.5]} />
                <meshBasicMaterial color="#FFD700" toneMapped={false} />
            </mesh>

            {/* Layer 1.5: Crowd (Background characters) */}
            {crowdPositions.map((pos, i) => (
                <CrowdSprite key={`crowd-${i}`} position={pos} index={i} />
            ))}

            {/* Layer 1: Main Character Stage (handled by SouthParkStage component) */}
            {/* This will be integrated in the next phase */}

            {/* Foreground snow particles */}
            <group position={[0, 0, DEPTH.FOREGROUND]}>
                {Array.from({ length: 10 }).map((_, i) => (
                    <mesh
                        key={`snow-${i}`}
                        position={[
                            (Math.random() - 0.5) * 50,
                            Math.random() * 20 - 5,
                            Math.random() * 10
                        ]}
                    >
                        <sphereGeometry args={[0.2, 8, 8]} />
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </mesh>
                ))}
            </group>
        </group>
    )
}
