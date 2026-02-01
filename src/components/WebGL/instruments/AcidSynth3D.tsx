/**
 * AcidSynth3D — Premium "Glossy Magazine" Edition
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, MeshDistortMaterial, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useBassStore } from '../../../store/instrumentStore'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { useGestureStore } from '../../../logic/GestureManager'

export function AcidSynth3D() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const matRef = useRef<any>(null!)

    const isPlaying = useBassStore(s => s.isPlaying)
    const setParams = useBassStore(s => s.setParams)
    const togglePlay = useBassStore(s => s.togglePlay)
    const gestures = useGestureStore()

    useFrame((state) => {
        if (!meshRef.current) return
        const bassState = useBassStore.getState()

        // Sync liquid movement with music
        const speedMultiplier = isPlaying ? 1 : 0.2
        if (matRef.current) {
            const targetDistort = THREE.MathUtils.mapLinear(bassState.resonance, 0, 20, 0.2, 0.8)
            matRef.current.distort = THREE.MathUtils.lerp(matRef.current.distort, targetDistort, 0.03)

            const targetSpeed = THREE.MathUtils.mapLinear(Math.log2(bassState.cutoff), 5, 13, 2, 6)
            matRef.current.speed = THREE.MathUtils.lerp(matRef.current.speed, targetSpeed * speedMultiplier, 0.05)
        }

        // Gesture interaction
        if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(meshRef.current.position) < 3) {
            const dy = gestures.currentPos.y - gestures.startPos.y
            const dx = gestures.currentPos.x - gestures.startPos.x
            const newCutoff = THREE.MathUtils.clamp(bassState.cutoff - dy * 50, 50, 10000)
            const newRes = THREE.MathUtils.clamp(bassState.resonance + dx * 0.5, 0.1, 20)
            setParams({ cutoff: newCutoff, resonance: newRes })
        }

        meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
    })

    return (
        <group position={SPATIAL_LAYOUT.bass.position}>
            {/* Glossy Studio lighting */}
            <spotLight position={[5, 5, 5]} intensity={50} angle={0.3} penumbra={1} castShadow color="#ffffff" />
            <spotLight position={[-5, 5, 5]} intensity={30} angle={0.2} penumbra={1} color="#3390ec" />
            <pointLight position={[0, -2, 2]} intensity={10} color="#ffffff" />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Main Product Chassis */}
                <mesh position={[0, -0.6, 0]} receiveShadow>
                    <boxGeometry args={[6, 0.2, 6]} />
                    <meshPhysicalMaterial
                        color="#111"
                        metalness={0.8}
                        roughness={0.05}
                        clearcoat={1}
                        clearcoatRoughness={0}
                    />
                </mesh>

                {/* The "Liquid" Masterpiece */}
                <mesh
                    ref={meshRef}
                    position={[0, 0.5, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    onPointerDown={(e) => {
                        e.stopPropagation()
                        gestures.onStart(e.clientX, e.clientY, e.point)
                    }}
                    castShadow
                >
                    <sphereGeometry args={[2, 128, 128]} />
                    <MeshDistortMaterial
                        ref={matRef}
                        color="#ffffff"
                        metalness={1.0}
                        roughness={0.02}
                        distort={0.4}
                        speed={2}
                    />
                </mesh>
            </Float>

            {/* Typography */}
            <Text
                position={[0, 4, 0]}
                fontSize={0.4}
                color="#ffffff"
                anchorX="center"
            >
                PURE RADIANCE
            </Text>
            <Text
                position={[0, 3.5, 0]}
                fontSize={0.15}
                color="rgba(255,255,255,0.5)"
                anchorX="center"
                letterSpacing={0.2}
            >
                THE LIQUID BASS CORE — NO. 04
            </Text>

            <Button3D
                position={[0, -2.5, 1.5]}
                label={isPlaying ? "SUSPEND" : "ENGAGE"}
                active={isPlaying}
                onClick={() => togglePlay()}
                color="#ffffff"
                size={0.6}
            />

            <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </group>
    )
}
