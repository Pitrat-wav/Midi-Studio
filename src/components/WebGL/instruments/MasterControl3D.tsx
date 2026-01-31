/**
 * MasterControl3D — Mission Control for Global Parameters
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Box } from '@react-three/drei'
import { WhiskMaterial } from '../WhiskMaterial'
import * as THREE from 'three'
import { usePresetStore } from '../../../store/usePresetStore'
import { useCompositionManager } from '../../../logic/CompositionManager'
import { SPATIAL_LAYOUT } from '../../../lib/SpatialLayout'
import { exportToMidi } from '../../../logic/MidiExporter'
import { useAudioStore } from '../../../store/audioStore'
import {
    useBassStore,
    useDrumStore,
    useSequencerStore,
    useHarmStore,
    usePadStore,
    useLfoStore,
    useHarmonyStore
} from '../../../store/instrumentStore'
import { Knob3D } from '../controls/Knob3D'
import { Button3D } from '../controls/Button3D'

function LfoVisualizer({ position, value, target }: { position: [number, number, number], value: number, target: string }) {
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame((state) => {
        if (!meshRef.current) return
        meshRef.current.scale.set(1 + value * 0.5, 1 + value * 0.5, 1 + value * 0.5)
        meshRef.current.rotation.y += 0.02
    })

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <dodecahedronGeometry args={[0.5, 0]} />
                <WhiskMaterial
                    baseColor="#00ffff"
                    emissive="#00ffff"
                />
            </mesh>
            <Text position={[0, -0.8, 0]} fontSize={0.15} color="#00ffff">LFO: {target}</Text>
        </group>
    )
}

function FxModule({ position, label, wet, color, onChange }: { position: [number, number, number], label: string, wet: number, color: string, onChange: (v: number) => void }) {
    return (
        <group position={position}>
            <Box args={[1, 1, 1]}>
                <WhiskMaterial
                    baseColor={color}
                    transparent
                    opacity={0.3 + wet * 0.7}
                    emissive={color}
                />
            </Box>
            <Knob3D
                label="WET"
                position={[0, -1, 0.5]}
                value={wet}
                min={0} max={1}
                onChange={onChange}
                color={color}
                size={0.6}
            />
            <Text position={[0, 0.7, 0]} fontSize={0.2} color={color}>{label}</Text>
        </group>
    )
}

export function MasterControl3D() {
    // Audio Store Selectors
    const bpm = useAudioStore(s => s.bpm)
    const setBpm = useAudioStore(s => s.setBpm)
    const setMasterVolume = useAudioStore(s => s.setMasterVolume)
    const swing = useAudioStore(s => s.swing)
    const setSwing = useAudioStore(s => s.setSwing)
    const setFxParam = useAudioStore(s => s.setFxParam)
    const audioFx = useAudioStore(s => s.fx)
    const panic = useAudioStore(s => s.panic)

    // LFO Store
    const lfoValue = useLfoStore(s => s.currentValue)
    const lfoTarget = useLfoStore(s => s.target)
    const lfoEnabled = useLfoStore(s => s.enabled)
    const setLfo = useLfoStore(s => s.setLfo)

    // Sequencer Store
    const smartChordType = useSequencerStore(s => s.smartChordType)
    const smartChordEnabled = useSequencerStore(s => s.smartChordEnabled)
    const setSmartChordParam = useSequencerStore(s => s.setSmartChordParam)

    // Harmony Store
    const scale = useHarmonyStore(s => s.scale)
    const root = useHarmonyStore(s => s.root)

    // Preset Store
    const presets = usePresetStore(s => s.presets)
    const loadPreset = usePresetStore(s => s.loadPreset)
    const saveCurrentAs = usePresetStore(s => s.saveCurrentAs)

    const { requestNewComp } = useCompositionManager()
    const layout = SPATIAL_LAYOUT.master.position

    return (
        <group position={layout}>
            {/* Global Transport & Volume */}
            <group position={[0, 2.5, 0]}>
                <Knob3D
                    label="BPM"
                    position={[-2.5, 0, 0]}
                    value={bpm}
                    min={60} max={200}
                    onChange={(v) => setBpm(v)}
                    color="#ffffff"
                />
                <Knob3D
                    label="MAST VOL"
                    position={[0, 0, 0]}
                    value={0.8} // Shared for destination or harm
                    min={0} max={1}
                    onChange={(v) => setMasterVolume(v)}
                    color="#ffffff"
                    size={1.2}
                />
                <Knob3D
                    label="SWING"
                    position={[2.5, 0, 0]}
                    value={swing}
                    min={0} max={1}
                    onChange={(v) => setSwing(v)}
                    color="#ffffff"
                />
            </group>

            {/* LFO Station */}
            <LfoVisualizer
                position={[-4.5, -0.5, 0]}
                value={lfoValue}
                target={lfoTarget}
            />

            <group position={[-4.5, -2, 0]}>
                <Button3D
                    label={lfoEnabled ? "LFO ACTIVE" : "LFO OFF"}
                    position={[0, 0, 0.5]}
                    active={lfoEnabled}
                    onClick={() => setLfo({ enabled: !lfoEnabled })}
                    color="#00ffff"
                    size={0.6}
                />
            </group>

            {/* Smart Chord Terminal */}
            <group position={[4.5, -0.5, 0]}>
                <mesh>
                    <planeGeometry args={[2.5, 1.8]} />
                    <WhiskMaterial baseColor="#222244" metalness={0.9} roughness={0.1} transparent opacity={0.8} />
                </mesh>
                <Text position={[0, 0.5, 0.1]} fontSize={0.15} color="#8888ff">SMART CHORD</Text>
                <Text position={[0, 0, 0.1]} fontSize={0.3} color="#ffffff">{smartChordType.toUpperCase()}</Text>
                <Button3D
                    label={smartChordEnabled ? "ON" : "OFF"}
                    position={[0, -0.6, 0.1]}
                    active={smartChordEnabled}
                    onClick={() => setSmartChordParam({ smartChordEnabled: !smartChordEnabled })}
                    color="#8888ff"
                    size={0.5}
                />
            </group>

            {/* EQ RACK */}
            <group position={[0, 1.5, 0]}>
                <Text position={[0, 1.2, 0]} fontSize={0.2} color="#ffffff">4-BAND MASTER EQ</Text>
                <Knob3D
                    label="LOW"
                    position={[-2.25, 0, 0]}
                    value={0} // dB -12 to +12
                    min={-12} max={12}
                    onChange={(v) => useAudioStore.getState().setMasterEQ('low', v)}
                    color="#3390ec"
                    size={0.7}
                />
                <Knob3D
                    label="LO-MID"
                    position={[-0.75, 0, 0]}
                    value={0}
                    min={-12} max={12}
                    onChange={(v) => useAudioStore.getState().setMasterEQ('lowMid', v)}
                    color="#4cd964"
                    size={0.7}
                />
                <Knob3D
                    label="HI-MID"
                    position={[0.75, 0, 0]}
                    value={0}
                    min={-12} max={12}
                    onChange={(v) => useAudioStore.getState().setMasterEQ('highMid', v)}
                    color="#ffcc33"
                    size={0.7}
                />
                <Knob3D
                    label="HIGH"
                    position={[2.25, 0, 0]}
                    value={0}
                    min={-12} max={12}
                    onChange={(v) => useAudioStore.getState().setMasterEQ('high', v)}
                    color="#ff3b30"
                    size={0.7}
                />
            </group>

            {/* EFFECT RACK */}
            <group position={[0, -1, 0]}>
                <FxModule
                    position={[-2, 0, 0]}
                    label="REVERB"
                    wet={audioFx.reverb.wet}
                    color="#3399ff"
                    onChange={(v: number) => setFxParam('reverb', { wet: v })}
                />
                <FxModule
                    position={[0, 0, 0]}
                    label="DELAY"
                    wet={audioFx.delay.wet}
                    color="#33ff99"
                    onChange={(v: number) => setFxParam('delay', { wet: v })}
                />
                <FxModule
                    position={[2, 0, 0]}
                    label="DIST"
                    wet={audioFx.distortion.wet}
                    color="#ff3333"
                    onChange={(v: number) => setFxParam('distortion', { wet: v })}
                />
            </group>

            {/* GLOBAL PRESETS & PY-GENERATE */}
            <group position={[0, -3.5, 0]}>
                <Text position={[0, 1.2, 0]} fontSize={0.2} color="#ffcc33">GLOBAL PRESETS</Text>
                {[0, 1, 2, 3].map(i => (
                    <Button3D
                        key={i}
                        label={`P${i + 1}`}
                        position={[i * 1.3 - 1.95, 0.4, 0]}
                        active={presets[i] !== undefined}
                        onClick={() => {
                            const p = presets[i]
                            if (p) loadPreset(p.id)
                            else saveCurrentAs(`Preset ${i + 1}`)
                        }}
                        color="#ffcc33"
                        size={0.6}
                    />
                ))}

                <Button3D
                    label="PYTHON RANDOM PRESET"
                    position={[0, -0.6, 0.5]}
                    active={false}
                    onClick={() => requestNewComp(scale, root)}
                    color="#00ff00"
                    size={0.6}
                />
            </group>

            {/* MIDI EXPORT */}
            <group position={[0, -6, 0]}>
                <Button3D
                    label="EXPORT TO TELEGRAM"
                    position={[0, 0, 0.5]}
                    active={false}
                    onClick={async () => {
                        const activeBpm = bpm
                        const drums = useDrumStore.getState()
                        const bass = useBassStore.getState()
                        const seq = useSequencerStore.getState()
                        const pads = usePadStore.getState()
                        const harm = useHarmStore.getState()

                        const drumPatterns = {
                            kick: drums.activePatterns.kick.map(v => v ? 1 : 0),
                            snare: drums.activePatterns.snare.map(v => v ? 1 : 0),
                            hihat: drums.activePatterns.hihat.map(v => v ? 1 : 0),
                            hihatOpen: drums.activePatterns.hihatOpen.map(v => v ? 1 : 0),
                            clap: drums.activePatterns.clap.map(v => v ? 1 : 0)
                        }

                        const midiData = exportToMidi(
                            bpm,
                            drumPatterns,
                            bass.pattern,
                            seq.stages,
                            seq.snakeGrid.map(c => c.note),
                            seq.snakePattern,
                            { notes: [], active: pads.active },
                            harm.grid,
                            'drums',
                            { enabled: seq.smartChordEnabled, type: seq.smartChordType },
                            seq.turingRegister,
                            seq.turingBits
                        )

                        const base64 = btoa(String.fromCharCode(...midiData))

                        try {
                            const initData = (window as any).Telegram?.WebApp?.initData || ""
                            const response = await fetch('http://localhost:3001/upload-midi', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    midiBase64: base64,
                                    initData,
                                    filename: `autonomous_${Date.now()}.mid`
                                })
                            })
                            if (response.ok) {
                                if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                                    (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success')
                                }
                                alert('MIDI sent to your Telegram chat!')
                            } else {
                                const err = await response.json()
                                alert(`Export failed: ${err.error || 'Server error'}`)
                            }
                        } catch (e) {
                            console.error('Export failed', e)
                            alert('Network error. Is the backend running?')
                        }
                    }}
                    color="#4cd964"
                    size={0.8}
                />
            </group>

            <Text
                position={[0, 6, 0]}
                fontSize={0.4}
                color="#ffffff"
                anchorX="center"
            >
                COMMAND CENTER: AUTONOMOUS CORE
            </Text>
        </group>
    )
}
