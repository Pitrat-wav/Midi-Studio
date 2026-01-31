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
import { useAudioStore } from '../../../store/audioStore'
import React from 'react'

function InstrumentGroup({ instrument, children }: { instrument: InstrumentType, children: React.ReactNode }) {
    const setFocus = useVisualStore(s => s.setFocusInstrument)
    const focus = useVisualStore(s => s.focusInstrument)

    const isMuted = useAudioStore(s => {
        const m = s.mutes as any
        const key = instrument === 'harmony' ? 'harm' :
            instrument === 'pads' ? 'pads' :
                instrument === 'bass' ? 'bass' :
                    instrument === 'drums' ? 'drums' :
                        instrument === 'sampler' ? 'sampler' : null
        return (key && m && m[key]) ? m[key] : false
    })
    const energy = useVisualStore(s => (s.energy && s.energy[instrument as string]) || 0)
    const isFocused = useVisualStore(s => s.focusInstrument === instrument)

    const handleSelect = (e: any) => {
        e.stopPropagation()
        if (focus === instrument) {
            setFocus(null)
        } else {
            setFocus(instrument)
        }
    }

    return (
        <group onClick={handleSelect}>
            {/* Display status label if focused? Optional */}
            {children}
        </group>
    )
}

export function AllInstruments3D() {
    return (
        <group>
            {/* Core Instruments */}
            <InstrumentGroup instrument="drums"><DrumMachine3D /></InstrumentGroup>
            <InstrumentGroup instrument="bass"><AcidSynth3D /></InstrumentGroup>
            <InstrumentGroup instrument="pads"><PadsSynth3D /></InstrumentGroup>

            {/* Restored Instruments */}
            <InstrumentGroup instrument="harmony"><HarmSynth3D /></InstrumentGroup>

            {/* Sequencer Cluster - Separated */}
            <InstrumentGroup instrument="sequencer"><Sequencer3D /></InstrumentGroup>
            <InstrumentGroup instrument="ml185"><ML1853D /></InstrumentGroup>
            <InstrumentGroup instrument="snake"><SnakeGrid3D /></InstrumentGroup>

            <InstrumentGroup instrument="drone"><DroneEngine3D /></InstrumentGroup>
            <InstrumentGroup instrument="master"><MasterControl3D /></InstrumentGroup>
            <InstrumentGroup instrument="mixer"><Mixer3D /></InstrumentGroup>
            <InstrumentGroup instrument="keyboard"><Keyboard3D /></InstrumentGroup>

            <InstrumentGroup instrument="sampler"><Sampler3D /></InstrumentGroup>
            <InstrumentGroup instrument="buchla"><Buchla3D /></InstrumentGroup>

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
        const uniforms = bridge.getUniforms()
        if (!uniforms) return

        const { uAudioIntensity, uLowFreq, uHighFreq } = uniforms

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
