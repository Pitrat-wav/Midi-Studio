import { Drum, Music, Grid, Share2, Layers, Disc } from 'lucide-react'

export type TabId = 'drums' | 'bass' | 'sequencer' | 'pads' | 'harmony' | 'export'

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
        { id: 'export', label: 'Export', icon: Share2 }
    ]

    return (
        <nav
            style={{
                display: 'flex',
                justifyContent: 'space-around',
                background: 'var(--tg-theme-secondary-bg-color)',
                padding: '8px 0',
                paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                position: 'fixed',
                bottom: 0,
                width: '100%',
                zIndex: 100
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
                        background: 'none',
                        color: activeTab === tab.id ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)',
                        padding: '4px 8px',
                        gap: '4px',
                        fontSize: '10px',
                        transition: 'color 0.2s ease',
                        flex: 1
                    }}
                >
                    <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    )
}
