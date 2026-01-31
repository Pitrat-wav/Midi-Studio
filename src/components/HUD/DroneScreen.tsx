import React from 'react'
import { useHarmStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'
import './DroneScreen.css'

export const DroneScreen: React.FC = () => {
    const store = useHarmStore()
    const setFocusedInstrument = useVisualStore(s => s.setFocusInstrument)

    return (
        <div className="drone-screen hud-window">
            <div className="hud-header">
                <h2>☄️ INFINITE DRONE ENGINE</h2>
                <div className="hud-header-actions">
                    <button className="hud-close" onClick={() => setFocusedInstrument(null)}>✕</button>
                </div>
            </div>

            <div className="drone-container">
                {/* Power Toggle */}
                <div
                    className="drone-power-section"
                    onClick={() => store.setParam({ isDroneEnabled: !store.isDroneEnabled })}
                >
                    <div className={`drone-orb ${store.isDroneEnabled ? 'active' : ''}`}>
                        <div className="orb-inner"></div>
                        <div className="orb-glow"></div>
                    </div>
                    <div className="drone-power-label">
                        {store.isDroneEnabled ? 'DRONE ACTIVE' : 'DRONE STANDBY'}
                    </div>
                </div>

                {/* Visualization */}
                <div className="drone-visualization">
                    {Array.from({ length: 30 }).map((_, i) => {
                        const radius = 40 + (i * 3)
                        const opacity = store.isDroneEnabled ? (0.8 - i * 0.025) : 0.1
                        return (
                            <div
                                key={i}
                                className="drone-ring"
                                style={{
                                    width: `${radius * 2}px`,
                                    height: `${radius * 2}px`,
                                    borderColor: `rgba(136, 0, 255, ${opacity})`,
                                    animation: store.isDroneEnabled ? `pulse-ring ${4 + i * 0.2}s infinite` : 'none'
                                }}
                            />
                        )
                    })}
                </div>

                {/* Info */}
                <div className="drone-info">
                    <div className="drone-info-item">
                        <span className="info-label">STATUS:</span>
                        <span className="info-value">{store.isDroneEnabled ? 'ACTIVE' : 'STANDBY'}</span>
                    </div>
                    <div className="drone-info-item">
                        <span className="info-label">INSPIRATION:</span>
                        <span className="info-value">Sunn O))), LaMonte Young, Deep Listening</span>
                    </div>
                    <div className="drone-info-item">
                        <span className="info-label">TECHNIQUE:</span>
                        <span className="info-value">Sustained Harmonic Oscillation</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
