import { useDrumStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import { useBassStore, useHarmonyStore } from '../store/instrumentStore'
import { generateBassPattern } from '../logic/StingGenerator'
import { Dices } from 'lucide-react'
import { useAudioStore, AudioState } from '../store/audioStore'
import { bjorklund } from '../logic/bjorklund'

import { useMidiExport } from '../hooks/useMidiExport'
import { Send, Play, Square, VolumeX, Volume2 } from 'lucide-react'

export function DrumsView() {
    const { kick, snare, hihat, hihatOpen, clap, ride, kit, setParams, setKit, isPlaying, togglePlay } = useDrumStore()
    const { drumMachine } = useAudioStore()
    const { exportMidi, isExporting } = useMidiExport()

    const updateDrum = (drum: 'kick' | 'snare' | 'hihat' | 'hihatOpen' | 'clap' | 'ride', params: any) => {
        setParams(drum, params)
        if (drumMachine) {
            const d = useDrumStore.getState()[drum]
            const finalParams = { ...d, ...params }
            // Update Synths
            if (params.pitch !== undefined || params.decay !== undefined) {
                drumMachine.setDrumParams(drum, finalParams.pitch, finalParams.decay)
            }
            if (params.volume !== undefined) {
                drumMachine.setDrumVolume(drum, params.volume)
            }
        }
    }

    const handleKitChange = (newKit: '808' | '909') => {
        setKit(newKit)
        if (drumMachine) drumMachine.setKit(newKit)
    }

    const DRUMS = [
        { id: 'kick' as const, label: 'KICK' },
        { id: 'snare' as const, label: 'SNARE' },
        { id: 'hihat' as const, label: 'HI-HAT' },
        { id: 'hihatOpen' as const, label: 'OPEN HAT' },
        { id: 'clap' as const, label: 'CLAP' },
        { id: 'ride' as const, label: 'RIDE' }
    ]

    const currentStep = useAudioStore(s => s.currentStep)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-l)' }}>
            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-l)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                        <h3>Драм-машина</h3>
                        <button
                            onClick={togglePlay}
                            className="icon-button"
                            style={{
                                width: '36px', height: '36px',
                                background: isPlaying ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.15)',
                                color: isPlaying ? 'white' : 'var(--tg-theme-text-color)',
                                border: 'none',
                                padding: 0,
                                borderRadius: 'var(--radius-m)'
                            }}
                        >
                            {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>
                        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 var(--space-xs)' }} />
                        <button
                            onClick={() => exportMidi('drums')}
                            disabled={isExporting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-m)',
                                background: 'transparent',
                                border: '1px solid var(--tg-theme-link-color)',
                                color: 'var(--tg-theme-link-color)',
                                fontSize: '11px',
                                fontWeight: '700',
                                opacity: isExporting ? 0.5 : 1,
                                minHeight: '36px'
                            }}
                        >
                            <Send size={12} />
                            {isExporting ? '...' : 'MIDI'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '10px' }}>
                        {(['808', '909'] as const).map(k => (
                            <button
                                key={k}
                                onClick={() => handleKitChange(k)}
                                style={{
                                    padding: '6px 14px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    borderRadius: '8px',
                                    background: kit === k ? 'var(--tg-theme-button-color)' : 'transparent',
                                    color: kit === k ? 'white' : 'inherit',
                                    border: 'none',
                                    minHeight: '32px'
                                }}
                            >{k}</button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
                    {DRUMS.map(d => {
                        const current = { kick, snare, hihat, hihatOpen, clap, ride }[d.id]
                        return (
                            <div key={d.id} style={{
                                display: 'flex',
                                gap: 'var(--space-s)',
                                alignItems: 'center',
                                background: 'var(--tg-theme-bg-color)',
                                padding: 'var(--space-s) var(--space-m)',
                                borderRadius: 'var(--radius-m)',
                                border: '1px solid var(--glass-border)',
                                flexWrap: 'nowrap',
                                overflowX: 'auto'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)', minWidth: '94px' }}>
                                    <div style={{ fontWeight: '800', fontSize: '10px', color: 'var(--tg-theme-hint-color)', width: '60px' }}>{d.label}</div>
                                    <button
                                        onClick={() => updateDrum(d.id, { muted: !current.muted })}
                                        style={{
                                            border: 'none',
                                            background: current.muted ? 'var(--tg-theme-destructive-text-color)' : 'rgba(0,0,0,0.06)',
                                            color: current.muted ? 'white' : 'var(--tg-theme-text-color)',
                                            borderRadius: '8px',
                                            width: '32px',
                                            height: '32px',
                                            padding: 0,
                                            flexShrink: 0
                                        }}
                                    >
                                        {current.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-m)', alignItems: 'center' }}>
                                    <Knob
                                        label="Пульс"
                                        value={useDrumStore.getState()[d.id].pulses}
                                        min={0} max={16} step={1}
                                        onChange={(v) => updateDrum(d.id, { pulses: v })}
                                        size={38}
                                    />
                                    <Knob
                                        label="Decay"
                                        value={useDrumStore.getState()[d.id].decay}
                                        min={0} max={1} step={0.01}
                                        onChange={(v) => updateDrum(d.id, { decay: v })}
                                        size={38}
                                    />
                                    <Knob
                                        label="Vol"
                                        value={useDrumStore.getState()[d.id].volume}
                                        min={-60} max={0} step={1}
                                        onChange={(v) => updateDrum(d.id, { volume: v })}
                                        size={38}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Pattern Visualizer */}
                <div style={{
                    marginTop: 'var(--space-l)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-s)',
                    padding: 'var(--space-m)',
                    background: 'rgba(0,0,0,0.03)',
                    borderRadius: 'var(--radius-m)'
                }}>
                    {[
                        { id: 'kick' as const, name: 'KICK' },
                        { id: 'snare' as const, name: 'SNARE' },
                        { id: 'hihat' as const, name: 'HI-HAT' },
                        { id: 'hihatOpen' as const, name: 'OPEN' },
                        { id: 'clap' as const, name: 'CLAP' },
                        { id: 'ride' as const, name: 'RIDE' }
                    ].map((d, idx) => {
                        const pattern = useDrumStore.getState().activePatterns[d.id]
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                                <div style={{ fontSize: '8px', fontWeight: '900', opacity: 0.4, width: '32px', flexShrink: 0 }}>{d.name}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '3px', flex: 1 }}>
                                    {pattern.map((active, i) => (
                                        <div key={i} style={{
                                            height: '8px',
                                            borderRadius: '2px',
                                            background: active ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-bg-color)',
                                            opacity: active ? 1 : 0.3,
                                            border: (currentStep === i) ? '1px solid white' : 'none',
                                            boxShadow: (currentStep === i) ? '0 0 6px var(--tg-theme-button-color)' : 'none',
                                            transition: 'all 0.1s ease'
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
