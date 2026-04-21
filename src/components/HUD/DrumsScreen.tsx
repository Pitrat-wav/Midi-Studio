/**
 * DrumsScreen.tsx — TR-808/909 Style Drum Machine
 * Studio 2026 Redesign
 */

import React from 'react'
import { useDrumStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import { StudioScreen, StudioKnob, StudioButton, StudioDisplay } from './StudioScreen'
import './DrumsScreen.css'

export const DrumsScreen: React.FC = () => {
    const store = useDrumStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)

    const DRUMS = [
        { id: 'kick', label: 'Bass Drum', color: '#ff2244' },
        { id: 'snare', label: 'Snare', color: '#4466ff' },
        { id: 'hihat', label: 'Hi-Hat', color: '#ffff44' },
        { id: 'hihatOpen', label: 'Open Hat', color: '#ffaa22' },
        { id: 'clap', label: 'Clap', color: '#ff66ff' },
        { id: 'ride', label: 'Ride', color: '#44ffff' }
    ] as const

    const handleParamChange = (drum: typeof DRUMS[number]['id'] | string, field: string, value: number | boolean) => {
        store.setParams(drum as any, { [field]: value })
    }

    const [selectedDrum, setSelectedDrum] = React.useState<string>('kick')
    const handleClose = () => setFocusedInstrument(null)

    return (
        <StudioScreen
            title="TR Rhythm Composer"
            subtitle={store.kit === '808' ? 'TR-808 Analog' : 'TR-909 Digital'}
            onClose={handleClose}
            ledColor="amber"
            className="drums-screen-studio"
        >
            <div className="drums-screen-content">
                {/* Top Controls */}
                <div className="drums-top-controls">
                    <div className="kit-selector">
                        <StudioButton
                            label="808"
                            onClick={() => store.setKit('808')}
                            active={store.kit === '808'}
                        />
                        <StudioButton
                            label="909"
                            onClick={() => store.setKit('909')}
                            active={store.kit === '909'}
                        />
                    </div>
                    
                    <StudioDisplay
                        value={store.isPlaying ? 'PLAY' : 'STOP'}
                        color={store.isPlaying ? 'green' : 'amber'}
                        size="small"
                    />
                    
                    <StudioButton
                        label={store.isPlaying ? 'STOP' : 'START'}
                        onClick={store.togglePlay}
                        active={store.isPlaying}
                        danger={!store.isPlaying}
                    />
                </div>

                {/* Drum Pads Grid */}
                <div className="drum-pads-grid">
                    {DRUMS.map((d) => {
                        const drumState = (store as any)[d.id]
                        const isSelected = selectedDrum === d.id
                        
                        return (
                            <div
                                key={d.id}
                                className={`drum-pad ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedDrum(d.id);
                                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`${d.label} drum pad`}
                                aria-selected={isSelected}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setSelectedDrum(d.id);
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                    }
                                }}
                            >
                                <div 
                                    className="drum-pad-surface"
                                    style={{ 
                                        '--pad-color': d.color 
                                    } as React.CSSProperties}
                                />
                                <span className="drum-pad-label">{d.label}</span>
                                
                                {isSelected && (
                                    <div className="drum-pad-controls">
                                        <StudioKnob
                                            label="Level"
                                            value={drumState?.level || 50}
                                            min={0}
                                            max={100}
                                            onChange={(v) => handleParamChange(d.id, 'level', v)}
                                            color="amber"
                                            size="small"
                                        />
                                        <StudioKnob
                                            label="Tune"
                                            value={drumState?.tune || 50}
                                            min={0}
                                            max={100}
                                            onChange={(v) => handleParamChange(d.id, 'tune', v)}
                                            color="amber"
                                            size="small"
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Step Sequencer */}
                <div className="drum-sequencer">
                    <div className="sequencer-header">
                        <span>EDITING: {selectedDrum.toUpperCase()}</span>
                        <div className="sequencer-params">
                            <label>STEPS</label>
                            <input
                                type="number" 
                                min="1" 
                                max="32"
                                value={(store as any)[selectedDrum]?.steps || 16}
                                onChange={(e) => handleParamChange(selectedDrum, 'steps', parseInt(e.target.value))}
                            />
                            <label>PULSES</label>
                            <input
                                type="number" 
                                min="0" 
                                max={(store as any)[selectedDrum]?.steps || 16}
                                value={(store as any)[selectedDrum]?.pulses || 4}
                                onChange={(e) => handleParamChange(selectedDrum, 'pulses', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                    
                    <div className="sequencer-steps">
                        {Array.from({ length: 16 }).map((_, i) => {
                            const active = (store as any).activePatterns[selectedDrum]?.[i]
                            return (
                                <button
                                    key={i}
                                    className={`step-button ${active ? 'active' : ''}`}
                                    onClick={() => {
                                        store.toggleStep(selectedDrum as any, i);
                                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                    }}
                                    aria-label={`Step ${i + 1}`}
                                    aria-pressed={active}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </StudioScreen>
    )
}
