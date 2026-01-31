import { useVisualStore } from '../../store/visualStore'
import { useAudioStore } from '../../store/audioStore'
import { useGestureStore } from '../../logic/GestureManager'
import { PRESETS } from './GenerativeBackground'

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

                {/* Background Cycle */}
                <BgControl />
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

function BgControl() {
    const { cycleBackgroundPreset, backgroundPreset } = useVisualStore()

    return (
        <button
            onClick={() => cycleBackgroundPreset()}
            style={{
                background: 'rgba(0,0,0,0.5)',
                color: '#ffcc33',
                border: '1px solid #ffcc33',
                padding: '8px 15px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'monospace',
                width: 'fit-content',
                textTransform: 'uppercase'
            }}
        >
            🎨 BG: {PRESETS[backgroundPreset % PRESETS.length].name}
        </button>
    )
}
