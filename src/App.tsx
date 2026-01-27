/// <reference types="vite/client" />
import { useEffect, useState } from 'react'
import { useAudioStore } from './store/audioStore'
import { TabNavigation, TabId } from './components/TabNavigation'
import { DrumsView } from './components/DrumsView'
import { BassView } from './components/BassView'
import { SequencerView } from './components/SequencerView'
import { HarmonyView } from './components/HarmonyView'
import { PadsView } from './components/PadsView'
import { MixerView } from './components/MixerView'
import { Oscilloscope } from './components/Oscilloscope'
import { SequencerLoop } from './components/SequencerLoop'
import { HelpView } from './components/HelpView'
import { Knob } from './components/Knob'
import { Play, Square, Power, Zap, Info, Music } from 'lucide-react'
import { useDrumStore, useBassStore, usePadStore, useHarmonyStore, useSequencerStore, ROOTS, SCALES } from './store/instrumentStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
    const isInitialized = useAudioStore(s => s.isInitialized)
    const hasStarted = useAudioStore(s => s.hasStarted)
    const isPlaying = useAudioStore(s => s.isPlaying)
    const bpm = useAudioStore(s => s.bpm)
    const swing = useAudioStore(s => s.swing)
    const isInitializing = useAudioStore(s => s.isInitializing)
    const initialize = useAudioStore(s => s.initialize)
    const togglePlay = useAudioStore(s => s.togglePlay)
    const setBpm = useAudioStore(s => s.setBpm)
    const setSwing = useAudioStore(s => s.setSwing)
    const dispose = useAudioStore(s => s.dispose)

    const [activeTab, setActiveTab] = useState<TabId>(() => {
        return (sessionStorage.getItem('midi_app_active_tab') as TabId) || 'drums'
    })

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab)
        sessionStorage.setItem('midi_app_active_tab', tab)
    }

    // Haptic feedback effect
    useEffect(() => {
        if (window.Telegram?.WebApp?.HapticFeedback && isPlaying) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
        }
    }, [isPlaying])

    // Reset scroll on tab change
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [activeTab])

    useEffect(() => {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready()
            window.Telegram.WebApp.expand()

            if (window.Telegram.WebApp.enableClosingConfirmation) {
                window.Telegram.WebApp.enableClosingConfirmation()
            }
            if (window.Telegram.WebApp.disableVerticalSwipes) {
                window.Telegram.WebApp.disableVerticalSwipes()
            }
        }
    }, [])

    const harmony = useHarmonyStore()

    return (
        <ErrorBoundary fallbackName="App Root">
            <div id="root" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
                <SequencerLoop />

                <header style={{
                    padding: 'calc(12px + env(safe-area-inset-top)) var(--space-m) 12px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--glass-bg)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)' }}>
                        <div style={{
                            width: '36px', height: '36px', background: 'var(--tg-theme-button-color)',
                            borderRadius: 'var(--radius-m)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                            boxShadow: '0 2px 8px rgba(51, 144, 236, 0.2)'
                        }}>
                            <Music size={20} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '19px', fontWeight: '800', letterSpacing: '-0.03em' }}>MIDI Studio</h1>
                    </div>

                    {hasStarted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-m)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    color: isPlaying ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)',
                                    letterSpacing: '0.05em'
                                }}>
                                    {isInitialized ? (isPlaying ? '● RUNNING' : '○ STOPPED') : '● AUDIO OFF'}
                                </span>
                            </div>
                            <button
                                onClick={isInitialized ? togglePlay : initialize}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: !isInitialized ? 'var(--tg-theme-button-color)' : (isPlaying ? 'var(--tg-theme-destructive-text-color)' : 'var(--tg-theme-button-color)'),
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: isPlaying ? '0 0 15px rgba(255,59,48,0.3)' : '0 4px 12px rgba(51, 144, 236, 0.3)',
                                    border: 'none',
                                    padding: 0
                                }}
                            >
                                {isInitializing ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                        <Zap size={20} />
                                    </motion.div>
                                ) : (
                                    !isInitialized ? <Power size={20} /> : (isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />)
                                )}
                            </button>
                        </div>
                    )}
                </header>

                <main className="app-container">
                    {!hasStarted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-l)', padding: 'var(--space-m) 0' }}>
                            <section className="card" style={{
                                textAlign: 'center',
                                padding: 'var(--space-xl) var(--space-m)',
                                border: '2px solid var(--tg-theme-button-color)',
                                boxShadow: '0 12px 32px rgba(51, 144, 236, 0.15)'
                            }}>
                                <div style={{
                                    width: '72px', height: '72px', background: 'rgba(51, 144, 236, 0.1)',
                                    borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--tg-theme-button-color)', margin: '0 auto var(--space-l)'
                                }}>
                                    <Zap size={36} fill="currentColor" />
                                </div>
                                <h2 style={{ marginBottom: 'var(--space-s)', fontSize: '26px' }}>MIDI Studio Pro</h2>
                                <p style={{ color: 'var(--tg-theme-hint-color)', marginBottom: 'var(--space-xl)', lineHeight: '1.6', fontSize: '15px' }}>
                                    Мощная музыкальная студия в твоем кармане. <br />
                                    Синтезаторы, драм-машины и умные аккорды.
                                </p>
                                <button
                                    onClick={initialize}
                                    disabled={isInitializing}
                                    style={{
                                        backgroundColor: 'var(--tg-theme-button-color)',
                                        color: 'white',
                                        width: '100%',
                                        padding: '22px',
                                        fontSize: '18px',
                                        fontWeight: '800',
                                        borderRadius: 'var(--radius-l)',
                                        boxShadow: '0 8px 24px rgba(51, 144, 236, 0.4)',
                                        border: 'none',
                                        opacity: isInitializing ? 0.7 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    {isInitializing ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                            <Zap size={22} />
                                        </motion.div>
                                    ) : (
                                        <Power size={22} />
                                    )}
                                    {isInitializing ? 'Загрузка...' : 'Запустить студию'}
                                </button>
                                <p style={{ marginTop: 'var(--space-l)', fontSize: '12px', opacity: 0.6, fontWeight: '500' }}>
                                    ⚠️ Нажмите кнопку выше, чтобы начать извлекать звук.
                                </p>
                            </section>

                            <section className="card" style={{ background: 'rgba(51, 144, 236, 0.05)', border: '1px solid rgba(51, 144, 236, 0.1)' }}>
                                <div style={{ display: 'flex', gap: 'var(--space-m)', alignItems: 'flex-start' }}>
                                    <Info size={20} style={{ marginTop: '2px', color: 'var(--tg-theme-button-color)' }} />
                                    <div style={{ fontSize: '14px', lineHeight: '1.5', opacity: 0.9 }}>
                                        <strong>Совет:</strong> После запуска автоматически включится демо-ритм. Вы сможете остановить его кнопкой в верхней части экрана.
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <>
                            {!isInitialized && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'var(--tg-theme-button-color)',
                                        color: 'white',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        boxShadow: '0 8px 24px rgba(51, 144, 236, 0.3)',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Звуковой движок не запущен</div>
                                    <p style={{ fontSize: '12px', opacity: 0.9 }}>Браузер ограничил звук при обновлении. Нажмите кнопку, чтобы восстановить работу студии.</p>
                                    <button
                                        onClick={initialize}
                                        disabled={isInitializing}
                                        style={{
                                            padding: '10px 24px',
                                            background: 'white',
                                            color: 'var(--tg-theme-button-color)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '800',
                                            fontSize: '13px',
                                            opacity: isInitializing ? 0.7 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {isInitializing ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                                <Zap size={14} />
                                            </motion.div>
                                        ) : (
                                            <Power size={14} />
                                        )}
                                        {isInitializing ? 'Загрузка...' : 'Восстановить звук'}
                                    </button>

                                    {!isInitializing && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Очистить все настройки и вернуться к началу?')) {
                                                    dispose()
                                                    window.location.reload()
                                                }
                                            }}
                                            style={{
                                                marginTop: '8px',
                                                background: 'none',
                                                border: 'none',
                                                color: 'rgba(255,255,255,0.6)',
                                                fontSize: '10px',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Полный сброс (если не работает)
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <Knob
                                            label="ТЕМП"
                                            value={bpm}
                                            min={60} max={200} step={1}
                                            onChange={(v) => setBpm(v)}
                                            size={48}
                                        />
                                        <Knob
                                            label="СВИНГ"
                                            value={swing}
                                            min={0} max={1} step={0.01}
                                            onChange={(v) => setSwing(v)}
                                            size={48}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6 }}>МЕТРОНОМ</span>
                                            <button
                                                onClick={() => harmony.toggleMetronome()}
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '8px',
                                                    background: harmony.isMetronomeOn ? 'var(--tg-theme-button-color)' : 'rgba(128,128,128,0.2)',
                                                    color: harmony.isMetronomeOn ? 'white' : 'inherit',
                                                    fontSize: '10px',
                                                    border: 'none',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {harmony.isMetronomeOn ? 'ON' : 'OFF'}
                                            </button>
                                        </div>
                                        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }} />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6 }}>ТОНИКА</span>
                                            <select
                                                value={harmony.root}
                                                onChange={(e) => harmony.setRoot(e.target.value)}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    padding: '2px 4px',
                                                    color: 'var(--tg-theme-text-color)'
                                                }}
                                            >
                                                {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.6 }}>ЛАД</span>
                                            <select
                                                value={harmony.scale}
                                                onChange={(e) => harmony.setScale(e.target.value as any)}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    padding: '2px 4px',
                                                    color: 'var(--tg-theme-text-color)'
                                                }}
                                            >
                                                {SCALES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {activeTab !== 'help' && (
                                <>
                                    <MixerView />
                                    <Oscilloscope />
                                </>
                            )}

                            <div style={{ position: 'relative' }}>
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                    >
                                        {activeTab === 'drums' && <DrumsView />}
                                        {activeTab === 'bass' && <BassView />}
                                        {activeTab === 'sequencer' && (
                                            <ErrorBoundary fallbackName="Lead Sequencer">
                                                <SequencerView />
                                            </ErrorBoundary>
                                        )}
                                        {activeTab === 'pads' && <PadsView />}
                                        {activeTab === 'harmony' && <HarmonyView />}
                                        {activeTab === 'help' && <HelpView />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </main>

                {hasStarted && (
                    <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
                )}
            </div>
        </ErrorBoundary>
    )
}

export default App
