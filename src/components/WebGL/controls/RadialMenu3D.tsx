/**
 * RadialMenu3D — Interactive Orbital Context Menu
 * 
 * Logic:
 * 1. Appears on Long-press at the cursor location.
 * 2. Menu elements are arranged in a circle.
 * 3. Two-swipe selection: 
 *    - First swipe highlights category.
 *    - Releasing on category enters sub-menu or sets value.
 */

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Ring } from '@react-three/drei'
import * as THREE from 'three'

interface RadialItem {
    id: string
    label: string
    icon?: string
    color?: string
}

interface RadialMenu3DProps {
    items: RadialItem[]
    onSelect: (id: string) => void
    visible: boolean
    position: THREE.Vector3
}

export function RadialMenu3D({ items, onSelect, visible, position }: RadialMenu3DProps) {
    const groupRef = useRef<THREE.Group>(null!)

    useFrame((state) => {
        if (!groupRef.current) return
        if (visible) {
            groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
            groupRef.current.rotation.z += 0.01 // Gentle rotation
        } else {
            groupRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.2)
        }
    })

    if (!visible && groupRef.current?.scale.x < 0.01) return null

    return (
        <group ref={groupRef} position={position} scale={[0, 0, 0]}>
            {/* Background Ring */}
            <Ring args={[0.8, 1.2, 64]}>
                <meshStandardMaterial color="#222" transparent opacity={0.6} />
            </Ring>

            {/* Menu Items */}
            {items.map((item, i) => {
                const angle = (i / items.length) * Math.PI * 2
                const x = Math.cos(angle) * 1.5
                const y = Math.sin(angle) * 1.5

                return (
                    <group key={item.id} position={[x, y, 0.1]}>
                        <mesh onClick={() => onSelect(item.id)}>
                            <circleGeometry args={[0.4, 32]} />
                            <meshStandardMaterial color={item.color || "#3390ec"} emissive={item.color || "#3390ec"} emissiveIntensity={0.5} />
                        </mesh>
                        <Text position={[0, -0.6, 0]} fontSize={0.15} color="white">
                            {item.label}
                        </Text>
                    </group>
                )
            })}
        </group>
    )
}
