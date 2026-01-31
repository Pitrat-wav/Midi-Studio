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

    const material = useMemo(() => new THREE.LineBasicMaterial({ color: "#ff3b30", linewidth: 2, transparent: true, opacity: 0.7 }), [])
    const line = useMemo(() => {
        const l = new THREE.Line(geometry, material)
        l.position.set(0, 2, -5)
        return l
    }, [geometry, material])

    useFrame(() => {
        if (!line) return

        const uniforms = bridge.getUniforms()
        const positions = (line.geometry.attributes.position.array as Float32Array)

        for (let i = 0; i < 256; i++) {
            const x = (i / 256) * 10 - 5
            const baseFreq = Math.sin(x * 2 + uniforms.uTime * 5) * uniforms.uLowFreq
            const midFreq = Math.sin(x * 10 - uniforms.uTime * 3) * uniforms.uMidFreq * 0.5
            const highFreq = Math.sin(x * 30 + uniforms.uTime * 10) * uniforms.uHighFreq * 0.3
            const noise = (Math.random() - 0.5) * uniforms.uHighFreq * 0.2
            const y = (baseFreq + midFreq + highFreq + noise) * 3
            positions[i * 3 + 1] = y
        }

        line.geometry.attributes.position.needsUpdate = true
    })

    return <primitive object={line} />
}
