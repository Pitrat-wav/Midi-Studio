/**
 * CameraController — Manages camera transitions between instruments
 * 
 * Handles:
 * - Smooth transitions between camera presets
 * - Overview mode (all instruments visible)
 * - Focus mode (close-up on specific instrument)
 * - OrbitControls integration
 */

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { OrbitControls } from '@react-three/drei'
import { SPATIAL_LAYOUT, OVERVIEW_CAMERA_PRESET, type InstrumentType } from '../../lib/SpatialLayout'
import { useGestureStore } from '../../logic/GestureManager'

interface CameraControllerProps {
    focusInstrument?: InstrumentType | null
    mode?: 'overview' | 'focus'
}

export function CameraController({ focusInstrument, mode = 'overview' }: CameraControllerProps) {
    const { camera } = useThree()
    const controlsRef = useRef<OrbitControlsImpl>(null!)
    const targetPosition = useRef(new THREE.Vector3())
    const targetLookAt = useRef(new THREE.Vector3())
    const gestures = useGestureStore()

    // Update target camera position based on mode
    useEffect(() => {
        if (mode === 'overview' || !focusInstrument) {
            targetPosition.current.set(...OVERVIEW_CAMERA_PRESET.position)
            targetLookAt.current.set(...OVERVIEW_CAMERA_PRESET.lookAt)
        } else {
            const preset = SPATIAL_LAYOUT[focusInstrument].cameraPreset
            targetPosition.current.set(...preset.position)
            targetLookAt.current.set(...preset.lookAt)
        }
    }, [mode, focusInstrument])

    // Smooth camera transition
    useFrame(() => {
        // Lerp camera position
        camera.position.lerp(targetPosition.current, 0.05)

        // Update orbit controls target
        if (controlsRef.current) {
            controlsRef.current.target.lerp(targetLookAt.current, 0.05)
            controlsRef.current.update()
        }
    })

    return (
        <OrbitControls
            ref={controlsRef}
            enabled={gestures.activeGesture !== 'drag'}
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={40}
            maxPolarAngle={Math.PI * 0.75}
            minPolarAngle={Math.PI * 0.1}
        />
    )
}
