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
import { ML1853D } from './ML1853D'
import { SnakeGrid3D } from './SnakeGrid3D'
import { Sampler3D } from './Sampler3D'
import { Buchla3D } from './Buchla3D'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { useVisualStore, type InstrumentType } from '../../../store/visualStore'

export function AllInstruments3D() {
    const setFocus = useVisualStore(s => s.setFocusInstrument)
    const focus = useVisualStore(s => s.focusInstrument)

    const handleSelect = (e: any, type: InstrumentType) => {
        e.stopPropagation()
        // If already focused, maybe toggle back to null? Or stay focused?
        // User asked: "when I click object it approaches".
        // Usually clicking again might zoom out, or just stay. Let's stay for now or toggle if desired.
        // Let's implement toggle: if clicked active, go to overview (null).
        if (focus === type) {
            setFocus(null)
        } else {
            setFocus(type)
        }
    }

    return (
        <group>
            {/* Core Instruments */}
            <group onClick={(e) => handleSelect(e, 'drums')}><DrumMachine3D /></group>
            <group onClick={(e) => handleSelect(e, 'bass')}><AcidSynth3D /></group>
            <group onClick={(e) => handleSelect(e, 'pads')}><PadsSynth3D /></group>

            {/* Restored Instruments */}
            <group onClick={(e) => handleSelect(e, 'harmony')}><HarmSynth3D /></group>

            {/* Sequencer Cluster - Separated */}
            <group onClick={(e) => handleSelect(e, 'sequencer')}><Sequencer3D /></group>
            <group onClick={(e) => handleSelect(e, 'ml185')}><ML1853D /></group>
            <group onClick={(e) => handleSelect(e, 'snake')}><SnakeGrid3D /></group>

            <group onClick={(e) => handleSelect(e, 'drone')}><DroneEngine3D /></group>
            <group onClick={(e) => handleSelect(e, 'master')}><MasterControl3D /></group>
            <group onClick={(e) => handleSelect(e, 'mixer')}><Mixer3D /></group>
            <group onClick={(e) => handleSelect(e, 'keyboard')}><Keyboard3D /></group>

            <group onClick={(e) => handleSelect(e, 'sampler')}><Sampler3D /></group>
            <group onClick={(e) => handleSelect(e, 'buchla')}><Buchla3D /></group>

            {/* Global Lighting - Reactive */}
            <ReactiveLights />
        </group>
    )
}

function ReactiveLights() {
    const bridge = useAudioVisualBridge()
    const dirLight = useRef<THREE.DirectionalLight>(null)
    const ambientLight = useRef<THREE.AmbientLight>(null)
    const hemiLight = useRef<THREE.HemisphereLight>(null)

    useFrame(() => {
        const { uAudioIntensity, uLowFreq, uHighFreq } = bridge.getUniforms()

        // Base intensity + Audio reaction
        if (dirLight.current) {
            // Kick hits make the main light flash slightly
            dirLight.current.intensity = 0.5 + (uLowFreq * 0.5)

            // Move light slightly based on intensity for "shaking" shadow effect
            dirLight.current.position.set(10 + uAudioIntensity, 10 + uAudioIntensity, 10)
        }

        if (ambientLight.current) {
            // Ambient floor raises with general loudness
            ambientLight.current.intensity = 0.2 + (uAudioIntensity * 0.2)
        }

        if (hemiLight.current) {
            // Sky color shifts on high freqs (hihats)
            const hue = (uHighFreq * 0.2) % 1
            hemiLight.current.color.setHSL(hue, 0.5, 0.8)
        }
    })

    return (
        <group>
            <ambientLight ref={ambientLight} intensity={0.2} />
            <directionalLight ref={dirLight} position={[10, 10, 10]} intensity={0.5} castShadow />
            <hemisphereLight ref={hemiLight} args={["#ffffff", "#444444", 0.3]} />
        </group>
    )
}
