import { useBassStore, useHarmonyStore, BassInstrument } from '../store/instrumentStore'
import { Knob } from './Knob'
import { generateBassPattern } from '../logic/StingGenerator'
import { generateRollingPattern, RollingMode } from '../logic/RollingGenerator'
import { Dices, Send, Play, Square, Zap, Disc } from 'lucide-react'
import { Oscilloscope } from './Oscilloscope'
import { useAudioStore, AudioState } from '../store/audioStore'
import { useMidiExport } from '../hooks/useMidiExport'

export function BassView() {
    const {
        activeInstrument, density, type, pattern, seedA, seedB, morph, cutoff, resonance, slide, distortion,
        fmHarmonicity, fmModIndex, fmAttack, fmDecay, fmMode,
        setInstrument, setDensity, setType, setSeed, setMorph, setCutoff, setResonance, setSlide, setDistortion, setPattern, isPlaying, togglePlay
    } = useBassStore()
    const { root, scale } = useHarmonyStore()
    const { exportMidi, isExporting } = useMidiExport()

    const handleGenerate = () => {
        try {
            if (activeInstrument === 'acid') {
                const sA = Math.random()
                const sB = Math.random()
                useBassStore.setState({ seedA: sA, seedB: sB })
                const newPattern = generateBassPattern(density, type, root, scale, 2, sA, sB, morph)
                if (newPattern && Array.isArray(newPattern)) {
                    setPattern(newPattern)
                }
            } else {
                const newPattern = generateRollingPattern(density, fmMode, root, scale, 1)
                setPattern(newPattern)
            }
        } catch (e) {
            console.error('Bass generation failed', e)
        }
    }

    const updateDensity = (v: number) => {
        setDensity(v)
        try {
            let newPattern;
            if (activeInstrument === 'acid') {
                newPattern = generateBassPattern(v, type, root, scale, 2, seedA, seedB, morph)
            } else {
                newPattern = generateRollingPattern(v, fmMode, root, scale, 1)
            }
            setPattern(newPattern)
        } catch (e) { console.error(e) }
    }

    const updateType = (v: number) => {
        setType(v)
        if (activeInstrument === 'acid') {
            try {
                const newPattern = generateBassPattern(density, v, root, scale, 2, seedA, seedB, morph)
                setPattern(newPattern)
            } catch (e) { console.error(e) }
        }
    }

    const updateMorph = (v: number) => {
        setMorph(v)
        try {
            const newPattern = generateBassPattern(density, type, root, scale, 2, seedA, seedB, v)
            setPattern(newPattern)
        } catch (e) { console.error(e) }
    }

    const updateCutoff = (v: number) => {
        setCutoff(v)
        try {
            const synth = useAudioStore.getState().bassSynth
            if (synth && 'setCutoff' in synth) {
                (synth as any).setCutoff(v)
            }
        } catch (e) {
            console.warn('Failed to set cutoff', e)
        }
    }

    const updateResonance = (v: number) => {
        setResonance(v)
        try {
            const synth = useAudioStore.getState().bassSynth
            if (synth && 'setResonance' in synth) {
                (synth as any).setResonance(v)
            }
        } catch (e) {
            console.warn('Failed to set resonance', e)
        }
    }

    const updateSlide = (v: number) => {
        setSlide(v)
        try {
            const synth = useAudioStore.getState().bassSynth
            if (synth && 'setSlide' in synth) {
                (synth as any).setSlide(v)
            }
        } catch (e) {
            console.warn('Failed to set slide', e)
        }
    }

    const updateDistortion = (v: number) => {
        setDistortion(v)
        try {
            const synth = useAudioStore.getState().bassSynth
            if (synth && 'setDistortion' in synth) {
                (synth as any).setDistortion(v)
            }
        } catch (e) {
            console.warn('Failed to set distortion', e)
        }
    }

    const currentStep = useAudioStore(s => s.currentStep)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-l)' }}>
            <section className="card">
                <div style={{ display: 'flex', gap: 'var(--space-s)', marginBottom: 'var(--space-l)' }}>
                    <button
                        onClick={() => setInstrument('acid')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: 'var(--radius-m)',
                            background: activeInstrument === 'acid' ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                            color: activeInstrument === 'acid' ? 'white' : 'inherit',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)',
                            fontWeight: '700', fontSize: '14px', minHeight: '44px'
                        }}
                    >
                        <Zap size={16} fill={activeInstrument === 'acid' ? 'currentColor' : 'none'} /> ACID
                    </button>
                    <button
                        onClick={() => setInstrument('fm')}
                        style={{
                            flex: 1, padding: '12px', borderRadius: 'var(--radius-m)',
                            background: activeInstrument === 'fm' ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.05)',
                            color: activeInstrument === 'fm' ? 'white' : 'inherit',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s)',
                            fontWeight: '700', fontSize: '14px', minHeight: '44px'
                        }}
                    >
                        <Disc size={16} fill={activeInstrument === 'fm' ? 'currentColor' : 'none'} /> FM BASS
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-l)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                            <h3 style={{ margin: 0, letterSpacing: '-0.02em' }}>{activeInstrument === 'acid' ? 'Кислотный Бас' : 'FM Бас-машина'}</h3>
                            <button
                                onClick={togglePlay}
                                className="icon-button"
                                style={{
                                    width: '32px', height: '32px',
                                    background: isPlaying ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.15)',
                                    color: isPlaying ? 'white' : 'var(--tg-theme-text-color)',
                                    border: 'none',
                                    padding: 0,
                                    borderRadius: '8px'
                                }}
                            >
                                {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                            </button>
                            <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 2px' }} />
                            <button
                                onClick={() => exportMidi('bass')}
                                disabled={isExporting}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    color: 'var(--tg-theme-link-color)',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    border: 'none',
                                    opacity: isExporting ? 0.5 : 1
                                }}
                            >
                                <Send size={12} />
                                {isExporting ? '...' : 'MIDI'}
                            </button>
                        </div>
                        <p style={{ fontSize: '11px', fontWeight: '500', color: 'var(--tg-theme-hint-color)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {activeInstrument === 'acid' ? 'Logic: Sting by Iftah' : 'Rolling Bass Engine'}
                        </p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        style={{
                            backgroundColor: 'var(--tg-theme-button-color)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-s)',
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-m)',
                            fontWeight: '800',
                            fontSize: '14px',
                            minHeight: '40px',
                            boxShadow: '0 4px 12px rgba(51, 144, 236, 0.2)'
                        }}
                    >
                        <Dices size={16} />
                        GEN
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
                    gap: 'var(--space-m)',
                    marginTop: 'var(--space-l)',
                    padding: 'var(--space-m)',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: 'var(--radius-l)',
                    border: '1px solid var(--glass-border)'
                }}>
                    <Knob
                        label="Density"
                        value={density}
                        min={0} max={1} step={0.01}
                        onChange={updateDensity}
                        size={52}
                    />

                    {activeInstrument === 'acid' ? (
                        <>
                            <Knob label="Shape" value={type} min={0} max={1} step={0.01} onChange={updateType} size={52} />
                            <Knob label="Morph" value={morph} min={0} max={1} step={0.01} onChange={updateMorph} size={52} />
                            <Knob label="Cutoff" value={cutoff} min={100} max={5000} step={10} onChange={updateCutoff} size={52} />
                            <Knob label="Res" value={resonance} min={0.1} max={20} step={0.1} onChange={updateResonance} size={52} />
                            <Knob label="Slide" value={slide} min={0} max={0.5} step={0.01} onChange={updateSlide} size={52} />
                            <Knob label="Drive" value={distortion} min={0} max={1} step={0.01} onChange={updateDistortion} size={52} />
                        </>
                    ) : (
                        <>
                            <Knob
                                label="Harm"
                                value={fmHarmonicity}
                                min={0.5} max={8} step={0.1}
                                onChange={(v) => {
                                    useBassStore.setState({ fmHarmonicity: v })
                                    useAudioStore.getState().fmBass?.setHarmonicity(v)
                                }}
                                size={52}
                            />
                            <Knob
                                label="Brite"
                                value={fmModIndex}
                                min={0} max={50} step={1}
                                onChange={(v) => {
                                    useBassStore.setState({ fmModIndex: v })
                                    useAudioStore.getState().fmBass?.setModulationIndex(v)
                                }}
                                size={52}
                            />
                            <Knob label="Attack" value={fmAttack} min={0.001} max={0.2} step={0.005} onChange={(v) => useBassStore.setState({ fmAttack: v })} size={52} />
                            <Knob label="Decay" value={fmDecay} min={0.05} max={1} step={0.01} onChange={(v) => useBassStore.setState({ fmDecay: v })} size={52} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '56px', justifyContent: 'center' }}>
                                <span style={{ fontSize: '9px', fontWeight: '800', textAlign: 'center', opacity: 0.6 }}>MODE</span>
                                <select
                                    value={fmMode}
                                    onChange={(e) => {
                                        const mode = e.target.value as RollingMode
                                        useBassStore.setState({ fmMode: mode })
                                        const newPattern = generateRollingPattern(density, mode, root, scale, 1)
                                        setPattern(newPattern)
                                    }}
                                    style={{
                                        background: 'var(--tg-theme-secondary-bg-color)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        padding: '4px 2px',
                                        color: 'var(--tg-theme-text-color)',
                                        fontWeight: '700'
                                    }}
                                >
                                    <option value="offbeat">OFF</option>
                                    <option value="galloping">ROLL</option>
                                    <option value="syncopated">SYNC</option>
                                    <option value="random">RND</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ marginTop: 'var(--space-l)', display: 'flex', gap: 'var(--space-s)', justifyContent: 'center' }}>
                    {['Saw', 'Square', 'Sine'].map((t) => (
                        <button
                            key={t}
                            onClick={() => useAudioStore.getState().bassSynth?.setOscillatorType(t.toLowerCase() as any)}
                            style={{
                                padding: '8px 16px',
                                fontSize: '11px',
                                fontWeight: '800',
                                background: 'rgba(0,0,0,0.05)',
                                color: 'var(--tg-theme-text-color)',
                                borderRadius: '8px',
                                minHeight: '32px',
                                textTransform: 'uppercase'
                            }}
                        >{t}</button>
                    ))}
                </div>

                <div style={{
                    marginTop: 'var(--space-l)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(16, 1fr)',
                    gap: '4px',
                    padding: 'var(--space-s)',
                    background: 'rgba(0,0,0,0.03)',
                    borderRadius: 'var(--radius-m)'
                }}>
                    {pattern.map((step, i) => (
                        <div
                            key={i}
                            style={{
                                height: '24px',
                                background: step.active ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-bg-color)',
                                borderRadius: '4px',
                                opacity: step.active ? (step.accent ? 1 : 0.6) : 0.2,
                                border: step.slide ? '2px solid rgba(255, 215, 0, 0.6)' : 'none',
                                position: 'relative',
                                transition: 'all 0.1s ease',
                                boxShadow: currentStep === i ? '0 0 10px var(--tg-theme-button-color)' : 'none'
                            }}
                        >
                            {currentStep === i && (
                                <div style={{ position: 'absolute', inset: 0, border: '2px solid white', borderRadius: '4px' }} />
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div >
    )
}
