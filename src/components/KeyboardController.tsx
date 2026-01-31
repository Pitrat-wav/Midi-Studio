import { useEffect } from 'react'
import { useAudioStore } from '../store/audioStore'
import { useBassStore, useDrumStore, usePadStore } from '../store/instrumentStore'
import { useVisualStore } from '../store/visualStore'
import type { InstrumentType } from '../lib/SpatialLayout'
import * as Tone from 'tone'

interface KeyboardControllerProps {
    onToggleOverlay?: () => void
    onToggleFAQ?: () => void
    showOverlay: boolean
}

export function KeyboardController({
    onToggleOverlay,
    onToggleFAQ,
    showOverlay
}: KeyboardControllerProps) {
    // We do NOT call useAudioStore() here to avoid re-renders on every step.
    // Instead we access state directly in the event handler.

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input field
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

            const audio = useAudioStore.getState()
            const visual = useVisualStore.getState()
            const bass = useBassStore.getState()
            const pads = usePadStore.getState()
            const focusedInstrument = visual.focusInstrument

            console.log(`[Key] ${e.code} (Focus: ${focusedInstrument})`)

            switch (e.code) {
                // --- TRANSPORT ---
                case 'Space':
                    e.preventDefault()
                    audio.togglePlay()
                    // Visual feedback
                    visual.setStatus(audio.isPlaying ? 'PAUSED' : 'PLAYING')
                    break
                case 'KeyP':
                    e.preventDefault()
                    audio.panic()
                    visual.setStatus('PANIC TRIGGERED')
                    break

                // --- UI ---
                case 'KeyH':
                    e.preventDefault()
                    onToggleOverlay?.()
                    break
                case 'Slash': // ? key (Shift+/)
                    if (e.shiftKey) {
                        e.preventDefault()
                        onToggleFAQ?.()
                    }
                    break

                // --- NAVIGATION ---
                case 'Digit0':
                    e.preventDefault()
                    visual.setFocusInstrument(null)
                    break
                case 'Digit1':
                    visual.setFocusInstrument('drums')
                    break
                case 'Digit2':
                    visual.setFocusInstrument('bass')
                    break
                case 'Digit3':
                    visual.setFocusInstrument('harmony')
                    break
                case 'Digit4':
                    visual.setFocusInstrument('pads')
                    break
                case 'Digit5':
                    visual.setFocusInstrument('sequencer')
                    break
                case 'Digit6':
                    visual.setFocusInstrument('drone')
                    break
                case 'Digit7':
                    visual.setFocusInstrument('master')
                    break
                case 'Digit8':
                    visual.setFocusInstrument('sampler')
                    break
                case 'Digit9':
                    visual.setFocusInstrument('buchla')
                    break

                // --- MUTE ---
                case 'KeyM':
                    e.preventDefault()
                    if (focusedInstrument) {
                        const channelMap: Record<string, 'drums' | 'bass' | 'lead' | 'pads' | 'harm'> = {
                            drums: 'drums', bass: 'bass', harmony: 'harm', buchla: 'harm', pads: 'pads'
                        }
                        const chan = channelMap[focusedInstrument]
                        if (chan) {
                            audio.toggleMute(chan)
                            const isMuted = audio.mutes[chan]
                            visual.setStatus(`${chan.toUpperCase()} ${!isMuted ? 'MUTED' : 'UNMUTED'}`) // Logic is inverted in toggleMute vs state? No, toggleMute flips state. We read OLD state here.
                            // Actually better to read fresh state after a tick, or just assume toggle.
                        }
                    } else {
                        // Global Mute? Or maybe mute Master?
                        // audio.toggleMute('master') // Not implemented
                    }
                    break

                // --- MASTER VOLUME ([ / ]) ---
                case 'BracketLeft': // [
                    e.preventDefault()
                    const vDown = Math.max(Tone.dbToGain(Tone.Destination.volume.value) - 0.1, 0)
                    audio.setMasterVolume(vDown)
                    visual.setStatus(`MASTER VOL: ${Math.round(vDown * 100)}%`)
                    break
                case 'BracketRight': // ]
                    e.preventDefault()
                    const vUp = Math.min(Tone.dbToGain(Tone.Destination.volume.value) + 0.1, 1)
                    audio.setMasterVolume(vUp)
                    visual.setStatus(`MASTER VOL: ${Math.round(vUp * 100)}%`)
                    break

                // --- MACRO CONTROLS REMOVED (Handled by CameraController for Navigation) ---
                // WASD / Arrows now strictly for Camera Movement
                /*
                case 'KeyW': ...
                */
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onToggleOverlay, onToggleFAQ]) // Re-bind if event handlers change

    return null
}
