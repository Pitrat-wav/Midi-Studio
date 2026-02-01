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
import { useVisualStore } from '../../store/visualStore'
import { GamepadManager } from '../../lib/GamepadManager'

export function CameraController({ focusInstrument, mode = 'overview' }: { focusInstrument: InstrumentType | null, mode?: 'overview' | 'focus' }) {
    const { camera } = useThree()
    const controlsRef = useRef<OrbitControlsImpl>(null!)
    const gestures = useGestureStore()
    const activeParam = useVisualStore(s => s.activeParam)
    const setFocus = useVisualStore(s => s.setFocusInstrument)

    // Transition State
    const targetPos = useRef(new THREE.Vector3())
    const targetLook = useRef(new THREE.Vector3())
    const isTransitioning = useRef(false)
    const lastFocus = useRef<InstrumentType | null>(null)

    // Navigation Input
    const keys = useRef<Set<string>>(new Set())

    // 1. Handle Focus Changes
    useEffect(() => {
        if (focusInstrument === lastFocus.current) return
        lastFocus.current = focusInstrument

        let preset = OVERVIEW_CAMERA_PRESET
        if (focusInstrument && SPATIAL_LAYOUT[focusInstrument]) {
            preset = SPATIAL_LAYOUT[focusInstrument].cameraPreset
        }

        targetPos.current.set(...preset.position)
        targetLook.current.set(...preset.lookAt)
        isTransitioning.current = true

    }, [focusInstrument])

    // 2. Input Listeners
    useEffect(() => {
        const onDown = (e: KeyboardEvent) => {
            keys.current.add(e.code)

            // Instrument Shortcuts
            // Ignore if typing in an input (though we don't have many inputs in canvas)
            if (e.target instanceof HTMLInputElement) return

            switch (e.key) {
                case '0': setFocus(null); break;
                case '1': setFocus('drums'); break;
                case '2': setFocus('bass'); break;
                case '3': setFocus('harmony'); break;
                case '4': setFocus('pads'); break;
                case '5': setFocus('sequencer'); break;
                case '6': setFocus('drone'); break;
                case '7': setFocus('master'); break;
                case '8': setFocus('sampler'); break;
                case '9': setFocus('buchla'); break;
            }
        }
        const onUp = (e: KeyboardEvent) => keys.current.delete(e.code)

        window.addEventListener('keydown', onDown)
        window.addEventListener('keyup', onUp)
        return () => {
            window.removeEventListener('keydown', onDown)
            window.removeEventListener('keyup', onUp)
        }
    }, [setFocus])

    useFrame((state, delta) => {
        if (!controlsRef.current) return

        // --- A. Transition Logic ---
        if (isTransitioning.current) {
            const lerp = 5 * delta
            camera.position.lerp(targetPos.current, lerp)
            controlsRef.current.target.lerp(targetLook.current, lerp)

            if (camera.position.distanceTo(targetPos.current) < 0.5 &&
                controlsRef.current.target.distanceTo(targetLook.current) < 0.5) {
                isTransitioning.current = false
            }
            controlsRef.current.update()
        }

        // --- B. Manual Navigation (Keyboard & Gamepad) ---
        // Block if using UI knobs (activeParam)
        if (activeParam) return

        // 1. Gamepad Input
        const leftStick = GamepadManager.getStick('left')
        const rightStick = GamepadManager.getStick('right')

        // Deadzone check inside loop to potentially override keys
        const gpMove = Math.abs(leftStick.y) > 0.1 || Math.abs(leftStick.x) > 0.1
        const gpRot = Math.abs(rightStick.x) > 0.1

        const hasMove = keys.current.has('KeyW') || keys.current.has('KeyS') ||
            keys.current.has('KeyA') || keys.current.has('KeyD') || gpMove
        const hasRot = keys.current.has('KeyQ') || keys.current.has('KeyE') || gpRot

        if (hasMove || hasRot) {
            // Break Auto-Pilot
            if (isTransitioning.current || focusInstrument) {
                isTransitioning.current = false
                if (focusInstrument) setFocus(null)
            }

            const speed = 25 * delta
            const rotSpeed = 2.0 * delta

            const forward = new THREE.Vector3()
            const right = new THREE.Vector3()
            camera.getWorldDirection(forward)
            forward.y = 0
            forward.normalize()
            right.crossVectors(forward, camera.up).normalize()

            // KEYBOARD
            if (keys.current.has('KeyW')) {
                camera.position.addScaledVector(forward, speed)
                controlsRef.current.target.addScaledVector(forward, speed)
            }
            if (keys.current.has('KeyS')) {
                camera.position.addScaledVector(forward, -speed)
                controlsRef.current.target.addScaledVector(forward, -speed)
            }
            if (keys.current.has('KeyA')) {
                camera.position.addScaledVector(right, -speed)
                controlsRef.current.target.addScaledVector(right, -speed)
            }
            if (keys.current.has('KeyD')) {
                camera.position.addScaledVector(right, speed)
                controlsRef.current.target.addScaledVector(right, speed)
            }

            // GAMEPAD STICKS
            if (gpMove) {
                // Left Stick Y -> Forward/Back (Inverted typically, stick up is -1)
                camera.position.addScaledVector(forward, -leftStick.y * speed)
                controlsRef.current.target.addScaledVector(forward, -leftStick.y * speed)

                // Left Stick X -> Strafe
                camera.position.addScaledVector(right, leftStick.x * speed)
                controlsRef.current.target.addScaledVector(right, leftStick.x * speed)
            }
            if (gpRot) {
                // Right Stick X -> Rotate
                (controlsRef.current as any).rotateLeft?.(-rightStick.x * rotSpeed)
            }

            if (keys.current.has('KeyQ')) (controlsRef.current as any).rotateLeft?.(rotSpeed)
            if (keys.current.has('KeyE')) (controlsRef.current as any).rotateLeft?.(-rotSpeed)

            controlsRef.current.update()
        }
    })

    return (
        <OrbitControls
            ref={controlsRef}
            enabled={gestures.activeGesture !== 'drag' && !activeParam}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={200}
            maxPolarAngle={Math.PI * 0.95}
            minPolarAngle={Math.PI * 0.05}
        />
    )
}
