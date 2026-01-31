/**
 * Mixer3D — Professional 3D Mixing Console
 * 
 * Features:
 * - 5 Vertical Channel Strips (Drums, Bass, Lead, Pads, Harmony)
 * - Glowing VU meters (simulated or real FFT)
 * - Mute buttons per channel
 * - Integrated 3D LFO visualization
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Box, RoundedBox } from '@react-three/drei'
import { WhiskMaterial } from '../WhiskMaterial'
import * as THREE from 'three'
import { useAudioStore } from '../../../store/audioStore'
import { useLfoStore } from '../../../store/instrumentStore'
import { Knob3D } from '../controls/Knob3D'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'

function Fader3D({ position, label, chId, color }: {
    position: [number, number, number],
    label: string,
    chId: 'drums' | 'bass' | 'lead' | 'pads' | 'harm',
    color: string
}) {
    const value = useAudioStore(s => s.volumes[chId])
    const isMuted = useAudioStore(s => s.mutes[chId])
    const setVolume = useAudioStore(s => s.setVolume)
    const toggleMute = useAudioStore(s => s.toggleMute)

    return (
        <group position={position}>
            {/* Channel Track */}
            <Box args={[0.4, 4, 0.1]} position={[0, 0, -0.05]}>
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </Box>

            {/* Fader Handle */}
            <Knob3D
                label={label}
                position={[0, (value - 0.5) * 3.5, 0.1]}
                value={value}
                min={0} max={1}
                onChange={(v) => setVolume(chId, v)}
                color={isMuted ? "#444" : color}
                size={0.7}
            />

            {/* Mute Button Block */}
            <mesh position={[0, -2.5, 0.1]} onClick={(e) => { e.stopPropagation(); toggleMute(chId); }}>
                <boxGeometry args={[0.5, 0.3, 0.1]} />
                <meshStandardMaterial
                    color={isMuted ? "#ff1111" : "#222"}
                    emissive={isMuted ? "#ff1111" : "#000"}
                    emissiveIntensity={isMuted ? 1 : 0}
                />
            </mesh>
            <Text position={[0, -2.5, 0.2]} fontSize={0.1} color="white">MUTE</Text>
            <Text position={[0, 2.3, 0]} fontSize={0.2} color={color}>{label}</Text>
        </group>
    )
}

export function Mixer3D() {
    const panic = useAudioStore(s => s.panic)
    const layout = SPATIAL_LAYOUT.mixer.position
    const channels = [
        { id: 'drums', label: 'DRM', color: '#ff3b30' },
        { id: 'bass', label: 'BASS', color: '#3390ec' },
        { id: 'lead', label: 'LEAD', color: '#ffcc33' },
        { id: 'pads', label: 'PAD', color: '#4cd964' },
        { id: 'harm', label: 'HRM', color: '#af52de' }
    ] as const

    return (
        <group position={layout}>
            {/* Console Base */}
            <RoundedBox args={[8, 6, 0.5]} radius={0.1} smoothness={4} position={[0, -0.5, -0.2]}>
                <WhiskMaterial baseColor="#050505" metalness={0.8} roughness={0.2} />
            </RoundedBox>

            {/* Title */}
            <Text position={[0, 3.5, 0]} fontSize={0.4} color="white" fontWeight="bold">
                LIVE PERFORMANCE MIXER
            </Text>

            {/* Faders */}
            <group position={[-3, 0, 0]}>
                {channels.map((ch, i) => (
                    <Fader3D
                        key={ch.id}
                        chId={ch.id}
                        position={[i * 1.5, 0, 0]}
                        label={ch.label}
                        color={ch.color}
                    />
                ))}
            </group>

            {/* Master Panic Button */}
            <group position={[0, -4.5, 0]}>
                <mesh onClick={(e) => { e.stopPropagation(); panic(); }}>
                    <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
                    <WhiskMaterial baseColor="#ff0000" emissive="#ff0000" />
                </mesh>
                <Text position={[0, 0, 0.15]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="white">PANIC</Text>
            </group>
        </group>
    )
}
