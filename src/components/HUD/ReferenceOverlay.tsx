import React from 'react'
import { useVisualStore } from '../../store/visualStore'
import { Info, Zap, Scissors, MousePointer2, Anchor, Layout, Music, Settings } from 'lucide-react'
import './ReferenceOverlay.css'

export function ReferenceOverlay() {
    const showHelp = useVisualStore(s => s.showHelp)
    const toggleHelp = useVisualStore(s => s.toggleHelp)
    const focusInstrument = useVisualStore(s => s.focusInstrument)
    const appView = useVisualStore(s => s.appView)

    if (!showHelp) return null

    const getContent = () => {
        // 1. ARRANGEMENT VIEW
        if (appView === 'ARRANGE') {
            return {
                title: 'ARRANGEMENT ELITE 4.0',
                icon: <Layout className="icon-gold" />,
                sections: [
                    {
                        label: 'TOOLS & MODES',
                        hints: [
                            { key: 'S', desc: 'Hold for Scissors Tool (Split clips)' },
                            { key: 'Cmd+D', desc: 'Duplicate selected clips' },
                            { key: 'Del', desc: 'Delete selected clips' },
                            { key: 'Shift', desc: 'Multi-select modifier' }
                        ]
                    },
                    {
                        label: 'PRO FEATURES',
                        hints: [
                            { key: 'Zap', desc: 'Toggle Automation Lane for current track' },
                            { key: 'Markers', desc: 'Add structure labels (+ MARKER)' },
                            { key: 'Vertical', desc: 'Drag clips between tracks to swap instruments' }
                        ]
                    }
                ],
                footer: 'Elite arrangement workflow allows for sample-accurate linear song construction.'
            }
        }

        // 2. FOCUSED INSTRUMENT
        if (focusInstrument === 'drums') {
            return {
                title: 'RHYTHM COMPOSER REFERENCE',
                icon: <Music className="icon-neon" />,
                sections: [
                    {
                        label: 'EURO RACK ENGINE',
                        text: 'Euclidean sequencer based on Bjorklund algorithm. Creates perfectly distributed rhythms.'
                    },
                    {
                        label: 'HARDWARE MODELS',
                        text: 'TR-808 (Analog warmth) & TR-909 (Digital/Analog hybrid). Switch kits in real-time.'
                    },
                    {
                        label: 'PERFORMANCE',
                        hints: [
                            { key: 'Pitch', desc: 'Adjust tuning for each drum part' },
                            { key: 'Steps', desc: 'Global length of the pattern (1-32)' },
                            { key: 'Pulses', desc: 'Number of active hits per pattern' }
                        ]
                    }
                ]
            }
        }

        if (focusInstrument === 'bass') {
            return {
                title: 'BASS ENGINE COGNITION',
                icon: <Zap className="icon-blue" />,
                sections: [
                    {
                        label: 'ACID ENGINE',
                        text: 'Classic 303-style synthesis with resonant low-pass filtering and hard clipping.'
                    },
                    {
                        label: 'FM ENGINE',
                        text: 'Frequency Modulation synthesis for metallic and evolving harmonic basslines.'
                    }
                ]
            }
        }

        if (focusInstrument === 'sampler') {
            return {
                title: 'GRANULAR SAMPLER PRO',
                icon: <Scissors className="icon-orange" />,
                sections: [
                    {
                        label: 'GRAIN CONTROL',
                        text: 'Manipulate Grain Size and Overlap for ethereal time-stretching and textures.'
                    },
                    {
                        label: 'NAVIGATION',
                        hints: [
                            { key: '< >', desc: 'Cycle through manifest samples' },
                            { key: 'Slices', desc: 'Divide sample into 4-16 trigger points' }
                        ]
                    }
                ]
            }
        }

        // 3. OVERVIEW / NAVIGATION
        return {
            title: 'MIDI STUDIO NAVIGATION',
            icon: <MousePointer2 className="icon-white" />,
            sections: [
                {
                    label: '3D NAVIGATION',
                    hints: [
                        { key: 'WASD', desc: 'Fly camera through the orbital ring' },
                        { key: 'QE', desc: 'Rotation and altitude' },
                        { key: '0-9', desc: 'Instant focus on instrument modules' }
                    ]
                },
                {
                    label: 'SYSTEM COMMANDS',
                    hints: [
                        { key: 'H', desc: 'Toggle main HUD visibility' },
                        { key: 'Tab', desc: 'Cycle views (3D > Nodes > Live > Arrange)' },
                        { key: 'Space', desc: 'Play / Stop master clock' }
                    ]
                },
                {
                    label: '🎮 GAMEPAD (DualSense)',
                    text: 'Controls are ISOLATED per mode. No overlap between Studio & Visualizer.',
                    hints: [
                        { key: 'Touchpad', desc: 'Switch Mode (3D ↔ Visualizer)' },
                        { key: 'X / O / □', desc: 'Studio: Play/Mute/Focus | Visual: Layer Select' },
                        { key: 'Triangle', desc: 'Studio: PANIC | Visual: GLITCH PULSE' },
                        { key: 'R2 Trigger', desc: 'Visual: BOOST Intensity' },
                        { key: 'R-Stick Y', desc: 'Studio: Master BPM control' }
                    ]
                }
            ],
            footer: 'Gamepad detected automatically. Press any key to bind. Press ESC to close.'
        }
    }

    const data = getContent()

    return (
        <div className="reference-overlay" onClick={toggleHelp}>
            <div className="reference-card glass" onClick={e => e.stopPropagation()}>
                <button className="reference-close" onClick={toggleHelp}>×</button>

                <header className="ref-header">
                    {data.icon}
                    <div className="ref-title-group">
                        <span className="ref-meta">REFERENCE HUD V4.1</span>
                        <h1>{data.title}</h1>
                    </div>
                </header>

                <div className="ref-body">
                    {data.sections.map((section: any, idx) => (
                        <section key={idx} className="ref-section">
                            <h3>{section.label}</h3>
                            {section.text && <p>{section.text}</p>}
                            {section.hints && (
                                <div className="ref-hints">
                                    {section.hints.map((h: any, i: number) => (
                                        <div key={i} className="ref-hint-row">
                                            <kbd>{h.key}</kbd>
                                            <span>{h.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}
                </div>

                {data.footer && (
                    <footer className="ref-footer">
                        <Info size={12} />
                        <span>{data.footer}</span>
                    </footer>
                )}
            </div>
        </div>
    )
}
