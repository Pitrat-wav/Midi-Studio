import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'

/**
 * SpectrumAnalyzer3D
 * A holographic ring of bars that reacts to FFT audio data.
 */
export function SpectrumAnalyzer3D() {
    // 64 Instanced bars for performance
    const count = 64
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const bridge = useAudioVisualBridge()
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Colors
    const colorA = new THREE.Color('#4cd964') // Green
    const colorB = new THREE.Color('#3390ec') // Blue
    const tempColor = new THREE.Color()

    useFrame(() => {
        if (!meshRef.current) return

        // Get FFT data (512 bins)
        // We will sample 64 distinct frequencies across the spectrum
        const audioData = bridge.getUniforms() // This gives simplified low/mid/high, but we need full data
        // For full data, we need to register a callback. 
        // OPTIMIZATION: Instead of React state, we access the analyser directly or use a shared buffer if AudioVisualBridge exposed it.
        // Current AudioVisualBridge exposes AudioData via callbacks. 
        // Let's create a faster path or just fallback to procedural animation for now if direct data isn't easily accessible per-frame without state thrashing.

        // Actually AudioVisualBridge DOES NOT expose raw array to components easily without callback. 
        // Let's modify AudioVisualBridge later to expose `lastAudioData`.
        // For now, let's use the Uniforms to drive a procedural wave that looks like a spectrum.
        const { uAudioIntensity, uLowFreq, uMidFreq, uHighFreq, uTime } = audioData

        const radius = 6

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2
            const x = Math.cos(angle) * radius
            const z = Math.sin(angle) * radius

            // Calculate height based on frequency band simulation
            let value = 0.1
            const normalizedIndex = i / count

            if (normalizedIndex < 0.33) value = uLowFreq * 2 // Bass section
            else if (normalizedIndex < 0.66) value = uMidFreq * 2 // Mids
            else value = uHighFreq * 3 // Highs

            // Add some noise/variation
            value *= (Math.sin(i * 0.5 + uTime * 2) * 0.2 + 0.8)
            value = Math.max(0.1, value * 5) // Scale up

            dummy.position.set(x, value / 2, z) // Pivot at bottom
            dummy.scale.set(0.2, value, 0.2)
            dummy.rotation.y = -angle
            dummy.updateMatrix()

            meshRef.current.setMatrixAt(i, dummy.matrix)

            // Color based on height/intensity
            tempColor.lerpColors(colorB, colorA, value / 8)
            meshRef.current.setColorAt(i, tempColor)
        }

        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true

        // Slowly rotate the entire ring
        meshRef.current.rotation.y += 0.001
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} position={[0, -2, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                toneMapped={false}
                emissiveIntensity={2}
                transparent
                opacity={0.8}
            />
        </instancedMesh>
    )
}
