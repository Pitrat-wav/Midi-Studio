/**
 * Spatial Layout — Predefined 3D Positions
 * 
 * Defines where each instrument and its controls are positioned in 3D space.
 * Also includes camera presets for focusing on each instrument.
 */

import * as THREE from 'three'

export type InstrumentType = 'drums' | 'bass' | 'harmony' | 'sequencer' | 'pads' | 'drone' | 'master' | 'mixer' | 'keyboard' | 'ml185' | 'snake' | 'sampler' | 'buchla'

// ... CameraPreset and InstrumentLayout interfaces ...
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

export const SPATIAL_LAYOUT: Record<InstrumentType, InstrumentLayout> = {
    drums: { // Center-ish
        position: [0, 0, 0],
        cameraPreset: { position: [0, 8, 12], lookAt: [0, 0, 0], fov: 60 },
        controls: {
            // ... keep existing controls ...
            kickPitch: [-3, -2, 1], kickDecay: [-3, -1, 1], kickVolume: [-3, 0, 1], kickMute: [-3, 1, 1],
            snarePitch: [-1.5, -2, 1], snareDecay: [-1.5, -1, 1], snareVolume: [-1.5, 0, 1], snareMute: [-1.5, 1, 1],
            hihatPitch: [1.5, -2, 1], hihatDecay: [1.5, -1, 1], hihatVolume: [1.5, 0, 1], hihatMute: [1.5, 1, 1],
            kickSteps: [3, -2, 1], kickPulses: [3, -1, 1], snareSteps: [4.5, -2, 1], snarePulses: [4.5, -1, 1],
        }
    },

    bass: { // Left Wing - Farther out
        position: [-25, 0, 0],
        cameraPreset: { position: [-25, 6, 10], lookAt: [-25, 0, 0], fov: 60 },
        controls: {
            cutoff: [-27, 2, 0], resonance: [-27, 1, 0], slide: [-27, 0, 0], distortion: [-27, -1, 0],
            density: [-23, 2, 0], type: [-23, 1, 0], morph: [-23, 0, 0],
            fmHarmonicity: [-25, -2, 1], fmModIndex: [-23.5, -2, 1], fmAttack: [-26.5, -2, 1], fmDecay: [-25, -3, 1]
        }
    },

    harmony: { // Right Wing - Farther out
        position: [25, 0, 0],
        cameraPreset: { position: [25, 8, 14], lookAt: [25, 0, 0], fov: 55 },
        controls: {
            complexTimbre: [23, 3, 0], complexFmIndex: [24, 3, 0], complexAmIndex: [25, 3, 0],
            complexOrder: [26, 3, 0], complexHarmonics: [27, 3, 0],
            complexModPitch: [24, 1.5, 0], complexPrincipalPitch: [26, 1.5, 0],
            osc1Detune: [23, -1, 0], osc2Detune: [25, -1, 0], osc3Detune: [27, -1, 0],
            osc1Attack: [22.5, -2.5, 1], osc1Decay: [23, -2.5, 1], osc2Attack: [24.5, -2.5, 1], osc2Decay: [25, -2.5, 1]
        }
    },

    sequencer: { // Back Center - Turing Machine Hub
        position: [0, 0, -25],
        cameraPreset: { position: [0, 10, -15], lookAt: [0, 0, -25], fov: 65 },
        controls: {
            turingProb: [-3, 2, -25], turingBits: [-3, 1, -25],
            snakePattern: [3, 2, -25], snakeRange: [3, 1, -25]
        }
    },

    // NEW: ML-185 (Left Back)
    ml185: {
        position: [-15, 0, -15],
        cameraPreset: { position: [-15, 8, -5], lookAt: [-15, 0, -15], fov: 60 },
        controls: {}
    },

    // NEW: Snake (Right Back)
    snake: {
        position: [15, 0, -15],
        cameraPreset: { position: [15, 8, -5], lookAt: [15, 0, -15], fov: 60 },
        controls: {}
    },

    // NEW: Sampler (Left Elevated)
    sampler: { // Left Elevated
        position: [-10, 5, -5], // Suspended near the left wing
        cameraPreset: { position: [-10, 8, 2], lookAt: [-10, 5, -5], fov: 60 },
        controls: {}
    },
    buchla: { // Right Wing
        position: [12, 4, 3],
        cameraPreset: { position: [12, 7, 10], lookAt: [12, 4, 3], fov: 60 },
        controls: {}
    },

    pads: { // Front Center - Farther out
        position: [0, 0, 25],
        cameraPreset: { position: [0, 6, 35], lookAt: [0, 0, 25], fov: 60 },
        controls: { brightness: [-2, 0, 25], complexity: [0, 0, 25], active: [2, 0, 25] }
    },

    drone: { // Upper Sky
        position: [0, 20, -10],
        cameraPreset: { position: [0, 25, 5], lookAt: [0, 20, -10], fov: 70 },
        controls: { droneIntensity: [-3, 20, -8], droneChaos: [-1, 20, -8], droneGrit: [1, 20, -8], droneNervousness: [3, 20, -8] }
    },

    master: { // Front Left
        position: [-15, 0, 15],
        cameraPreset: { position: [-15, 6, 25], lookAt: [-15, 0, 15], fov: 60 },
        controls: {
            masterVol: [-17, 1, 15], masterBpm: [-15, 1, 15], masterSwing: [-13, 1, 15],
            reverbWet: [-17, -1, 15], delayWet: [-15, -1, 15], distWet: [-13, -1, 15]
        }
    },

    mixer: { // Front Right
        position: [15, 0, 15],
        cameraPreset: { position: [15, 6, 25], lookAt: [15, 0, 15], fov: 55 },
        controls: { volDrums: [13, 0, 15], volBass: [14, 0, 15], volLead: [15, 0, 15], volPads: [16, 0, 15], volHarm: [17, 0, 15] }
    },

    keyboard: {
        position: [0, -5, 10], // Lower
        cameraPreset: { position: [0, 2, 20], lookAt: [0, -5, 10], fov: 60 },
        controls: {}
    }
}

export const OVERVIEW_CAMERA_PRESET: CameraPreset = {
    position: [0, 25, 25],
    lookAt: [0, 0, 0],
    fov: 65
}

export function getControlWorldPosition(
    instrument: InstrumentType,
    controlName: string
): THREE.Vector3 {
    const layout = SPATIAL_LAYOUT[instrument]
    const controlPos = layout.controls[controlName]

    if (!controlPos) {
        console.warn(`Control "${controlName}" not found in ${instrument} layout`)
        return new THREE.Vector3().set(...layout.position)
    }

    return new THREE.Vector3(...controlPos)
}

export function getInstrumentControls(instrument: InstrumentType) {
    return SPATIAL_LAYOUT[instrument].controls
}
