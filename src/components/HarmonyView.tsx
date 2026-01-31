import { useHarmStore, useHarmonyStore, useSequencerStore, HARM_PRESETS } from '../store/instrumentStore'
import { useAudioStore } from '../store/audioStore'
import { Knob } from './Knob'
import { Power, RefreshCw, Send, Play, Square, Settings2 } from 'lucide-react'
import * as Tone from 'tone'
import { useEffect, useState } from 'react'
import { useMidiExport } from '../hooks/useMidiExport'
import { ADSRParams } from '../logic/HarmSynth'

export function HarmonyView() {
    const harmStore = useHarmStore()
    const seqStore = useSequencerStore()
    const { root, scale } = useHarmonyStore()
    const { exportMidi, isExporting } = useMidiExport()
    const harmSynth = useAudioStore(s => s.harmSynth)
    const currentStep = useAudioStore(s => s.currentStep)
    const [selectedStep, setSelectedStep] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'synth' | 'seq' | 'chord' | 'fx'>('synth')
    // Sync complex modular params to engine
    useEffect(() => {
        if (!harmSynth) return

        try {
            // Osc Types
            harmSynth.setOscType(1, harmStore.osc1Type)
            harmSynth.setOscType(2, harmStore.osc2Type)
            harmSynth.setOscType(3, harmStore.osc3Type)

            harmSynth.setOscDetune(2, harmStore.osc2Detune)
            harmSynth.setOscDetune(3, harmStore.osc3Detune)

            // Envelopes
            harmSynth.setEnv('osc1', harmStore.osc1Env)
            harmSynth.setEnv('osc2', harmStore.osc2Env)
            harmSynth.setEnv('osc3', harmStore.osc3Env)
            harmSynth.setEnv('noise', harmStore.noiseEnv)

            // Filters
            harmSynth.setFilter(1, harmStore.f1Freq, harmStore.f1Q, harmStore.f1Type)
            harmSynth.setFilter(2, harmStore.f2Freq, harmStore.f2Q, harmStore.f2Type)

            // FX Send Routing
            harmSynth.setFxSend('osc1', harmStore.osc1FxSend)
            harmSynth.setFxSend('osc2', harmStore.osc2FxSend)
            harmSynth.setFxSend('osc3', harmStore.osc3FxSend)
            harmSynth.setFxSend('noise', harmStore.noiseFxSend)

            // FX Rack Params
            harmSynth.setDistortion(harmStore.distortionDrive, harmStore.distortionWet)
            harmSynth.setPhaser(harmStore.phaserFreq, harmStore.phaserDepth, harmStore.phaserStages, harmStore.phaserWet)
            harmSynth.setChorus(harmStore.chorusFreq, harmStore.chorusDelay, harmStore.chorusDepth, harmStore.chorusWet)
            harmSynth.setDelay(harmStore.delayTime, harmStore.delayFeedback, harmStore.delayWet)
            harmSynth.setReverb(harmStore.reverbDecay, harmStore.reverbWet)

            // Complex Params
            harmSynth.setComplexParams({
                complexMode: harmStore.complexMode,
                fmIndex: harmStore.complexFmIndex,
                amIndex: harmStore.complexAmIndex,
                timbre: harmStore.complexTimbre,
                order: harmStore.complexOrder,
                harmonics: harmStore.complexHarmonics,
                pitchMod: harmStore.complexPitchMod,
                ampMod: harmStore.complexAmpMod,
                timbreMod: harmStore.complexTimbreMod,
                modOscRange: harmStore.complexModOscRange,
                modPitch: harmStore.complexModPitch,
                principalPitch: harmStore.complexPrincipalPitch,
                vcaBypass: harmStore.complexVcaBypass,
                phaseLock: harmStore.complexPhaseLock,
                modOscShape: harmStore.complexModOscShape
            })
        } catch (e) {
            console.error('Failed to sync Harmony parameters', e)
        }
    }, [harmSynth, harmStore])

    const randomizePattern = () => {
        const newGrid = harmStore.grid.map(() => ({
            note: 48 + Math.floor(Math.random() * 24),
            active: Math.random() > 0.4,
            velocity: 0.6 + Math.random() * 0.4,
            probability: 1.0
        }))
        harmStore.setParam({ grid: newGrid })
    }

    const [showPresets, setShowPresets] = useState(false)
    const [presetSearch, setPresetSearch] = useState('')

    // Sync Toggles
    useEffect(() => {
        if (!harmSynth) return
        harmSynth.toggleModule('osc1', harmStore.osc1Enabled)
        harmSynth.toggleModule('osc2', harmStore.osc2Enabled)
        harmSynth.toggleModule('osc3', harmStore.osc3Enabled)
        harmSynth.toggleModule('noise', harmStore.noiseEnabled)
        harmSynth.toggleModule('f1', harmStore.f1Enabled)
        harmSynth.toggleModule('f2', harmStore.f2Enabled)
    }, [harmSynth, harmStore.osc1Enabled, harmStore.osc2Enabled, harmStore.osc3Enabled, harmStore.noiseEnabled, harmStore.f1Enabled, harmStore.f2Enabled])

    // Sync OSC1 Detune
    useEffect(() => {
        harmSynth?.setOscDetune(1, harmStore.osc1Detune)
    }, [harmSynth, harmStore.osc1Detune])

    const filteredPresets = HARM_PRESETS.filter(p =>
        p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(presetSearch.toLowerCase())
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
            {/* Header with Preset Browser Toggle */}
            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings2 size={18} color="var(--tg-theme-button-color)" />
                        <h3 style={{ margin: 0 }}>TOTAL MODULAR CONTROL</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setShowPresets(!showPresets)}
                            className="icon-button"
                            style={{
                                background: showPresets ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
                                fontSize: '11px', padding: '6px 12px'
                            }}
                        >
                            BROWSE PRESETS
                        </button>
                        <button onClick={() => exportMidi('harm')} disabled={isExporting} className="icon-button" style={{ background: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-link-color)', fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Send size={12} /> {isExporting ? '...' : 'MIDI'}
                        </button>
                        <button onClick={harmStore.togglePlay} className="icon-button" style={{ background: harmStore.isPlaying ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)', color: 'white' }}>
                            {harmStore.isPlaying ? <Square size={14} fill="white" /> : <Play size={14} fill="white" />}
                        </button>
                    </div>
                </div>

                {/* Preset Browser Overlay */}
                {showPresets && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'var(--tg-theme-bg-color)', zIndex: 100, padding: '20px',
                        display: 'flex', flexDirection: 'column', gap: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Preset Library</h2>
                            <button onClick={() => setShowPresets(false)} style={{ background: 'none', border: 'none', color: 'var(--tg-theme-link-color)', fontSize: '16px' }}>Close</button>
                        </div>
                        <input
                            placeholder="Search presets (Bass, Lead, SFX...)"
                            value={presetSearch}
                            onChange={(e) => setPresetSearch(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)', color: 'var(--tg-theme-text-color)' }}
                        />
                        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {filteredPresets.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => { harmStore.loadPreset(p); setShowPresets(false); }}
                                    style={{
                                        padding: '12px', textAlign: 'left', borderRadius: '12px',
                                        background: 'var(--tg-theme-secondary-bg-color)', border: '1px solid var(--glass-border)'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{p.name}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.5 }}>{p.category}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB SWITCHER */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '12px' }}>
                    {['synth', 'seq', 'chord', 'fx'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                                background: activeTab === tab ? 'var(--tg-theme-button-color)' : 'transparent',
                                color: activeTab === tab ? 'white' : 'var(--tg-theme-text-color)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab === 'synth' ? 'Modules' : tab === 'seq' ? 'Step Seq' : tab === 'chord' ? 'Chord/Drone' : 'Rack'}
                        </button>
                    ))}
                </div>

                {/* Modular Blocks: 3 OSCs (Visible in Synth Tab) */}
                {activeTab === 'synth' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                        {[1, 2, 3].map(idx => {
                            const enabled = harmStore[`osc${idx}Enabled` as keyof typeof harmStore] as boolean
                            const oscType = harmStore[`osc${idx}Type` as keyof typeof harmStore] as string
                            const detune = harmStore[`osc${idx}Detune` as keyof typeof harmStore] as number
                            const env = harmStore[`osc${idx}Env` as keyof typeof harmStore] as ADSRParams

                            return (
                                <div key={idx} style={{
                                    padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px',
                                    border: enabled ? '1px solid var(--tg-theme-button-color)' : '1px solid var(--glass-border)',
                                    opacity: enabled ? 1 : 0.6
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button
                                                onClick={() => harmStore.setParam({ [`osc${idx}Enabled`]: !enabled } as any)}
                                                style={{
                                                    width: '20px', height: '20px', borderRadius: '50%',
                                                    background: enabled ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                                                    border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Power size={10} color="white" />
                                            </button>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6 }}>OSC {idx}</span>
                                        </div>
                                        <select
                                            value={oscType}
                                            onChange={(e) => harmStore.setParam({ [`osc${idx}Type`]: e.target.value } as any)}
                                            style={{ fontSize: '9px', background: 'transparent', border: 'none' }}
                                        >
                                            <option value="sawtooth">SAW</option>
                                            <option value="square">SQ</option>
                                            <option value="triangle">TRI</option>
                                            <option value="sine">SIN</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <Knob label="DETUNE" value={detune} min={-50} max={50} step={1} onChange={(v) => harmStore.setParam({ [`osc${idx}Detune`]: v } as any)} size={32} />
                                        <Knob label="FX SEND" value={harmStore[`osc${idx}FxSend` as keyof typeof harmStore] as number} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ [`osc${idx}FxSend`]: v } as any)} size={32} color="var(--tg-theme-link-color)" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <Knob label="ATK" value={env.attack} min={0.001} max={1} step={0.01} onChange={(v) => harmStore.setSubParam(`osc${idx}Env` as any, { attack: v })} size={32} />
                                        <Knob label="DEC" value={env.decay} min={0.01} max={1} step={0.01} onChange={(v) => harmStore.setSubParam(`osc${idx}Env` as any, { decay: v })} size={32} />
                                        <Knob label="SUS" value={env.sustain} min={0} max={1} step={0.01} onChange={(v) => harmStore.setSubParam(`osc${idx}Env` as any, { sustain: v })} size={32} />
                                        <Knob label="REL" value={env.release} min={0.01} max={1} step={0.01} onChange={(v) => harmStore.setSubParam(`osc${idx}Env` as any, { release: v })} size={32} />
                                    </div>
                                </div>
                            )
                        })}

                        {/* Noise Block with Toggle */}
                        <div style={{
                            padding: '12px', background: 'rgba(51, 144, 236, 0.05)', borderRadius: '12px',
                            border: harmStore.noiseEnabled ? '1px solid var(--tg-theme-button-color)' : '1px solid var(--glass-border)',
                            opacity: harmStore.noiseEnabled ? 1 : 0.6
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <button
                                    onClick={() => harmStore.setParam({ noiseEnabled: !harmStore.noiseEnabled })}
                                    style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: harmStore.noiseEnabled ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                                        border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <Power size={10} color="white" />
                                </button>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6 }}>NOISE GENERATOR</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <Knob label="ATK" value={harmStore.noiseEnv.attack} min={0.001} max={1} step={0.01} onChange={(v) => harmStore.setSubParam('noiseEnv', { attack: v })} size={32} />
                                <Knob label="DEC" value={harmStore.noiseEnv.decay} min={0.01} max={1} step={0.01} onChange={(v) => harmStore.setSubParam('noiseEnv', { decay: v })} size={32} />
                                <Knob label="SUS" value={harmStore.noiseEnv.sustain} min={0} max={1} step={0.01} onChange={(v) => harmStore.setSubParam('noiseEnv', { sustain: v })} size={32} />
                                <Knob label="REL" value={harmStore.noiseEnv.release} min={0.01} max={1} step={0.01} onChange={(v) => harmStore.setSubParam('noiseEnv', { release: v })} size={32} />
                                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                                    <Knob label="FX SEND" value={harmStore.noiseFxSend} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ noiseFxSend: v })} size={32} color="var(--tg-theme-link-color)" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buchla 259 Complex Engine Panel */}
                {activeTab === 'synth' && (
                    <div style={{
                        marginTop: '20px', padding: '16px',
                        background: 'linear-gradient(180deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95))',
                        borderRadius: '20px', border: harmStore.complexMode ? '2px solid #3390ec' : '1px solid var(--glass-border)',
                        color: 'white', position: 'relative', overflow: 'hidden'
                    }}>
                        {/* 259 Inspired Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button
                                    onClick={() => harmStore.setParam({ complexMode: !harmStore.complexMode })}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: harmStore.complexMode ? '#3390ec' : 'rgba(255,255,255,0.1)',
                                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
                                    }}
                                >
                                    <Power size={18} color="white" />
                                </button>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#3390ec' }}>Programmable Waveform Generator 259</h4>
                                    <p style={{ margin: 0, fontSize: '9px', opacity: 0.6 }}>Complex Engine — Dual Osc Modulation & Folding</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '8px', opacity: 0.5 }}>DRONE</span>
                                    <button
                                        onClick={() => harmStore.setParam({ complexVcaBypass: !harmStore.complexVcaBypass })}
                                        style={{
                                            padding: '4px 8px', borderRadius: '4px', border: 'none', fontSize: '8px',
                                            background: harmStore.complexVcaBypass ? '#ff4d4d' : 'rgba(255,255,255,0.1)',
                                            color: 'white', fontWeight: 'bold'
                                        }}
                                    >
                                        VCA BYPASS
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '8px', opacity: 0.5 }}>SYNC</span>
                                    <button
                                        onClick={() => harmStore.setParam({ complexPhaseLock: !harmStore.complexPhaseLock })}
                                        style={{
                                            padding: '4px 8px', borderRadius: '4px', border: 'none', fontSize: '8px',
                                            background: harmStore.complexPhaseLock ? '#3390ec' : 'rgba(255,255,255,0.1)',
                                            color: 'white', fontWeight: 'bold'
                                        }}
                                    >
                                        PHASE LOCK
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <span style={{ fontSize: '8px', opacity: 0.5 }}>RANGE</span>
                                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '2px' }}>
                                        {(['low', 'high'] as const).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => harmStore.setParam({ complexModOscRange: r })}
                                                style={{
                                                    fontSize: '8px', padding: '4px 8px', borderRadius: '4px', border: 'none',
                                                    background: harmStore.complexModOscRange === r ? '#3390ec' : 'transparent',
                                                    color: 'white', textTransform: 'uppercase'
                                                }}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) 1.5fr minmax(100px, 1fr)', gap: '16px' }}>
                            {/* MODULATION OSC FREQUENCY (Left) */}
                            <div style={{ paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                <div style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>MOD FREQ</div>
                                <Knob label="Hz / OCT" value={harmStore.complexModPitch} min={-24} max={24} step={1} onChange={(v) => harmStore.setParam({ complexModPitch: v })} size={64} color="#3390ec" />

                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                    {([['triangle', 'TRI'], ['square', 'SQ'], ['sawtooth', 'SAW']] as const).map(([type, label]) => (
                                        <button
                                            key={type}
                                            onClick={() => harmStore.setParam({ complexModOscShape: type as any })}
                                            style={{
                                                fontSize: '7px', padding: '4px', borderRadius: '2px', border: 'none',
                                                background: harmStore.complexModOscShape === type ? '#3390ec' : 'rgba(255,255,255,0.05)',
                                                color: 'white'
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                    {[
                                        { id: 'complexPitchMod', label: 'PITCH' },
                                        { id: 'complexAmpMod', label: 'AMPLITUDE' },
                                        { id: 'complexTimbreMod', label: 'TIMBRE' }
                                    ].map(sw => (
                                        <button
                                            key={sw.id}
                                            onClick={() => harmStore.setParam({ [sw.id]: !(harmStore as any)[sw.id] } as any)}
                                            style={{
                                                fontSize: '7px', padding: '5px', borderRadius: '4px', border: 'none',
                                                background: (harmStore as any)[sw.id] ? '#3390ec' : 'rgba(255,255,255,0.05)',
                                                color: 'white', fontWeight: 'bold'
                                            }}
                                        >
                                            {sw.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CENTER SECTION: FOLDING & SHAPING */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 12px',
                                borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.7, textAlign: 'center' }}>SHAPING & INDEX</div>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                    <Knob label="MOD INDEX" value={harmStore.complexFmIndex} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ complexFmIndex: v })} size={54} color="#3390ec" />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Knob label="TIMBRE" value={harmStore.complexTimbre} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ complexTimbre: v })} size={80} color="#3390ec" />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '4px' }}>
                                    <Knob label="ORDER" value={harmStore.complexOrder} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ complexOrder: v })} size={40} color="#3390ec" />
                                    <Knob label="HARMONICS" value={harmStore.complexHarmonics} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ complexHarmonics: v })} size={40} color="#3390ec" />
                                </div>
                            </div>

                            {/* PRINCIPAL OSC PITCH (Right) */}
                            <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                <div style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px' }}>PRINCIPAL PITCH</div>
                                <Knob label="Hz / OCT" value={harmStore.complexPrincipalPitch} min={-24} max={24} step={1} onChange={(v) => harmStore.setParam({ complexPrincipalPitch: v })} size={64} color="#3390ec" />
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{
                                        padding: '12px', borderRadius: '12px', background: 'rgba(51, 144, 236, 0.1)',
                                        border: '1px solid rgba(51, 144, 236, 0.2)', fontSize: '8px', textAlign: 'center', color: '#3390ec'
                                    }}>
                                        FINAL<br />OUTPUT
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters/Rack Tabs */}
                {activeTab === 'synth' && (
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[1, 2].map(num => {
                            const enabled = harmStore[`f${num}Enabled` as keyof typeof harmStore] as boolean
                            return (
                                <div key={num} style={{
                                    padding: '12px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '12px',
                                    opacity: enabled ? 1 : 0.6,
                                    border: enabled ? '1px solid rgba(0,0,0,0.1)' : '1px solid transparent'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button
                                                onClick={() => harmStore.setParam({ [`f${num}Enabled`]: !enabled } as any)}
                                                style={{
                                                    width: '18px', height: '18px', borderRadius: '4px',
                                                    background: enabled ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                                                    border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Power size={9} color="white" />
                                            </button>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>FILTER {num}</span>
                                        </div>
                                        <select
                                            value={harmStore[`f${num}Type` as keyof typeof harmStore] as string}
                                            onChange={(e) => harmStore.setParam({ [`f${num}Type`]: e.target.value } as any)}
                                            style={{ fontSize: '9px', background: 'transparent', border: 'none' }}
                                        >
                                            <option value="lowpass">LP</option>
                                            <option value="highpass">HP</option>
                                            <option value="bandpass">BP</option>
                                            <option value="notch">NOTCH</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                        <Knob label="FREQ" value={harmStore[`f${num}Freq` as keyof typeof harmStore] as number} min={50} max={10000} step={10} onChange={(v) => harmStore.setParam({ [`f${num}Freq`]: v } as any)} size={44} />
                                        <Knob label="Q" value={harmStore[`f${num}Q` as keyof typeof harmStore] as number} min={0.1} max={20} step={0.1} onChange={(v) => harmStore.setParam({ [`f${num}Q`]: v } as any)} size={44} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* FX RACK (Rack Tab) */}
                {activeTab === 'fx' && (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.06)', borderRadius: '20px', border: '1px solid var(--tg-theme-button-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--tg-theme-button-color)', textTransform: 'uppercase' }}>ULTIMATE FX RACK</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)', opacity: 0.3 }} />
                            <Knob label="VIBE (Macro)" value={0.5} min={0} max={1} step={0.01} onChange={(v) => {
                                // Vibe Macro: Reverb Wet, Delay Wet, Filter 1 Freq
                                harmStore.setParam({
                                    reverbWet: v * 0.8,
                                    delayWet: v * 0.5,
                                    f1Freq: 2000 + (v * 4000)
                                })
                            }} size={36} color="var(--tg-theme-button-color)" />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ padding: '12px', background: 'rgba(255, 77, 77, 0.05)', borderRadius: '14px', border: '1px solid rgba(255, 77, 77, 0.1)' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#ff4d4d', marginBottom: '8px', textAlign: 'center' }}>DISTORTION</div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                        <Knob label="DRIVE" value={harmStore.distortionDrive} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ distortionDrive: v })} size={36} color="#ff4d4d" />
                                        <Knob label="WET" value={harmStore.distortionWet} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ distortionWet: v })} size={36} color="#ff4d4d" />
                                    </div>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(191, 77, 255, 0.05)', borderRadius: '14px', border: '1px solid rgba(191, 77, 255, 0.1)' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#bf4dff', marginBottom: '8px', textAlign: 'center' }}>PHASER</div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                        <Knob label="FREQ" value={harmStore.phaserFreq} min={0.1} max={10} step={0.1} onChange={(v) => harmStore.setParam({ phaserFreq: v })} size={36} color="#bf4dff" />
                                        <Knob label="WET" value={harmStore.phaserWet} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ phaserWet: v })} size={36} color="#bf4dff" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6, color: '#4d79ff' }}>CHORUS</span>
                                    <Knob label="WET" value={harmStore.chorusWet} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ chorusWet: v })} size={36} color="#4d79ff" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6, color: '#4dff88' }}>DELAY</span>
                                    <Knob label="WET" value={harmStore.delayWet} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ delayWet: v })} size={36} color="#4dff88" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6, color: '#4da6ff' }}>REVERB</span>
                                    <Knob label="WET" value={harmStore.reverbWet} min={0} max={1} step={0.01} onChange={(v) => harmStore.setParam({ reverbWet: v })} size={36} color="#4da6ff" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CHORD & DRONE (Chord Tab) */}
                {activeTab === 'chord' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ padding: '16px', background: 'rgba(51, 144, 236, 0.05)', borderRadius: '16px', border: '1px solid var(--tg-theme-button-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>MIDI CHORD FX (± ST)</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: harmStore.chordOffsets[i] !== undefined ? 'var(--tg-theme-button-color)' : '#333' }} />
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                {[0, 1, 2, 3].map(idx => (
                                    <Knob
                                        key={idx}
                                        label={`OFF ${idx + 1}`}
                                        value={harmStore.chordOffsets[idx] || 0}
                                        min={-24} max={24} step={1}
                                        onChange={(v) => {
                                            const newOffsets = [...harmStore.chordOffsets]
                                            newOffsets[idx] = v
                                            harmStore.setParam({ chordOffsets: newOffsets.filter(n => n !== 0) })
                                        }}
                                        size={40}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => harmStore.setParam({ isDroneEnabled: !harmStore.isDroneEnabled })}
                                        style={{ width: '20px', height: '20px', borderRadius: '50%', background: harmStore.isDroneEnabled ? 'var(--tg-theme-button-color)' : '#333', border: 'none' }}
                                    >
                                        <Play size={10} color="white" fill="white" />
                                    </button>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>ATMOSPHERE DRONE</span>
                                </div>
                                <span style={{ fontSize: '9px', opacity: 0.5 }}>SLOW SWELLS (32 STEP)</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                                {harmStore.droneGrid.map((step, i) => (
                                    <div
                                        key={i}
                                        onClick={() => harmStore.setParam({ droneGrid: harmStore.droneGrid.map((s, idx) => idx === i ? { ...s, active: !s.active } : s) })}
                                        style={{
                                            height: '24px', borderRadius: '4px',
                                            background: step.active ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                                            border: harmStore.currentDroneStep === i ? '1px solid white' : 'none',
                                            opacity: 1
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP SEQUENCER (Seq Tab) */}
                {activeTab === 'seq' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => harmStore.setParam({ isSequencerEnabled: !harmStore.isSequencerEnabled })}
                                    style={{ width: '20px', height: '20px', borderRadius: '4px', background: harmStore.isSequencerEnabled ? 'var(--tg-theme-button-color)' : '#333', border: 'none' }}
                                >
                                    <Play size={10} color="white" fill="white" />
                                </button>
                                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>16-STEP MODULAR GRID</span>
                            </div>
                            <button onClick={randomizePattern} className="icon-button-small"><RefreshCw size={12} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                            {harmStore.grid.map((step, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedStep(i)}
                                    style={{
                                        height: '36px',
                                        background: step.active ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-bg-color)',
                                        borderRadius: '6px',
                                        border: (harmStore.currentStep === i && harmStore.isPlaying) ? '2px solid white' : (selectedStep === i ? '2px solid var(--tg-theme-link-color)' : '1px solid var(--glass-border)'),
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        opacity: step.active ? 1 : 0.5, cursor: 'pointer', transition: 'all 0.1s'
                                    }}
                                >
                                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: step.active ? 'white' : 'inherit' }}>
                                        {Tone.Frequency(step.note, "midi").toNote().replace(/[0-9]/g, '')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {selectedStep !== null && (
                            <div style={{ padding: '12px', background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>STEP #{selectedStep + 1}</span>
                                    <button onClick={() => setSelectedStep(null)} style={{ fontSize: '10px', border: 'none', background: 'none', color: 'var(--tg-theme-link-color)' }}>CLOSE</button>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-around' }}>
                                    <button
                                        onClick={() => harmStore.setStep(selectedStep, { active: !harmStore.grid[selectedStep].active })}
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: harmStore.grid[selectedStep].active ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)', border: 'none' }}
                                    >
                                        <Power size={16} color="white" />
                                    </button>
                                    <Knob label="NOTE" value={harmStore.grid[selectedStep].note} min={24} max={84} step={1} onChange={(v) => harmStore.setStep(selectedStep, { note: v })} size={40} />
                                    <Knob label="VEL" value={harmStore.grid[selectedStep].velocity} min={0} max={1} step={0.01} onChange={(v) => harmStore.setStep(selectedStep, { velocity: v })} size={40} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    )
}
