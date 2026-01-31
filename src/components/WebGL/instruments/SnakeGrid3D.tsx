/**
 * SnakeGrid3D — MDD Snake 4x4 Grid
 */

import { Text } from '@react-three/drei'
import { WhiskMaterial } from '../WhiskMaterial'
import { useSequencerStore } from '../../../store/instrumentStore'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'

export function SnakeGrid3D() {
    const seq = useSequencerStore()
    const { position } = SPATIAL_LAYOUT.snake

    return (
        <group position={position}>
            {seq.snakeGrid.map((cell, i) => {
                const x = (i % 4) - 1.5
                const z = Math.floor(i / 4) - 1.5
                const isActive = i === seq.currentSnakeIndex

                return (
                    <mesh key={i} position={[x, 0, z]}>
                        <boxGeometry args={[0.8, 0.05, 0.8]} />
                        <WhiskMaterial
                            baseColor={isActive ? "#ff00ff" : cell.active ? "#440044" : "#111111"}
                            emissive={isActive ? "#ff00ff" : "#000000"}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                )
            })}
            <Text position={[0, 0.5, 0]} fontSize={0.2} color="#ff00ff">MDD SNAKE</Text>
        </group>
    )
}
