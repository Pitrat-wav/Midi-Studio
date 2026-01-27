import { Drum, Music, Grid, Share2, Layers, Disc, HelpCircle } from 'lucide-react'

export type TabId = 'drums' | 'bass' | 'sequencer' | 'pads' | 'harmony' | 'export' | 'help'

interface TabNavigationProps {
    activeTab: TabId
    setActiveTab: (tab: TabId) => void
}

export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
    const tabs: { id: TabId, label: string, icon: any }[] = [
        { id: 'drums', label: 'Drums', icon: Drum },
        { id: 'bass', label: 'Bass', icon: Music },
        { id: 'sequencer', label: 'Lead', icon: Grid },
        { id: 'pads', label: 'Pads', icon: Layers },
        { id: 'harmony', label: 'Harm', icon: Disc },
        { id: 'help', label: 'Help', icon: HelpCircle }
    ]

    return (
        <nav
            style={{
                display: 'flex',
                justifyContent: 'space-around',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                padding: 'var(--space-s) 0',
                paddingBottom: 'calc(var(--space-s) + env(safe-area-inset-bottom))',
                borderTop: '1px solid var(--glass-border)',
                position: 'fixed',
                bottom: 0,
                width: '100%',
                zIndex: 1000
            }}
        >
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        color: activeTab === tab.id ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)',
                        padding: 'var(--space-xs) var(--space-s)',
                        gap: '2px',
                        fontSize: '10px',
                        fontWeight: activeTab === tab.id ? '700' : '500',
                        transition: 'all 0.2s ease',
                        flex: 1,
                        minHeight: '48px',
                        border: 'none',
                        borderRadius: 0
                    }}
                >
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)'
                    }}>
                        <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    </div>
                    <span style={{
                        opacity: activeTab === tab.id ? 1 : 0.8,
                        letterSpacing: '0.02em'
                    }}>{tab.label}</span>
                </button>
            ))}
        </nav>
    )
}
