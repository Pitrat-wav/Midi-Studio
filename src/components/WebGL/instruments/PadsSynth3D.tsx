/**
 * PadsSynth3D — 3D Visualization for Ambient Pads
 * 
 * Visual Metaphor:
 * - Particle cloud с density based on complexity
 * - Color temperature based on brightness
 * - Expanding/contracting при active state
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePadStore } from '../../../store/instrumentStore'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { useGestureStore } from '../../../logic/GestureManager'

export function PadsSynth3D() {
    const pointsRef = useRef<THREE.Points>(null!)
    const padStore = usePadStore()
    const controls = SPATIAL_LAYOUT.pads.controls

    // Particle count based on complexity
    const particleCount = useMemo(() => {
        return Math.floor(500 + padStore.complexity * 1500) // 500-2000 particles
    }, [padStore.complexity])

    const { positions, colors } = useMemo(() => {
        const positions = new Float32Array(particleCount * 3)
        const colors = new Float32Array(particleCount * 3)

        for (let i = 0; i < particleCount; i++) {
            // Spherical distribution
            const radius = 1 + Math.random() * 2
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = radius * Math.cos(phi)

            // Color based on brightness (warm to cool)
            const hue = THREE.MathUtils.mapLinear(padStore.brightness, 0, 1, 0.55, 0.15) // cyan to orange
            const color = new THREE.Color().setHSL(hue, 0.7, 0.6)
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        }

        return { positions, colors }
    }, [particleCount, padStore.brightness])

    const gestures = useGestureStore()
    const layout = SPATIAL_LAYOUT.pads.position

    useFrame((state) => {
        if (!pointsRef.current) return

        // Slow rotation
        pointsRef.current.rotation.y += 0.002
        pointsRef.current.rotation.x += 0.001

        // Modulation via gesture
        if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(new THREE.Vector3(...layout)) < 5) {
            const dx = gestures.currentPos.x - gestures.startPos.x
            const dy = gestures.currentPos.y - gestures.startPos.y
            padStore.setParams({
                brightness: THREE.MathUtils.clamp(padStore.brightness - dy * 0.005, 0, 1),
                complexity: THREE.MathUtils.clamp(padStore.complexity + dx * 0.005, 0, 1)
            })
        }

        // Pulsating scale when active
        if (padStore.active) {
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
            pointsRef.current.scale.lerp(
                new THREE.Vector3(pulse, pulse, pulse),
                0.05
            )
        } else {
            pointsRef.current.scale.lerp(
                new THREE.Vector3(0.8, 0.8, 0.8),
                0.05
            )
        }
    })

    return (
        <group position={SPATIAL_LAYOUT.pads.position}>
            {/* Particle Cloud */}
            <points
                ref={pointsRef}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    gestures.onStart(e.clientX, e.clientY, e.point, e.pointerId)
                }}
            >
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
                    size={0.02}
                    vertexColors
                    transparent
                    opacity={padStore.active ? 0.8 : 0.4}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Interactive Controls */}
            <Knob3D
                position={controls.brightness}
                value={padStore.brightness}
                min={0}
                max={1}
                label="Brightness"
                onChange={(v) => padStore.setParams({ brightness: v })}
                color="#ff9944"
                size={1}
            />

            <Knob3D
                position={controls.complexity}
                value={padStore.complexity}
                min={0}
                max={1}
                label="Complexity"
                onChange={(v) => padStore.setParams({ complexity: v })}
                color="#ffaa66"
                size={1}
            />

            <Button3D
                position={controls.active}
                label={padStore.active ? "ON" : "OFF"}
                active={padStore.active}
                onClick={() => padStore.togglePlay()}
                color={padStore.active ? "#44ff44" : "#888888"}
                size={0.8}
                variant={padStore.active ? "success" : "default"}
            />

            {/* Ambient Lighting */}
            <pointLight
                position={[0, 0, 0]}
                intensity={padStore.active ? 3 : 1}
                color={new THREE.Color().setHSL(
                    THREE.MathUtils.mapLinear(padStore.brightness, 0, 1, 0.55, 0.15),
                    0.7,
                    0.6
                )}
                distance={10}
            />
        </group>
    )
}
