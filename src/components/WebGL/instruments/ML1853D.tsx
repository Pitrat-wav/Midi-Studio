/**
 * ML185_3D — Circular Step Sequencer
 */

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { useSequencerStore, type Stage } from '../../../store/instrumentStore'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'

export function ML1853D() {
    const seq = useSequencerStore()
    const { position } = SPATIAL_LAYOUT.ml185

    return (
        <group position={position}>
            {seq.stages.map((stage, i) => {
                const angle = (i / 8) * Math.PI * 2
                const radius = 2
                const x = Math.cos(angle) * radius
                const z = Math.sin(angle) * radius
                const isActive = i === seq.currentStageIndex

                return (
                    <group key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
                        <mesh>
                            <cylinderGeometry args={[0.3, 0.1, 0.5, 6]} />
                            <meshStandardMaterial
                                color={isActive ? "#ffcc33" : "#333333"}
                                emissive={isActive ? "#ff9900" : "#000000"}
                                emissiveIntensity={isActive ? 2 : 0}
                            />
                        </mesh>
                        <Text position={[0, 0.5, 0]} fontSize={0.15} color="#ffffff">{stage.pitch}</Text>
                    </group>
                )
            })}
            <Text position={[0, -0.2, 0]} fontSize={0.25} color="#ffcc33" rotation={[-Math.PI / 2, 0, 0]}>ML-185 STEP SEQ</Text>
        </group>
    )
}
