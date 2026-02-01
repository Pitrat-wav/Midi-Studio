import { useState, useEffect, useRef } from 'react'
import { useVisualStore, VISUALIZER_REGISTRY } from '../store/visualStore'

export function VisualizerSearch() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const appView = useVisualStore(s => s.appView)
    const setVisualizerIndex = useVisualStore(s => s.setVisualizerIndex)

    const results = VISUALIZER_REGISTRY.filter(v => {
        const q = query.toLowerCase()
        return v.name.toLowerCase().includes(q) || v.tags.toLowerCase().includes(q)
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (appView !== 'VISUALIZER') return

            if (e.key === '/' && !isOpen) {
                e.preventDefault()
                setIsOpen(true)
                setQuery('')
                setSelectedIndex(0)
                return
            }

            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
                return
            }

            if (!isOpen) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(i => (i + 1) % results.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(i => (i - 1 + results.length) % results.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (results[selectedIndex]) {
                    setVisualizerIndex(results[selectedIndex].id)
                    setIsOpen(false)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex, appView, setVisualizerIndex])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen])

    if (!isOpen || appView !== 'VISUALIZER') return null

    return (
        <div className="search-overlay visualizer-search-overlay" onClick={() => setIsOpen(false)} style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="search-modal" onClick={e => e.stopPropagation()} style={{
                width: '600px',
                background: '#111',
                borderRadius: '16px',
                border: '1px solid #333',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div className="search-header" style={{
                    padding: '20px',
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                        placeholder="Search 51 visualizers..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '1.2rem',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                    <kbd style={{ background: '#222', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#666' }}>ESC</kbd>
                </div>

                <div className="search-results" style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '10px'
                }}>
                    {results.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No visualizers found</div>
                    ) : (
                        results.map((v, index) => (
                            <div
                                key={v.id}
                                className={`search-item ${index === selectedIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setVisualizerIndex(v.id)
                                    setIsOpen(false)
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                style={{
                                    padding: '12px 15px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    cursor: 'pointer',
                                    background: index === selectedIndex ? 'rgba(51,144,236,0.2)' : 'transparent',
                                    border: index === selectedIndex ? '1px solid rgba(51,144,236,0.5)' : '1px solid transparent',
                                    transition: 'all 0.1s ease'
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{v.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: index === selectedIndex ? '#3390ec' : '#fff', fontWeight: 'bold' }}>{v.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{v.tags}</div>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#444' }}>#{v.id}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="search-footer" style={{
                    padding: '12px 20px',
                    background: '#0a0a0a',
                    fontSize: '0.8rem',
                    color: '#444',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>Use <kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                    <span><kbd>↵</kbd> to select</span>
                </div>
            </div>
        </div>
    )
}
