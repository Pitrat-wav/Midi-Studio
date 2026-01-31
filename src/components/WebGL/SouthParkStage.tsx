/**
 * SouthParkStage — Renders the character cutouts for the South Park theme.
 * Characters react to specific audio channels.
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'

interface CharacterProps {
    texturePath: string
    position: [number, number, number]
    scale?: number
    channel: 'kick' | 'bass' | 'lead' | 'pads' | 'snare' | 'hihat'
    reactivity?: number
    baseBounce?: number
}

function CharacterCutout({
    texturePath,
    position,
    scale = 3,
    channel,
    reactivity = 0.5,
    baseBounce = 0.5
}: CharacterProps) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const bridge = useAudioVisualBridge()

    const texture = useMemo(() => {
        const loader = new THREE.TextureLoader()
        return loader.load(texturePath)
    }, [texturePath])

    useFrame((state) => {
        if (!meshRef.current) return

        // Get audio data for this channel
        const pulse = bridge.getPulse(channel)

        // Bounce animation
        // Initial y position is position[1]
        // Add sinus bounce + audio pulse
        const t = state.clock.getElapsedTime()

        // Idle breathing animation
        const idleY = Math.sin(t * 2 + position[0]) * 0.1

        // Audio reaction
        const jumpY = pulse * reactivity * 2

        meshRef.current.position.y = position[1] + idleY + jumpY

        // Sqash and stretch
        const stretch = 1 + pulse * 0.2
        const squash = 1 - pulse * 0.1
        meshRef.current.scale.set(scale * squash, scale * stretch, scale)
    })

    return (
        <mesh ref={meshRef} position={position}>
            <planeGeometry args={[1, 1]} /> // Aspect ratio will be handled by scale/texture
            <meshBasicMaterial
                map={texture}
                transparent
                side={THREE.DoubleSide}
                toneMapped={false}
            />
        </mesh>
    )
}

export function SouthParkStage() {
    return (
        <group>
            {/* Eric Cartman - Drums (Center Back) */}
            {/* Texture is square-ish, slightly wide */}
            <CharacterCutout
                texturePath="/assets/visuals/sp_cartman.png"
                position={[0, -2, -10]}
                scale={8}
                channel="kick"
                reactivity={0.8}
            />

            {/* Stan Marsh - Bass (Front Left) */}
            <CharacterCutout
                texturePath="/assets/visuals/sp_stan.png"
                position={[-6, -4, -6]}
                scale={6}
                channel="bass"
            />

            {/* Kyle Broflovski - Lead Guitar (Front Right) */}
            <CharacterCutout
                texturePath="/assets/visuals/sp_kyle.png"
                position={[6, -4, -6]}
                scale={6}
                channel="lead"
            />

            {/* Kenny McCormick - Pads/Synth (Far Right) */}
            <CharacterCutout
                texturePath="/assets/visuals/sp_kenny.png"
                position={[10, -5, -8]}
                scale={5}
                channel="pads"
            />

            {/* Butters - Percussion (Far Left) */}
            <CharacterCutout
                texturePath="/assets/visuals/sp_butters.png"
                position={[-10, -5, -8]}
                scale={5}
                channel="hihat"
                reactivity={1.2} // High reactivity for fast percussion
            />

            {/* Shadows for characters */}
            <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.9, 0]}>
                {[0, -6, 6, 10, -10].map((x, i) => (
                    <mesh key={i} position={[x, -i === 0 ? -10 : -6, 0]}> {/* Approximate Z overlap fix */}
                        <circleGeometry args={[2.5, 32]} />
                        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
                    </mesh>
                ))}
            </group>
        </group>
    )
}
