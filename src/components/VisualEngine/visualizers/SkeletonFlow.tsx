import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore, PoseLandmark } from '../../../store/visualStore'
import { Line, Trail } from '@react-three/drei'

// MediaPipe Pose connections
const CONNECTIONS = [
    [11, 12], // Shoulders
    [11, 13], [13, 15], // Left Arm
    [12, 14], [14, 16], // Right Arm
    [11, 23], [12, 24], // Torso sides
    [23, 24], // Hips
    [23, 25], [25, 27], // Left Leg
    [24, 26], [26, 28], // Right Leg
    [27, 29], [27, 31], [29, 31], // Left Foot
    [28, 30], [28, 32], [30, 32], // Right Foot
    // Face (simplified)
    [0, 1], [1, 2], [2, 3], [3, 7],
    [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10] // Mouth/Chin
]

function Bone({ start, end, intensity }: { start: PoseLandmark, end: PoseLandmark, intensity: number }) {
    if (!start || !end || (start.visibility < 0.5) || (end.visibility < 0.5)) return null

    // Map MediaPipe coordinates (0..1, Y down) to ThreeJS world (-5..5, Y up)
    const p1 = new THREE.Vector3(
        (start.x - 0.5) * -10, // Mirror X
        (0.5 - start.y) * 8,
        -start.z * 5
    )
    const p2 = new THREE.Vector3(
        (end.x - 0.5) * -10,
        (0.5 - end.y) * 8,
        -end.z * 5
    )

    return (
        <Line
            points={[p1, p2]}
            color={new THREE.Color().setHSL(0.6 + intensity * 0.4, 1, 0.5)}
            lineWidth={3 + intensity * 5}
            transparent
            opacity={0.8}
        />
    )
}

function Joint({ point, intensity }: { point: PoseLandmark, intensity: number }) {
    if (!point || point.visibility < 0.5) return null

    const pos = new THREE.Vector3(
        (point.x - 0.5) * -10,
        (0.5 - point.y) * 8,
        -point.z * 5
    )

    return (
        <mesh position={pos}>
            <sphereGeometry args={[0.05 + intensity * 0.1, 8, 8]} />
            <meshBasicMaterial color={new THREE.Color().setHSL(0.1 + intensity * 0.2, 1, 0.5)} />
        </mesh>
    )
}

export function SkeletonFlow() {
    const setPoseTrackingEnabled = useVisualStore(s => s.setPoseTrackingEnabled)
    const poseData = useVisualStore(s => s.poseData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const setConditions = useVisualStore(s => s.setConditions)

    useEffect(() => {
        setPoseTrackingEnabled(true)
        // Darken environment for better contrast
        return () => setPoseTrackingEnabled(false)
    }, [setPoseTrackingEnabled])

    useFrame((state) => {
        // Optional: Camera follows player center slightly
        if (poseData && poseData[0]) { // Nose
            // state.camera.lookAt(0, 0, 0)
        }
    })

    if (!poseData) return null

    return (
        <group>
            {/* Render Bones */}
            {CONNECTIONS.map(([i, j], idx) => (
                <Bone
                    key={`bone-${idx}`}
                    start={poseData[i]}
                    end={poseData[j]}
                    intensity={intensity}
                />
            ))}

            {/* Render Joints */}
            {poseData.map((landmark, idx) => (
                <Joint key={`joint-${idx}`} point={landmark} intensity={intensity} />
            ))}

            {/* Audio Reactive Particles around hands */}
            <HandParticles handIndex={15} poseData={poseData} intensity={intensity} color="#ff00cc" />
            <HandParticles handIndex={16} poseData={poseData} intensity={intensity} color="#00ccff" />
        </group>
    )
}

function HandParticles({ handIndex, poseData, intensity, color }: any) {
    const hand = poseData[handIndex]
    if (!hand || hand.visibility < 0.5) return null

    const pos = new THREE.Vector3(
        (hand.x - 0.5) * -10,
        (0.5 - hand.y) * 8,
        -hand.z * 5
    )

    return (
        <mesh position={pos}>
            <sphereGeometry args={[0.1 + intensity * 0.5, 16, 16]} />
            <meshBasicMaterial color={color} wireframe />
        </mesh>
    )
}
