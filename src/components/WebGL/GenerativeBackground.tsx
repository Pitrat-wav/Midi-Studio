/**
 * GenerativeBackground — Animated 3D background with Presets
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioStore } from '../../store/audioStore'
import { useVisualStore } from '../../store/visualStore'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'

export const PRESETS = [
    { name: 'DEEP VOID', color: '#000000', stars: 1500, haze: 0, light1: '#ffffff', light2: '#111111' }, // Pure black, cold
    { name: 'ORION NEBULA', color: '#0a0010', stars: 4000, haze: 0.02, light1: '#ff00cc', light2: '#3300ff' }, // Purple/Pink haze
    { name: 'BLUE GIANT', color: '#000510', stars: 3000, haze: 0.01, light1: '#00ccff', light2: '#002244' }, // Cold Blue
    { name: 'RED SUPERGIANT', color: '#100200', stars: 3000, haze: 0.015, light1: '#ff3300', light2: '#441100' }, // Warm Red
    { name: 'MILKY WAY', color: '#050505', stars: 6000, haze: 0.005, light1: '#ffeeaa', light2: '#aabbff' }, // Dense, varied
    { name: 'CYBER SPACE', color: '#000205', stars: 2000, haze: 0.01, light1: '#00ffaa', light2: '#ff00ff' }, // Neon accents
    { name: 'EVENT HORIZON', color: '#000000', stars: 500, haze: 0.002, light1: '#333333', light2: '#000000' }, // Dark, minimal
    { name: 'GOLDEN CLUSTER', color: '#050300', stars: 5000, haze: 0.01, light1: '#ffcc00', light2: '#ff8800' } // Gold/Warm
]

export function GenerativeBackground() {
    const isPlaying = useAudioStore(s => s.isPlaying)
    const presetIndex = useVisualStore(s => s.backgroundPreset)
    const bridge = useAudioVisualBridge()
    const meshRef = useRef<THREE.Mesh>(null!)

    const preset = PRESETS[presetIndex % PRESETS.length]

    useFrame((state) => {
        const t = state.clock.getElapsedTime()

        // Smooth background color transition
        state.scene.background = new THREE.Color(preset.color)

        // Note: Fog updating is tricky in r3f as it's imperative. 
        // We'll trust the declarative <fogExp2> below for now.

        if (meshRef.current) {
            // Slower, smoother rotation
            meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.05
            meshRef.current.rotation.y = Math.cos(t * 0.15) * 0.05

            // Smoother pulse
            const pulse = bridge.getPulse('kick') * 0.15 + bridge.getPulse('snare') * 0.05
            meshRef.current.scale.lerp(new THREE.Vector3(1 + pulse, 1 + pulse, 1 + pulse), 0.05)
        }
    })

    return (
        <group>
            {/* Conditional Fog - Minimal to avoid flickering */}
            {preset.haze > 0.001 && <fogExp2 attach="fog" args={[preset.color, preset.haze]} />}

            <Stars
                radius={100}
                depth={60}
                count={preset.stars}
                factor={4}
                saturation={0}
                fade
                speed={isPlaying ? 0.5 : 0.1} // Slower star movement
            />

            {/* Dynamic Lights */}
            <ambientLight intensity={0.2} />
            <pointLight position={[20, 20, 20]} intensity={1.5} color={preset.light1} />
            <pointLight position={[-20, -20, -20]} intensity={0.5} color={preset.light2} />

            {/* Central Artifact - Smoother */}
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
                <mesh ref={meshRef} position={[0, 0, -15]}>
                    <icosahedronGeometry args={[5, 15]} />
                    <MeshDistortMaterial
                        color="#050505"
                        envMapIntensity={1}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        metalness={0.8}
                        roughness={0.2}
                        distort={isPlaying ? 0.3 : 0.1} // Less distortion
                        speed={isPlaying ? 1.5 : 0.5}   // Slower animation
                        emissive={preset.light1}
                        emissiveIntensity={0.05} // Less glow flicker
                    />
                </mesh>
            </Float>

            {/* Floating particles - Calmer */}
            <Sparkles
                count={30}
                scale={20} // Spread them out more so they aren't clumped (strobing)
                size={2}
                speed={0.1} // Very slow
                opacity={0.3}
                color={preset.light1}
            />
        </group>
    )
}
