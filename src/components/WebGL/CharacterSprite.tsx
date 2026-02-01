/**
 * CharacterSprite.tsx
 * Billboard sprite component for South Park characters
 * Uses MeshBasicMaterial for flat, unlit paper cutout aesthetic
 */

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
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

const SHOUTS: Record<string, string[]> = {
    'sp_cartman.png': ["RESPECT MY AUTHORITAH!", "BEEFCAKE!", "I'm not fat, I'm big-boned!", "Screw you guys, I'm going home!"],
    'sp_kenny.png': ["Mmmph mmmph!", "Mph mmmph mph!", "Mmmmmph!"],
    'sp_kyle.png': ["You bastards!", "I learned something today...", "Kick the baby!"],
    'sp_stan.png': ["Oh my god, they killed Kenny!", "Dude, this is sweet.", "Stan Marsh is a man!"],
    'sp_butters.png': ["Oh, hamburgers.", "Loo loo loo...", "I'm Professor Chaos!"]
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
    const [isJumping, setIsJumping] = useState(false)
    const [speech, setSpeech] = useState<string | null>(null)

    // Extract filename for shouts
    const charName = useMemo(() => texturePath.split('/').pop() || '', [texturePath])

    // Load textures
    const texture = useMemo(() => {
        const tex = new THREE.TextureLoader().load(texturePath)
        tex.minFilter = THREE.NearestFilter
        tex.magFilter = THREE.NearestFilter
        return tex
    }, [texturePath])

    const grainTexture = useMemo(() => {
        const tex = new THREE.TextureLoader().load('/assets/visuals/sp_paper_grain.png')
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(2, 2)
        return tex
    }, [])

    useFrame((state) => {
        if (!meshRef.current || !audioChannel) return

        const pulse = bridge.getPulse(audioChannel)
        const t = state.clock.getElapsedTime()

        // STOP-MOTION: Quantize time to 12fps
        const fps = 12
        const quantizedT = Math.floor(t * fps) / fps
        const quantizedPulse = Math.floor(pulse * 10) / 10

        const idle = Math.sin(quantizedT * 2 + position[0]) * 0.05

        if (enableSquash) {
            const scaleY = 1 + (quantizedPulse * reactivity * 0.3) + idle + (isJumping ? 0.3 : 0)
            const scaleX = 1 - (quantizedPulse * reactivity * 0.1)
            meshRef.current.scale.set(scale * scaleX, scale * scaleY, scale)
        } else {
            const s = scale * (1 + quantizedPulse * reactivity * 0.2 + idle)
            meshRef.current.scale.set(s, s, s)
        }

        meshRef.current.position.y = Math.sin(quantizedT * 24) * 0.02
        meshRef.current.position.x = Math.cos(quantizedT * 18) * 0.01
    })

    const handleClick = (e: any) => {
        e.stopPropagation()
        setIsJumping(true)

        // Random shout
        if (SHOUTS[charName]) {
            const list = SHOUTS[charName]
            setSpeech(list[Math.floor(Math.random() * list.length)])
            setTimeout(() => setSpeech(null), 2000)
        }

        setTimeout(() => setIsJumping(false), 300)
    }

    return (
        <group position={position}>
            {/* Speech Bubble */}
            {speech && (
                <Billboard position={[0, scale * 1.5, 1]} follow={true}>
                    <mesh>
                        <planeGeometry args={[speech.length * 0.4, 1.5]} />
                        <meshBasicMaterial color="white" toneMapped={false} />
                    </mesh>
                    <Html center transform distanceFactor={10} pointerEvents="none">
                        <div style={{
                            fontFamily: "'Bangers', cursive",
                            color: 'black',
                            fontSize: '24px',
                            whiteSpace: 'nowrap',
                            background: 'white',
                            padding: '10px 20px',
                            border: '4px solid black',
                            borderRadius: '10px',
                            boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
                        }}>
                            {speech}
                        </div>
                    </Html>
                </Billboard>
            )}

            <Billboard
                follow={true}
                lockX={false}
                lockY={false}
                lockZ={false}
                onClick={handleClick}
            >
                <mesh ref={meshRef}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial
                        map={texture}
                        transparent
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        toneMapped={false}
                        depthWrite={true}
                    />
                    <mesh position={[0, 0, 0.01]}>
                        <planeGeometry args={[1, 1]} />
                        <meshBasicMaterial
                            map={grainTexture}
                            transparent
                            opacity={0.15}
                            blending={THREE.MultiplyBlending}
                            toneMapped={false}
                        />
                    </mesh>
                </mesh>
            </Billboard>
        </group>
    )
}
