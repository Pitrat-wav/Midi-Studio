/**
 * DrumMachine3D — Генеративная WebGL визуализация драм-машины
 * 
 * Визуальная Метафора:
 * - Kick: Большая пульсирующая сфера в центре
 * - Snare: Icosahedron с vertex displacement
 * - HiHat: Поток частиц по спирали  
 * - Bjorklund Patterns: Светящиеся кольца частиц
 * 
 * Интеграция:
 * - Подписывается на drumStore для параметров
 * - Реагирует на MIDI triggers через AudioVisualBridge
 * - FFT визуализация low frequencies на kick ring
 * 
 * NEW (3D UX):
 * - Interactive 3D controls (knobs, buttons)
 * - Ray-cast based interaction
 * - Spatial layout from SpatialLayout.ts
 */

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDrumStore } from '../../../store/instrumentStore'
import { useVisualStore } from '../../../store/visualStore'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { useGestureStore } from '../../../logic/GestureManager'
import { audioReactiveVertexShader, fresnelFragmentShader } from '../../../shaders/audioReactive.glsl'

/**
 * Kick Drum — Центральная пульсирующая сфера
 */
function KickDrum() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const bridge = useAudioVisualBridge()
    const kickPitch = useDrumStore(s => s.kick.pitch)
    const setParams = useDrumStore(s => s.setParams)
    const gestures = useGestureStore()

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uPitch: { value: 0 },
        uBaseColor: { value: new THREE.Color('#ff4444') },
        uGlowColor: { value: new THREE.Color('#ffaa00') },
        uResonanceExp: { value: 3.0 }
    }), [])

    useFrame((state) => {
        if (!meshRef.current) return

        const drumState = useDrumStore.getState()
        const currentKickPitch = drumState.kick.pitch
        const kickTrigger = bridge.getPulse('kick')

        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uAudioIntensity.value = 0.2 + kickTrigger * 0.8
        uniforms.uPitch.value = currentKickPitch * 0.2

        const scale = 1.0 + kickTrigger * 0.5
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2)
        meshRef.current.rotation.y += 0.002

        // Gesture Modulation
        if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(meshRef.current.position) < 2) {
            const dy = gestures.currentPos.y - gestures.startPos.y
            const dx = gestures.currentPos.x - gestures.startPos.x

            setParams('kick', {
                pitch: THREE.MathUtils.clamp(drumState.kick.pitch - dy * 0.005, 0, 1),
                decay: THREE.MathUtils.clamp(drumState.kick.decay + dx * 0.005, 0, 1)
            })
        }
    })

    return (
        <mesh
            ref={meshRef}
            position={[0, 0, 0]}
            onPointerDown={(e) => {
                e.stopPropagation()
                gestures.onStart(e.clientX, e.clientY, e.point)
            }}
        >
            <sphereGeometry args={[1.5, 64, 64]} />
            <shaderMaterial
                vertexShader={audioReactiveVertexShader}
                fragmentShader={fresnelFragmentShader}
                uniforms={uniforms}
            />
        </mesh>
    )
}

/**
 * Snare Drum — Icosahedron с deformation
 */
function SnareDrum() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const bridge = useAudioVisualBridge()
    const snarePitch = useDrumStore(s => s.snare.pitch)
    const setParams = useDrumStore(s => s.setParams)
    const gestures = useGestureStore()

    useFrame((state) => {
        if (!meshRef.current) return
        const drumState = useDrumStore.getState()
        const snareTrigger = bridge.getPulse('snare')

        const scale = 1.0 + snareTrigger * 0.4
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15)
        meshRef.current.rotation.x += 0.01
        meshRef.current.rotation.y += 0.015

        // Gesture Modulation
        if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(meshRef.current.position) < 2) {
            const dy = gestures.currentPos.y - gestures.startPos.y
            setParams('snare', {
                pitch: THREE.MathUtils.clamp(drumState.snare.pitch - dy * 0.005, 0, 1)
            })
        }
    })

    const color = useMemo(() => {
        const hue = THREE.MathUtils.mapLinear(snarePitch, 0, 1, 0.55, 0.7)
        return new THREE.Color().setHSL(hue, 0.9, 0.6)
    }, [snarePitch])

    return (
        <mesh
            ref={meshRef}
            position={[-3, 0, -2]}
            onPointerDown={(e) => {
                e.stopPropagation()
                gestures.onStart(e.clientX, e.clientY, e.point)
            }}
        >
            <icosahedronGeometry args={[0.8, 2]} />
            <MeshWobbleMaterial
                color={color}
                speed={1}
                factor={0.2}
                emissive={color}
                emissiveIntensity={0}
                metalness={0.8}
                roughness={0.2}
            />
        </mesh>
    )
}

/**
 * HiHat — Частицы по спирали
 */
function HiHatParticles() {
    const pointsRef = useRef<THREE.Points>(null!)
    const bridge = useAudioVisualBridge()
    const hihatPitch = useDrumStore(s => s.hihat.pitch)
    const drumStore = useDrumStore()
    const particleCount = useDrumStore(s => s.hihat.steps * 10)

    const { positions, colors } = useMemo(() => {
        const positions = new Float32Array(particleCount * 3)
        const colors = new Float32Array(particleCount * 3)

        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount
            // Спираль Архимеда
            const angle = t * Math.PI * 4
            const radius = 2 + t * 1

            positions[i * 3] = Math.cos(angle) * radius
            positions[i * 3 + 1] = t * 2 - 1 // вертикальное распределение
            positions[i * 3 + 2] = Math.sin(angle) * radius

            // Цвет от желтого до белого
            const semitones = THREE.MathUtils.mapLinear(hihatPitch, 0, 1, -12, 12)
            const hue = THREE.MathUtils.mapLinear(semitones, -12, 12, 0.15, 0.18)
            const color = new THREE.Color().setHSL(hue, 0.7, 0.7 + t * 0.3)
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        }

        return { positions, colors }
    }, [particleCount, hihatPitch])

    useFrame((state) => {
        if (!pointsRef.current) return
        const hihatTrigger = bridge.getPulse('hihat')

        // Вращение спирали
        pointsRef.current.rotation.y += 0.005

        // Масштаб при trigger
        const scale = 1.0 + hihatTrigger * 0.2
        pointsRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.3)

        // Обновляем размер точек
        const material = pointsRef.current.material as THREE.PointsMaterial
        material.size = 0.05 + hihatTrigger * 0.05
    })

    return (
        <points ref={pointsRef} position={[3, 0, -2]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particleCount}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

/**
 * Bjorklund Pattern Ring — Визуализация эвклидовых ритмов
 */
interface BjorklundRingProps {
    instrument: 'kick' | 'snare' | 'hihat'
    position: [number, number, number]
    color: THREE.Color
}

function BjorklundRing({ instrument, position, color }: BjorklundRingProps) {
    const groupRef = useRef<THREE.Group>(null!)
    const steps = useDrumStore(s => s[instrument].steps)
    const pulses = useDrumStore(s => s[instrument].pulses)
    const currentStep = useVisualStore(s => s.triggers[instrument])

    // Генерируем Bjorklund pattern (упрощенная версия)
    const pattern = useMemo(() => {
        const result: boolean[] = Array(steps).fill(false)
        const interval = steps / pulses
        for (let i = 0; i < pulses; i++) {
            result[Math.floor(i * interval)] = true
        }
        return result
    }, [steps, pulses])

    useFrame((state) => {
        if (!groupRef.current) return
        groupRef.current.rotation.z = state.clock.elapsedTime * 0.2
    })

    return (
        <group ref={groupRef} position={position}>
            {pattern.map((active, i) => {
                const angle = (i / steps) * Math.PI * 2
                const radius = 1.2
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                return (
                    <mesh key={i} position={[x, y, 0]}>
                        <circleGeometry args={[0.08, 16]} />
                        <meshBasicMaterial
                            color={active ? color : new THREE.Color('#222')}
                            transparent
                            opacity={active ? (currentStep > 0 ? 1 : 0.6) : 0.3}
                        />
                    </mesh>
                )
            })}

            {/* Ring outline */}
            <mesh rotation={[0, 0, 0]}>
                <ringGeometry args={[1.1, 1.3, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.2}
                />
            </mesh>
        </group>
    )
}

const KickControls = () => {
    const kick = useDrumStore(s => s.kick)
    const setParams = useDrumStore(s => s.setParams)
    const triggerKick = useDrumStore(s => s.triggerKick)
    const controls = SPATIAL_LAYOUT.drums.controls

    return (
        <>
            <Knob3D
                position={controls.kickPitch}
                value={kick.pitch}
                min={0} max={1}
                label="Kick Pitch"
                onChange={(v) => setParams('kick', { pitch: v })}
                color="#ff4444"
                size={0.8}
            />
            <Knob3D
                position={controls.kickDecay}
                value={kick.decay}
                min={0} max={1}
                label="Kick Decay"
                onChange={(v) => setParams('kick', { decay: v })}
                color="#ff4444"
                size={0.8}
            />
            <Knob3D
                position={controls.kickVolume}
                value={THREE.MathUtils.mapLinear(kick.volume, -60, 0, 0, 1)}
                min={0} max={1}
                label="Kick Vol"
                onChange={(v) => setParams('kick', { volume: THREE.MathUtils.mapLinear(v, 0, 1, -60, 0) })}
                color="#ff4444"
                size={0.8}
            />
            <Button3D
                position={[controls.kickMute[0], controls.kickMute[1] - 0.7, controls.kickMute[2]]}
                label="TRIG"
                active={false}
                onClick={triggerKick}
                color="#ff4444"
                size={0.5}
            />
            <Knob3D
                position={controls.kickSteps}
                value={kick.steps / 32}
                min={0} max={1} step={1 / 32}
                label="Kick Steps"
                onChange={(v) => setParams('kick', { steps: Math.round(v * 32) })}
                color="#ff4444"
                size={0.7}
            />
            <Knob3D
                position={controls.kickPulses}
                value={kick.pulses / 32}
                min={0} max={1} step={1 / 32}
                label="Kick Pulses"
                onChange={(v) => setParams('kick', { pulses: Math.round(v * 32) })}
                color="#ff4444"
                size={0.7}
            />
        </>
    )
}

/**
 * Main DrumMachine3D Component
 */
export function DrumMachine3D() {
    const bridge = useAudioVisualBridge()

    // Register with Bridge
    useEffect(() => {
        bridge.register('drumMachine3D', () => { })
        return () => bridge.unregister('drumMachine3D')
    }, [bridge])

    return (
        <group>
            <KickDrum />
            <SnareDrum />
            <HiHatParticles />

            <BjorklundRing
                instrument="kick"
                position={[0, -2.5, 0]}
                color={new THREE.Color('#ff4444')}
            />
            <BjorklundRing
                instrument="snare"
                position={[-3, -2.5, -2]}
                color={new THREE.Color('#4444ff')}
            />
            <BjorklundRing
                instrument="hihat"
                position={[3, -2.5, -2]}
                color={new THREE.Color('#ffff44')}
            />

            <KickControls />

            <ambientLight intensity={0.3} />
            <pointLight position={[0, 5, 5]} intensity={1} color="#ff4444" />
            <pointLight position={[-5, 0, 0]} intensity={0.5} color="#4444ff" />
        </group>
    )
}
