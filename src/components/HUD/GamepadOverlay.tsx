import React from 'react'
import { useVisualStore } from '../../store/visualStore'
import { X } from 'lucide-react'
import './GamepadOverlay.css'

export function GamepadOverlay() {
    const show = useVisualStore(s => s.showGamepadHelp)
    const toggle = useVisualStore(s => s.toggleGamepadHelp)
    const appView = useVisualStore(s => s.appView)

    if (!show) return null

    return (
        <div className="gamepad-overlay" onClick={toggle}>
            <div className="gamepad-card glass" onClick={e => e.stopPropagation()}>
                <button className="gamepad-close" onClick={toggle}><X size={20} /></button>

                <header className="gamepad-header">
                    <span className="gamepad-meta">SYSTEM REFERENCE</span>
                    <h1>🎮 DUALSENSE CONTROL MAP</h1>
                    <p className="mode-indicator">ACTIVE MODE: <span>{appView}</span></p>
                </header>

                <div className="gamepad-content">
                    <div className="gamepad-image-container">
                        <img
                            src="/assets/visuals/dualsense_map.png"
                            alt="DualSense Map"
                            className="gamepad-image"
                        />

                        {/* Dynamic Tooltips based on mode */}
                        <div className="gamepad-tooltips">
                            {appView === 'VISUALIZER' ? (
                                <>
                                    <div className="tooltip t-touchpad">SWITCH MODE</div>
                                    <div className="tooltip t-l1">PREV VISUAL</div>
                                    <div className="tooltip t-r1">NEXT VISUAL</div>
                                    <div className="tooltip t-dpad-lr">VISUAL SPEED</div>
                                    <div className="tooltip t-dpad-ud">VISUAL DETAIL</div>
                                    <div className="tooltip t-cross">COLOR SHIFT</div>
                                    <div className="tooltip t-circle">SCALE FEEDBACK</div>
                                    <div className="tooltip t-square">RESET ALL</div>
                                    <div className="tooltip t-triangle">GLITCH PULSE</div>
                                    <div className="tooltip t-r2">BOOST (+)</div>
                                    <div className="tooltip t-l2">REDUCE (-)</div>
                                    <div className="tooltip t-options">EXIT TO STUDIO</div>
                                </>
                            ) : (
                                <>
                                    <div className="tooltip t-touchpad">VISUALIZER</div>
                                    <div className="tooltip t-cross">PLAY / STOP</div>
                                    <div className="tooltip t-circle">MUTE CURRENT</div>
                                    <div className="tooltip t-square">DESELECT</div>
                                    <div className="tooltip t-triangle">PANIC (STOP ALL)</div>
                                    <div className="tooltip t-r1">NEXT INST</div>
                                    <div className="tooltip t-l1">PREV INST</div>
                                    <div className="tooltip t-rstick">BPM CONTROL</div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="gamepad-legend">
                        <div className="legend-section">
                            <h3>{appView === 'VISUALIZER' ? 'VISUAL PERFORMANCE' : 'STUDIO CONTROLS'}</h3>
                            <ul>
                                {appView === 'VISUALIZER' ? (
                                    <>
                                        <li><strong>L1 / R1</strong> — Cycle Visualizers</li>
                                        <li><strong>D-Pad ←/→</strong> — Modulation Speed (uSpeed)</li>
                                        <li><strong>D-Pad ↑/↓</strong> — Graphics Detail (uDetail)</li>
                                        <li><strong>Left Stick</strong> — Warp / Offset center</li>
                                        <li><strong>Trigger R2 / L2</strong> — Boost / Decrease Intensity</li>
                                        <li><strong>X / O</strong> — Color Shift / Feedback Scale</li>
                                        <li><strong>□ (Square)</strong> — RESET to initial settings</li>
                                        <li><strong>△ (Triangle)</strong> — GLITCH PULSE (Max Intensity)</li>
                                        <li><strong>Touchpad</strong> — Exit to 3D World</li>
                                    </>
                                ) : (
                                    <>
                                        <li><strong>Cross (X)</strong> — Start/Stop Master Clock</li>
                                        <li><strong>Circle (O)</strong> — Mute selected instrument</li>
                                        <li><strong>L1 / R1</strong> — Cycle between 3D modules</li>
                                        <li><strong>Right Stick</strong> — Dynamic BPM adjustment</li>
                                        <li><strong>Triangle</strong> — PANIC (Global Stop)</li>
                                    </>
                                )}
                            </ul>
                        </div>
                        <div className="connection-tip">
                            Hold <strong>PS + Share</strong> to pair via Bluetooth
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
