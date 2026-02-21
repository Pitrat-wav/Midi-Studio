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
import { PlanetField } from './PlanetField'

// Parallax depth constants
const DEPTH = {
    MOUNTAINS: -60,
    BUILDINGS: -30,
    ROAD: -10,
    CHARACTERS: -5,
    FOREGROUND: 5
}

// Parallax layer component with optional paper grain
function ParallaxLayer({
    texturePath,
    position,
    size,
    parallaxFactor = 0.1,
    opacity = 1,
    useGrain = true
}: {
    texturePath: string
    position: [number, number, number]
    size: [number, number]
    parallaxFactor?: number
    opacity?: number
    useGrain?: boolean
}) {
    const meshRef = useRef<THREE.Mesh>(null!)

    const texture = useMemo(() => {
        const tex = new THREE.TextureLoader().load(texturePath)
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        return tex
    }, [texturePath])

    const grainTexture = useMemo(() => {
        const tex = new THREE.TextureLoader().load('/assets/visuals/sp_paper_grain.png')
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(size[0] / 10, size[1] / 10)
        return tex
    }, [size])

    useFrame(({ camera, clock }) => {
        if (!meshRef.current) return
        // Parallax effect with slight stop-motion quantization
        const t = Math.floor(clock.getElapsedTime() * 12) / 12
        meshRef.current.position.x = position[0] + (camera.position.x * parallaxFactor) + Math.sin(t * 2) * 0.01
    })

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <planeGeometry args={size} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    opacity={opacity}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
                {useGrain && (
                    <mesh position={[0, 0, 0.01]}>
                        <planeGeometry args={size} />
                        <meshBasicMaterial
                            map={grainTexture}
                            transparent
                            opacity={0.1}
                            blending={THREE.MultiplyBlending}
                            toneMapped={false}
                        />
                    </mesh>
                )}
            </mesh>
        </group>
    )
}

// Moving Cloud component
function MovingCloud({ index }: { index: number }) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const seed = useMemo(() => Math.random(), [])
    const speed = 0.5 + seed * 1
    const xOffset = (seed - 0.5) * 100

    const texture = useMemo(() => {
        const tex = new THREE.TextureLoader().load('/assets/visuals/sp_clouds.png')
        // Assume 2x2 grid for 4 clouds
        tex.repeat.set(0.5, 0.5)
        tex.offset.x = (index % 2) * 0.5
        tex.offset.y = Math.floor(index / 2) * 0.5
        return tex
    }, [index])

    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const t = clock.getElapsedTime()
        const x = ((t * speed + xOffset) % 120) - 60
        // Stop-motion quantization
        meshRef.current.position.x = Math.floor(x * 12) / 12
        meshRef.current.position.y = 15 + Math.sin(Math.floor(t * 8) / 8 + seed * 10) * 0.5
    })

    return (
        <mesh ref={meshRef} position={[0, 15, DEPTH.MOUNTAINS + 5]}>
            <planeGeometry args={[12, 6]} />
            <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
    )
}

// ... CrowdSprite remains same ...
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
    const crowdPositions = useMemo(() => {
        const positions: [number, number, number][] = []
        for (let i = 0; i < 30; i++) {
            positions.push([
                (Math.random() - 0.5) * 60,
                -8 + Math.random() * 2,
                -8 + Math.random() * 4
            ])
        }
        return positions
    }, [])

    return (
        <group>
            <color attach="background" args={['#42B4E6']} />
            <ambientLight intensity={1.5} />

            {/* Cartoon Planets in the Sky */}
            <PlanetField mode="cartoon" />

            {/* Clouds */}
            {Array.from({ length: 6 }).map((_, i) => (
                <MovingCloud key={`cloud-${i}`} index={i % 4} />
            ))}

            <ParallaxLayer
                texturePath="/assets/visuals/sp_mountains.png"
                position={[0, 0, DEPTH.MOUNTAINS]}
                size={[300, 100]}
                parallaxFactor={0.05}
            />

            <ParallaxLayer
                texturePath="/assets/visuals/sp_town.png"
                position={[0, -5, DEPTH.BUILDINGS]}
                size={[200, 60]}
                parallaxFactor={0.15}
            />

            {/* Ground with grain */}
            <group position={[0, -10, DEPTH.ROAD]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh>
                    <planeGeometry args={[300, 100]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[300, 100]} />
                    <meshBasicMaterial color="#444444" transparent opacity={0.3} toneMapped={false} />
                </mesh>
            </group>

            {/* Crowd */}
            {crowdPositions.map((pos, i) => (
                <CrowdSprite key={`crowd-${i}`} position={pos} index={i} />
            ))}

            {/* Snow particles with quantization */}
            <SnowField />
        </group>
    )
}

function SnowField() {
    const snowRef = useRef<THREE.Group>(null!)
    useFrame(({ clock }) => {
        if (!snowRef.current) return
        const t = Math.floor(clock.getElapsedTime() * 12) / 12
        snowRef.current.children.forEach((child, i) => {
            child.position.y -= 0.05
            if (child.position.y < -10) child.position.y = 20
            child.position.x += Math.sin(t + i) * 0.02
        })
    })

    return (
        <group ref={snowRef} position={[0, 0, DEPTH.FOREGROUND]}>
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh
                    key={`snow-${i}`}
                    position={[
                        (Math.random() - 0.5) * 50,
                        Math.random() * 30 - 5,
                        Math.random() * 10
                    ]}
                >
                    <sphereGeometry args={[0.15, 6, 6]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </mesh>
            ))}
        </group>
    )
}
