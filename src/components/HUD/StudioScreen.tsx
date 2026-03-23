/**
 * StudioScreen.tsx — Base Component for 2D Instrument Controllers
 * 
 * Единый стиль для всех 2D контроллеров инструментов:
 * - Стеклянная панель с неоновой обводкой
 * - Заголовок с LED индикатором
 * - Кнопка закрытия
 * - Аудио-реактивное свечение
 */

import React, { useEffect, useRef } from 'react'
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'
import { useAudioStore } from '../../store/audioStore'
import './StudioScreen.css'

interface StudioScreenProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    onClose?: () => void
    ledColor?: 'blue' | 'purple' | 'amber' | 'red' | 'green'
    className?: string
}

export const StudioScreen: React.FC<StudioScreenProps> = ({
    title,
    subtitle,
    children,
    onClose,
    ledColor = 'blue',
    className = ''
}) => {
    const bridge = useAudioVisualBridge()
    const isPlaying = useAudioStore(s => s.isPlaying)
    const screenRef = useRef<HTMLDivElement>(null!)
    const ledRef = useRef<HTMLDivElement>(null!)
    
    // Аудио-реактивное свечение
    useEffect(() => {
        if (!screenRef.current || !ledRef.current) return
        
        let animationId: number
        
        const animate = () => {
            const kick = bridge.getPulse('kick')
            const snare = bridge.getPulse('snare')
            const pulse = kick * 0.5 + snare * 0.3
            
            if (screenRef.current) {
                const intensity = 0.5 + pulse
                screenRef.current.style.setProperty('--glow-intensity', intensity.toString())
            }
            
            if (ledRef.current && isPlaying) {
                ledRef.current.style.opacity = (0.6 + pulse * 0.4).toString()
            }
            
            animationId = requestAnimationFrame(animate)
        }
        
        animate()
        
        return () => cancelAnimationFrame(animationId)
    }, [bridge, isPlaying])
    
    // Закрытие по ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                onClose()
            }
        }
        
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])
    
    return (
        <div className="studio-screen-overlay" onClick={onClose}>
            <div 
                ref={screenRef}
                className={`studio-screen ${className}`}
                onClick={(e) => e.stopPropagation()}
                style={{ '--led-color': `var(--neon-${ledColor})` } as React.CSSProperties}
            >
                {/* Studio Header */}
                <div className="studio-screen-header">
                    <div className="studio-screen-title-group">
                        <div className="studio-screen-title">
                            <span className="title-text">{title}</span>
                            {subtitle && <span className="title-subtitle">{subtitle}</span>}
                        </div>
                        <div ref={ledRef} className="studio-screen-led" />
                    </div>
                    
                    <button className="studio-screen-close" onClick={onClose} aria-label="Close">
                        <span>✕</span>
                        <span className="close-hint">ESC</span>
                    </button>
                </div>
                
                {/* Studio Content */}
                <div className="studio-screen-content">
                    {children}
                </div>
                
                {/* Neon Border Effect */}
                <div className="studio-screen-neon-border" />
            </div>
        </div>
    )
}

/**
 * StudioKnob — Rotary Control Component
 */
interface StudioKnobProps {
    label: string
    value: number
    min?: number
    max?: number
    step?: number
    defaultValue?: number
    onChange: (value: number) => void
    color?: 'blue' | 'amber' | 'green'
    size?: 'small' | 'medium' | 'large'
}

export const StudioKnob: React.FC<StudioKnobProps> = ({
    label,
    value,
    min = 0,
    max = 100,
    step,
    defaultValue,
    onChange,
    color = 'blue',
    size = 'medium'
}) => {
    const percentage = ((value - min) / (max - min)) * 100
    const rotation = -135 + (percentage * 2.7) // 270 degree range
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = parseFloat(e.target.value)
        onChange(newVal)
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged()
        }
    }

    const handleDoubleClick = () => {
        const resetVal = defaultValue !== undefined ? defaultValue : (max + min) / 2
        onChange(resetVal)
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
        }
    }
    
    return (
        <div className={`studio-knob-container studio-knob-${size}`}>
            <div className={`studio-knob-wrapper studio-knob-${color}`}>
                <div 
                    className="studio-knob"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    onDoubleClick={handleDoubleClick}
                >
                    <div className="knob-marker" />
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step || (max - min) / 100}
                    value={value}
                    onChange={handleChange}
                    className="studio-knob-input"
                    aria-label={label}
                />
            </div>
            <span className="studio-knob-label">{label}</span>
            <span className="studio-knob-value">{value.toFixed(1)}</span>
        </div>
    )
}

/**
 * StudioSlider — Fader Component
 */
interface StudioSliderProps {
    label: string
    value: number
    min?: number
    max?: number
    step?: number
    defaultValue?: number
    onChange: (value: number) => void
    vertical?: boolean
    color?: 'blue' | 'amber' | 'green'
}

export const StudioSlider: React.FC<StudioSliderProps> = ({
    label,
    value,
    min = 0,
    max = 100,
    step,
    defaultValue,
    onChange,
    vertical = false,
    color = 'blue'
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = parseFloat(e.target.value)
        onChange(newVal)
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged()
        }
    }

    const handleDoubleClick = () => {
        const resetVal = defaultValue !== undefined ? defaultValue : (max + min) / 2
        onChange(resetVal)
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
        }
    }
    
    const percentage = ((value - min) / (max - min)) * 100
    
    return (
        <div className={`studio-slider-container ${vertical ? 'vertical' : 'horizontal'}`}>
            <span className="studio-slider-label">{label}</span>
            <div className={`studio-slider-wrapper studio-slider-${color}`} onDoubleClick={handleDoubleClick}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step || (max - min) / 100}
                    value={value}
                    onChange={handleChange}
                    className="studio-slider-input"
                    style={vertical ? { height: '120px' } : { width: '150px' }}
                    aria-label={label}
                />
                {vertical && (
                    <div 
                        className="studio-slider-fill"
                        style={{ height: `${percentage}%` }}
                    />
                )}
            </div>
            <span className="studio-slider-value">{value.toFixed(1)}</span>
        </div>
    )
}

/**
 * StudioDisplay — LED/LCD Display Component
 */
interface StudioDisplayProps {
    value: string | number
    label?: string
    color?: 'blue' | 'amber' | 'green' | 'red'
    size?: 'small' | 'medium' | 'large'
}

export const StudioDisplay: React.FC<StudioDisplayProps> = ({
    value,
    label,
    color = 'blue',
    size = 'medium'
}) => {
    return (
        <div className={`studio-display-container studio-display-${size}`}>
            {label && <span className="studio-display-label">{label}</span>}
            <div className={`studio-display studio-display-${color}`}>
                {value}
            </div>
        </div>
    )
}

/**
 * StudioButton — Button Component
 */
interface StudioButtonProps {
    label: string
    onClick?: () => void
    active?: boolean
    danger?: boolean
    icon?: string
}

export const StudioButton: React.FC<StudioButtonProps> = ({
    label,
    onClick,
    active = false,
    danger = false,
    icon
}) => {
    const handleClick = () => {
        if (onClick) onClick()
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
        }
    }

    return (
        <button 
            className={`studio-button ${active ? 'active' : ''} ${danger ? 'danger' : ''}`}
            onClick={handleClick}
            aria-pressed={active}
        >
            {icon && <span className="button-icon">{icon}</span>}
            <span className="button-label">{label}</span>
        </button>
    )
}

/**
 * StudioVUMeter — VU Meter Component
 */
interface StudioVUMeterProps {
    value: number // 0-100
    label?: string
    channels?: number
}

export const StudioVUMeter: React.FC<StudioVUMeterProps> = ({
    value,
    label,
    channels = 1
}) => {
    return (
        <div className="studio-vu-meter-container">
            {label && <span className="studio-vu-meter-label">{label}</span>}
            <div className="studio-vu-meters">
                {Array.from({ length: channels }).map((_, i) => (
                    <div key={i} className="studio-vu-meter">
                        <div className="vu-meter-bar">
                            <div 
                                className="vu-meter-fill"
                                style={{ height: `${Math.min(value, 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
