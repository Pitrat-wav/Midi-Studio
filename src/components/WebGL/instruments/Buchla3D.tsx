import { useRef } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { useVisualStore } from '../../../store/visualStore'

export function Buchla3D() {
    const { position } = SPATIAL_LAYOUT.buchla
    const setFocus = useVisualStore(s => s.setFocusInstrument)
    const focused = useVisualStore(s => s.focusInstrument === 'buchla')

    return (
        <group position={position}>
            {/* Rack Main Body */}
            <mesh onClick={() => setFocus('buchla')}>
                <boxGeometry args={[4, 3, 0.5]} />
                <meshStandardMaterial
                    color="#cccccc"
                    metalness={0.8}
                    roughness={0.2}
                    emissive={focused ? "#3366ff" : "#000"}
                    emissiveIntensity={focused ? 0.5 : 0}
                />
            </mesh>

            {/* Panel Lines / Details */}
            <mesh position={[0, 0, 0.26]}>
                <planeGeometry args={[3.8, 2.8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
            </mesh>

            {/* Decorative Knobs (Blue) */}
            <group position={[-1, 0, 0.3]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                    <meshStandardMaterial color="#0055ff" />
                </mesh>
            </group>

            <group position={[1, 0, 0.3]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
                    <meshStandardMaterial color="#0055ff" />
                </mesh>
            </group>

            <Text
                position={[0, 2, 0]}
                fontSize={0.3}
                color="#0055ff"
            >
                BUCHLA 259
            </Text>

            <Text
                position={[0, -2, 0]}
                fontSize={0.2}
                color="#ffffff"
                fillOpacity={0.5}
            >
                COMPLEX WAVEFORM GENERATOR
            </Text>
        </group>
    )
}
