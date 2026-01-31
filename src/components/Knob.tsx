import { useState, useRef, useEffect } from 'react'
import { useVisualStore } from '../store/visualStore'

interface KnobProps {
    label?: string
    value: number
    min?: number
    max?: number
    step?: number
    defaultValue?: number
    onChange: (value: number) => void
    size?: number
    showLabel?: boolean
    color?: string
}

export function Knob({ label, value, min = 0, max = 1, step = 0.01, defaultValue, onChange, size = 64, showLabel = true, color }: KnobProps) {
    const setInteraction = useVisualStore(s => s.setInteraction)
    const activeColor = color || 'var(--tg-theme-button-color)'
    const [isDragging, setIsDragging] = useState(false)
    const startY = useRef(0)
    const startValue = useRef(0)

    const handlePointerDown = (e: React.PointerEvent) => {
        try {
            setIsDragging(true)
            startY.current = e.clientY
            startValue.current = value
            e.currentTarget.setPointerCapture(e.pointerId)

            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
            }
        } catch (e) {
            console.error('Knob pointer down failed', e)
        }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return
        try {
            const deltaY = startY.current - e.clientY
            const range = max - min
            const sensitivity = 240 // More precise
            const newValue = Math.min(max, Math.max(min, startValue.current + (deltaY / sensitivity) * range))

            const steppedValue = Math.round(newValue / step) * step
            const finalValue = Number(steppedValue.toFixed(2))

            if (finalValue !== value) {
                onChange(finalValue)
                setInteraction(label || 'knob', 1.0)
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.selectionChanged()
                }
            }
        } catch (e) {
            console.error('Knob pointer move failed', e)
        }
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false)
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    const handleDoubleClick = () => {
        try {
            const resetValue = defaultValue !== undefined ? defaultValue : (max + min) / 2
            onChange(resetValue)
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
            }
        } catch (e) {
            console.error('Knob double click failed', e)
        }
    }

    const radius = 24
    const circumference = 2 * Math.PI * radius
    const normalizedValue = (value - min) / (max - min)
    const angle = normalizedValue * 270 - 135
    const offset = circumference - normalizedValue * (circumference * 0.75)

    return (
        <div
            className="knob-container"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                width: size + 24,
                userSelect: 'none'
            }}
        >
            <div
                className="knob-outer"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={handleDoubleClick}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    background: isDragging
                        ? 'var(--tg-theme-secondary-bg-color)'
                        : 'linear-gradient(145deg, var(--tg-theme-secondary-bg-color), var(--tg-theme-bg-color))',
                    boxShadow: isDragging
                        ? 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.8)'
                        : '4px 4px 10px rgba(0,0,0,0.05), -4px -4px 10px rgba(255,255,255,0.8)',
                    position: 'relative',
                    cursor: 'ns-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    transform: isDragging ? 'scale(1.05)' : 'scale(1)'
                }}
            >
                <svg width={size} height={size} viewBox="0 0 64 64">
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke="var(--tg-theme-hint-color)"
                        strokeWidth="3"
                        strokeOpacity="0.1"
                        strokeDasharray={`${circumference * 0.75} ${circumference}`}
                        strokeDashoffset="0"
                        style={{ transform: 'rotate(135deg)', transformOrigin: '32px 32px' }}
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke={activeColor}
                        strokeWidth="4"
                        strokeDasharray={`${circumference * 0.75} ${circumference}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transform: 'rotate(135deg)',
                            transformOrigin: '32px 32px',
                            transition: isDragging ? 'none' : 'stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            filter: `drop-shadow(0 0 4px ${activeColor})`
                        }}
                    />
                </svg>

                {/* Center Cap */}
                <div style={{
                    position: 'absolute',
                    width: '70%',
                    height: '70%',
                    borderRadius: '50%',
                    background: 'var(--tg-theme-secondary-bg-color)',
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Indicator Line */}
                    <div style={{
                        position: 'absolute',
                        width: '3px',
                        height: '8px',
                        background: activeColor,
                        top: '4px',
                        borderRadius: '2px',
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: '50% 18px',
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                {showLabel && <div className="knob-label">{label}</div>}
                <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    fontFamily: 'monospace',
                    color: isDragging ? activeColor : 'var(--tg-theme-text-color)',
                    transition: 'color 0.2s ease'
                }}>
                    {step >= 1 ? Math.round(value) : value.toFixed(2)}
                </div>
            </div>
        </div>
    )
}
