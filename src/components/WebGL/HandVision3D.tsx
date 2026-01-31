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

function FingerJoint({ position }: { position: THREE.Vector3 }) {
    return (
        <mesh position={position}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#3390ec" />
        </mesh>
    )
}

export function HandVision3D() {
    const handData = useVisualStore(s => s.handData)
    const bridge = useAudioVisualBridge()
    const groupRef = useRef<THREE.Group>(null!)
    const audio = useAudioStore.getState() // Use non-reactive state for engines
    const bass = useBassStore.getState()
    const pads = usePadStore.getState()

    // Map normalized landmarks to 3D space relative to camera
    // Making it "Fullscreen Big" - covering a wider area
    const joints = useMemo(() => {
        if (!handData) return []
        return handData.map(l => {
            // Scale up significantly: 20x16 units (approx fullscreen at depth 10)
            return new THREE.Vector3(
                (0.5 - l.x) * 20, // Was 10
                (0.5 - l.y) * 16, // Was 8
                -l.z * 10
            )
        })
    }, [handData])

    const lastUpdateRef = useRef(0)

    useFrame(() => {
        if (!handData || joints.length === 0) return

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

    if (!handData) return null

    return (
        <group ref={groupRef} position={[0, 5, 10]}>
            {joints.map((p, i) => (
                <FingerJoint key={i} position={p} />
            ))}

            {/* Draw lines for bones */}
            <line>
                <bufferGeometry attach="geometry">
                    <bufferAttribute attach="attributes-position" count={joints.length} array={new Float32Array(joints.flatMap(j => [j.x, j.y, j.z]))} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
            </line>
        </group>
    )
}
