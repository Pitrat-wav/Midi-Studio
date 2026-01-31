/**
 * SouthParkBackground — Special background for South Park theme
 * Renders a flat cartoon landscape with mountains, snow, and 3D trees
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { useVisualStore } from '../../store/visualStore'

// Simple pine tree component
function PineTree({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Tree trunk */}
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
                <meshStandardMaterial color="#8B4513" flatShading />
            </mesh>
            {/* Tree foliage - 3 layers */}
            <mesh position={[0, 2.5, 0]}>
                <coneGeometry args={[1.5, 2, 8]} />
                <meshStandardMaterial color="#228B22" flatShading />
            </mesh>
            <mesh position={[0, 3.5, 0]}>
                <coneGeometry args={[1.2, 1.5, 8]} />
                <meshStandardMaterial color="#2d7a3e" flatShading />
            </mesh>
            <mesh position={[0, 4.3, 0]}>
                <coneGeometry args={[0.8, 1, 8]} />
                <meshStandardMaterial color="#32CD32" flatShading />
            </mesh>
            {/* Snow on top */}
            <mesh position={[0, 4.8, 0]}>
                <sphereGeometry args={[0.3, 8, 6]} />
                <meshStandardMaterial color="#FFFFFF" flatShading />
            </mesh>
        </group>
    )
}

// Snowball/rock element
function SnowElement({ position, size = 1 }: { position: [number, number, number], size?: number }) {
    return (
        <mesh position={position}>
            <sphereGeometry args={[size, 8, 6]} />
            <meshStandardMaterial color="#F5F5F5" flatShading />
        </mesh>
    )
}

export function SouthParkBackground() {
    const theme = useVisualStore(s => s.aestheticTheme)

    // Only render if South Park theme is active
    if (theme !== 'southpark') return null

    const texture = useMemo(() => {
        const loader = new THREE.TextureLoader()
        return loader.load('/assets/visuals/south_park_bg.png')
    }, [])

    return (
        <>
            {/* Sky color - light blue */}
            <color attach="background" args={['#87CEEB']} />

            {/* Background plane with South Park landscape */}
            <mesh position={[0, 0, -50]} rotation={[0, 0, 0]}>
                <planeGeometry args={[200, 100]} />
                <meshBasicMaterial
                    map={texture}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* 3D Pine Trees scattered around */}
            <PineTree position={[-15, -8, -20]} />
            <PineTree position={[-8, -8, -15]} />
            <PineTree position={[10, -8, -18]} />
            <PineTree position={[18, -8, -25]} />
            <PineTree position={[-20, -8, -30]} />
            <PineTree position={[15, -8, -28]} />

            {/* Snow elements on ground */}
            <SnowElement position={[-5, -9, -10]} size={1.2} />
            <SnowElement position={[5, -9, -12]} size={0.8} />
            <SnowElement position={[0, -9, -8]} size={1.0} />
            <SnowElement position={[-10, -9, -15]} size={1.5} />
            <SnowElement position={[12, -9, -14]} size={0.9} />

            {/* Ground plane - snowy white */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#F5F5F5" flatShading />
            </mesh>

            {/* Bright ambient light for cartoon look */}
            <ambientLight intensity={1.2} />

            {/* Directional lights for minimal shadows */}
            <directionalLight
                position={[10, 10, 5]}
                intensity={0.8}
                color="#FFD700"
            />
            <directionalLight
                position={[-10, 5, -5]}
                intensity={0.4}
                color="#228B22"
            />
        </>
    )
}
