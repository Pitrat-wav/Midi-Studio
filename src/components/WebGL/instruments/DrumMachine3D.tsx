/**
 * DrumMachine3D — Generative Physics Drum Visualization & Control Console
 * 
 * Features:
 * - Physics-based Generative Visuals (Gravity Kick, Graphite Snare, Orbital HiHats)
 * - Interactive Holographic Rings (Drag to change Pulses)
 * - "Mission Control" Console for precise parameter tuning
 */

import { useRef, useMemo, useState, memo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDrumStore } from '../../../store/instrumentStore'
import { useVisualStore } from '../../../store/visualStore'
import { useAudioStore } from '../../../store/audioStore'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { Text, Box, RoundedBox, MeshTransmissionMaterial, Instances, Instance } from '@react-three/drei'
import { WhiskMaterial } from '../WhiskMaterial'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { useGestureStore } from '../../../logic/GestureManager'
import { audioReactiveVertexShader, fresnelFragmentShader } from '../../../shaders/audioReactive.glsl'

// --- Generative Visuals (Preserved & Polished) ---

const KickDrum = memo(function KickDrum() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const bridge = useAudioVisualBridge()
    const kickPitch = useDrumStore(s => s.kick.pitch)
    const setParams = useDrumStore(s => s.setParams)
    const gestures = useGestureStore()

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uPitch: { value: 0 },
        uBaseColor: { value: new THREE.Color('#ff2244') }, // Deeper Red
        uGlowColor: { value: new THREE.Color('#ffaa44') },
        uResonanceExp: { value: 3.0 }
    }), [])

    useFrame((state) => {
        if (!meshRef.current) return
        const trigger = bridge.getPulse('kick')
        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uAudioIntensity.value = 0.2 + trigger * 0.8
        uniforms.uPitch.value = kickPitch * 0.2

        const scale = 1.0 + trigger * 0.3
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2)
        meshRef.current.rotation.y += 0.005

        // Direct Interact - read store directly to avoid re-renders during drag
        const gestureState = useGestureStore.getState()
        if (gestureState.activeGesture === 'drag' && gestureState.targetPosition && gestureState.targetPosition.distanceTo(meshRef.current.position) < 2.5) {
            const dy = gestureState.currentPos.y - gestureState.startPos.y
            // We use getState here to avoid stale closure or dependency on changing store values
            const currentDecay = useDrumStore.getState().kick.decay
            setParams('kick', { decay: THREE.MathUtils.clamp(currentDecay + dy * 0.01, 0.1, 1) })
        }
    })

    return (
        <group position={[0, 1, 0]}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1.2, 64, 64]} />
                <shaderMaterial
                    vertexShader={audioReactiveVertexShader}
                    fragmentShader={fresnelFragmentShader}
                    uniforms={uniforms}
                />
            </mesh>
            {/* Glass Shell */}
            <mesh>
                <sphereGeometry args={[1.4, 64, 64]} />
                <MeshTransmissionMaterial
                    backside
                    samples={4}
                    thickness={0.5}
                    chromaticAberration={0.5}
                    anisotropy={0.5}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.2}
                    color="#ffcccc"
                    transmission={1}
                    roughness={0.1}
                />
            </mesh>
        </group>
    )
})

const SnareDrum = memo(function SnareDrum() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const bridge = useAudioVisualBridge()

    useFrame(() => {
        if (!meshRef.current) return
        const trigger = bridge.getPulse('snare')
        const scale = 1.0 + trigger * 0.4
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.25)
        meshRef.current.rotation.x += 0.02
        meshRef.current.rotation.z += 0.01
    })

    return (
        <mesh ref={meshRef} position={[-3.5, 1, 1]}>
            <tetrahedronGeometry args={[0.8, 2]} />
            <WhiskMaterial
                baseColor="#4466ff"
                emissive="#1122aa"
                metalness={0.8}
                roughness={0.1}
                distort={0.4}
                speed={2}
            />
        </mesh>
    )
})

const HiHatParticles = memo(function HiHatParticles() {
    const groupRef = useRef<THREE.Group>(null!)
    const bridge = useAudioVisualBridge()

    useFrame((state) => {
        if (!groupRef.current) return
        const trigger = bridge.getPulse('hihat')
        groupRef.current.rotation.y += 0.02 + trigger * 0.1
        groupRef.current.scale.setScalar(1 + trigger * 0.2)
    })

    return (
        <group ref={groupRef} position={[3.5, 1, 1]}>
            {Array.from({ length: 40 }).map((_, i) => (
                <mesh key={i} position={[Math.cos(i / 40 * Math.PI * 2) * 1.2, (Math.random() - 0.5) * 0.5, Math.sin(i / 40 * Math.PI * 2) * 1.2]}>
                    <boxGeometry args={[0.05, 0.05, 0.05]} />
                    <WhiskMaterial baseColor="#ffff44" emissive="#ffff00" />
                </mesh>
            ))}
        </group>
    )
})

// --- Interactive Bjorklund Rings ---

const InteractiveRing = memo(function InteractiveRing({ instrument, radius, color, yPos }: { instrument: 'kick' | 'snare' | 'hihat', radius: number, color: string, yPos: number }) {
    const steps = useDrumStore(s => s[instrument].steps)
    const pulses = useDrumStore(s => s[instrument].pulses)
    
    // Removed globalStep hook to prevent re-renders on every beat
    const groupRef = useRef<THREE.Group>(null!)
    const meshRefs = useRef<(THREE.Mesh | null)[]>([])
    const patternRef = useRef<boolean[]>([])

    // Pattern generation
    const pattern = useMemo(() => {
        const res = Array(steps).fill(false)
        if (pulses > 0) {
            const bucket = steps
            let count = 0
            for (let i = 0; i < steps; i++) {
                count += pulses
                if (count >= bucket) { count -= bucket; res[i] = true }
            }
        }
        return res
    }, [steps, pulses])

    // Sync pattern to ref for useFrame usage
    useEffect(() => {
        patternRef.current = pattern
        meshRefs.current = meshRefs.current.slice(0, steps)
    }, [pattern, steps])

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.05 * (yPos === 0 ? 1 : yPos === -0.5 ? -1 : 0.5)
        }

        // Access global step directly from store
        const globalStep = useAudioStore.getState().globalStep
        const currentStep = globalStep % steps

        // Update opacity of ring segments directly
        meshRefs.current.forEach((mesh, i) => {
            if (!mesh) return
            const active = patternRef.current[i]
            // Check for current step match
            const isCurrent = Math.abs(currentStep - i) < 0.5
            const targetOpacity = active ? (isCurrent ? 1 : 0.6) : 0.1
            
            const material = mesh.material as THREE.MeshBasicMaterial
            // Smoothly interpolate opacity
            material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.2)
        })
    })

    return (
        <group ref={groupRef} position={[0, yPos, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius, radius + 0.05, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Active Steps */}
            {pattern.map((_, i) => {
                const angle = (i / steps) * Math.PI * 2
                const arcLength = (Math.PI * 2) / steps * 0.5
                return (
                    <mesh 
                        key={i} 
                        ref={(el) => (meshRefs.current[i] = el)}
                        rotation={[-Math.PI / 2, 0, angle]}
                    >
                        <ringGeometry args={[radius, radius + 0.1, 32, 1, 0, arcLength]} />
                        <meshBasicMaterial
                            color={color}
                            transparent 
                            opacity={0.1} // Initial opacity, updated in useFrame
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                )
            })}
        </group>
    )
})

// --- Control Console ---

const ChannelStrip = memo(function ChannelStrip({ instrument, xPos, color, label }: { instrument: 'kick' | 'snare' | 'hihat', xPos: number, color: string, label: string }) {
    const state = useDrumStore(s => s[instrument])
    const setParams = useDrumStore(s => s.setParams)
    // Cast to any to avoid type complexity with dynamic key access
    const play = useDrumStore(s => s[`trigger${label}` as 'triggerKick' | 'triggerSnare' | 'triggerHiHat'])

    return (
        <group position={[xPos, 0, 0]}>
            {/* Backplate */}
            <RoundedBox args={[2.8, 0.2, 3]} radius={0.1} position={[0, -0.1, 0]}>
                <WhiskMaterial baseColor="#1a1a1a" roughness={0.5} metalness={0.5} />
            </RoundedBox>

            {/* Label */}
            <Text position={[0, 0.15, -1.2]} fontSize={0.25} color={color} anchorX="center" fontWeight="bold">{label.toUpperCase()}</Text>

            {/* Knobs Row 1 */}
            <Knob3D
                position={[-0.8, 0.3, -0.4]}
                value={state.pitch} min={0} max={1}
                label="PITCH" color={color} size={0.6}
                onChange={(v) => setParams(instrument, { pitch: v })}
            />
            <Knob3D
                position={[0.8, 0.3, -0.4]}
                value={state.decay} min={0.1} max={1}
                label="DECAY" color={color} size={0.6}
                onChange={(v) => setParams(instrument, { decay: v })}
            />

            {/* Knobs Row 2 (Sequencer) */}
            <Knob3D
                position={[-0.8, 0.3, 0.6]}
                value={state.steps / 32} min={0} max={1} step={1 / 32}
                label="STEPS" color={color} size={0.6}
                onChange={(v) => setParams(instrument, { steps: Math.max(1, Math.round(v * 32)) })}
            />
            <Knob3D
                position={[0.8, 0.3, 0.6]}
                value={state.pulses / 32} min={0} max={1} step={1 / 32}
                label="PULSES" color={color} size={0.6}
                onChange={(v) => setParams(instrument, { pulses: Math.round(v * 32) })}
            />

            {/* Trig Button */}
            <Button3D
                position={[0, 0.2, 1.3]}
                label="TRIG" color={color} size={0.6}
                active={false}
                onClick={() => (play as any)()}
            />
        </group>
    )
})

const ControlConsole = memo(function ControlConsole() {
    return (
        <group position={[0, -3.5, 4]} rotation={[-Math.PI / 6, 0, 0]}>
            {/* Desk Base */}
            <RoundedBox args={[11, 0.1, 4.5]} radius={0.2} position={[0, -0.3, 0]}>
                <WhiskMaterial baseColor="#050505" roughness={0.2} metalness={0.8} />
            </RoundedBox>

            <ChannelStrip instrument="snare" xPos={-3.5} color="#4466ff" label="Snare" />
            <ChannelStrip instrument="kick" xPos={0} color="#ff2244" label="Kick" />
            <ChannelStrip instrument="hihat" xPos={3.5} color="#ffff44" label="HiHat" />
        </group>
    )
})

export const DrumMachine3D = memo(function DrumMachine3D() {
    return (
        <group position={SPATIAL_LAYOUT.drums.position}>
            {/* Visuals suspended above */}
            <group position={[0, 2, 0]}>
                <KickDrum />
                <SnareDrum />
                <HiHatParticles />

                {/* Holographic Pattern Rings - Stacked vertically around kick */}
                <InteractiveRing instrument="kick" radius={2.0} color="#ff2244" yPos={0} />
                <InteractiveRing instrument="snare" radius={2.5} color="#4466ff" yPos={0.2} />
                <InteractiveRing instrument="hihat" radius={3.0} color="#ffff44" yPos={0.4} />
            </group>

            {/* Physical Controls below */}
            <ControlConsole />

            <Text position={[0, 5, -2]} fontSize={0.5} color="#ffffff" anchorX="center">
                GENERATIVE DRUM LAB
            </Text>
        </group>
    )
})
