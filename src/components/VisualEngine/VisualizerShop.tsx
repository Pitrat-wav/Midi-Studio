import React, { useState, useMemo } from 'react'
import { useVisualStore, VISUALIZER_REGISTRY } from '../../store/visualStore'
import './VisualizerShop.css'

export function VisualizerShop() {
    const showShop = useVisualStore(s => s.showVisualizerShop)
    const toggleShop = useVisualStore(s => s.toggleVisualizerShop)
    const setVisualizerIndex = useVisualStore(s => s.setVisualizerIndex)
    const setAppView = useVisualStore(s => s.setAppView)

    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState<'ALL' | '2D' | '3D' | 'AUDIO' | 'VIDEO'>('ALL')

    const categories = useMemo(() => {
        const cats = {
            ALL: VISUALIZER_REGISTRY,
            '2D': VISUALIZER_REGISTRY.filter(v => v.tags.includes('2d')),
            '3D': VISUALIZER_REGISTRY.filter(v => !v.tags.includes('2d')),
            AUDIO: VISUALIZER_REGISTRY.filter(v =>
                v.tags.includes('spectrum') ||
                v.tags.includes('pulse') ||
                v.tags.includes('audio') ||
                v.tags.includes('frequency') ||
                v.tags.includes('vibrates')
            ),
            VIDEO: VISUALIZER_REGISTRY.filter(v =>
                v.tags.includes('video') ||
                v.tags.includes('cam') ||
                v.tags.includes('feedback') ||
                v.tags.includes('glitch') ||
                v.tags.includes('scan') ||
                v.tags.includes('data') ||
                v.tags.includes('matrix')
            )
        }
        return cats
    }, [])

    const filteredVisualizers = useMemo(() => {
        let list = categories[activeCategory]
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            list = list.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.tags.toLowerCase().includes(q)
            )
        }
        return list
    }, [activeCategory, searchQuery, categories])

    React.useEffect(() => {
        if (!showShop) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                toggleShop()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showShop, toggleShop])

    const handleSelect = (id: number) => {
        setVisualizerIndex(id)
        setAppView('VISUALIZER')
        toggleShop()
    }

    if (!showShop) return null

    return (
        <div className="visualizer-shop-overlay" onClick={toggleShop}>
            <div className="visualizer-shop-container" onClick={e => e.stopPropagation()}>
                <header className="shop-header">
                    <div className="header-top">
                        <h1>VISUALIZER <span className="highlight">GALLERY</span></h1>
                        <button className="close-btn" onClick={toggleShop}>✕</button>
                    </div>

                    <div className="search-bar-container">
                        <input
                            type="text"
                            placeholder="Find your vibe..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <nav className="shop-tabs">
                        {(['ALL', '2D', '3D', 'AUDIO', 'VIDEO'] as const).map(cat => (
                            <button
                                key={cat}
                                className={activeCategory === cat ? 'active' : ''}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                                <span className="count">{categories[cat].length}</span>
                            </button>
                        ))}
                    </nav>
                </header>

                <div className="shop-grid">
                    {filteredVisualizers.map(v => (
                        <div
                            key={v.id}
                            className="visualizer-card"
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('visualizerId', v.id.toString())
                                e.dataTransfer.effectAllowed = 'copy'
                                if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                                    (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
                                }
                            }}
                            onClick={() => handleSelect(v.id)}
                        >
                            <div className="card-icon">{v.icon}</div>
                            <div className="card-info">
                                <h3>{v.name}</h3>
                                <p>{v.tags}</p>
                            </div>
                            <div className="card-id">#{v.id}</div>
                            <div className="card-glow"></div>
                        </div>
                    ))}
                    {filteredVisualizers.length === 0 && (
                        <div className="no-results">
                            <p>No visualizers match your search</p>
                        </div>
                    )}
                </div>

                <footer className="shop-footer">
                    <p>Press <kbd>0</kbd> to exit gallery • <kbd>ENTER</kbd> to select</p>
                </footer>
            </div>
        </div>
    )
}
