/**
 * DroneEngine3D — Immersive Cosmic Nebula Visualization
 * 
 * Features:
 * - Reactive Nebula Shader that changes density and chaos
 * - Pulse indicators for Bernoulli gates (glitches)
 * - Large crystal controls for Intensity, Grit, and Chaos
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Points, PointMaterial } from '@react-three/drei'
import { WhiskMaterial } from '../WhiskMaterial'
import * as THREE from 'three'
import { useDroneStore } from '../../../store/droneStore'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'

const nebulaVertexShader = `
    uniform float uTime;
    uniform float uIntensity;
    uniform float uChaos;
    uniform float uGrit;
    attribute float aOffset;
    varying vec3 vColor;

    void main() {
        vec3 pos = position;
        float t = uTime * (1.0 + uChaos * 5.0);
        
        // GPU Jitter
        pos.x += sin(t + pos.x * 10.0 + aOffset) * 0.1 * uIntensity;
        pos.y += cos(t + pos.y * 10.0 + aOffset) * 0.1 * uIntensity;
        pos.z += sin(t * 0.5 + pos.z * 10.0) * 0.1 * uIntensity;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (0.2 + uGrit * 0.5) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        vColor = vec3(0.6 + uIntensity * 0.2, 0.8, 0.5); // HSL approximation in RGB for simplicity
    }
`

const nebulaFragmentShader = `
    varying vec3 vColor;
    void main() {
        float dist = distance(gl_PointCoord, vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = smoothstep(0.5, 0.2, dist);
        gl_FragColor = vec4(vColor, alpha * 0.6);
    }
`

function NebulaField({ intensity, grit, chaos }: { intensity: number, grit: number, chaos: number }) {
    const count = 2000 // Increased count since it's on GPU now
    const meshRef = useRef<THREE.Points>(null!)

    const { particles, offsets } = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const off = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10
            off[i] = Math.random() * 100
        }
        return { particles: positions, offsets: off }
    }, [count])

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uChaos: { value: chaos },
        uGrit: { value: grit }
    }), [])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uIntensity.value = intensity
        uniforms.uChaos.value = chaos
        uniforms.uGrit.value = grit

        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002
        }
    })

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.length / 3}
                    array={particles}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aOffset"
                    count={offsets.length}
                    array={offsets}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={nebulaVertexShader}
                fragmentShader={nebulaFragmentShader}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

export function DroneEngine3D() {
    const drone = useDroneStore()
    const layout = SPATIAL_LAYOUT.drone.position

    return (
        <group position={layout}>
            {/* Simple Core Indicator instead of Beam */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <WhiskMaterial baseColor="#8800ff" emissive="#4400ff" />
            </mesh>

            {/* Controls */}
            <group position={[0, -2, 2]}>
                <Knob3D
                    label="Intensity"
                    position={[-3, 0, 0]}
                    value={drone.intensity}
                    min={0} max={1}
                    onChange={(v) => drone.setParam({ intensity: v })}
                    color="#8800ff"
                    size={1.2}
                />
                <Knob3D
                    label="Chaos"
                    position={[-1, 0, 0]}
                    value={drone.chaos}
                    min={0} max={1}
                    onChange={(v) => drone.setParam({ chaos: v })}
                    color="#ff00ff"
                />
                <Knob3D
                    label="Grit"
                    position={[1, 0, 0]}
                    value={drone.grit}
                    min={0} max={1}
                    onChange={(v) => drone.setParam({ grit: v })}
                    color="#ff8800"
                />
                <Knob3D
                    label="Nervousness"
                    position={[3, 0, 0]}
                    value={drone.nervousness}
                    min={0} max={1}
                    onChange={(v) => drone.setParam({ nervousness: v })}
                    color="#00ffff"
                />

                <Button3D
                    label={drone.enabled ? "ACTIVE" : "OFFLINE"}
                    position={[0, -1.2, 0]}
                    active={drone.enabled}
                    onClick={() => drone.toggle()}
                    color="#8800ff"
                />
            </group>

            <Text
                position={[0, 5, 0]}
                fontSize={0.5}
                color="#ffffff"
                anchorX="center"
            >
                DRONE STATION: NEBULA GENERATOR
            </Text>
        </group>
    )
}
