/**
 * AllInstruments3D — Container for all 3D instruments
 * 
 * Manages all instrument visualizations in 3D space
 * according to SpatialLayout configuration.
 */

import { DrumMachine3D } from './DrumMachine3D'
import { AcidSynth3D } from './AcidSynth3D'
import { PadsSynth3D } from './PadsSynth3D'

export function AllInstruments3D() {
    return (
        <group>
            <DrumMachine3D />
            <AcidSynth3D />
            <PadsSynth3D />

            {/* TODO: HarmSynth3D - complex modular synth */}
            {/* TODO: Sequencer3D - ML-185 + Snake + Turing */}

            {/* Global Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 10, 10]} intensity={0.5} />
            <hemisphereLight
                args={["#ffffff", "#444444", 0.3]}
            />
        </group>
    )
}
