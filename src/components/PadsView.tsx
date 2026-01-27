import { usePadStore } from '../store/instrumentStore'
import { Knob } from './Knob'
import { useAudioStore } from '../store/audioStore'
import { useMidiExport } from '../hooks/useMidiExport'
import { Send, Play, Square } from 'lucide-react'

export function PadsView() {
    const { active, brightness, complexity, setParams, togglePlay } = usePadStore()
    const { padSynth } = useAudioStore()
    const { exportMidi, isExporting } = useMidiExport()

    const handleBrightnessChange = (v: number) => {
        setParams({ brightness: v })
        if (padSynth) padSynth.setParams(v)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3>Эмбиент Пэды</h3>
                        <button
                            onClick={togglePlay}
                            style={{
                                padding: '4px',
                                borderRadius: '6px',
                                background: active ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.2)',
                                color: active ? 'white' : 'inherit',
                                border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            {active ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                        <div style={{ width: '1px', height: '16px', background: 'var(--glass-border)', margin: '0 4px' }} />
                        <button
                            onClick={() => exportMidi('pads')}
                            disabled={isExporting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'var(--tg-theme-secondary-bg-color)',
                                color: 'var(--tg-theme-link-color)',
                                fontSize: '10px',
                                border: 'none',
                                opacity: isExporting ? 0.5 : 1
                            }}
                        >
                            <Send size={12} />
                            {isExporting ? '...' : 'MIDI'}
                        </button>
                    </div>
                    <button
                        onClick={() => setParams({ active: !active })}
                        style={{
                            background: active ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                            color: 'white',
                            fontSize: '10px',
                            padding: '6px 12px'
                        }}
                    >
                        {active ? 'ВКЛ' : 'ВЫКЛ'}
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '24px' }}>
                    <Knob
                        label="Яркость"
                        value={brightness}
                        min={0} max={1} step={0.01}
                        onChange={handleBrightnessChange}
                        size={80}
                    />
                    <Knob
                        label="Сложность"
                        value={complexity}
                        min={0} max={1} step={0.01}
                        onChange={(v) => setParams({ complexity: v })}
                        size={80}
                    />
                </div>

                <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '24px', textAlign: 'center' }}>
                    Пэды автоматически следуют глобальной гармонии и меняются каждые 2 такта.
                </p>
            </section>
        </div>
    )
}
