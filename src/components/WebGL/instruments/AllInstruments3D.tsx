/**
 * AllInstruments3D — Container for all 3D instruments
 * 
 * Manages all instrument visualizations in 3D space
 * according to SpatialLayout configuration.
 */

import { DrumMachine3D } from './DrumMachine3D'
import { AcidSynth3D } from './AcidSynth3D'
import { PadsSynth3D } from './PadsSynth3D'
import { HarmSynth3D } from './HarmSynth3D'
import { Sequencer3D } from './Sequencer3D'
import { DroneEngine3D } from './DroneEngine3D'
import { MasterControl3D } from './MasterControl3D'
import { Mixer3D } from './Mixer3D'
import { Keyboard3D } from './Keyboard3D'

export function AllInstruments3D() {
    return (
        <group>
            {/* Core Instruments */}
            <DrumMachine3D />
            <AcidSynth3D />
            <PadsSynth3D />

            {/* Restored Instruments */}
            <HarmSynth3D />
            <Sequencer3D />
            <DroneEngine3D />
            <MasterControl3D />
            <Mixer3D />
            <Keyboard3D />

            {/* Global Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 10, 10]} intensity={0.5} />
            <hemisphereLight
                args={["#ffffff", "#444444", 0.3]}
            />
        </group>
    )
}
