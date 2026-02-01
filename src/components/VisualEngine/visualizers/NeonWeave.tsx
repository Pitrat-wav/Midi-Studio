import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function NeonWeave() {
    const meshRef = useRef<THREE.LineSegments>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const size = 20
    const divisions = 40

    return (
        <group>
            <gridHelper args={[size, divisions, '#00ffff', '#333']} rotation={[Math.PI / 2, 0, 0]} />
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[size, size, divisions, divisions]} />
                <WaveMaterial intensity={intensity} />
            </mesh>
        </group>
    )
}

function WaveMaterial({ intensity }: { intensity: number }) {
    const materialRef = useRef<THREE.ShaderMaterial>(null!)

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
            materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
                materialRef.current.uniforms.uIntensity.value,
                intensity,
                0.1
            )
        }
    })

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uIntensity: { value: 0 }
    }), [])

    return (
        <shaderMaterial
            ref={materialRef}
            wireframe
            transparent
            uniforms={uniforms}
            vertexShader={`
                varying vec2 vUv;
                uniform float uTime;
                uniform float uIntensity;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float wave = sin(pos.x * 0.5 + uTime) * cos(pos.y * 0.5 + uTime) * uIntensity * 3.0;
                    pos.z += wave;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `}
            fragmentShader={`
                varying vec2 vUv;
                uniform float uIntensity;
                void main() {
                    vec3 color = mix(vec3(0.0, 0.5, 1.0), vec3(1.0, 0.0, 0.5), uIntensity);
                    gl_FragColor = vec4(color, 0.8);
                }
            `}
        />
    )
}

