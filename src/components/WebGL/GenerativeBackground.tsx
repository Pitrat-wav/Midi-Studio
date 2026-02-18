import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioStore } from '../../store/audioStore'
import { PRESETS, useVisualStore } from '../../store/visualStore'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'
import { SouthParkWorld } from './SouthParkWorld'
import { PlanetField } from './PlanetField'
import { StudioRoom } from './StudioRoom'

export function GenerativeBackground() {
    const isPlaying = useAudioStore(s => s.isPlaying)
    const presetIndex = useVisualStore(s => s.backgroundPreset)
    const aestheticTheme = useVisualStore(s => s.aestheticTheme)
    const bridge = useAudioVisualBridge()
    const meshRef = useRef<THREE.Mesh>(null!)

    // Use Studio 2026 environment
    if (aestheticTheme === 'studio') {
        return <StudioRoom />
    }

    // Use South Park 2.5D world if that theme is active
    if (aestheticTheme === 'southpark') {
        return <SouthParkWorld />
    }

    const preset = (PRESETS && Array.isArray(PRESETS) && PRESETS.length > 0)
        ? PRESETS[presetIndex % PRESETS.length]
        : { name: 'DEFAULT', color: '#000000', stars: 1000, haze: 0, light1: '#ffffff', light2: '#111111' }

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

    // Load custom texture if present
    const map = useMemo(() => {
        if (!preset.texture) return null
        return new THREE.TextureLoader().load(preset.texture)
    }, [preset.texture])

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

            {/* Decorative Planets */}
            <PlanetField mode="cosmic" />

            {/* Dynamic Lights */}
            <ambientLight intensity={0.2} />
            <pointLight position={[20, 20, 20]} intensity={1.5} color={preset.light1} />
            <pointLight position={[-20, -20, -20]} intensity={0.5} color={preset.light2} />

            {/* Central Artifact - Smoother */}
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
                <mesh ref={meshRef} position={[0, 0, -15]}>
                    <icosahedronGeometry args={[5, 15]} />
                    <MeshDistortMaterial
                        map={map}
                        color={map ? "#ffffff" : "#050505"}
                        envMapIntensity={1}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        metalness={0.8}
                        roughness={0.2}
                        distort={isPlaying ? 0.3 : 0.1} // Less distortion
                        speed={isPlaying ? 1.5 : 0.5}   // Slower animation
                        emissive={preset.light1}
                        emissiveIntensity={map ? 0.1 : 0.05} // Less glow flicker
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
