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
import * as THREE from 'three'
import { useBassStore } from '../../../store/instrumentStore'
import { useVisualStore } from '../../../store/visualStore'
import { Knob3D } from '../controls/Knob3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { audioReactiveVertexShader, fresnelFragmentShader } from '../../../shaders/audioReactive.glsl'

export function AcidSynth3D() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const bassStore = useBassStore()
    const audioIntensity = useVisualStore(s => s.globalAudioIntensity)
    const controls = SPATIAL_LAYOUT.bass.controls

    // Shader uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uCutoff: { value: bassStore.cutoff },
        uResonance: { value: bassStore.resonance },
        uLowFreq: { value: 0 },
        uMidFreq: { value: 0 },
        uHighFreq: { value: 0 },
        uBPM: { value: 120 },
        uBeat: { value: 0 },
        uGlowColor: { value: new THREE.Color('#3390ec') },
        uBaseColor: { value: new THREE.Color('#1a5a8a') },
        uResonanceExp: { value: 2.0 }
    }), [])

    // Update uniforms
    useFrame((state) => {
        if (!meshRef.current) return

        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uAudioIntensity.value = audioIntensity
        uniforms.uCutoff.value = bassStore.cutoff
        uniforms.uResonance.value = bassStore.resonance
        uniforms.uResonanceExp.value = 1.0 + (bassStore.resonance / 20) * 4 // 1-5 range

        // Gentle rotation
        meshRef.current.rotation.z += 0.001
    })

    return (
        <group position={SPATIAL_LAYOUT.bass.position}>
            {/* Main Deformable Plane */}
            <mesh ref={meshRef}>
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

            {/* Interactive Controls */}
            <Knob3D
                position={controls.cutoff}
                value={THREE.MathUtils.mapLinear(bassStore.cutoff, 50, 10000, 0, 1)}
                min={0}
                max={1}
                label="Cutoff"
                onChange={(v) => bassStore.setCutoff(THREE.MathUtils.mapLinear(v, 0, 1, 50, 10000))}
                color="#3390ec"
                size={1.2}
            />

            <Knob3D
                position={controls.resonance}
                value={bassStore.resonance / 20}
                min={0}
                max={1}
                label="Resonance"
                onChange={(v) => bassStore.setResonance(v * 20)}
                color="#5ab3ff"
                size={1.2}
            />

            <Knob3D
                position={controls.slide}
                value={bassStore.slide}
                min={0}
                max={1}
                label="Slide"
                onChange={(v) => bassStore.setSlide(v)}
                color="#7ac5ff"
                size={1}
            />

            <Knob3D
                position={controls.distortion}
                value={bassStore.distortion}
                min={0}
                max={1}
                label="Distortion"
                onChange={(v) => bassStore.setDistortion(v)}
                color="#9ad7ff"
                size={1}
            />

            <Knob3D
                position={controls.density}
                value={bassStore.density}
                min={0}
                max={1}
                label="Density"
                onChange={(v) => bassStore.setDensity(v)}
                color="#3390ec"
                size={0.9}
            />

            <Knob3D
                position={controls.type}
                value={bassStore.type}
                min={0}
                max={1}
                label="Type"
                onChange={(v) => bassStore.setType(v)}
                color="#5ab3ff"
                size={0.9}
            />

            <Knob3D
                position={controls.morph}
                value={bassStore.morph}
                min={0}
                max={1}
                label="Morph"
                onChange={(v) => bassStore.setMorph(v)}
                color="#7ac5ff"
                size={0.9}
            />

            {/* Lighting */}
            <pointLight position={[0, 3, 3]} intensity={2} color="#3390ec" />
            <pointLight position={[0, -3, 3]} intensity={1} color="#5ab3ff" />
        </group>
    )
}
