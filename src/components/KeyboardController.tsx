/**
 * KeyboardController — Keyboard shortcuts for 3D navigation
 */

import { useEffect } from 'react'
import { useAudioStore } from '../store/audioStore'

interface KeyboardControllerProps {
    onToggleOverlay?: () => void
}

export function KeyboardController({ onToggleOverlay }: KeyboardControllerProps) {
    const togglePlay = useAudioStore(s => s.togglePlay)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement) return

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault()
                    togglePlay()
                    break
                case 'h':
                    e.preventDefault()
                    onToggleOverlay?.()
                    break
                case '1':
                    // TODO: Focus drums
                    break
                case '2':
                    // TODO: Focus bass
                    break
                case '3':
                    // TODO: Focus harmony
                    break
                case '4':
                    // TODO: Focus pads
                    break
                case '0':
                    // TODO: Overview mode
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [togglePlay, onToggleOverlay])

    return null
}
