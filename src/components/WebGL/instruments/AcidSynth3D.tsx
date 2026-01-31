/**
 * AcidSynth3D — 3D Visualization for Acid Bass Synth
 * 
 * Visual Metaphor:
 * - "Liquid Metal" Surface (Mercury/Chrome)
 * - Ripples and Distortion based on Resonance/Cutoff
 * - Generative MeshDistortMaterial
 * 
 * Interactive Controls:
 * - Drag Surface to Modulate
 * - Touch Interaction
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { WhiskMaterial } from '../WhiskMaterial'
import * as THREE from 'three'
import { useBassStore } from '../../../store/instrumentStore'
import { useVisualStore } from '../../../store/visualStore'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { useGestureStore } from '../../../logic/GestureManager'

export function AcidSynth3D() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const matRef = useRef<any>(null!) // Ref to MeshDistortMaterial (it's properly typed usually but any for safety here)

    const isPlaying = useBassStore(s => s.isPlaying)
    const setParams = useBassStore(s => s.setParams)
    const togglePlay = useBassStore(s => s.togglePlay)

    const gestures = useGestureStore()
    // controls usually defined in SPATIAL_LAYOUT.bass.controls - simplified here

    useFrame((state) => {
        if (!meshRef.current) return

        // Read current store state
        const bassState = useBassStore.getState()

        // Modulate Liquid Metal
        if (matRef.current) {
            // Resonance (0.1 - 20) -> Distort (0 - 1.0)
            const targetDistort = THREE.MathUtils.mapLinear(bassState.resonance, 0, 20, 0, 0.8)
            matRef.current.distort = THREE.MathUtils.lerp(matRef.current.distort, targetDistort, 0.05)

            // Cutoff (50 - 10000) -> Speed (1 - 10)
            const targetSpeed = THREE.MathUtils.mapLinear(Math.log2(bassState.cutoff), 5, 13, 1, 8)
            matRef.current.speed = THREE.MathUtils.lerp(matRef.current.speed, targetSpeed, 0.05)
        }

        // Direct Modulation via Gesture
        if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(meshRef.current.position) < 3) {
            const dy = gestures.currentPos.y - gestures.startPos.y
            const dx = gestures.currentPos.x - gestures.startPos.x

            // Map Y drag to Cutoff (inverted)
            // Map X drag to Resonance
            const newCutoff = THREE.MathUtils.clamp(useBassStore.getState().cutoff - dy * 50, 50, 10000)
            const newRes = THREE.MathUtils.clamp(useBassStore.getState().resonance + dx * 0.5, 0.1, 20)

            setParams({ cutoff: newCutoff, resonance: newRes })
        }

        // Gentle rotation
        meshRef.current.rotation.z = state.clock.elapsedTime * 0.1
    })

    return (
        <group position={SPATIAL_LAYOUT.bass.position}>
            {/* Liquid Metal Surface */}
            <mesh
                ref={meshRef}
                rotation={[-Math.PI / 2, 0, 0]}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    gestures.onStart(e.clientX, e.clientY, e.point)
                }}
            >
                <planeGeometry args={[5, 5, 128, 128]} />
                <WhiskMaterial
                    baseColor="#3390ec"
                    emissive="#001133"
                    metalness={0.9}
                    roughness={0.1}
                    distort={0.4}
                    speed={2}
                />
            </mesh>

            <Text position={[0, 3, 0]} fontSize={0.2} color="#3390ec" anchorX="center">
                ACID LIQUID: TOUCH TO MORPH
            </Text>

            <Button3D
                position={[0, -3.5, 0.5]}
                label={isPlaying ? "STOP" : "PLAY"}
                active={isPlaying}
                onClick={() => togglePlay()}
                color="#3390ec"
                size={0.8}
            />

            {/* Lighting */}
            <pointLight position={[0, 4, 3]} intensity={3} color="#3390ec" />
            <pointLight position={[0, -4, 3]} intensity={2} color="#5ab3ff" />
        </group>
    )
}
