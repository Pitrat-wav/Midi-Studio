/**
 * HandVision3D — 3D Skeleton + Interaction Logic
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import * as Tone from 'tone'
import { useVisualStore, type HandLandmark } from '../../store/visualStore'
import { useAudioStore } from '../../store/audioStore'
import { useBassStore, usePadStore } from '../../store/instrumentStore'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'

export function HandVision3D() {
    // Only subscribe to hand presence reactively to avoid 60fps re-renders
    const hasHand = useVisualStore(s => s.handData !== null)

    const bridge = useAudioVisualBridge()
    const groupRef = useRef<THREE.Group>(null!)
    const jointRefs = useRef<(THREE.Mesh | null)[]>([])
    const lineRef = useRef<THREE.Line>(null!)

    // Stable joints array of Vector3s to be mutated in useFrame
    const joints = useMemo(() => {
        return Array.from({ length: 21 }, () => new THREE.Vector3())
    }, [])

    const lastUpdateRef = useRef(0)

    useFrame(() => {
        // Pull latest hand data and audio state non-reactively
        const handData = useVisualStore.getState().handData
        const audio = useAudioStore.getState()
        const bass = useBassStore.getState()
        const pads = usePadStore.getState()

        if (!handData || joints.length === 0) return

        // Update joint positions directly
        handData.forEach((l, i) => {
            if (joints[i]) {
                const x = (0.5 - l.x) * 20
                const y = (0.5 - l.y) * 16
                const z = -l.z * 10
                joints[i].set(x, y, z)

                const mesh = jointRefs.current[i]
                if (mesh) {
                    mesh.position.set(x, y, z)
                }
            }
        })

        // Update line geometry manually
        if (lineRef.current) {
            const positions = lineRef.current.geometry.attributes.position.array as Float32Array
            joints.forEach((j, i) => {
                positions[i * 3] = j.x
                positions[i * 3 + 1] = j.y
                positions[i * 3 + 2] = j.z
            })
            lineRef.current.geometry.attributes.position.needsUpdate = true
        }

        // Interaction Logic
        // Landmark 4 = Thumb tip, 8 = Index tip
        const thumb = joints[4]
        const index = joints[8]

        const pinchDistance = thumb.distanceTo(index)
        const isPinching = pinchDistance < 0.5

        // Theremin Logic (Index height)
        const height = THREE.MathUtils.clamp(index.y / 4 + 0.5, 0, 1) // 0-1
        const xPos = THREE.MathUtils.clamp(index.x / 5 + 0.5, 0, 1)

        // Map height to Cutoff or Pitch
        if (isPinching) {
            const now = Date.now()

            // DIRECT MODULATION (Non-reactive)
            if (audio.harmSynth) {
                // Update the Tone.js node directly
                audio.harmSynth.setVolume(Tone.gainToDb(height))
            }

            // Update parameters in the engines directly if possible
            if (audio.bassSynth) {
                // Assuming bassSynth is Tone.MonoSynth or similar
                const cutoff = 40 + height * 5000
                if ((audio.bassSynth as any).filter) {
                    (audio.bassSynth as any).filter.frequency.rampTo(cutoff, 0.05)
                }
            }

            // THROTTLED STORE SYNC (Only update store occasionally for UI/Persistence)
            if (now - lastUpdateRef.current > 100) {
                lastUpdateRef.current = now
                // We could call store updates here, but keeping it direct is better for FPS
                // bass.setParams({ cutoff: ... }) 
            }
        }
    })

    if (!hasHand) return null

    return (
        <group ref={groupRef} position={[0, 5, 10]}>
            {joints.map((p, i) => (
                <mesh key={i} ref={el => jointRefs.current[i] = el!} position={p}>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshBasicMaterial color="#3390ec" />
                </mesh>
            ))}

            {/* Draw lines for bones */}
            <line ref={lineRef as any}>
                <bufferGeometry attach="geometry">
                    <bufferAttribute
                        attach="attributes-position"
                        count={joints.length}
                        array={new Float32Array(joints.length * 3)}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
            </line>
        </group>
    )
}
