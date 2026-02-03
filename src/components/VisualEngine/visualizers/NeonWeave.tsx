import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { useVisualStore } from '../../../store/visualStore'

export function NeonWeave() {
    const size = 30
    const divisions = 60

    return (
        <group>
            {/* Removed gridHelper to show only reactive neon grid */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[size, size, divisions, divisions]} />
                <WaveMaterial />
            </mesh>
        </group>
    )
}

function WaveMaterial() {
    const materialRef = useRef<THREE.ShaderMaterial>(null!)
    const bridge = useAudioVisualBridge()
    const { globalAudioIntensity, visualModifier } = useVisualStore()

    // Smooth rotation accumulation
    const rotationRef = useRef(new THREE.Vector2(0, 0))

    useFrame((state, delta) => {
        if (materialRef.current) {
            const uniforms = bridge.getUniforms()
            const time = state.clock.getElapsedTime()

            materialRef.current.uniforms.uTime.value = time

            // Accumulate rotation velocity from stick
            rotationRef.current.x += visualModifier.x * delta * 2.0
            rotationRef.current.y += visualModifier.y * delta * 2.0
            materialRef.current.uniforms.uModifier.value.set(rotationRef.current.x, rotationRef.current.y)

            // L2/R2 Intensity mapping
            const intensity = globalAudioIntensity
            materialRef.current.uniforms.uIntensity.value = intensity

            const lerp = (a: number, b: number, t: number) => a + (b - a) * t

            // Boost reactive waves when triggers are pressed
            const boost = 1.0 + intensity * 2.5

            materialRef.current.uniforms.uLow.value = lerp(
                materialRef.current.uniforms.uLow.value,
                uniforms.uLowFreq * boost * 2.0,
                0.2
            )
            materialRef.current.uniforms.uMid.value = lerp(
                materialRef.current.uniforms.uMid.value,
                uniforms.uMidFreq * boost * 2.0,
                0.1
            )
            materialRef.current.uniforms.uHigh.value = lerp(
                materialRef.current.uniforms.uHigh.value,
                uniforms.uHighFreq * boost * 2.0,
                0.3
            )
        }
    })

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uLow: { value: 0 },
        uMid: { value: 0 },
        uHigh: { value: 0 },
        uIntensity: { value: 0 },
        uModifier: { value: new THREE.Vector2(0, 0) }
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
                uniform float uLow;
                uniform float uHigh;
                uniform float uIntensity;
                uniform vec2 uModifier;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // 1. Smooth rotation around axes (Left Stick velocity)
                    float cx = cos(uModifier.x);
                    float sx = sin(uModifier.x);
                    float cy = cos(uModifier.y);
                    float sy = sin(uModifier.y);
                    
                    // Rotate around Y
                    float nx = pos.x * cy + pos.z * sy;
                    float nz = -pos.x * sy + pos.z * cy;
                    pos.x = nx;
                    pos.z = nz;
                    
                    // Rotate around X
                    float ny = pos.y * cx - pos.z * sx;
                    nz = pos.y * sx + pos.z * cx;
                    pos.y = ny;
                    pos.z = nz;

                    // 2. EQ Bulge Effect (L2/R2 Triggers)
                    // Pushes center outward creating "volume" feel
                    float dist = length(pos.xy);
                    float bulge = exp(-dist * dist * 0.05) * uIntensity * 15.0;
                    pos.z += bulge;

                    // 3. Audio Reactivity (Frequency waves)
                    float wave = sin(pos.x * 0.2 + uTime) * cos(pos.y * 0.2 + uTime) * (uLow * 8.0);
                    
                    if (uHigh > 0.3) {
                        wave += sin(pos.x * 20.0 + uTime * 30.0) * uHigh * 0.5;
                    }
                    
                    pos.z += wave;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `}
            fragmentShader={`
                varying vec2 vUv;
                uniform float uMid;
                uniform float uHigh;
                uniform float uIntensity;
                uniform float uTime;

                void main() {
                    vec3 cyan = vec3(0.0, 1.0, 1.0);
                    vec3 magenta = vec3(1.0, 0.0, 1.0);
                    
                    // Colors shift between Cyan and Magenta based on mid frequencies and bulge intensity
                    vec3 color = mix(cyan, magenta, uMid * 1.5 + uIntensity * 0.5);
                    
                    // Base brightness + boost from high frequencies and trigger intensity
                    float brightness = 0.5 + uHigh * 1.0 + uIntensity * 1.0;
                    
                    // Sharp flicker on highs
                    if (uHigh > 0.5 && sin(uTime * 60.0) > 0.0) {
                        brightness *= 1.8;
                    }

                    gl_FragColor = vec4(color * brightness, 0.9);
                }
            `}
        />
    )
}
