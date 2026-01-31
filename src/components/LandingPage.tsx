import React, { useState } from 'react'
import './LandingPage.css'

interface LandingPageProps {
    onLaunch: () => void
}

export function LandingPage({ onLaunch }: LandingPageProps) {
    const [isLaunchHovered, setIsLaunchHovered] = useState(false)

    return (
        <div className="landing-container">
            <div className="background-glow"></div>

            <div className="content-wrapper">
                <header className="landing-header">
                    <div className="logo-section">
                        <span className="logo-icon">🌌</span>
                        <h1 className="title-text">
                            AUTONOMOUS <span>STUDIO</span>
                        </h1>
                    </div>
                    <div className="version-badge">v3.2.0 PRO</div>
                </header>

                <main className="hero-section">
                    <h2 className="tagline">Immersive Generative Architecture</h2>
                    <p className="description">
                        Experience the next generation of music production.
                        WASM-powered Euclidean intelligence meets high-performance 3D spatial control.
                    </p>

                    <div className="cta-section">
                        <button
                            className={`launch-btn ${isLaunchHovered ? 'hover' : ''}`}
                            onMouseEnter={() => setIsLaunchHovered(true)}
                            onMouseLeave={() => setIsLaunchHovered(false)}
                            onClick={onLaunch}
                        >
                            <span className="btn-label">INITIALIZE ENGINE</span>
                            <span className="btn-glow"></span>
                        </button>
                    </div>
                </main>

                <footer className="landing-footer">
                    <div className="feature-grid">
                        <div className="feature-item">
                            <span className="f-icon">🙌</span>
                            <span className="f-label">AI VISION</span>
                        </div>
                        <div className="feature-item">
                            <span className="f-icon">⚛️</span>
                            <span className="f-label">PYODIDE CORE</span>
                        </div>
                        <div className="feature-item">
                            <span className="f-icon">🎨</span>
                            <span className="f-label">WEBGL SHADERS</span>
                        </div>
                    </div>

                    <div className="shortcuts-bar">
                        <span className="s-key">SPACE</span> PLAY/STOP  •
                        <span className="s-key">1-7</span> NAVIGATE  •
                        <span className="s-key">H</span> TOGGLE HUD
                    </div>
                </footer>
            </div>
        </div>
    )
}
