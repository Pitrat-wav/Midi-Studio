import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

// 19: Hypercube
export function Hypercube() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.Group>(null!)
    useFrame((state) => {
        meshRef.current.rotation.x += 0.01 + intensity * 0.1
        meshRef.current.rotation.y += 0.01
    })
    return (
        <group ref={meshRef}>
            <mesh>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial wireframe color="#fff" />
            </mesh>
            <mesh scale={0.5}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial wireframe color="#3390ec" />
            </mesh>
        </group>
    )
}

// 20: Glitch World
export function GlitchWorld() {
    const store = useVisualStore()
    const { globalAudioIntensity, visualModifier, visualDetail, visualPalette, visualInvert } = store

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uModifier: { value: new THREE.Vector2(0, 0) },
        uDetail: { value: 0.5 },
        uPalette: { value: 0 },
        uInvert: { value: 0 }
    }), [])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uIntensity.value = globalAudioIntensity
        uniforms.uModifier.value.set(visualModifier.x, visualModifier.y)
        uniforms.uDetail.value = visualDetail
        uniforms.uPalette.value = visualPalette
        uniforms.uInvert.value = visualInvert ? 1.0 : 0.0
    })

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                transparent
                vertexShader={`
                    varying vec2 vUv;
                    uniform float uTime;
                    uniform float uIntensity;
                    uniform vec2 uModifier;
                    
                    void main() {
                        vUv = uv;
                        vec3 pos = position;
                        
                        // Small positional jitter based on chaos/intensity
                        if (uIntensity > 0.4) {
                            pos.x += sin(uTime * 50.0) * uIntensity * 0.1 * uModifier.x;
                            pos.y += cos(uTime * 45.0) * uIntensity * 0.1 * uModifier.y;
                        }
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
                fragmentShader={`
                    varying vec2 vUv;
                    uniform float uTime;
                    uniform float uIntensity;
                    uniform vec2 uModifier;
                    uniform float uDetail;
                    uniform float uPalette;
                    uniform float uInvert;

                    float random(vec2 st) {
                        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                    }

                    void main() {
                        vec2 uv = vUv;
                        
                        // 1. Slicing Glitch (Right Stick / Detail)
                        float sliceCount = 10.0 + uDetail * 60.0;
                        float sliceId = floor(uv.y * sliceCount);
                        float sliceOffset = random(vec2(sliceId, floor(uTime * 15.0))) - 0.5;
                        
                        // Increase slice chance based on intensity and X-modifier
                        float sliceChance = 0.02 + uIntensity * 0.2 + abs(uModifier.x) * 0.4;
                        if (random(vec2(sliceId, floor(uTime * 10.0))) < sliceChance) {
                            uv.x += sliceOffset * (0.05 + abs(uModifier.x) * 0.3);
                        }

                        // 2. Procedural Glitch Patterns
                        float stripes = step(0.1, sin(uv.y * (100.0 + uDetail * 200.0) + uTime * 5.0));
                        float noise = random(uv + uTime);
                        float block = random(floor(uv * (10.0 + uIntensity * 10.0)) + floor(uTime * 8.0));
                        
                        // 3. Chromatic Shift (Simulated)
                        float shift = 0.005 + abs(uModifier.x) * 0.05 + uIntensity * 0.02;
                        float rMod = random(uv + vec2(shift, 0.0) + uTime);
                        float gMod = random(uv + uTime);
                        float bMod = random(uv - vec2(shift, 0.0) + uTime);
                        
                        // 4. Palettes
                        vec3 p[5];
                        p[0] = vec3(0.0, 1.0, 0.0); // Classic Terminal
                        p[1] = vec3(1.0, 0.0, 1.0); // Cyberpunk
                        p[2] = vec3(0.0, 1.0, 1.0); // Ice
                        p[3] = vec3(1.0, 0.5, 0.0); // Amber
                        p[4] = vec3(1.0, 1.0, 1.0); // White
                        
                        vec3 targetCol = p[int(mod(uPalette, 5.0))];
                        
                        // Pattern Mix based on Y-modifier (Up = Noise, Down = Stripes)
                        float pattern = mix(stripes, noise, 0.5 + uModifier.y * 0.5);
                        
                        // Glitch Blocks
                        if (block < 0.05 * uIntensity) {
                            pattern = 1.0 - pattern;
                        }
                        
                        vec3 finalCol = targetCol * pattern;
                        
                        // Apply chromatic-like splitting to the brightness
                        finalCol.r *= 0.5 + rMod * 0.5;
                        finalCol.g *= 0.8;
                        finalCol.b *= 0.5 + bMod * 0.5;
                        
                        // Scanlines
                        finalCol *= 0.85 + 0.15 * sin(uv.y * 500.0);
                        
                        // Audio reactive brightness
                        finalCol += uIntensity * 0.3;

                        if (uInvert > 0.5) finalCol = 1.0 - finalCol;

                        gl_FragColor = vec4(finalCol, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 21: Spiral Galaxy
export function SpiralGalaxy() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const pointsRef = useRef<THREE.Points>(null!)
    const COUNT = 5000
    const [pos] = useMemo(() => {
        const p = new Float32Array(COUNT * 3)
        for (let i = 0; i < COUNT; i++) {
            const angle = i * 0.1
            const dist = i * 0.002
            p[i * 3] = Math.cos(angle) * dist
            p[i * 3 + 1] = (Math.random() - 0.5) * 0.1
            p[i * 3 + 2] = Math.sin(angle) * dist
        }
        return [p]
    }, [])
    useFrame(() => {
        pointsRef.current.rotation.y += 0.002 + intensity * 0.02
    })
    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={COUNT} array={pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#8888ff" transparent opacity={0.6} />
        </points>
    )
}

// 22: Crystal Cave
export function CrystalCave() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 12 }).map((_, i) => (
                <mesh key={i} position={[Math.sin(i) * 4, Math.cos(i) * 4, -5]} rotation={[0, 0, i]}>
                    <coneGeometry args={[1, 5, 4]} />
                    <meshStandardMaterial color="#00ffff" metalness={1} roughness={0} emissive="#00ffff" emissiveIntensity={intensity * 2} />
                </mesh>
            ))}
        </group>
    )
}

// 23: Growth Tendrils
export function GrowthTendrils() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
                    <torusGeometry args={[2, 0.05, 16, 100, Math.PI * (0.5 + intensity)]} />
                    <meshBasicMaterial color="#44ff44" />
                </mesh>
            ))}
        </group>
    )
}

// 24: Geometric Chaos
export function GeometricChaos() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 50
    const tempMatrix = new THREE.Matrix4()
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const scale = 0.2 + intensity * Math.sin(t + i)
            tempMatrix.makeScale(scale, scale, scale)
            tempMatrix.setPosition(Math.sin(t + i) * 3, Math.cos(t * 0.5 + i) * 3, Math.sin(t * 0.2 + i) * 3)
            meshRef.current.setMatrixAt(i, tempMatrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshNormalMaterial />
        </instancedMesh>
    )
}

// 25: Solar Flare
export function SolarFlare() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            <mesh>
                <sphereGeometry args={[2, 32, 32]} />
                <meshBasicMaterial color="#ffaa00" />
            </mesh>
            <mesh scale={1 + intensity * 2}>
                <sphereGeometry args={[2.1, 32, 32]} />
                <meshBasicMaterial color="#ff4400" transparent opacity={0.3} wireframe />
            </mesh>
            <pointLight intensity={20 * intensity} color="#ffaa00" />
        </group>
    )
}

// 26: Depth Rings
export function DepthRings() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    return (
        <group>
            {Array.from({ length: 10 }).map((_, i) => (
                <mesh key={i} position={[0, 0, -i * 2]}>
                    <ringGeometry args={[2, 2.1, 64]} />
                    <meshBasicMaterial color="#3390ec" transparent opacity={1 - i / 10 + intensity * 0.5} />
                </mesh>
            ))}
        </group>
    )
}

// 27: Frequency 360
export function Frequency360() {
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const groupRef = useRef<THREE.Group>(null!)
    const COUNT = 32
    useFrame(() => {
        if (!fftData) return
        groupRef.current.children.forEach((child, i) => {
            const val = fftData[i * 4] / 255
            child.scale.y = 0.1 + val * 10 * intensity
        })
    })
    return (
        <group ref={groupRef}>
            {Array.from({ length: COUNT }).map((_, i) => (
                <mesh key={i} rotation={[0, (i / COUNT) * Math.PI * 2, 0]} position={[Math.sin((i / COUNT) * Math.PI * 2) * 5, 0, Math.cos((i / COUNT) * Math.PI * 2) * 5]}>
                    <boxGeometry args={[0.2, 1, 0.2]} />
                    <meshBasicMaterial color={new THREE.Color().setHSL(i / COUNT, 0.8, 0.5)} />
                </mesh>
            ))}
        </group>
    )
}

// 28: Triangle Rain
export function TriangleRain() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 100
    const tempMatrix = new THREE.Matrix4()
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const h = (10 - (t * (1 + intensity * 5) + i * 2) % 20) - 10
            tempMatrix.setPosition((i % 10) - 5, h, Math.floor(i / 10) - 5)
            tempMatrix.makeRotationZ(t + i)
            meshRef.current.setMatrixAt(i, tempMatrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <circleGeometry args={[0.2, 3]} />
            <meshBasicMaterial color="#ff3b30" side={THREE.DoubleSide} />
        </instancedMesh>
    )
}
