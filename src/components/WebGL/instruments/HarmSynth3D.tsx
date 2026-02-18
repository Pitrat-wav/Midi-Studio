/**
 * HarmSynth3D — Buchla-Inspired Modular Synth Visualization
 * 
 * Features:
 * - 3x OSC Modules with glowing orbs
 * - Buchla 259 Complex Section with Wavefolding visualization
 * - Audio-reactive glowing cables and ADSR lines
 * - Futuristic glass-rack aesthetic
 */

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float } from '@react-three/drei'
import { WhiskMaterial } from '../WhiskMaterial'
import * as THREE from 'three'
import { useHarmStore, HARM_PRESETS } from '../../../store/instrumentStore'
import { useVisualStore } from '../../../store/visualStore'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { useGestureStore } from '../../../logic/GestureManager'
import { audioReactiveVertexShader, fresnelFragmentShader } from '../../../shaders/audioReactive.glsl'

// Separate component for Wavefolding Visual to isolate re-renders and logic
const WavefoldingVisual = memo(function WavefoldingVisual({ position, onGesture }: {
    position: [number, number, number],
    onGesture: (e: any) => void
}) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const theme = useVisualStore(s => s.aestheticTheme)
    
    // Subscribe to low-frequency changes for geometry updates
    const order = useHarmStore(s => s.complexOrder)
    const harmonics = useHarmStore(s => s.complexHarmonics)
    const active = useHarmStore(s => s.complexMode)

    // Memoize geometry args to prevent regeneration when other props change
    const geometryArgs = useMemo(() => {
        return [0.8, 0.3, 128, 32, Math.floor(2 + order * 3), Math.floor(3 + harmonics * 5)]
    }, [order, harmonics])

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uPitch: { value: 0.5 },
        uBaseColor: { value: new THREE.Color('#ffcc33') },
        uGlowColor: { value: new THREE.Color('#ff9900') },
        uResonanceExp: { value: 3.0 }
    }), [])

    useFrame((state) => {
        if (!meshRef.current) return
        
        // Read high-frequency data directly from store to avoid re-renders
        const harmState = useHarmStore.getState()
        const timbre = harmState.complexTimbre
        
        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uAudioIntensity.value = active ? 0.5 + timbre : 0.1
        uniforms.uPitch.value = timbre

        if (theme !== 'none') {
            meshRef.current.rotation.x += 0.01 * (1 + timbre * 5)
            meshRef.current.rotation.y += 0.015 * (1 + timbre * 5)
        }
    })

    return (
        <group position={position}>
            <mesh ref={meshRef} onPointerDown={onGesture}>
                {theme === 'none' ? (
                    <>
                        <torusKnotGeometry args={geometryArgs as any} />
                        <shaderMaterial
                            vertexShader={audioReactiveVertexShader}
                            fragmentShader={fresnelFragmentShader}
                            uniforms={uniforms}
                        />
                    </>
                ) : (
                    <>
                        <icosahedronGeometry args={[1.2, 4]} />
                        <WhiskMaterial
                            baseColor="#ffffff"
                            // Note: WhiskMaterial currently ignores distort/speed if theme is active
                            // We keep them for potential future support or fallback
                            emissive={theme === 'cosmic' ? "#ff00ff" : "#00ff88"}
                        />
                    </>
                )}
            </mesh>
            <Text position={[0, 1.5, 0]} fontSize={0.2} color={theme === 'none' ? "#ffcc33" : "#00ffff"}>
                {theme === 'none' ? "TOUCH TO FOLD" : "WHISK ENERGY CORE"}
            </Text>
        </group>
    )
})

export const HarmSynth3D = memo(function HarmSynth3D() {
    const isPlaying = useHarmStore(s => s.isPlaying)
    const setParam = useHarmStore(s => s.setParam)
    const togglePlay = useHarmStore(s => s.togglePlay)
    
    // Low frequency subscriptions for UI toggles
    const complexMode = useHarmStore(s => s.complexMode)
    const osc1Enabled = useHarmStore(s => s.osc1Enabled)
    const osc2Enabled = useHarmStore(s => s.osc2Enabled)
    const osc3Enabled = useHarmStore(s => s.osc3Enabled)

    const gestures = useGestureStore()
    const layout = SPATIAL_LAYOUT.harmony.position

    useFrame(() => {
        // Drag logic updates the store, but this component doesn't subscribe to the updated values
        // (timbre, fmIndex) so it won't re-render 60fps.
        // WavefoldingVisual reads them via getState().
        if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(new THREE.Vector3(...layout)) < 5) {
            const dx = gestures.currentPos.x - gestures.startPos.x
            const dy = gestures.currentPos.y - gestures.startPos.y

            const harmState = useHarmStore.getState()

            // Simple mapping: Y = Timbre, X = FM Index
            const newTimbre = THREE.MathUtils.clamp(harmState.complexTimbre - dy * 0.005, 0, 1)
            const newFM = THREE.MathUtils.clamp(harmState.complexFmIndex + dx * 0.005, 0, 1)
            setParam({ complexTimbre: newTimbre, complexFmIndex: newFM })
        }
    })

    // Group controls logically
    const buchlaPos: [number, number, number] = [layout[0], layout[1] + 2, layout[2]]
    
    return (
        <group position={layout}>
            {/* Background glowing panel */}
            <mesh position={[0, 0, -1]}>
                <planeGeometry args={[10, 8]} />
                <WhiskMaterial
                    baseColor="#050510"
                    transparent
                    opacity={0.8}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Buchla Section */}
            <group position={[0, 3, 0]}>
                <WavefoldingVisual
                    position={[0, 0, 0]}
                    onGesture={(e) => {
                        e.stopPropagation()
                        gestures.onStart(e.clientX, e.clientY, e.point, e.pointerId)
                    }}
                />

                <Button3D
                    label="COMPLEX"
                    position={[0, -2.5, 0.5]}
                    active={complexMode}
                    onClick={() => setParam({ complexMode: !complexMode })}
                    color="#ffcc33"
                />
            </group>

            {/* OSC Sections - Simplified for gesture interaction */}
            <group position={[-3, -1, 0]}>
                <mesh onClick={() => setParam({ osc1Enabled: !osc1Enabled })}>
                    <octahedronGeometry args={[0.5, 0]} />
                    <WhiskMaterial baseColor={osc1Enabled ? "#3390ec" : "#222"} emissive={osc1Enabled ? "#3390ec" : "#000"} />
                </mesh>
            </group>

            <group position={[0, -1, 0]}>
                <mesh onClick={() => setParam({ osc2Enabled: !osc2Enabled })}>
                    <icosahedronGeometry args={[0.5, 0]} />
                    <WhiskMaterial baseColor={osc2Enabled ? "#ff3b30" : "#222"} emissive={osc2Enabled ? "#ff3b30" : "#000"} />
                </mesh>
            </group>

            <group position={[3, -1, 0]}>
                <mesh onClick={() => setParam({ osc3Enabled: !osc3Enabled })}>
                    <boxGeometry args={[0.7, 0.7, 0.7]} />
                    <WhiskMaterial baseColor={osc3Enabled ? "#4cd964" : "#222"} emissive={osc3Enabled ? "#4cd964" : "#000"} />
                </mesh>
            </group>

            {/* Remove Old Control Surface - Use gestures */}
            <Text position={[0, -4, 0]} fontSize={0.2} color="#ffcc33">
                MANIPULATE CORE TO MODULATE
            </Text>

            {/* Play/Stop Toggle */}
            <Button3D
                label={isPlaying ? "STOP" : "PLAY"}
                position={[0, -5, 0.5]}
                active={isPlaying}
                onClick={() => togglePlay()}
                color="#3390ec"
                size={1}
            />

            {/* Station Title */}
            <Text
                position={[0, 4.5, 0]}
                fontSize={0.4}
                color="#ffffff"
                anchorX="center"
            >
                HARMONY STATION: BUCHLA 259 MODULAR
            </Text>
        </group>
    )
})
