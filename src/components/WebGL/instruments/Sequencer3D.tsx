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

function TuringMachine3D({ position, register, bits, probability }: { position: [number, number, number], register: number, bits: number, probability: number }) {
    const groupRef = useRef<THREE.Group>(null!)

    useFrame((state) => {
        if (!groupRef.current) return
        groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5
    })

    return (
        <group position={position} ref={groupRef}>
            {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i / 16) * Math.PI * 2
                const radius = 1.2
                const x = Math.cos(angle) * radius
                const z = Math.sin(angle) * radius
                const isActive = (register >> i) & 1

                return (
                    <mesh key={i} position={[x, 0, z]}>
                        <boxGeometry args={[0.2, 0.2, 0.2]} />
                        <meshStandardMaterial
                            color={isActive ? "#00ffff" : "#112222"}
                            emissive={isActive ? "#00ffff" : "#000000"}
                            emissiveIntensity={2}
                        />
                    </mesh>
                )
            })}
            <Text position={[0, -0.5, 0]} fontSize={0.2} color="#00ffff" rotation={[Math.PI / 2, 0, 0]}>TURING MACHINE</Text>
        </group>
    )
}

function ML185_3D({ position, stages, currentIndex }: { position: [number, number, number], stages: Stage[], currentIndex: number }) {
    return (
        <group position={position}>
            {stages.map((stage, i) => {
                const angle = (i / 8) * Math.PI * 2
                const radius = 2
                const x = Math.cos(angle) * radius
                const z = Math.sin(angle) * radius
                const isActive = i === currentIndex

                return (
                    <group key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
                        <mesh>
                            <cylinderGeometry args={[0.3, 0.1, 0.5, 6]} />
                            <meshStandardMaterial
                                color={isActive ? "#ffcc33" : "#333333"}
                                emissive={isActive ? "#ff9900" : "#000000"}
                                emissiveIntensity={isActive ? 2 : 0}
                            />
                        </mesh>
                        <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ffffff">{stage.pitch}</Text>
                    </group>
                )
            })}
            <Text position={[0, -0.2, 0]} fontSize={0.25} color="#ffcc33" rotation={[-Math.PI / 2, 0, 0]}>ML-185 STEP SEQ</Text>
        </group>
    )
}

function SnakeGrid3D({ position, grid, currentIndex }: { position: [number, number, number], grid: SnakeCell[], currentIndex: number }) {
    return (
        <group position={position}>
            {grid.map((cell, i) => {
                const x = (i % 4) - 1.5
                const z = Math.floor(i / 4) - 1.5
                const isActive = i === currentIndex

                return (
                    <mesh key={i} position={[x, 0, z]}>
                        <boxGeometry args={[0.8, 0.05, 0.8]} />
                        <meshStandardMaterial
                            color={isActive ? "#ff00ff" : cell.active ? "#440044" : "#111111"}
                            emissive={isActive ? "#ff00ff" : "#000000"}
                            emissiveIntensity={isActive ? 3 : 0}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                )
            })}
            <Text position={[0, 0.5, 0]} fontSize={0.2} color="#ff00ff">MDD SNAKE</Text>
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

            {/* ML-185 */}
            <ML185_3D
                position={[-4, 0, 0]}
                stages={seq.stages}
                currentIndex={seq.currentStageIndex}
            />

            {/* Turing Machine */}
            <TuringMachine3D
                position={[0, 2, -2]}
                register={seq.turingRegister}
                bits={seq.turingBits}
                probability={seq.turingProbability}
            />

            <group position={[0, 1.5, -2]}>
                <Knob3D
                    label="Entropy"
                    position={[-1, 0, 1]}
                    value={seq.turingProbability}
                    min={0} max={1}
                    onChange={(v) => seq.setTuringParam({ turingProbability: v })}
                    color="#00ffff"
                />
            </group>

            {/* MDD Snake */}
            <SnakeGrid3D
                position={[4, 0, 0]}
                grid={seq.snakeGrid}
                currentIndex={seq.currentSnakeIndex}
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
