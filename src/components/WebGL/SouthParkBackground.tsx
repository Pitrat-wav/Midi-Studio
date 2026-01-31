/**
 * SouthParkBackground — Special background for South Park theme
 * Renders a flat cartoon landscape with Road, Mountains, Clouds, Particles
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { Sparkles } from '@react-three/drei'
import { useVisualStore } from '../../store/visualStore'
import { SouthParkStage } from './SouthParkStage'

// --- SCENE ELEMENTS ---

function PineTree({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
                <meshStandardMaterial color="#8B4513" flatShading toneMapped={false} />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
                <coneGeometry args={[1.5, 2, 8]} />
                <meshStandardMaterial color="#228B22" flatShading toneMapped={false} />
            </mesh>
            <mesh position={[0, 3.5, 0]}>
                <coneGeometry args={[1.2, 1.5, 8]} />
                <meshStandardMaterial color="#2d7a3e" flatShading toneMapped={false} />
            </mesh>
            <mesh position={[0, 4.3, 0]}>
                <coneGeometry args={[0.8, 1, 8]} />
                <meshStandardMaterial color="#32CD32" flatShading toneMapped={false} />
            </mesh>
            <mesh position={[0, 4.8, 0]}>
                <sphereGeometry args={[0.3, 8, 6]} />
                <meshStandardMaterial color="#FFFFFF" flatShading toneMapped={false} />
            </mesh>
        </group>
    )
}

function SnowElement({ position, size = 1 }: { position: [number, number, number], size?: number }) {
    return (
        <mesh position={position}>
            <sphereGeometry args={[size, 8, 6]} />
            <meshStandardMaterial color="#F5F5F5" flatShading toneMapped={false} />
        </mesh>
    )
}

function SimpleMountain({ position, scale }: { position: [number, number, number], scale: number }) {
    return (
        <group position={position}>
            <mesh position={[0, scale / 2, 0]}>
                <coneGeometry args={[scale, scale, 4]} />
                <meshStandardMaterial color="#228B22" flatShading toneMapped={false} />
            </mesh>
            <mesh position={[0, scale * 0.8, 0]}>
                <coneGeometry args={[scale * 0.3, scale * 0.4, 4]} />
                <meshStandardMaterial color="#FFFFFF" flatShading toneMapped={false} />
            </mesh>
        </group>
    )
}

function PaperCloud({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
    return (
        <group position={position} scale={scale}>
            <mesh position={[0, 0, 0]}>
                <circleGeometry args={[2, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.9} toneMapped={false} />
            </mesh>
            <mesh position={[1.5, -0.5, 0.1]}>
                <circleGeometry args={[1.5, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.9} toneMapped={false} />
            </mesh>
            <mesh position={[-1.5, -0.5, 0.1]}>
                <circleGeometry args={[1.5, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.9} toneMapped={false} />
            </mesh>
        </group>
    )
}

// --- MAIN COMPONENT ---

export function SouthParkBackground() {
    const theme = useVisualStore(s => s.aestheticTheme)

    // Only render if South Park theme is active
    if (theme !== 'southpark') return null

    // Background texture (optional if using 3D mountains, but keeps the distant vibe)
    const texture = useMemo(() => {
        const loader = new THREE.TextureLoader()
        return loader.load('/assets/visuals/south_park_bg.png')
    }, [])

    return (
        <group>
            {/* Sky */}
            <color attach="background" args={['#87CEEB']} />

            {/* Distant Background Plane (The painted landscape) */}
            <mesh position={[0, 0, -60]} rotation={[0, 0, 0]}>
                <planeGeometry args={[300, 150]} />
                <meshBasicMaterial
                    map={texture}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                    transparent
                    opacity={0.8} // Blend with 3D mountains
                />
            </mesh>

            {/* 3D Scene Container */}
            <group position={[0, 0, 0]}>

                {/* 1. Ground Plane (Snow) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
                    <planeGeometry args={[200, 200]} />
                    <meshStandardMaterial color="#F5F5F5" toneMapped={false} />
                </mesh>

                {/* 2. Road (Dark Gray) */}
                {/* Z range: -15 (back) to +5 (front). Width 200. */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9.95, -5]} receiveShadow>
                    <planeGeometry args={[200, 20]} />
                    <meshStandardMaterial color="#444444" toneMapped={false} />
                </mesh>

                {/* 3. Road Stripe (Yellow) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9.94, -5]}>
                    <planeGeometry args={[200, 0.5]} />
                    <meshBasicMaterial color="#FFD700" toneMapped={false} />
                </mesh>

                {/* 4. The Band (Characters) */}
                {/* They stand at Y approx -6 to -8, Z approx -6 to -10, which is ON the Road */}
                <SouthParkStage />

                {/* 5. 3D Mountains (Behind the road) */}
                <SimpleMountain position={[-30, -10, -40]} scale={25} />
                <SimpleMountain position={[30, -10, -40]} scale={25} />
                <SimpleMountain position={[0, -10, -50]} scale={30} />

                {/* 6. Pine Trees (Scattered) */}
                <PineTree position={[-15, -9, -20]} />
                <PineTree position={[-25, -9, -15]} />
                <PineTree position={[20, -9, -20]} />
                <PineTree position={[30, -9, -25]} />

                {/* 7. Snow Elements (Foreground) */}
                <SnowElement position={[-5, -9.5, 5]} size={0.5} />
                <SnowElement position={[5, -9.5, 4]} size={0.4} />

                {/* 8. Clouds (Atmosphere) */}
                <PaperCloud position={[-10, 5, -20]} scale={1} />
                <PaperCloud position={[15, 7, -20]} scale={1.2} />
                <PaperCloud position={[0, 9, -25]} scale={0.8} />

                {/* 9. Falling Snow (Particle Atmosphere) */}
                <Sparkles
                    count={500}
                    scale={[50, 30, 30]}
                    position={[0, 0, -10]}
                    speed={0.4}
                    opacity={0.8}
                    color="white"
                    size={5}
                />
            </group>

            {/* Lights */}
            <ambientLight intensity={1.5} />
            <directionalLight
                position={[10, 20, 10]}
                intensity={1.0}
                color="#FFD700"
                castShadow
            />
            <directionalLight
                position={[-10, 5, -5]}
                intensity={0.5}
                color="#228B22"
            />
        </group>
    )
}
