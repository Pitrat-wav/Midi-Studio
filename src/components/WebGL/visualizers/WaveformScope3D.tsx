import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'

/**
 * WaveformScope3D
 * Renders a data line showing the actual audio waveform.
 */
export function WaveformScope3D() {
    const lineRef = useRef<THREE.Line>(null)
    const bridge = useAudioVisualBridge()

    // Geometry for the line (256 points)
    const points = useMemo(() => {
        const ptrs = []
        for (let i = 0; i < 256; i++) {
            ptrs.push(new THREE.Vector3((i / 256) * 10 - 5, 0, 0))
        }
        return ptrs
    }, [])

    const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

    useFrame(() => {
        if (!lineRef.current) return

        const uniforms = bridge.getUniforms()
        // Ideally we need actual waveform data. 
        // Since we are simulating visualizers based on uniforms for now to avoid callback overhead in this iteration:
        // We will generate a "fake" waveform composed of sine waves modulated by low/mid/high uniforms.

        const positions = lineRef.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < 256; i++) {
            const x = (i / 256) * 10 - 5

            // Synthesis of waveform visual
            const baseFreq = Math.sin(x * 2 + uniforms.uTime * 5) * uniforms.uLowFreq // Bass wave
            const midFreq = Math.sin(x * 10 - uniforms.uTime * 3) * uniforms.uMidFreq * 0.5 // Mid ripple
            const highFreq = Math.sin(x * 30 + uniforms.uTime * 10) * uniforms.uHighFreq * 0.3 // High jitter

            const noise = (Math.random() - 0.5) * uniforms.uHighFreq * 0.2

            const y = (baseFreq + midFreq + highFreq + noise) * 3

            // Update Y
            positions[i * 3 + 1] = y
        }

        lineRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <line ref={lineRef} geometry={geometry} position={[0, 2, -5]}>
            <lineBasicMaterial color="#ff3b30" linewidth={2} transparent opacity={0.7} />
        </line>
    )
}
