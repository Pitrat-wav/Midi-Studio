/**
 * AcidSynth3D — 3D Visualization for Acid Bass Synth
 * 
 * Visual Metaphor:
 * - Deformable plane reacting to cutoff/resonance
 * - Vertex displacement based on filter frequency
 * - Fresnel glow for resonance peaks
 * 
 * Interactive Controls:
 * - Cutoff, Resonance, Slide, Distortion knobs
 * - Density, Type, Morph pattern controls
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useBassStore } from '../../../store/instrumentStore'
import { useVisualStore } from '../../../store/visualStore'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { audioReactiveVertexShader, fresnelFragmentShader } from '../../../shaders/audioReactive.glsl'
import { useGestureStore } from '../../../logic/GestureManager'

export function AcidSynth3D() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const isPlaying = useBassStore(s => s.isPlaying)
    const setParams = useBassStore(s => s.setParams)
    const togglePlay = useBassStore(s => s.togglePlay)

    const audioIntensity = useVisualStore(s => s.globalAudioIntensity)
    const gestures = useGestureStore()
    const controls = SPATIAL_LAYOUT.bass.controls

    // Initial values for uniforms
    const initialCutoff = useBassStore.getState().cutoff
    const initialRes = useBassStore.getState().resonance

    // Shader uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uCutoff: { value: initialCutoff },
        uResonance: { value: initialRes },
        uLowFreq: { value: 0 },
        uMidFreq: { value: 0 },
        uHighFreq: { value: 0 },
        uBPM: { value: 120 },
        uBeat: { value: 0 },
        uGlowColor: { value: new THREE.Color('#3390ec') },
        uBaseColor: { value: new THREE.Color('#1a5a8a') },
        uResonanceExp: { value: 2.0 },
        uPitch: { value: 0.5 }
    }), [])

    // Update uniforms & Gestures
    useFrame((state) => {
        if (!meshRef.current) return

        // Read current store state without subscribing to re-renders
        const bassState = useBassStore.getState()

        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uAudioIntensity.value = audioIntensity
        uniforms.uCutoff.value = bassState.cutoff
        uniforms.uResonance.value = bassState.resonance
        uniforms.uResonanceExp.value = 1.0 + (bassState.resonance / 20) * 4 // 1-5 range

        // Map pitch (note frequency) to 0-1
        const freq = bassState.lastNoteFrequency || 440
        uniforms.uPitch.value = THREE.MathUtils.mapLinear(Math.log2(freq), 5, 10, 0, 1)

        // Direct Modulation via Gesture
        if (gestures.activeGesture === 'drag' && gestures.targetPosition) {
            const dy = gestures.currentPos.y - gestures.startPos.y
            const dx = gestures.currentPos.x - gestures.startPos.x

            // Map Y drag to Cutoff (inverted)
            const newCutoff = THREE.MathUtils.clamp(bassState.cutoff - dy * 20, 50, 10000)
            const newRes = THREE.MathUtils.clamp(bassState.resonance + dx * 0.1, 0.1, 20)

            setParams({ cutoff: newCutoff, resonance: newRes })
        }

        // Gentle rotation
        meshRef.current.rotation.z += 0.001
    })

    return (
        <group position={SPATIAL_LAYOUT.bass.position}>
            {/* Main Deformable Plane */}
            <mesh
                ref={meshRef}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    gestures.onStart(e.clientX, e.clientY, e.point)
                }}
            >
                <planeGeometry args={[4, 4, 64, 64]} />
                <shaderMaterial
                    vertexShader={audioReactiveVertexShader}
                    fragmentShader={fresnelFragmentShader}
                    uniforms={uniforms}
                    wireframe={false}
                />
            </mesh>

            {/* Wireframe Overlay */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[4, 4, 32, 32]} />
                <meshBasicMaterial
                    color="#3390ec"
                    wireframe
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Remove Old Knobs - Replaced by direct manipulation */}
            <Text position={[0, 2.5, 0]} fontSize={0.2} color="#3390ec">
                TOUCH SURFACE TO MODULATE
            </Text>

            <Button3D
                position={[0, -2.5, 0.5]}
                label={isPlaying ? "STOP" : "PLAY"}
                active={isPlaying}
                onClick={() => togglePlay()}
                color="#3390ec"
                size={0.8}
            />

            {/* Lighting */}
            <pointLight position={[0, 3, 3]} intensity={2} color="#3390ec" />
            <pointLight position={[0, -3, 3]} intensity={1} color="#5ab3ff" />
        </group>
    )
}
