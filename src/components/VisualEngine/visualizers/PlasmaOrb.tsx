import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

export function PlasmaOrb() {
    const meshRef = useRef<THREE.Mesh>(null!)

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uColor: { value: new THREE.Color("#ff00cc") }
    }), [])

    useFrame((state) => {
        if (meshRef.current) {
            const intensity = useVisualStore.getState().globalAudioIntensity
            const material = meshRef.current.material as THREE.ShaderMaterial
            material.uniforms.uTime.value = state.clock.getElapsedTime()
            material.uniforms.uIntensity.value = THREE.MathUtils.lerp(
                material.uniforms.uIntensity.value,
                intensity,
                0.1
            )
            meshRef.current.rotation.y += 0.01
            meshRef.current.rotation.z += 0.005
        }
    })

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[2, 64, 64]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    uniform float uTime;
                    uniform float uIntensity;

                    void main() {
                        vUv = uv;
                        vNormal = normal;
                        vec3 pos = position;
                        float noise = sin(pos.x * 3.0 + uTime * 2.0) * cos(pos.y * 3.0 + uTime * 2.0) * sin(pos.z * 3.0 + uTime * 2.0);
                        pos += normal * noise * uIntensity * 1.5;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
                fragmentShader={`
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    uniform float uTime;
                    uniform float uIntensity;
                    uniform vec3 uColor;

                    void main() {
                        float pulse = sin(uTime * 5.0) * 0.5 + 0.5;
                        vec3 color = mix(uColor, vec3(0.0, 1.0, 1.0), uIntensity);
                        float glow = pow(0.7 - dot(vNormal, vec3(0, 0, 1)), 2.0);
                        gl_FragColor = vec4(color + glow, 0.6 + uIntensity * 0.4);
                    }
                `}
                transparent
                wireframe
            />
        </mesh>
    )
}
