import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import * as Tone from 'tone'
import { WhiskMaterial } from '../WhiskMaterial'
import { useAudioStore } from '../../../store/audioStore'
import { useVisualStore } from '../../../store/visualStore'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { audioReactiveVertexShader, fresnelFragmentShader } from '../../../shaders/audioReactive.glsl'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function PerformanceWheel({ position, label, value = 0 }: { position: [number, number, number], label: string, value?: number }) {
    const wheelRef = useRef<THREE.Group>(null!)

    useFrame((state) => {
        if (!wheelRef.current) return
        wheelRef.current.rotation.x = THREE.MathUtils.lerp(wheelRef.current.rotation.x, value * Math.PI * 0.2, 0.1)
    })

    return (
        <group position={position}>
            <Text position={[0, -0.6, 0.4]} fontSize={0.12} color="#00ffcc">
                {label}
            </Text>
            <group ref={wheelRef}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
                    <WhiskMaterial baseColor="#111111" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, 0, 0.35]}>
                    <boxGeometry args={[0.05, 0.1, 0.2]} />
                    <meshBasicMaterial color="#00ffcc" toneMapped={false} />
                </mesh>
            </group>
        </group>
    )
}

function Key3D({ note, octave, position, width, height, color, onTrigger }: {
    note: string,
    octave: number,
    position: [number, number, number],
    width: number,
    height: number,
    color: string,
    onTrigger: (velocity: number) => void
}) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [isActive, setIsActive] = useState(false)
    const bridge = useAudioVisualBridge()

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uPitch: { value: (NOTES.indexOf(note) + (octave - 3) * 12) / 48 },
        uBaseColor: { value: new THREE.Color(color) },
        uGlowColor: { value: new THREE.Color('#ffffff') },
        uResonanceExp: { value: 4.0 }
    }), [note, octave, color])

    useFrame((state) => {
        if (!meshRef.current) return
        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uAudioIntensity.value = isActive ? 1.0 : (bridge.getPulse('note') * 0.3)

        const targetY = isActive ? -0.15 : 0
        const targetRot = isActive ? -0.05 : 0
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.3)
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot, 0.3)
    })

    const handlePointerDown = (e: any) => {
        e.stopPropagation()
        setIsActive(true)
        const localY = e.uv.y
        const velocity = 0.3 + localY * 0.7
        onTrigger(velocity)

        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
        }
    }

    const handlePointerUp = () => setIsActive(false)

    return (
        <mesh
            ref={meshRef}
            position={position}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerOut={handlePointerUp}
        >
            <RoundedBox args={[width, 0.2, height]} radius={0.02} smoothness={4}>
                <WhiskMaterial
                    baseColor={color}
                    emissive={isActive ? "#00ffcc" : "#000000"}
                    transparent
                    opacity={isActive ? 1.0 : 0.9}
                    metalness={0.2}
                    roughness={0.8}
                />
            </RoundedBox>
        </mesh>
    )
}

export function Keyboard3D() {
    const bridge = useAudioVisualBridge()
    const theme = useVisualStore(s => s.aestheticTheme)

    const layout = useMemo(() => {
        const keys = []
        let currentX = -5
        for (let oct = 3; oct <= 4; oct++) {
            for (let i = 0; i < 12; i++) {
                const note = NOTES[i]
                const isBlack = note.includes('#')

                keys.push({
                    note,
                    octave: oct,
                    isBlack,
                    position: [currentX, isBlack ? 0.12 : 0, isBlack ? -0.4 : 0] as [number, number, number],
                    color: isBlack ? '#0a0a0a' : '#ffffff'
                })

                if (!isBlack) currentX += 0.82
                else {
                    if (keys.length > 0) {
                        keys[keys.length - 1].position[0] -= 0.41
                    }
                }
            }
        }
        return keys
    }, [])

    const handleTrigger = (note: string, oct: number, velocity: number) => {
        const leadSynth = useAudioStore.getState().leadSynth
        if (leadSynth) {
            leadSynth.triggerNote(`${note}${oct}`, '16n', Tone.now(), velocity)
        }
    }

    return (
        <group position={[0, -2.5, 10]}>
            {/* Main Chassis */}
            <mesh position={[0, -0.4, -0.8]}>
                <RoundedBox args={[12, 0.8, 3.5]} radius={0.1} smoothness={4}>
                    <WhiskMaterial baseColor="#1a1a1b" metalness={0.8} roughness={0.2} />
                </RoundedBox>
            </mesh>

            {/* Side Panels - Premium Wood Finish */}
            <mesh position={[-6, -0.2, -0.8]}>
                <RoundedBox args={[0.3, 1.2, 3.8]} radius={0.05}>
                    <WhiskMaterial baseColor="#4a2c16" metalness={0.3} roughness={0.4} />
                </RoundedBox>
            </mesh>
            <mesh position={[6, -0.2, -0.8]}>
                <RoundedBox args={[0.3, 1.2, 3.8]} radius={0.05}>
                    <WhiskMaterial baseColor="#4a2c16" metalness={0.3} roughness={0.4} />
                </RoundedBox>
            </mesh>

            {/* Controls Section */}
            <group position={[-5.2, 0, 0]}>
                <PerformanceWheel position={[0, 0, 0.1]} label="PITCH" />
                <PerformanceWheel position={[0.8, 0, 0.1]} label="MOD" value={bridge.getPulse('note') * 0.5} />
            </group>

            {/* LED Strip */}
            <mesh position={[0, 0.15, -1.8]}>
                <planeGeometry args={[11.4, 0.05]} />
                <meshBasicMaterial color="#00ffcc" toneMapped={false} />
            </mesh>

            {/* Branding */}
            <Text
                position={[0, 0.5, -2.2]}
                fontSize={0.22}
                color="#00ffcc"
                anchorX="center"
            >
                TELEGRAM MIDI STUDIO PRO
            </Text>

            {/* Keys Area */}
            <group position={[0.4, 0, 0]}>
                {layout.map((k, i) => (
                    <Key3D
                        key={`${k.note}${k.octave}`}
                        note={k.note}
                        octave={k.octave}
                        position={k.position}
                        width={k.isBlack ? 0.45 : 0.78}
                        height={k.isBlack ? 1.8 : 3.0}
                        color={k.color}
                        onTrigger={(v) => handleTrigger(k.note, k.octave, v)}
                    />
                ))}
            </group>

            {/* Display / UI area on the right */}
            <group position={[4.8, 0.1, -1]}>
                <mesh>
                    <planeGeometry args={[1.5, 0.8]} />
                    <meshBasicMaterial color="#001a11" />
                </mesh>
                <Text position={[0, 0, 0.01]} fontSize={0.12} color="#00ff66">
                    MASTER OUT
                </Text>
            </group>
        </group>
    )
}
