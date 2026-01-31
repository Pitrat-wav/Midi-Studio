/**
 * Sequencer3D — Holographic HUB for ML-185, Snake, and Turing Machine
 * 
 * Features:
 * - Circular ML-185 with glowing step indicators
 * - Rotating Turing Machine ring showing bit states
 * - 4x4 MDD Snake grid with holographic trail
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useSequencerStore, Stage, SnakeCell } from '../../../store/instrumentStore'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'

// ML185 and Snake extracted to separate files.
// Sequencer3D now acts as the Turing Machine / Hub.

function NeuralRingVisual({ position, register, bits, probability }: { position: [number, number, number], register: number, bits: number, probability: number }) {
    const groupRef = useRef<THREE.Group>(null!)
    const activeMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: "#00ffff", emissive: "#00ffff", emissiveIntensity: 2,
        metalness: 0.8, roughness: 0.1, transmission: 0.2
    }), [])
    const inactiveMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: "#112233", emissive: "#000000",
        metalness: 0.5, roughness: 0.4, transmission: 0.1
    }), [])

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002
            // Pulse scale based on probability
            const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
            groupRef.current.scale.set(s, s, s)
        }
    })

    return (
        <group position={position} ref={groupRef}>
            {/* Nucleus */}
            <mesh position={[0, 0, 0]}>
                <icosahedronGeometry args={[0.5, 1]} />
                <meshStandardMaterial
                    color="#ff00ff"
                    emissive="#ff00ff"
                    emissiveIntensity={probability * 2}
                    wireframe
                />
            </mesh>

            {/* Neural Nodes */}
            {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i / 16) * Math.PI * 2
                const nextAngle = ((i + 1) / 16) * Math.PI * 2
                const radius = 2.0

                const x = Math.cos(angle) * radius
                const z = Math.sin(angle) * radius

                const nx = Math.cos(nextAngle) * radius
                const nz = Math.sin(nextAngle) * radius

                const isActive = (register >> i) & 1

                return (
                    <group key={i}>
                        {/* Node */}
                        <mesh position={[x, 0, z]}>
                            <sphereGeometry args={[0.15, 16, 16]} />
                            <primitive object={isActive ? activeMaterial : inactiveMaterial} />
                        </mesh>

                        {/* Synapse Connection (Line to next) */}
                        <Line
                            points={[[x, 0, z], [nx, 0, nz]]}
                            color={isActive ? "#00ffff" : "#112233"}
                            lineWidth={isActive ? 2 : 0.5}
                            transparent
                            opacity={isActive ? 0.8 : 0.2}
                        />

                        {/* Energy Beam to Center (if active) */}
                        {isActive ? (
                            <Line
                                points={[[x, 0, z], [0, 0, 0]]}
                                color="#ff00ff"
                                lineWidth={1}
                                transparent
                                opacity={0.3}
                            />
                        ) : null}
                    </group>
                )
            })}

            <Text position={[0, -1, 0]} fontSize={0.2} color="#00ffff" rotation={[Math.PI / 2, 0, 0]}>
                NEURAL SEQUENCER
            </Text>
        </group>
    )
}

export function Sequencer3D() {
    const seq = useSequencerStore()
    const layout = SPATIAL_LAYOUT.sequencer.position

    return (
        <group position={layout}>
            {/* Center Area: Global controls */}
            <group position={[0, 1, 0]}>
                <Button3D
                    label={seq.isStagesPlaying ? "STAGES ON" : "STAGES OFF"}
                    position={[-2, 0, 2]}
                    active={seq.isStagesPlaying}
                    onClick={() => seq.toggleStagesPlay()}
                    color="#ffcc33"
                />
                <Button3D
                    label={seq.isSnakePlaying ? "SNAKE ON" : "SNAKE OFF"}
                    position={[0, 0, 2]}
                    active={seq.isSnakePlaying}
                    onClick={() => seq.toggleSnakePlay()}
                    color="#ff00ff"
                />
                <Button3D
                    label={seq.isTuringPlaying ? "TURING ON" : "TURING OFF"}
                    position={[2, 0, 2]}
                    active={seq.isTuringPlaying}
                    onClick={() => seq.toggleTuringPlay()}
                    color="#00ffff"
                />
            </group>

            {/* Turing Machine as Neural Ring */}
            <NeuralRingVisual
                position={[0, 2, -2]}
                register={seq.turingRegister}
                bits={seq.turingBits}
                probability={seq.turingProbability}
            />

            <Text
                position={[0, 5, 0]}
                fontSize={0.5}
                color="#ffffff"
                anchorX="center"
            >
                SEQUENCER HUB: HOLOGRAPHIC LOGIC
            </Text>
        </group>
    )
}
