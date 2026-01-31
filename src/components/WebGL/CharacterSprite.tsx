/**
 * CharacterSprite.tsx
 * Billboard sprite component for South Park characters
 * Uses MeshBasicMaterial for flat, unlit paper cutout aesthetic
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'

interface CharacterSpriteProps {
    texturePath: string
    position: [number, number, number]
    scale?: number
    audioChannel?: 'kick' | 'snare' | 'bass' | 'lead' | 'pads' | 'hihat' | 'drone'
    reactivity?: number
    enableSquash?: boolean
}

export function CharacterSprite({
    texturePath,
    position,
    scale = 1,
    audioChannel,
    reactivity = 0.5,
    enableSquash = true
}: CharacterSpriteProps) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const bridge = useAudioVisualBridge()

    // Load texture with nearest filter for crisp pixel art
    const texture = useMemo(() => {
        const tex = new THREE.TextureLoader().load(texturePath)
        tex.minFilter = THREE.NearestFilter
        tex.magFilter = THREE.NearestFilter
        return tex
    }, [texturePath])

    useFrame((state) => {
        if (!meshRef.current || !audioChannel) return

        const pulse = bridge.getPulse(audioChannel)
        const t = state.clock.getElapsedTime()

        // Idle breathing animation
        const idle = Math.sin(t * 2 + position[0]) * 0.05

        if (enableSquash) {
            // Squash and stretch on audio pulse
            const scaleY = 1 + pulse * reactivity * 0.3 + idle
            const scaleX = 1 - pulse * reactivity * 0.1
            meshRef.current.scale.set(scale * scaleX, scale * scaleY, scale)
        } else {
            // Simple scale pulse
            const s = scale * (1 + pulse * reactivity * 0.2 + idle)
            meshRef.current.scale.set(s, s, s)
        }
    })

    return (
        <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
            <mesh ref={meshRef}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>
        </Billboard>
    )
}
