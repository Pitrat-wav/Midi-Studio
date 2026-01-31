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

/**
 * Kick Drum — Центральная пульсирующая сфера
 */
function KickDrum() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const kickTrigger = useVisualStore(s => s.triggers.kick)
    const kickPitch = useDrumStore(s => s.kick.pitch)
    const kickDecay = useDrumStore(s => s.kick.decay)

    useFrame(() => {
        if (!meshRef.current) return

        // Pulsation на kick trigger
        const scale = 1.0 + kickTrigger * 0.5
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2)

        // Небольшое вращение
        meshRef.current.rotation.y += 0.002
    })

    // Цвет зависит от pitch (низкие частоты = красный, высокие = оранжевый)
    // drumStore.pitch is normalized 0-1, convert to semitones first
    const color = useMemo(() => {
        const semitones = THREE.MathUtils.mapLinear(kickPitch, 0, 1, -12, 12)
        const hue = THREE.MathUtils.mapLinear(semitones, -12, 12, 0, 0.1) // 0° to 36° hue
        return new THREE.Color().setHSL(hue, 0.8, 0.5)
    }, [kickPitch])

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            <sphereGeometry args={[1.5, 64, 64]} />
            <MeshDistortMaterial
                color={color}
                envMapIntensity={2}
                clearcoat={1}
                clearcoatRoughness={0.1}
                metalness={0.9}
                roughness={0.1}
                distort={0.2 + kickTrigger * 0.3}
                speed={2}
                emissive={color}
                emissiveIntensity={kickTrigger * 2}
            />
        </mesh>
    )
}

/**
 * Snare Drum — Icosahedron с deformation
 */
function SnareDrum() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const snareTrigger = useVisualStore(s => s.triggers.snare)
    const snarePitch = useDrumStore(s => s.snare.pitch)

    useFrame((state) => {
        if (!meshRef.current) return

        // Bounce эффект при trigger
        const scale = 1.0 + snareTrigger * 0.4
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.15)

        // Вращение
        meshRef.current.rotation.x += 0.01
        meshRef.current.rotation.y += 0.015
    })

    const color = useMemo(() => {
        const semitones = THREE.MathUtils.mapLinear(snarePitch, 0, 1, -12, 12)
        const hue = THREE.MathUtils.mapLinear(semitones, -12, 12, 0.55, 0.65) // cyan-blue range
        return new THREE.Color().setHSL(hue, 0.9, 0.6)
    }, [snarePitch])

    return (
        <mesh ref={meshRef} position={[-3, 0, -2]}>
            <icosahedronGeometry args={[0.8, 2]} />
            <MeshWobbleMaterial
                color={color}
                speed={1 + snareTrigger * 4}
                factor={0.2 + snareTrigger * 0.5}
                emissive={color}
                emissiveIntensity={snareTrigger * 1.5}
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
    const hihatTrigger = useVisualStore(s => s.triggers.hihat)
    const hihatPitch = useDrumStore(s => s.hihat.pitch)
    const drumStore = useDrumStore()

    // Количество частиц зависит от Bjorklund steps
    const particleCount = drumStore.hihat.steps * 10

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
    const drumStore = useDrumStore()
    const currentStep = useVisualStore(s => s.triggers[instrument])

    const steps = drumStore[instrument].steps
    const pulses = drumStore[instrument].pulses

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

/**
 * Main DrumMachine3D Component with Interactive Controls
 */
export function DrumMachine3D() {
    const bridge = useAudioVisualBridge()
    const drumStore = useDrumStore()
    const controls = SPATIAL_LAYOUT.drums.controls

    // Register this component with AudioVisualBridge
    useEffect(() => {
        const handleAudioData = (data: any) => {
            // Можно использовать FFT data для дополнительных эффектов
            // Например, kick ring реагирует на low frequencies
        }

        bridge.register('drumMachine3D', handleAudioData)

        return () => {
            bridge.unregister('drumMachine3D')
        }
    }, [bridge])

    return (
        <group>
            {/* Основные инструменты */}
            <KickDrum />
            <SnareDrum />
            <HiHatParticles />

            {/* Bjorklund Pattern Rings */}
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

            {/* INTERACTIVE CONTROLS */}

            {/* Kick Controls */}
            <Knob3D
                position={controls.kickPitch}
                value={drumStore.kick.pitch}
                min={0}
                max={1}
                label="Kick Pitch"
                onChange={(v) => drumStore.setParams('kick', { pitch: v })}
                color="#ff4444"
                size={0.8}
            />
            <Knob3D
                position={controls.kickDecay}
                value={drumStore.kick.decay}
                min={0}
                max={1}
                label="Kick Decay"
                onChange={(v) => drumStore.setParams('kick', { decay: v })}
                color="#ff4444"
                size={0.8}
            />
            <Knob3D
                position={controls.kickVolume}
                value={THREE.MathUtils.mapLinear(drumStore.kick.volume, -60, 0, 0, 1)}
                min={0}
                max={1}
                label="Kick Vol"
                onChange={(v) => drumStore.setParams('kick', { volume: THREE.MathUtils.mapLinear(v, 0, 1, -60, 0) })}
                color="#ff4444"
                size={0.8}
            />
            <Button3D
                position={controls.kickMute}
                label="Mute"
                active={drumStore.kick.muted}
                onClick={() => drumStore.setParams('kick', { muted: !drumStore.kick.muted })}
                color="#ff4444"
                size={0.6}
            />

            {/* Snare Controls */}
            <Knob3D
                position={controls.snarePitch}
                value={drumStore.snare.pitch}
                min={0}
                max={1}
                label="Snare Pitch"
                onChange={(v) => drumStore.setParams('snare', { pitch: v })}
                color="#4444ff"
                size={0.8}
            />
            <Knob3D
                position={controls.snareDecay}
                value={drumStore.snare.decay}
                min={0}
                max={1}
                label="Snare Decay"
                onChange={(v) => drumStore.setParams('snare', { decay: v })}
                color="#4444ff"
                size={0.8}
            />
            <Knob3D
                position={controls.snareVolume}
                value={THREE.MathUtils.mapLinear(drumStore.snare.volume, -60, 0, 0, 1)}
                min={0}
                max={1}
                label="Snare Vol"
                onChange={(v) => drumStore.setParams('snare', { volume: THREE.MathUtils.mapLinear(v, 0, 1, -60, 0) })}
                color="#4444ff"
                size={0.8}
            />
            <Button3D
                position={controls.snareMute}
                label="Mute"
                active={drumStore.snare.muted}
                onClick={() => drumStore.setParams('snare', { muted: !drumStore.snare.muted })}
                color="#4444ff"
                size={0.6}
            />

            {/* HiHat Controls */}
            <Knob3D
                position={controls.hihatPitch}
                value={drumStore.hihat.pitch}
                min={0}
                max={1}
                label="HiHat Pitch"
                onChange={(v) => drumStore.setParams('hihat', { pitch: v })}
                color="#ffff44"
                size={0.8}
            />
            <Knob3D
                position={controls.hihatDecay}
                value={drumStore.hihat.decay}
                min={0}
                max={1}
                label="HiHat Decay"
                onChange={(v) => drumStore.setParams('hihat', { decay: v })}
                color="#ffff44"
                size={0.8}
            />
            <Knob3D
                position={controls.hihatVolume}
                value={THREE.MathUtils.mapLinear(drumStore.hihat.volume, -60, 0, 0, 1)}
                min={0}
                max={1}
                label="HiHat Vol"
                onChange={(v) => drumStore.setParams('hihat', { volume: THREE.MathUtils.mapLinear(v, 0, 1, -60, 0) })}
                color="#ffff44"
                size={0.8}
            />
            <Button3D
                position={controls.hihatMute}
                label="Mute"
                active={drumStore.hihat.muted}
                onClick={() => drumStore.setParams('hihat', { muted: !drumStore.hihat.muted })}
                color="#ffff44"
                size={0.6}
            />

            {/* Pattern Controls */}
            <Knob3D
                position={controls.kickSteps}
                value={drumStore.kick.steps / 32} // normalize to 0-1
                min={0}
                max={1}
                step={1 / 32}
                label="Kick Steps"
                onChange={(v) => drumStore.setParams('kick', { steps: Math.round(v * 32) })}
                color="#ff4444"
                size={0.7}
            />
            <Knob3D
                position={controls.kickPulses}
                value={drumStore.kick.pulses / 32}
                min={0}
                max={1}
                step={1 / 32}
                label="Kick Pulses"
                onChange={(v) => drumStore.setParams('kick', { pulses: Math.round(v * 32) })}
                color="#ff4444"
                size={0.7}
            />

            {/* Ambient Light */}
            <ambientLight intensity={0.3} />
            <pointLight position={[0, 5, 5]} intensity={1} color="#ff4444" />
            <pointLight position={[-5, 0, 0]} intensity={0.5} color="#4444ff" />
        </group>
    )
}
