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
    const southParkIndex = PRESETS?.findIndex(p => p.name === 'SOUTH PARK ROCK') ?? -1

    const isDefaultActive = backgroundPreset < 8
    const isCosmicActive = backgroundPreset === whisk1Index
    const isCyberActive = backgroundPreset === whisk2Index
    const isPixelActive = backgroundPreset === whisk3Index
    const isSouthParkActive = backgroundPreset === southParkIndex

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.9), rgba(20, 40, 60, 0.9))',
            padding: '15px',
            borderRadius: '20px',
            border: '2px solid rgba(51, 200, 236, 0.4)',
            backdropFilter: 'blur(15px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 0 30px rgba(51, 200, 236, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'grab',
            minWidth: '280px'
        }}>
            <div style={{
                fontSize: '11px',
                color: '#00ffff',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
            }}>
                <span style={{ animation: 'pulse 1.5s infinite', fontSize: '14px' }}>🎨</span>
                VISUAL THEMES
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
            }}>
                <button
                    onClick={() => {
                        setAestheticTheme('none')
                        setBackgroundPreset(0)
                    }}
                    style={{
                        background: isDefaultActive ? 'linear-gradient(135deg, #ffcc33, #ff9933)' : 'rgba(0,0,0,0.5)',
                        color: isDefaultActive ? '#000000' : '#ffcc33',
                        border: `2px solid ${isDefaultActive ? '#ffcc33' : 'rgba(255, 204, 51, 0.3)'}`,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold',
                        boxShadow: isDefaultActive ? '0 0 20px rgba(255, 204, 51, 0.5)' : 'none',
                        transform: isDefaultActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                >
                    DEFAULT
                </button>
                <button
                    onClick={() => {
                        setAestheticTheme('cosmic')
                        if (whisk1Index >= 0) setBackgroundPreset(whisk1Index)
                    }}
                    style={{
                        background: isCosmicActive ? 'linear-gradient(135deg, #ff00ff, #00ffff)' : 'rgba(0,0,0,0.5)',
                        color: isCosmicActive ? '#000000' : '#ff00ff',
                        border: `2px solid ${isCosmicActive ? '#ff00ff' : 'rgba(255, 0, 255, 0.3)'}`,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold',
                        boxShadow: isCosmicActive ? '0 0 20px rgba(255, 0, 255, 0.5)' : 'none',
                        transform: isCosmicActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                >
                    COSMIC
                </button>
                <button
                    onClick={() => {
                        setAestheticTheme('cyber')
                        if (whisk2Index >= 0) setBackgroundPreset(whisk2Index)
                    }}
                    style={{
                        background: isCyberActive ? 'linear-gradient(135deg, #00ffaa, #ffcc00)' : 'rgba(0,0,0,0.5)',
                        color: isCyberActive ? '#000000' : '#00ffaa',
                        border: `2px solid ${isCyberActive ? '#00ffaa' : 'rgba(0, 255, 170, 0.3)'}`,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold',
                        boxShadow: isCyberActive ? '0 0 20px rgba(0, 255, 170, 0.5)' : 'none',
                        transform: isCyberActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                >
                    CYBER
                </button>
                <button
                    onClick={() => {
                        setAestheticTheme('pixel')
                        if (whisk3Index >= 0) setBackgroundPreset(whisk3Index)
                    }}
                    style={{
                        background: isPixelActive ? 'linear-gradient(135deg, #ff00ff, #ffff00)' : 'rgba(0,0,0,0.5)',
                        color: isPixelActive ? '#000000' : '#ff00ff',
                        border: `2px solid ${isPixelActive ? '#ff00ff' : 'rgba(255, 0, 255, 0.3)'}`,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold',
                        boxShadow: isPixelActive ? '0 0 20px rgba(255, 0, 255, 0.5)' : 'none',
                        transform: isPixelActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                >
                    PIXEL
                </button>
            </div>

            {/* South Park Rock - Full Width Special Button */}
            <button
                onClick={() => {
                    setAestheticTheme('southpark')
                    if (southParkIndex >= 0) setBackgroundPreset(southParkIndex)
                }}
                style={{
                    background: isSouthParkActive
                        ? 'linear-gradient(135deg, #228B22 0%, #FFD700 50%, #87CEEB 100%)'
                        : 'rgba(0,0,0,0.5)',
                    color: isSouthParkActive ? '#000000' : '#87CEEB',
                    border: `2px solid ${isSouthParkActive ? '#228B22' : 'rgba(135, 206, 235, 0.3)'}`,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s ease',
                    fontWeight: 'bold',
                    boxShadow: isSouthParkActive ? '0 0 25px rgba(34, 139, 34, 0.6)' : 'none',
                    transform: isSouthParkActive ? 'scale(1.05)' : 'scale(1)',
                    textShadow: isSouthParkActive ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none',
                    letterSpacing: '1px'
                }}
            >
                🏔️ SOUTH PARK ROCK ❄️
            </button>

            <div style={{
                fontSize: '9px',
                color: '#888',
                fontFamily: 'monospace',
                textAlign: 'center',
                marginTop: '4px',
                fontStyle: 'italic'
            }}>
                Click theme to apply • Drag panel to move
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
