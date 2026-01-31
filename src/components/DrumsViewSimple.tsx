import { useDrumStore } from '../store/instrumentStore'
import { useAudioStore } from '../store/audioStore'

const DRUMS = [
    { key: 'kick', label: 'KICK', color: '#ff3b30' },
    { key: 'snare', label: 'SNARE', color: '#ff9500' },
    { key: 'hihat', label: 'HI-HAT', color: '#ffcc00' },
] as const

export function DrumsViewSimple() {
    const drumStore = useDrumStore()

    // Ultra-safe check
    if (!drumStore?.activePatterns?.kick) {
        return <div className="card"><p>Loading drums...</p></div>
    }

    const { activePatterns, setParams, isPlaying, togglePlay } = drumStore

    return (
        <div style={{ padding: '20px' }}>
            <div className="card" style={{ marginBottom: '20px' }}>
                <h2>🥁 DRUMS - Simple View</h2>
                <button
                    onClick={togglePlay}
                    style={{
                        padding: '15px 30px',
                        background: isPlaying ? '#ff3b30' : '#34c759',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    {isPlaying ? '⏸ STOP' : '▶️ PLAY'}
                </button>
            </div>

            {DRUMS.map(drum => {
                const pattern = activePatterns[drum.key]
                if (!pattern || !Array.isArray(pattern)) return null

                return (
                    <div key={drum.key} className="card" style={{ marginBottom: '10px' }}>
                        <h3 style={{ color: drum.color }}>{drum.label}</h3>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {pattern.map((active, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        const newPattern = [...pattern]
                                        newPattern[i] = !active
                                        setParams(drum.key as any, { pattern: newPattern })
                                    }}
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        background: active ? drum.color : '#ddd',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
