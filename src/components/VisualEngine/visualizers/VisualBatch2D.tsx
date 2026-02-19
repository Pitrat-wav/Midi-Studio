import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

// 39: Retro Oscilloscope
export function RetroOscilloscope() {
    const meshRef = useRef<THREE.Line>(null!)
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const initialPositions = useMemo(() => {
        const p = new Float32Array(128 * 3)
        for (let i = 0; i < 128; i++) {
            p[i * 3] = (i / 64 - 1) * 4 // X
            p[i * 3 + 1] = 0 // Y
            p[i * 3 + 2] = 0 // Z
        }
        return p
    }, [])

    useFrame(() => {
        if (!fftData) return
        const positions = meshRef.current.geometry.attributes.position
        for (let i = 0; i < 128; i++) {
            const val = (fftData[i] / 255 - 0.5) * 2 * intensity
            positions.setY(i, val * 2)
        }
        positions.needsUpdate = true
    })

    return (
        <line ref={meshRef as any}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={128} array={initialPositions} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color="#00ff00" linewidth={2} />
        </line>
    )
}

// 40: Vibrant Spectrum
export function VibrantSpectrum() {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const COUNT = 64
    const tempMatrix = new THREE.Matrix4()
    const tempColor = new THREE.Color()

    useFrame(() => {
        if (!fftData) return
        for (let i = 0; i < COUNT; i++) {
            const val = fftData[i * 2] / 255
            const h = val * 5 * intensity + 0.1
            tempMatrix.makeScale(0.1, h, 0.1)
            tempMatrix.setPosition((i - COUNT / 2) * 0.15, h / 2 - 2, 0)
            meshRef.current.setMatrixAt(i, tempMatrix)

            tempColor.setHSL(0.5 + val * 0.5, 0.8, 0.5)
            meshRef.current.setColorAt(i, tempColor)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial />
        </instancedMesh>
    )
}

// 41: Radial Pulse
export function RadialPulse() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} scale={1 + intensity * i * 0.5}>
                    <ringGeometry args={[0.5 + i * 0.2, 0.52 + i * 0.2, 64]} />
                    <meshBasicMaterial color="#3390ec" transparent opacity={1 - i / 8} />
                </mesh>
            ))}
        </group>
    )
}

// 42: Glitch Scanner
export function GlitchScanner() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.Mesh>(null!)
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        meshRef.current.position.y = Math.sin(t * 2) * 4
        meshRef.current.scale.x = 1 + (intensity > 0.8 ? Math.random() * 2 : 0)
    })
    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[10, 0.05]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
    )
}

// 43: Lava Lamp 2D
export function LavaLamp2D() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const { viewport } = useThree()
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) }
    }), [viewport.width, viewport.height])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uIntensity.value = intensity
    })

    return (
        <mesh>
            <planeGeometry args={[viewport.width, viewport.height]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`}
                fragmentShader={`
                    varying vec2 vUv;
                    uniform float uTime;
                    uniform float uIntensity;
                    void main() {
                        vec2 p = vUv * 2.0 - 1.0;
                        float d = 0.0;
                        for(float i=1.0; i<5.0; i++) {
                            p.x += 0.3/i * sin(i * 3.0 * p.y + uTime + uIntensity);
                            p.y += 0.3/i * cos(i * 3.0 * p.x + uTime + uIntensity);
                            d += abs(0.1 / p.x);
                        }
                        gl_FragColor = vec4(mix(vec3(0.1, 0.0, 0.2), vec3(0.0, 0.8, 1.0), d * 0.1), 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 44: Neon Wavelet
export function NeonWavelet() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 5 }).map((_, i) => (
                <mesh key={i} position={[0, (i - 2) * 1.5, 0]}>
                    <planeGeometry args={[10, 0.1, 100]} />
                    <WaveMaterial2D intensity={intensity} offset={i} />
                </mesh>
            ))}
        </group>
    )
}

function WaveMaterial2D({ intensity, offset }: { intensity: number, offset: number }) {
    const uniforms = useMemo(() => ({ uTime: { value: 0 }, uIntensity: { value: 0 } }), [])
    useFrame((state) => {
        uniforms.uTime.value = state.clock.getElapsedTime() + offset
        uniforms.uIntensity.value = intensity
    })
    return (
        <shaderMaterial
            transparent
            uniforms={uniforms}
            vertexShader={`
                varying vec2 vUv;
                uniform float uTime;
                uniform float uIntensity;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    pos.y += sin(pos.x * 2.0 + uTime * 3.0) * uIntensity * 1.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `}
            fragmentShader={`
                varying vec2 vUv;
                void main() {
                    gl_FragColor = vec4(0.0, 1.0, 1.0, 0.8 * (1.0 - abs(vUv.x - 0.5) * 2.0));
                }
            `}
        />
    )
}

// 45: Binary Star 2D
export function BinaryStar2D() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.Group>(null!)
    useFrame((state) => {
        meshRef.current.rotation.z += 0.05 + intensity * 0.2
    })
    return (
        <group ref={meshRef}>
            <mesh position={[2, 0, 0]}>
                <circleGeometry args={[0.5, 32]} />
                <meshBasicMaterial color="#fff" />
            </mesh>
            <mesh position={[-2, 0, 0]}>
                <circleGeometry args={[0.5, 32]} />
                <meshBasicMaterial color="#3390ec" />
            </mesh>
        </group>
    )
}

// 46: Gradient Flow
export function GradientFlow() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const { viewport } = useThree()
    const uniforms = useMemo(() => ({ uTime: { value: 0 }, uIntensity: { value: 0 } }), [])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uIntensity.value = intensity
    })

    return (
        <mesh>
            <planeGeometry args={[viewport.width, viewport.height]} />
            <shaderMaterial
                vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`}
                fragmentShader={`
                    varying vec2 vUv;
                    uniform float uTime;
                    uniform float uIntensity;
                    void main() {
                        vec3 c1 = vec3(0.2, 0.0, 0.5);
                        vec3 c2 = vec3(0.0, 0.5, 1.0);
                        float mixVal = vUv.x + sin(uTime + vUv.y * 5.0) * uIntensity;
                        gl_FragColor = vec4(mix(c1, c2, mixVal), 1.0);
                    }
                `}
                uniforms={uniforms}
            />
        </mesh>
    )
}

// 47: Pixel Noise
export function PixelNoise() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const GRID = 20
    const COUNT = GRID * GRID
    const tempMatrix = new THREE.Matrix4()
    const tempColor = new THREE.Color()

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const x = i % GRID, y = Math.floor(i / GRID)
            const noise = Math.random() * intensity
            tempMatrix.setPosition(x - GRID / 2, y - GRID / 2, 0)
            meshRef.current.setMatrixAt(i, tempMatrix)
            tempColor.setScalar(noise)
            meshRef.current.setColorAt(i, tempColor)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial />
        </instancedMesh>
    )
}

// 48: Abstract Grid 2D
export function AbstractGrid2D() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 100 }).map((_, i) => (
                <mesh key={i} position={[(i % 10 - 5) * 1.5, (Math.floor(i / 10) - 5) * 1.5, 0]}>
                    <planeGeometry args={[0.2 + intensity * 1.2, 0.2 + intensity * 1.2]} />
                    <meshBasicMaterial color="#3390ec" transparent opacity={0.5} />
                </mesh>
            ))}
        </group>
    )
}

// 49: Mondrian Composition (Modern Art)
export function MondrianComposition() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const { viewport } = useThree()

    const blocks = useMemo(() => {
        const b = []
        const colors = ['#ff0000', '#0000ff', '#ffff00', '#ffffff']
        for (let i = 0; i < 15; i++) {
            b.push({
                x: (Math.random() - 0.5) * viewport.width,
                y: (Math.random() - 0.5) * viewport.height,
                w: 1 + Math.random() * 3,
                h: 1 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)]
            })
        }
        return b
    }, [viewport.width, viewport.height])

    return (
        <group>
            <mesh>
                <planeGeometry args={[viewport.width, viewport.height]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            {blocks.map((b, i) => (
                <group key={i} position={[b.x, b.y, 0.01]}>
                    <mesh scale={[1 + intensity * 0.5, 1 + intensity * 0.5, 1]}>
                        <planeGeometry args={[b.w, b.h]} />
                        <meshBasicMaterial color={b.color} />
                    </mesh>
                    <mesh position={[0, 0, 0.005]}>
                        <planeGeometry args={[b.w, b.h]} />
                        <meshBasicMaterial color="#000000" wireframe wireframeLinewidth={5} />
                    </mesh>
                </group>
            ))}
            {/* Black border lines */}
            {Array.from({ length: 10 }).map((_, i) => (
                <mesh key={i} position={[0, (i - 5) * 1.5, 0.02]}>
                    <planeGeometry args={[viewport.width, 0.1]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
                <mesh key={i} position={[(i - 5) * 1.5, 0, 0.02]}>
                    <planeGeometry args={[0.1, viewport.height]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>
            ))}
        </group>
    )
}

// 50: Kandinsky Abstract (Modern Art)
export function KandinskyAbstract() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const { viewport } = useThree()

    const elements = useMemo(() => {
        const e = []
        for (let i = 0; i < 20; i++) {
            e.push({
                x: (Math.random() - 0.5) * viewport.width,
                y: (Math.random() - 0.5) * viewport.height,
                size: 0.5 + Math.random() * 2,
                type: Math.random() > 0.5 ? 'circle' : 'triangle',
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6)
            })
        }
        return e
    }, [viewport.width, viewport.height])

    const groupRef = useRef<THREE.Group>(null!)
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        groupRef.current.children.forEach((child, i) => {
            if (i === 0) return // Skip background
            child.position.x += Math.sin(t + i) * 0.01 * intensity
            child.position.y += Math.cos(t + i) * 0.01 * intensity
            child.rotation.z += 0.01 * intensity
        })
    })

    return (
        <group ref={groupRef}>
            <mesh>
                <planeGeometry args={[viewport.width, viewport.height]} />
                <meshBasicMaterial color="#fdf2e9" />
            </mesh>
            {elements.map((el, i) => (
                <mesh key={i} position={[el.x, el.y, 0.01]} rotation={[0, 0, Math.random() * Math.PI]}>
                    {el.type === 'circle' ? (
                        <circleGeometry args={[el.size, 32]} />
                    ) : (
                        <circleGeometry args={[el.size, 3]} />
                    )}
                    <meshBasicMaterial color={el.color} transparent opacity={0.7} />
                </mesh>
            ))}
            {/* Abstract lines */}
            {Array.from({ length: 15 }).map((_, i) => (
                <mesh key={`line-${i}`} position={[(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0.02]} rotation={[0, 0, Math.random() * Math.PI]}>
                    <planeGeometry args={[5, 0.02]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>
            ))}
        </group>
    )
}
