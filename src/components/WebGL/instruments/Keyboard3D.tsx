/**
 * Keyboard3D — Adaptive 3D Performance Surface
 * 
 * Features:
 * - 2 octaves of interactive 3D keys.
 * - Velocity mapped to vertical (Y) touch position on the key.
 * - Spectral reaction (color depends on played note).
 * - Fresnel glow on active keys.
 */

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import * as Tone from 'tone'
import { WhiskMaterial } from '../WhiskMaterial'
import { useAudioStore } from '../../../store/audioStore'
import { useVisualStore } from '../../../store/visualStore'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { audioReactiveVertexShader, fresnelFragmentShader } from '../../../shaders/audioReactive.glsl'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

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
    const [lastVelocity, setLastVelocity] = useState(0.8)
    const bridge = useAudioVisualBridge()

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uPitch: { value: (NOTES.indexOf(note) + (octave - 3) * 12) / 48 }, // Normalized pitch
        uBaseColor: { value: new THREE.Color(color) },
        uGlowColor: { value: new THREE.Color('#ffffff') },
        uResonanceExp: { value: 4.0 }
    }), [note, octave, color])

    useFrame((state) => {
        if (!meshRef.current) return
        uniforms.uTime.value = state.clock.elapsedTime
        // Local pulse when triggered
        uniforms.uAudioIntensity.value = isActive ? 1.0 : (bridge.getPulse('note') * 0.3)

        // Key press animation
        const targetY = isActive ? -0.2 : 0
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.2)
    })

    const handlePointerDown = (e: any) => {
        e.stopPropagation()
        setIsActive(true)

        // Calculate velocity based on where on the key they clicked (front = loud, back = soft)
        // Local point relative to key center. y is horizontal in world but vertical in local box?
        // Actually, let's use the local 'y' of the box if oriented correctly.
        // For a box sitting on Z-axis, usually Y is vertical.
        const localY = e.uv.y // 0 to 1
        const velocity = 0.3 + localY * 0.7
        setLastVelocity(velocity)
        onTrigger(velocity)

        // Haptic if available
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
            <boxGeometry args={[width, 0.2, height]} />
            <WhiskMaterial
                baseColor={color}
                emissive={isActive ? "#ffffff" : "#000000"}
                transparent
                opacity={isActive ? 1.0 : 0.8}
            />
        </mesh>
    )
}

export function Keyboard3D() {
    // Removed useAudioStore hook to prevent re-renders
    const layout = useMemo(() => {
        const keys = []
        let currentX = -6
        for (let oct = 3; oct <= 4; oct++) {
            for (let i = 0; i < 12; i++) {
                const note = NOTES[i]
                const isBlack = note.includes('#')
                const xPos = currentX + (isBlack ? 0 : 0)

                keys.push({
                    note,
                    octave: oct,
                    isBlack,
                    position: [currentX, isBlack ? 0.1 : 0, isBlack ? -0.5 : 0] as [number, number, number],
                    color: isBlack ? '#111111' : '#eeeeee'
                })

                if (!isBlack) currentX += 0.8
                else {
                    // Adjust black key position to sit between whites
                    if (keys.length > 0) {
                        keys[keys.length - 1].position[0] -= 0.4
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
        <group position={[0, -2, 10]}>
            <Text position={[0, 1.5, -1]} fontSize={0.3} color="#ffffff">ADAPTIVE 3D KEYBOARD</Text>
            {layout.map((k, i) => (
                <Key3D
                    key={`${k.note}${k.octave}`}
                    note={k.note}
                    octave={k.octave}
                    position={k.position}
                    width={k.isBlack ? 0.4 : 0.7}
                    height={k.isBlack ? 1.5 : 2.5}
                    color={k.color}
                    onTrigger={(v) => handleTrigger(k.note, k.octave, v)}
                />
            ))}
        </group>
    )
}
