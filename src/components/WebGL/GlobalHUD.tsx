import { useVisualStore, PRESETS } from '../../store/visualStore'
import { useAudioStore } from '../../store/audioStore'
import { useGestureStore } from '../../logic/GestureManager'

export function GlobalHUD() {
    const handTrackingEnabled = useVisualStore(s => s.handTrackingEnabled)
    const setHandTrackingEnabled = useVisualStore(s => s.setHandTrackingEnabled)
    const statusMessage = useVisualStore(s => s.statusMessage)

    // For edge gestures, we need active gesture state
    const activeGesture = useGestureStore(s => s.activeGesture)
    const isEdgeSwipe = useGestureStore(s => s.isEdgeSwipe)
    const edgeSide = useGestureStore(s => s.edgeSide)

    // For displaying values during edge swipe
    const masterVol = useAudioStore(s => s.volumes.harm) // Simplified approximation or use specific selector
    const bpm = useAudioStore(s => s.bpm)

    return (
        <>
            {/* Top Right Controls */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 10,
                alignItems: 'flex-end'
            }}>
                {/* Hand Vision Toggle */}
                <button
                    onClick={() => setHandTrackingEnabled(!handTrackingEnabled)}
                    style={{
                        background: handTrackingEnabled ? '#3390ec' : 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: '1px solid white',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        width: 'fit-content'
                    }}
                >
                    {handTrackingEnabled ? '🙌 VISION: ON' : '🙌 VISION: OFF'}
                </button>

                {/* Mic Monitor Toggle */}
                <MicControl />

                {/* Whisk Generative UI */}
                <WhiskUI />
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div style={{
                    position: 'absolute',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.8)',
                    color: '#3390ec',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid #3390ec',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    pointerEvents: 'none',
                    zIndex: 20
                }}>
                    {statusMessage}
                </div>
            )}

            {/* Edge Gesture Indicators */}
            {activeGesture === 'swipe' && isEdgeSwipe && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.8)',
                    color: edgeSide === 'top' ? '#3390ec' : '#ffcc33',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    zIndex: 10,
                    pointerEvents: 'none',
                    border: '1px solid currentColor'
                }}>
                    {edgeSide === 'top' ? `MASTER VOLUME: ${Math.round(masterVol * 100)}%` : `GLOBAL BPM: ${Math.round(bpm)}`}
                </div>
            )}
        </>
    )
}

function MicControl() {
    const { isMicOpen, toggleMic, isMicMonitor, setMicMonitor } = useAudioStore()

    return (
        <div style={{ display: 'flex', gap: '5px' }}>
            <button
                onClick={() => toggleMic()}
                style={{
                    background: isMicOpen ? '#ff3b30' : 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: '1px solid white',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                }}
            >
                {isMicOpen ? '🎙 MIC: ON' : '🎙 MIC: OFF'}
            </button>

            {isMicOpen && (
                <button
                    onClick={() => setMicMonitor(!isMicMonitor)}
                    style={{
                        background: isMicMonitor ? '#3390ec' : 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: '1px solid white',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                    }}
                >
                    {isMicMonitor ? '🔈 MON: ON' : '🔈 MON: OFF'}
                </button>
            )}
        </div>
    )
}

function WhiskUI() {
    const { setBackgroundPreset, backgroundPreset, setAestheticTheme } = useVisualStore()

    // Whisk presets are at the end of the PRESETS array
    const whisk1Index = PRESETS?.findIndex(p => p.name === 'WHISK: COSMIC') ?? -1
    const whisk2Index = PRESETS?.findIndex(p => p.name === 'WHISK: CYBER') ?? -1
    const whisk3Index = PRESETS?.findIndex(p => p.name === 'WHISK: PIXEL') ?? -1

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'rgba(51, 144, 236, 0.1)',
            padding: '12px',
            borderRadius: '15px',
            border: '1px solid rgba(51, 144, 236, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
            <div style={{
                fontSize: '10px',
                color: '#00ffff',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
            }}>
                <span style={{ animation: 'pulse 1.5s infinite' }}>🧪</span> GOOGLE WHISK LABS
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => {
                        setAestheticTheme('none')
                        setBackgroundPreset(0)
                    }}
                    style={{
                        background: backgroundPreset < 6 ? '#ffcc33' : 'rgba(0,0,0,0.6)',
                        color: backgroundPreset < 6 ? '#000000' : '#ffcc33',
                        border: '1px solid #ffcc33',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold'
                    }}
                >
                    DEFAULT
                </button>
                <button
                    onClick={() => whisk1Index >= 0 && setBackgroundPreset(whisk1Index)}
                    style={{
                        background: backgroundPreset === whisk1Index ? '#00ffff' : 'rgba(0,0,0,0.6)',
                        color: backgroundPreset === whisk1Index ? '#000000' : '#00ffff',
                        border: '1px solid #00ffff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold'
                    }}
                >
                    COSMIC
                </button>
                <button
                    onClick={() => whisk2Index >= 0 && setBackgroundPreset(whisk2Index)}
                    style={{
                        background: backgroundPreset === whisk2Index ? '#00ffff' : 'rgba(0,0,0,0.6)',
                        color: backgroundPreset === whisk2Index ? '#000000' : '#00ffff',
                        border: '1px solid #00ffff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold'
                    }}
                >
                    CYBER
                </button>
                <button
                    onClick={() => whisk3Index >= 0 && setBackgroundPreset(whisk3Index)}
                    style={{
                        background: backgroundPreset === whisk3Index ? '#ffff00' : 'rgba(0,0,0,0.6)',
                        color: backgroundPreset === whisk3Index ? '#000000' : '#ffff00',
                        border: '1px solid #ffff00',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold'
                    }}
                >
                    PIXEL
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.5; transform: scale(0.95); }
                    50% { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 0.5; transform: scale(0.95); }
                }
            `}</style>
        </div>
    )
}
