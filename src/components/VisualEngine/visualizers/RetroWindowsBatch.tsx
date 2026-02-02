import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'
import { Text } from '@react-three/drei'

// Helper to create textures procedurally
const useTextureGen = (type: 'cursor' | 'window' | 'bsod' | 'icon') => {
    return useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')!

        if (type === 'cursor') {
            ctx.fillStyle = 'transparent'
            ctx.clearRect(0, 0, 128, 128)
            // Draw arrow
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(0, 100)
            ctx.lineTo(25, 75)
            ctx.lineTo(55, 128)
            ctx.lineTo(75, 118)
            ctx.lineTo(45, 65)
            ctx.lineTo(100, 65)
            ctx.closePath()
            ctx.fillStyle = 'white'
            ctx.fill()
            ctx.strokeStyle = 'black'
            ctx.lineWidth = 5
            ctx.stroke()
        } else if (type === 'window') {
            ctx.fillStyle = '#c0c0c0' // Win98 Grey
            ctx.fillRect(0, 0, 128, 128)
            // Bevels
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 128, 4)
            ctx.fillRect(0, 0, 4, 128)
            ctx.fillStyle = '#808080'
            ctx.fillRect(124, 0, 4, 128)
            ctx.fillRect(0, 124, 128, 4)
            // Title bar
            ctx.fillStyle = '#000080'
            ctx.fillRect(4, 4, 120, 24)
            // Text
            ctx.font = 'bold 16px monospace'
            ctx.fillStyle = 'white'
            ctx.fillText('Error', 10, 20)
            // Body
            ctx.fillStyle = 'black'
            ctx.font = '12px monospace'
            ctx.fillText('Yes', 20, 80)
            ctx.fillText('No', 80, 80)
            // Buttons
            ctx.fillStyle = '#c0c0c0'
            ctx.fillRect(15, 60, 40, 30)
            ctx.fillRect(75, 60, 40, 30)
            // Button bevels
            ctx.strokeStyle = 'white'
            ctx.strokeRect(15, 60, 40, 30)
            ctx.fillStyle = 'black'
            ctx.fillText('Yes', 22, 80)
            ctx.fillText('No', 82, 80)
        }

        const tex = new THREE.CanvasTexture(canvas)
        tex.needsUpdate = true
        return tex
    }, [type])
}

// 161: Win98 Cascade
export function Win98Cascade() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const texture = useTextureGen('window')
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 200
    const dummy = new THREE.Object3D()

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        for (let i = 0; i < COUNT; i++) {
            const z = (i * 0.1 + t * 5) % 20 - 10
            const x = Math.sin(i * 0.5 + t) * 5 * Math.sin(t * 0.1)
            const y = Math.cos(i * 0.3 + t) * 3

            dummy.position.set(x, y, z)
            dummy.rotation.z = Math.sin(t + i) * 0.1
            const scale = 1 + intensity * 0.5
            dummy.scale.set(scale, scale, scale)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <planeGeometry args={[2, 1.5]} />
            <meshBasicMaterial map={texture} transparent />
        </instancedMesh>
    )
}

// 162: BSOD Glitch
export function BSODGlitch() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const { viewport } = useThree()

    return (
        <group>
            <mesh>
                <planeGeometry args={[16, 9]} />
                <meshBasicMaterial color="#0000aa" />
            </mesh>
            <group position={[-3, 2, 0.1]}>
                <Text color="white" fontSize={0.5} anchorX="left" anchorY="top">
                    {`A problem has been detected and Windows has been shut down to prevent damage to your computer.

The problem seems to be caused by the following file: VIBE.SYS

PAGE_FAULT_IN_NONPAGED_AREA

If this is the first time you've seen this stop error screen, restart your computer. If this screen appears again, follow these steps:

Check to make sure any new hardware or software is properly installed. If this is a new installation, ask your hardware or software manufacturer for any Windows updates you might need.

Technical information:

*** STOP: 0x00000050 (0xFD3094C2, 0x00000001, 0xFBFE7617, 0x00000000)

*** VIBE.SYS - Address FBFE7617 base at FBFE5000, DateStamp 3d6dd67c`}
                </Text>
            </group>
            {/* Glitch Overlay */}
            <mesh position={[0, 0, 0.2]}>
                <planeGeometry args={[16, 9]} />
                <shaderMaterial
                    transparent
                    uniforms={{ uTime: { value: 0 }, uIntensity: { value: 0 } }}
                    vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
                    fragmentShader={`
                        varying vec2 vUv;
                        uniform float uTime;
                        uniform float uIntensity;
                        float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
                        void main() {
                            float glitch = step(0.98 - uIntensity * 0.1, rand(vec2(floor(vUv.y * 20.0), uTime)));
                            vec4 col = vec4(1.0, 1.0, 1.0, glitch * 0.5);
                            gl_FragColor = col;
                        }
                    `}
                    key={Math.random()} // Force re-render if needed? No, ref is better but this is quick
                />
                <GlitchMaterial intensity={intensity} />
            </mesh>
        </group>
    )
}

function GlitchMaterial({ intensity }: { intensity: number }) {
    const ref = useRef<THREE.ShaderMaterial>(null!)
    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.uniforms.uTime.value = clock.elapsedTime
            ref.current.uniforms.uIntensity.value = intensity
        }
    })
    return <shaderMaterial
        ref={ref}
        transparent
        uniforms={{ uTime: { value: 0 }, uIntensity: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`
                        varying vec2 vUv;
                        uniform float uTime;
                        uniform float uIntensity;
                        float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
                        void main() {
                            float glitch = step(0.9 - uIntensity * 0.2, rand(vec2(floor(vUv.y * 50.0), floor(uTime * 20.0))));
                            if (glitch > 0.0) {
                                gl_FragColor = vec4(1.0, 1.0, 1.0, 0.2);
                            } else {
                                discard;
                            }
                        }
                    `}
    />
}

// 163: Cursor Sphere
export function CursorSphere() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const texture = useTextureGen('cursor')
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const COUNT = 1000
    const dummy = new THREE.Object3D()

    useMemo(() => {
        // Initial setup if needed
    }, [])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        const radius = 4 + intensity * 2

        for (let i = 0; i < COUNT; i++) {
            // Fibonacci Sphere
            const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT)
            const theta = Math.PI * (1 + 5 ** 0.5) * (i + 0.5) + t * 0.2

            const x = radius * Math.sin(phi) * Math.cos(theta)
            const y = radius * Math.sin(phi) * Math.sin(theta)
            const z = radius * Math.cos(phi)

            dummy.position.set(x, y, z)
            dummy.lookAt(0, 0, 0)
            // Make them point OUTWARD
            dummy.rotateX(-Math.PI / 2)

            const scale = 0.5 + Math.sin(i + t * 5) * 0.2
            dummy.scale.set(scale, scale, scale)

            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        </instancedMesh>
    )
}

// 164: XP Bliss Warp
export function XPBlissWarp() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uIntensity: { value: 0 }
    }), [])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uIntensity.value = intensity
    })

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    varying vec2 vUv;
                    uniform float uTime;
                    uniform float uIntensity;
                    
                    // Simple noise
                    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
                    float noise(vec2 p) {
                        vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
                        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), f.x),
                                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y);
                    }

                    void main() {
                        vec3 skyTop = vec3(0.0, 0.4, 0.9);
                        vec3 skyBot = vec3(0.4, 0.7, 1.0);
                        vec3 grassDark = vec3(0.1, 0.5, 0.0);
                        vec3 grassLight = vec3(0.3, 0.8, 0.1);
                        
                        // Hill curve
                        float hill = 0.3 + sin(vUv.x * 4.0) * 0.1;
                        
                        vec3 col;
                        
                        if (vUv.y > hill) {
                            // Sky
                            col = mix(skyBot, skyTop, (vUv.y - hill) * 1.5);
                            // Clouds
                            float c = noise(vUv * 5.0 + vec2(uTime * 0.1, 0.0));
                            if (c > 0.6) col = mix(col, vec3(1.0), (c-0.6)*2.0);
                        } else {
                            // Grass
                            col = mix(grassDark, grassLight, vUv.y * 2.0);
                            // Glitch / Warp based on audio
                            col.g += sin(vUv.x * 20.0 + uTime * 10.0) * uIntensity * 0.2;
                        }
                        
                        gl_FragColor = vec4(col, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 165: Icon Storm
export function IconStorm() {
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const { viewport } = useThree()

    // Create random icons using emojis as textures
    const icons = useMemo(() => {
        const items = ['💻', '📁', '🗑️', '💿', '💾', '📧']
        return items.map(char => {
            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 64
            const ctx = canvas.getContext('2d')!
            ctx.font = '50px serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(char, 32, 32)
            return new THREE.CanvasTexture(canvas)
        })
    }, [])

    const groupRef = useRef<THREE.Group>(null!)

    // Generate static positions
    const particles = useMemo(() => {
        return new Array(50).fill(0).map(() => ({
            pos: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5),
            rot: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
            iconIdx: Math.floor(Math.random() * icons.length),
            speed: 0.5 + Math.random()
        }))
    }, [icons])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        groupRef.current.children.forEach((child, i) => {
            const p = particles[i]
            // Orbit logic
            const r = 4 + Math.sin(t * p.speed + i) * intensity
            child.position.x = Math.cos(t * p.speed * 0.5 + i) * r
            child.position.y = Math.sin(t * p.speed * 0.3 + i) * r
            child.position.z = Math.sin(t + i) * 2

            child.rotation.x += 0.01
            child.rotation.y += 0.02

            // Always look at cam? No, let them spin 3D
        })
        groupRef.current.rotation.y += 0.005 + intensity * 0.01
    })

    return (
        <group ref={groupRef}>
            {particles.map((p, i) => (
                <mesh key={i}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial map={icons[p.iconIdx]} transparent side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    )
}
