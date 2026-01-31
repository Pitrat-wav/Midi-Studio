import React, { useEffect } from 'react'
import { useDroneStore } from '../store/droneStore'
import { useAudioStore } from '../store/audioStore'
import { Knob } from './Knob'
import { motion, AnimatePresence } from 'framer-motion'
import { Power, Ghost, Zap, Activity, Skull, Wind } from 'lucide-react'

export function DroneView() {
    const droneStore = useDroneStore()
    // const droneEngine = useAudioStore(s => s.droneEngine)
    const droneEngine = null // Temporarily disabled
    const isPlaying = useAudioStore(s => s.isPlaying)

    useEffect(() => {
        if (!droneEngine) return
        droneEngine.setEnabled(droneStore.enabled && isPlaying)
    }, [droneEngine, droneStore.enabled, isPlaying])

    useEffect(() => {
        if (!droneEngine) return
        droneEngine.updateParams({
            intensity: droneStore.intensity,
            fmDepth: droneStore.fmDepth,
            chaos: droneStore.chaos,
            grit: droneStore.grit,
            nervousness: droneStore.nervousness
        })

        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged()
        }
    }, [droneEngine, droneStore.intensity, droneStore.fmDepth, droneStore.chaos, droneStore.grit, droneStore.nervousness])

    useEffect(() => {
        if (!droneEngine) return
        droneEngine.setBaseNote(droneStore.baseNote)
    }, [droneEngine, droneStore.baseNote])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px' }}>
            <section className="card" style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: droneStore.enabled ? 'rgba(51, 144, 236, 0.05)' : 'rgba(0,0,0,0.02)',
                border: droneStore.enabled ? '1px solid var(--tg-theme-button-color)' : '1px solid var(--glass-border)',
                transition: 'all 0.5s ease',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Background "Ghost" Visuals */}
                <AnimatePresence>
                    {droneStore.enabled && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                zIndex: 0, pointerEvents: 'none', overflow: 'hidden'
                            }}
                        >
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        x: [Math.random() * 20 - 10, Math.random() * 20 - 10],
                                        y: [Math.random() * 100, Math.random() * 300],
                                        opacity: [0.05, 0.2, 0.05],
                                        scale: [1, 1.5, 1]
                                    }}
                                    transition={{
                                        duration: 5 + Math.random() * 5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: '100px', height: '100px',
                                        background: i % 2 === 0 ? 'var(--tg-theme-button-color)' : '#ff3b30',
                                        borderRadius: '50%',
                                        filter: 'blur(60px)',
                                        left: `${i * 25}%`,
                                        top: '-50px'
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Skull size={24} color={droneStore.enabled ? "#ff3b30" : "gray"} />
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '2px' }}>DRONE OF DREAD v2.0</h2>
                        </div>
                        <button
                            onClick={() => droneStore.toggle()}
                            style={{
                                width: '50px', height: '50px', borderRadius: '50%',
                                background: droneStore.enabled ? '#ff3b30' : 'rgba(0,0,0,0.1)',
                                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: droneStore.enabled ? '0 0 20px rgba(255, 59, 48, 0.4)' : 'none',
                                transition: 'all 0.3s'
                            }}
                        >
                            <Power size={24} />
                        </button>
                    </div>

                    {/* Macro Knob Section */}
                    <div style={{ position: 'relative', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div
                            animate={{
                                scale: droneStore.enabled ? [1, 1.1 + droneStore.intensity * 0.4, 1] : 1,
                                opacity: droneStore.enabled ? [0.1, 0.4, 0.1] : 0.05,
                                rotate: droneStore.enabled ? [0, 360] : 0
                            }}
                            transition={{
                                duration: droneStore.enabled ? (3 - droneStore.intensity * 2.5) : 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{
                                position: 'absolute',
                                width: '220px', height: '220px',
                                background: 'conic-gradient(from 0deg, #ff3b30, transparent, var(--tg-theme-button-color), transparent, #ff3b30)',
                                borderRadius: '50%',
                                filter: 'blur(30px)',
                            }}
                        />
                        <div style={{ zIndex: 1 }}>
                            <Knob
                                label="INTENSITY"
                                value={droneStore.intensity}
                                min={0} max={1} step={0.01}
                                onChange={(v) => droneStore.setIntensity(v)}
                                size={160}
                                color="#ff3b30"
                            />
                        </div>
                    </div>

                    {/* Advanced Controls Group */}
                    <div style={{
                        marginTop: '30px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '10px',
                        background: 'rgba(0,0,0,0.03)',
                        padding: '20px 10px',
                        borderRadius: '20px',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <Knob label="FM" value={droneStore.fmDepth} min={0} max={1} step={0.01} onChange={(v) => droneStore.setParam({ fmDepth: v })} size={44} color="#5856d6" />
                        <Knob label="CHAOS" value={droneStore.chaos} min={0} max={1} step={0.01} onChange={(v) => droneStore.setParam({ chaos: v })} size={44} color="#ff9500" />
                        <Knob label="GRIT" value={droneStore.grit} min={0} max={1} step={0.01} onChange={(v) => droneStore.setParam({ grit: v })} size={44} color="#ff3b30" />
                        <Knob label="JITTER" value={droneStore.nervousness} min={0} max={1} step={0.01} onChange={(v) => droneStore.setParam({ nervousness: v })} size={44} color="#34c759" />
                    </div>

                    {/* Base Settings Row */}
                    <div style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ flex: 1, padding: '15px', background: 'rgba(0,0,0,0.03)', borderRadius: '15px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.5, display: 'block', marginBottom: '10px' }}>ROOT OCTAVE</span>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {['C0', 'C1', 'C2'].map(note => (
                                    <button
                                        key={note}
                                        onClick={() => droneStore.setBaseNote(note)}
                                        style={{
                                            padding: '10px 15px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: droneStore.baseNote === note ? '#1c1c1e' : 'rgba(0,0,0,0.05)',
                                            color: droneStore.baseNote === note ? 'white' : 'var(--tg-theme-text-color)',
                                            fontSize: '13px', fontWeight: 'bold',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {note}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p style={{ marginTop: '30px', fontSize: '11px', opacity: 0.7, fontStyle: 'italic', letterSpacing: '0.5px', color: '#ff3b30' }}>
                        "Diabolus in Musica — Dissonance is the path to the void."
                    </p>
                </div>
            </section>
        </div>
    )
}

