/**
 * Spatial Layout — Predefined 3D Positions
 * 
 * Defines where each instrument and its controls are positioned in 3D space.
 * Also includes camera presets for focusing on each instrument.
 */

import * as THREE from 'three'

export type InstrumentType = 'drums' | 'bass' | 'harmony' | 'sequencer' | 'pads' | 'drone' | 'master' | 'mixer' | 'keyboard'

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
 * Instruments are arranged in a spatial cosmic field:
 */
export const SPATIAL_LAYOUT: Record<InstrumentType, InstrumentLayout> = {
    drums: {
        position: [0, 0, 0],
        cameraPreset: {
            position: [0, 5, 8],
            lookAt: [0, 0, 0],
            fov: 60
        },
        controls: {
            // Kick
            kickPitch: [-3, -2, 1],
            kickDecay: [-3, -1, 1],
            kickVolume: [-3, 0, 1],
            kickMute: [-3, 1, 1],
            // Snare
            snarePitch: [-1.5, -2, 1],
            snareDecay: [-1.5, -1, 1],
            snareVolume: [-1.5, 0, 1],
            snareMute: [-1.5, 1, 1],
            // HiHat
            hihatPitch: [1.5, -2, 1],
            hihatDecay: [1.5, -1, 1],
            hihatVolume: [1.5, 0, 1],
            hihatMute: [1.5, 1, 1],
            // Euclidean
            kickSteps: [3, -2, 1],
            kickPulses: [3, -1, 1],
            snareSteps: [4.5, -2, 1],
            snarePulses: [4.5, -1, 1],
        }
    },

    bass: {
        position: [-15, 0, 0],
        cameraPreset: {
            position: [-15, 4, 7],
            lookAt: [-15, 0, 0],
            fov: 60
        },
        controls: {
            // Acid
            cutoff: [-17, 2, 0],
            resonance: [-17, 1, 0],
            slide: [-17, 0, 0],
            distortion: [-17, -1, 0],
            density: [-13, 2, 0],
            type: [-13, 1, 0],
            morph: [-13, 0, 0],
            // FM
            fmHarmonicity: [-15, -2, 1],
            fmModIndex: [-13.5, -2, 1],
            fmAttack: [-16.5, -2, 1],
            fmDecay: [-15, -3, 1]
        }
    },

    harmony: {
        position: [15, 0, 0],
        cameraPreset: {
            position: [15, 6, 10],
            lookAt: [15, 0, 0],
            fov: 55
        },
        controls: {
            // Buchla Section
            complexTimbre: [13, 3, 0],
            complexFmIndex: [14, 3, 0],
            complexAmIndex: [15, 3, 0],
            complexOrder: [16, 3, 0],
            complexHarmonics: [17, 3, 0],
            complexModPitch: [14, 1.5, 0],
            complexPrincipalPitch: [16, 1.5, 0],

            // OSC Modules
            osc1Detune: [13, -1, 0],
            osc2Detune: [15, -1, 0],
            osc3Detune: [17, -1, 0],

            // ADSR (Conceptualized as vertical clusters)
            osc1Attack: [12.5, -2.5, 1],
            osc1Decay: [13, -2.5, 1],
            osc2Attack: [14.5, -2.5, 1],
            osc2Decay: [15, -2.5, 1]
        }
    },

    sequencer: {
        position: [0, 0, -15],
        cameraPreset: {
            position: [0, 8, -5],
            lookAt: [0, 0, -15],
            fov: 65
        },
        controls: {
            // ML-185 (Circular)
            turingProb: [-3, 2, -15],
            turingBits: [-3, 1, -15],
            snakePattern: [3, 2, -15],
            snakeRange: [3, 1, -15]
        }
    },

    pads: {
        position: [0, 0, 15],
        cameraPreset: {
            position: [0, 4, 22],
            lookAt: [0, 0, 15],
            fov: 60
        },
        controls: {
            brightness: [-2, 0, 15],
            complexity: [0, 0, 15],
            active: [2, 0, 15]
        }
    },

    drone: {
        position: [0, 12, -8],
        cameraPreset: {
            position: [0, 15, 2],
            lookAt: [0, 12, -8],
            fov: 70
        },
        controls: {
            droneIntensity: [-3, 12, -6],
            droneChaos: [-1, 12, -6],
            droneGrit: [1, 12, -6],
            droneNervousness: [3, 12, -6]
        }
    },

    master: {
        position: [-10, 0, 12],
        cameraPreset: {
            position: [-10, 5, 18],
            lookAt: [-10, 0, 12],
            fov: 60
        },
        controls: {
            masterVol: [-12, 1, 12],
            masterBpm: [-10, 1, 12],
            masterSwing: [-8, 1, 12],
            reverbWet: [-12, -1, 12],
            delayWet: [-10, -1, 12],
            distWet: [-8, -1, 12]
        }
    },
    mixer: {
        position: [10, 0, 12],
        cameraPreset: {
            position: [10, 6, 20],
            lookAt: [10, 0, 12],
            fov: 55
        },
        controls: {
            volDrums: [8, 0, 12],
            volBass: [9, 0, 12],
            volLead: [10, 0, 12],
            volPads: [11, 0, 12],
            volHarm: [12, 0, 12],
        }
    },
    keyboard: {
        position: [0, -2, 10],
        cameraPreset: {
            position: [0, 4, 18],
            lookAt: [0, -2, 10],
            fov: 60
        },
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
