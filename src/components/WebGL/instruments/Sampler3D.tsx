import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { useSamplerStore } from '../../../store/instrumentStore'
import { useAudioStore } from '../../../store/audioStore'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { CRTShader } from '../shaders/CRTShader'

// --- CMI V UI Components ---

function PageRGrid({ activeStep, activeSlice, grid, onToggle }: { activeStep: number, activeSlice: number, grid: boolean[], onToggle: (i: number) => void }) {
    return (
        <group position={[-2.4, 0.8, 0.01]}>
            {Array.from({ length: 16 }).map((_, step) => (
                Array.from({ length: 8 }).map((_, slice) => {
                    const isActive = step === activeStep
                    const isOn = grid[step] && slice === 0

                    return (
                        <mesh
                            key={`${step}-${slice}`}
                            position={[step * 0.3, slice * -0.25, 0]}
                            onClick={(e) => { e.stopPropagation(); onToggle(step) }}
                        >
                            <planeGeometry args={[0.25, 0.2]} />
                            <meshBasicMaterial
                                color={isOn ? "#00ff66" : (isActive ? "#004422" : "#002211")}
                                toneMapped={false}
                            />
                        </mesh>
                    )
                })
            ))}
            <Text position={[2.25, 0.5, 0]} fontSize={0.2} color="#00ff66">
                PAGE R - SEQUENCER
            </Text>
        </group>
    )
}

function VectorWaveform({ position }: { position: [number, number, number] }) {
    const lineRef = useRef<THREE.Line>(null!)
    const bridge = useAudioVisualBridge()

    const points = useMemo(() => {
        const p = []
        for (let i = 0; i < 64; i++) {
            p.push(new THREE.Vector3((i / 64) * 4.8 - 2.4, 0, 0))
        }
        return p
    }, [])

    const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

    const line = useMemo(() => new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: 0x00ff66,
        transparent: true,
        opacity: 0.8,
        toneMapped: false
    })), [geometry])

    useFrame(() => {
        if (!lineRef.current) return
        const data = bridge.getFFTData()
        const positions = line.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < 64; i++) {
            const val = data ? (data[i] / 255) * 0.4 : 0
            positions[i * 3 + 1] = val
        }
        line.geometry.attributes.position.needsUpdate = true
    })

    return (
        <primitive
            object={line}
            ref={lineRef}
            position={position}
        />
    )
}

export function Sampler3D({ position }: { position: [number, number, number] }) {
    const { slices, activeSlice, currentSampleIndex, availableSamples, grid, toggleStep, nextSample, prevSample } = useSamplerStore()
    const { triggerSampler } = useAudioStore()
    const [activeStep, setActiveStep] = useState(0)
    const crtRef = useRef<THREE.ShaderMaterial>(null!)

    const currentSampleName = (availableSamples && availableSamples[currentSampleIndex]) ? availableSamples[currentSampleIndex].name : "No Sample"

    useFrame((state) => {
        const bpm = 120
        const stepTime = (60 / bpm) / 4
        const currentStep = Math.floor(state.clock.getElapsedTime() / stepTime) % 16
        if (currentStep !== activeStep) setActiveStep(currentStep)

        if (crtRef.current) {
            crtRef.current.uniforms.time.value = state.clock.getElapsedTime()
        }
    })

    return (
        <group position={position}>
            {/* Hardware Chassis */}
            <mesh position={[0, -0.5, -0.5]}>
                <boxGeometry args={[6, 4, 1.5]} />
                <meshStandardMaterial color="#d1d1d1" roughness={0.8} />
            </mesh>

            {/* Front Panel */}
            <group position={[0, 0, 0.2]} rotation={[-0.2, 0, 0]}>
                <mesh position={[0, 0.5, 0.1]}>
                    <boxGeometry args={[5.2, 3.2, 0.1]} />
                    <meshStandardMaterial color="#222222" />
                </mesh>

                {/* CRT Screen */}
                <group position={[0, 0.5, 0.16]}>
                    <mesh>
                        <planeGeometry args={[5, 3]} />
                        <meshBasicMaterial color="#001a11" toneMapped={false} />
                    </mesh>
                    <mesh>
                        <planeGeometry args={[5, 3]} />
                        <shaderMaterial
                            ref={crtRef}
                            {...CRTShader}
                            transparent
                            depthWrite={false}
                        />
                    </mesh>

                    {/* UI Content */}
                    <group position={[0, 0, 0.01]}>
                        <PageRGrid
                            activeStep={activeStep}
                            activeSlice={activeSlice}
                            grid={grid}
                            onToggle={(i) => toggleStep(i)}
                        />
                        <VectorWaveform position={[0, -1.1, 0.01]} />
                        <Text position={[-2.3, 1.3, 0.02]} fontSize={0.15} color="#00ff66" anchorX="left">
                            {`FILE: ${currentSampleName.toUpperCase()}`}
                        </Text>
                        <Text position={[2.3, 1.3, 0.02]} fontSize={0.15} color="#00ff66" anchorX="right">
                            {`SAMPLES: ${availableSamples.length}`}
                        </Text>
                    </group>
                </group>

                {/* Buttons */}
                <mesh
                    position={[-2.2, -1.2, 0.1]}
                    onClick={(e) => { e.stopPropagation(); prevSample() }}
                >
                    <boxGeometry args={[0.3, 0.2, 0.1]} />
                    <meshStandardMaterial color="#ff4444" />
                </mesh>
                <mesh
                    position={[-1.8, -1.2, 0.1]}
                    onClick={(e) => { e.stopPropagation(); nextSample() }}
                >
                    <boxGeometry args={[0.3, 0.2, 0.1]} />
                    <meshStandardMaterial color="#44ff44" />
                </mesh>
            </group>

            {/* Keyboard */}
            <mesh position={[0, -2, 1.2]} rotation={[-0.4, 0, 0]}>
                <boxGeometry args={[5, 0.3, 2]} />
                <meshStandardMaterial color="#c0c0c0" />
                <mesh position={[0, 0.16, 0]}>
                    <planeGeometry args={[4.8, 1.8]} />
                    <meshBasicMaterial color="#333333" wireframe />
                </mesh>
            </mesh>

            <Text position={[0, 3.2, -0.5]} fontSize={0.6} color="#00ff66">
                FAIRLIGHT CMI IIx
            </Text>
        </group>
    )
}
