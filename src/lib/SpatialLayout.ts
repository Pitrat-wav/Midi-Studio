/**
 * Spatial Layout — Predefined 3D Positions
 * 
 * Defines where each instrument and its controls are positioned in 3D space.
 * Also includes camera presets for focusing on each instrument.
 */

import * as THREE from 'three'

export type InstrumentType = 'drums' | 'bass' | 'harmony' | 'sequencer' | 'pads'

export interface CameraPreset {
    position: [number, number, number]
    lookAt: [number, number, number]
    fov?: number
}

export interface InstrumentLayout {
    position: [number, number, number]
    cameraPreset: CameraPreset
    controls: Record<string, [number, number, number]>
}

/**
 * Main Layout Configuration
 * 
 * Instruments are arranged in a circular pattern:
 * - Drums: Center (0, 0, 0)
 * - Bass: Left (-8, 0, 0)
 * - Harmony: Right (8, 0, 0)
 * - Sequencer: Back (0, 0, -8)
 * - Pads: Front (0, 0, 8)
 */
export const SPATIAL_LAYOUT: Record<InstrumentType, InstrumentLayout> = {
    drums: {
        position: [0, 0, 0],
        cameraPreset: {
            position: [0, 3, 6],
            lookAt: [0, 0, 0],
            fov: 60
        },
        controls: {
            // Kick controls (left side)
            kickPitch: [-2.5, -1.5, 0],
            kickDecay: [-2.5, -1, 0],
            kickVolume: [-2.5, -0.5, 0],
            kickMute: [-2.5, 0, 0],

            // Snare controls (center-left)
            snarePitch: [-1, -1.5, 0],
            snareDecay: [-1, -1, 0],
            snareVolume: [-1, -0.5, 0],
            snareMute: [-1, 0, 0],

            // HiHat controls (center-right)
            hihatPitch: [1, -1.5, 0],
            hihatDecay: [1, -1, 0],
            hihatVolume: [1, -0.5, 0],
            hihatMute: [1, 0, 0],

            // Pattern controls (right side)
            kickSteps: [2.5, -1.5, 0],
            kickPulses: [2.5, -1, 0],
            snareSteps: [2.5, -0.5, 0],
            snarePulses: [2.5, 0, 0],
            hihatSteps: [2.5, 0.5, 0],
            hihatPulses: [2.5, 1, 0]
        }
    },

    bass: {
        position: [-8, 0, 0],
        cameraPreset: {
            position: [-8, 3, 6],
            lookAt: [-8, 0, 0],
            fov: 60
        },
        controls: {
            // Main controls
            cutoff: [-9.5, -1.5, 0],
            resonance: [-8.5, -1.5, 0],
            slide: [-7.5, -1.5, 0],
            distortion: [-6.5, -1.5, 0],

            // Pattern
            density: [-9.5, -0.5, 0],
            type: [-8.5, -0.5, 0],
            morph: [-7.5, -0.5, 0],
        }
    },

    harmony: {
        position: [8, 0, 0],
        cameraPreset: {
            position: [8, 3, 6],
            lookAt: [8, 0, 0],
            fov: 60
        },
        controls: {
            // OSC 1 (left module)
            osc1Type: [6, 1, 0],
            osc1Detune: [6, 0.5, 0],
            osc1Attack: [6, 0, 0],
            osc1Decay: [6, -0.5, 0],
            osc1Sustain: [6, -1, 0],
            osc1Release: [6, -1.5, 0],

            // OSC 2 (center module)
            osc2Type: [8, 1, 0],
            osc2Detune: [8, 0.5, 0],
            osc2Attack: [8, 0, 0],
            osc2Decay: [8, -0.5, 0],
            osc2Sustain: [8, -1, 0],
            osc2Release: [8, -1.5, 0],

            // OSC 3 (right module)
            osc3Type: [10, 1, 0],
            osc3Detune: [10, 0.5, 0],
            osc3Attack: [10, 0, 0],
            osc3Decay: [10, -0.5, 0],
            osc3Sustain: [10, -1, 0],
            osc3Release: [10, -1.5, 0],

            // Filters (bottom)
            f1Freq: [7, -2.5, 0],
            f1Q: [7.5, -2.5, 0],
            f2Freq: [8.5, -2.5, 0],
            f2Q: [9, -2.5, 0],
        }
    },

    sequencer: {
        position: [0, 0, -8],
        cameraPreset: {
            position: [0, 3, -2],
            lookAt: [0, 0, -8],
            fov: 60
        },
        controls: {
            // ML-185 controls would go here
            // Snake grid controls
            // Turing machine controls
        }
    },

    pads: {
        position: [0, 0, 8],
        cameraPreset: {
            position: [0, 3, 14],
            lookAt: [0, 0, 8],
            fov: 60
        },
        controls: {
            brightness: [-1, -1.5, 8],
            complexity: [0, -1.5, 8],
            active: [1, -1.5, 8]
        }
    }
}

/**
 * Overview Camera Position
 * Shows all instruments at once
 */
export const OVERVIEW_CAMERA_PRESET: CameraPreset = {
    position: [0, 15, 15],
    lookAt: [0, 0, 0],
    fov: 75
}

/**
 * Helper: Get control position in world coordinates
 */
export function getControlWorldPosition(
    instrument: InstrumentType,
    controlName: string
): THREE.Vector3 {
    const layout = SPATIAL_LAYOUT[instrument]
    const controlPos = layout.controls[controlName]

    if (!controlPos) {
        console.warn(`Control "${controlName}" not found in ${instrument} layout`)
        return new THREE.Vector3()
    }

    return new THREE.Vector3(...controlPos)
}

/**
 * Helper: Get all control positions for an instrument
 */
export function getInstrumentControls(instrument: InstrumentType) {
    return SPATIAL_LAYOUT[instrument].controls
}
