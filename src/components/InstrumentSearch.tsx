import { useState, useEffect, useRef } from 'react'
import { SPATIAL_LAYOUT, InstrumentType } from '../lib/SpatialLayout'
import { useVisualStore } from '../store/visualStore'

interface InstrumentSearchProps {
    onSelect: (instrument: InstrumentType) => void
}

// Map internal keys to human-readable names
const INSTRUMENT_NAMES: Record<InstrumentType, string> = {
    drums: "Drum Machine",
    bass: "Acid Bass (TD-3)",
    harmony: "Complex Oscillator (Buchla)",
    sequencer: "Turing Machine & Sequencer",
    pads: "Ambient Pads",
    drone: "Drone Engine",
    ml185: "ML-185 Sequencer",
    snake: "Snake Current",
    sampler: "Chrono Splitter (Sampler)",
    buchla: "Buchla 259 Complex Generator",
    master: "Master Effects & Global",
    mixer: "Mixer Console",
    keyboard: "Virtual Keyboard"
}

export function InstrumentSearch({ onSelect }: InstrumentSearchProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    // Filter instruments
    const results = (Object.keys(SPATIAL_LAYOUT) as InstrumentType[])
        .filter(key => {
            const name = (INSTRUMENT_NAMES[key] || String(key)).toLowerCase()
            const q = query.toLowerCase()
            return name.includes(q) || String(key).toLowerCase().includes(q)
        })

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle Search: Cmd+K or /
            const appView = useVisualStore.getState().appView
            if ((e.metaKey && e.key === 'k') || (e.key === '/' && !isOpen && appView !== 'VISUALIZER' && appView !== 'NODES')) {
                e.preventDefault()
                setIsOpen(prev => !prev)
                setQuery('')
                setSelectedIndex(0)
                return
            }

            // Close on Escape
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
                return
            }

            if (!isOpen) return

            // Navigation
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(i => {
                    const next = (i + 1) % results.length
                    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged()
                    return next
                })
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(i => {
                    const next = (i - 1 + results.length) % results.length
                    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged()
                    return next
                })
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (results[selectedIndex]) {
                    onSelect(results[selectedIndex])
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
                    setIsOpen(false)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex, onSelect])

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="search-overlay" onClick={() => setIsOpen(false)}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>
                <div className="search-header">
                    <span className="search-icon">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded="true"
                        aria-haspopup="listbox"
                        aria-controls="instrument-results"
                        aria-activedescendant={results[selectedIndex] ? `option-${results[selectedIndex]}` : undefined}
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                        placeholder="Search instrument..."
                        className="search-input"
                    />
                    <kbd className="esc-hint">ESC</kbd>
                </div>

                <div
                    id="instrument-results"
                    className="search-results"
                    role="listbox"
                    aria-label="Instruments"
                >
                    {results.length === 0 ? (
                        <div className="search-empty" role="option">No instruments found</div>
                    ) : (
                        results.map((key, index) => (
                            <div
                                key={key}
                                id={`option-${key}`}
                                className={`search-item ${index === selectedIndex ? 'active' : ''}`}
                                role="option"
                                aria-selected={index === selectedIndex}
                                onClick={() => {
                                    onSelect(key)
                                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
                                    setIsOpen(false)
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="item-name">{INSTRUMENT_NAMES[key]}</span>
                                <span className="item-key">{key}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="search-footer">
                    <span>Use <kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                    <span><kbd>↵</kbd> to select</span>
                </div>
            </div>
        </div>
    )
}
