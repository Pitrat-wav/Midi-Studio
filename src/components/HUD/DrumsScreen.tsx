import React from 'react'
import { useDrumStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

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

    const handleParamChange = (drum: any, field: string, value: number | boolean) => {
        store.setParams(drum, { [field]: value })
    }

    const [selectedDrum, setSelectedDrum] = React.useState<string>('kick')

    return (
        <div className={`drums-screen hud-window hardware-panel kit-${store.kit}`}>
            {/* ... rest of the existing JSX ... */}


            {/* WOOD/PLASTIC SIDES */}
            <div className="side-panel left" />
            <div className="side-panel right" />

            <div className="panel-content">
                <div className="panel-header">
                    <div className="branding">
                        <span className="sub-brand">{store.kit === '808' ? 'Computer Composer' : 'Digital Drum System'}</span>
                        <h1>{store.kit === '808' ? 'Rhythm Composer TR-808' : 'Rhythm Composer TR-909'}</h1>
                    </div>
                    <div className="master-controls">
                        <div className="master-knob">
                            <label>VOLUME</label>
                            <div className="knob-cap" />
                        </div>
                        <div className="kit-selectors">
                            <button className={store.kit === '808' ? 'active' : ''} onClick={() => store.setKit('808')}>808</button>
                            <button className={store.kit === '909' ? 'active' : ''} onClick={() => store.setKit('909')}>909</button>
                        </div>
                        <button className={`start-stop ${store.isPlaying ? 'playing' : ''}`} onClick={store.togglePlay}>
                            {store.isPlaying ? 'STOP' : 'START'}
                        </button>
                        <button className="power-btn" onClick={() => setFocusedInstrument(null)}>OFF</button>
                    </div>
                </div>

                <div className="panel-control-bay">
                    {DRUMS.map((d) => {
                        const drumState = (store as any)[d.id]
                        const isSelected = selectedDrum === d.id
                        return (
                            <div
                                key={d.id}
                                className={`inst-section ${isSelected ? 'selected' : ''}`}
                                onClick={() => setSelectedDrum(d.id)}
                            >
                                <span className="inst-label">{d.label.toUpperCase()}</span>
                                <div className="knobs-row">
                                    <div className="hw-knob">
                                        <label>PITCH</label>
                                        <input
                                            type="range" min="0" max="1" step="0.01"
                                            value={drumState.pitch}
                                            onChange={(e) => handleParamChange(d.id, 'pitch', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="hw-knob">
                                        <label>DECAY</label>
                                        <input
                                            type="range" min="0.01" max="1" step="0.01"
                                            value={drumState.decay}
                                            onChange={(e) => handleParamChange(d.id, 'decay', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="hw-knob">
                                        <label>LEVEL</label>
                                        <input
                                            type="range" min="-60" max="6" step="1"
                                            value={drumState.volume}
                                            onChange={(e) => handleParamChange(d.id, 'volume', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="panel-sequencer-strip">
                    <div className="seq-info">
                        <span>EDITING: {selectedDrum.toUpperCase()}</span>
                        <div className="seq-params">
                            <label>STEPS</label>
                            <input
                                type="number" min="1" max="32"
                                value={(store as any)[selectedDrum].steps}
                                onChange={(e) => handleParamChange(selectedDrum, 'steps', parseInt(e.target.value))}
                            />
                            <label>PULSES</label>
                            <input
                                type="number" min="0" max={(store as any)[selectedDrum].steps}
                                value={(store as any)[selectedDrum].pulses}
                                onChange={(e) => handleParamChange(selectedDrum, 'pulses', parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="step-buttons">
                        {store.activePatterns[selectedDrum as keyof typeof store.activePatterns]?.map((active: boolean, i: number) => (
                            <div
                                key={i}
                                className={`hw-step ${active ? 'active' : ''}`}
                                onClick={() => store.toggleStep(selectedDrum as any, i)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="led" />
                                <div className="btn-cap" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
