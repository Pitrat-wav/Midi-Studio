import { useAudioStore } from '../store/audioStore'
import { Knob } from './Knob'
import { useLfoStore, LfoShape } from '../store/instrumentStore'
import { Activity, Power, Waves, Zap, TrendingUp, Square as SquareIcon, Dice5 } from 'lucide-react'
import { motion } from 'framer-motion'

export function MixerView() {
    const volumes = useAudioStore(s => s.volumes)
    const setVolume = useAudioStore(s => s.setVolume)

    return (
        <section className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Микшер</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '24px', padding: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                {([
                    { id: 'drums', label: 'DRM' },
                    { id: 'bass', label: 'BASS' },
                    { id: 'lead', label: 'LEAD' },
                    { id: 'pads', label: 'PAD' },
                    { id: 'harm', label: 'HRM' }
                ] as const).map(ch => (
                    <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Knob
                            label={ch.label}
                            value={volumes[ch.id]}
                            min={0} max={1} step={0.01}
                            onChange={(v) => useAudioStore.getState().setVolume(ch.id, v)}
                            size={44}
                        />
                        <button
                            onClick={() => useAudioStore.getState().toggleMute(ch.id)}
                            style={{
                                width: '32px', height: '18px', borderRadius: '4px',
                                background: useAudioStore(s => s.mutes[ch.id]) ? 'var(--tg-theme-destructive-text-color)' : 'rgba(0,0,0,0.1)',
                                color: 'white', border: 'none', fontSize: '8px', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            MUTE
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ padding: '20px', background: 'rgba(51, 144, 236, 0.08)', borderRadius: '16px', border: '1px solid var(--tg-theme-button-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', background: 'var(--tg-theme-button-color)', borderRadius: '8px', color: 'white' }}>
                            <Activity size={20} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0 }}>LFO Modulator</h4>
                            <span style={{ fontSize: '10px', opacity: 0.6, textTransform: 'uppercase' }}>Professional Engine</span>
                        </div>
                    </div>
                    <button
                        onClick={() => useLfoStore.getState().setLfo({ enabled: !useLfoStore.getState().enabled })}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '10px',
                            background: useLfoStore(s => s.enabled) ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.2)',
                            color: 'white',
                            border: 'none',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease',
                            boxShadow: useLfoStore(s => s.enabled) ? '0 0 15px var(--tg-theme-button-color)' : 'none'
                        }}
                    >
                        <Power size={14} />
                        {useLfoStore(s => s.enabled) ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Visualizer and Shapes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{
                            height: '60px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '10px',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {/* Simple dynamic SVG waveform */}
                            <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <path
                                    d={useLfoStore(s => {
                                        const v = s.currentValue;
                                        const y = 20 - v * 15;
                                        return `M 0 20 Q 25 ${y}, 50 20 T 100 20`;
                                    })}
                                    stroke="var(--tg-theme-button-color)"
                                    strokeWidth="2"
                                    fill="none"
                                />
                                {/* Scanning line */}
                                <motion.line
                                    x1="0" y1="0" x2="0" y2="40"
                                    stroke="white" strokeWidth="1" strokeOpacity="0.3"
                                    animate={{ x: [0, 100] }}
                                    transition={{ duration: 1 / useLfoStore.getState().frequency, repeat: Infinity, ease: "linear" }}
                                />
                            </svg>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                            {[
                                { id: 'sine', icon: <Waves size={14} /> },
                                { id: 'triangle', icon: <TrendingUp size={14} /> },
                                { id: 'saw', icon: <Zap size={14} /> },
                                { id: 'square', icon: <SquareIcon size={14} /> },
                                { id: 'random', icon: <Dice5 size={14} /> }
                            ].map(shape => (
                                <button
                                    key={shape.id}
                                    onClick={() => useLfoStore.getState().setLfo({ shape: shape.id as LfoShape })}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        background: useLfoStore(s => s.shape) === shape.id ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                                        color: useLfoStore(s => s.shape) === shape.id ? 'white' : 'inherit',
                                        border: 'none',
                                        flex: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {shape.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                        <Knob
                            label="Rate"
                            value={useLfoStore(s => s.frequency)}
                            min={0.1} max={30} step={0.1}
                            onChange={(v) => useLfoStore.getState().setLfo({ frequency: v })}
                            size={44}
                        />
                        <Knob
                            label="Depth"
                            value={useLfoStore(s => s.depth * 100)}
                            min={0} max={100} step={1}
                            onChange={(v) => useLfoStore.getState().setLfo({ depth: v / 100 })}
                            size={44}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.6, marginLeft: '4px' }}>DESTINATION</label>
                    <select
                        value={useLfoStore(s => s.target)}
                        onChange={(e) => useLfoStore.getState().setLfo({ target: e.target.value as any })}
                        style={{
                            background: 'var(--tg-theme-secondary-bg-color)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--tg-theme-text-color)',
                            width: '100%',
                            appearance: 'none'
                        }}
                    >
                        <option value="none">No Modulation Target</option>
                        <optgroup label="Bass">
                            <option value="bassCutoff">Filter Cutoff</option>
                            <option value="bassResonance">Filter Resonance</option>
                        </optgroup>
                        <optgroup label="Lead">
                            <option value="leadCutoff">Lead Cutoff</option>
                            <option value="leadResonance">Lead Resonance</option>
                        </optgroup>
                        <optgroup label="Atmosphere">
                            <option value="padBrightness">Pad Brightness</option>
                        </optgroup>
                        <optgroup label="Global">
                            <option value="drumVolume">Drums Intensity</option>
                            <option value="masterVolume">Master Volume</option>
                        </optgroup>
                    </select>
                </div>
            </div>
        </section >
    )
}
