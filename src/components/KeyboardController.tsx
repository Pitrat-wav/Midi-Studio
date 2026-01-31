import { useEffect } from 'react'
import { useAudioStore } from '../store/audioStore'
import { useVisualStore } from '../store/visualStore'
import { useBassStore, useDrumStore, usePadStore } from '../store/instrumentStore'
import type { InstrumentType } from '../lib/SpatialLayout'

interface KeyboardControllerProps {
    onToggleOverlay?: () => void
    onSelectInstrument: (instrument: InstrumentType | null) => void
    focusedInstrument: InstrumentType | null
    onToggleFAQ?: () => void
    showOverlay: boolean
}

export function KeyboardController({
    onToggleOverlay,
    onSelectInstrument,
    focusedInstrument,
    onToggleFAQ,
    showOverlay
}: KeyboardControllerProps) {
    const audio = useAudioStore()
    const bass = useBassStore()
    const pads = usePadStore()
    const drums = useDrumStore()
    const visual = useVisualStore()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement) return

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault()
                    audio.togglePlay()
                    break
                case 'h':
                    e.preventDefault()
                    onToggleOverlay?.()
                    break
                case '?':
                case '/':
                    // If it's just '?' (not typing in a box)
                    e.preventDefault()
                    onToggleFAQ?.()
                    break
                case '0':
                    e.preventDefault()
                    onSelectInstrument(null)
                    break
                case '1':
                    e.preventDefault()
                    onSelectInstrument('drums')
                    break
                case '2':
                    e.preventDefault()
                    onSelectInstrument('bass')
                    break
                case '3':
                    e.preventDefault()
                    onSelectInstrument('harmony')
                    break
                case '4':
                    e.preventDefault()
                    onSelectInstrument('pads')
                    break
                case '5':
                    e.preventDefault()
                    onSelectInstrument('sequencer')
                    break
                case '6':
                    e.preventDefault()
                    onSelectInstrument('drone')
                    break
                case '7':
                    e.preventDefault()
                    onSelectInstrument('master')
                    break
                case 'p':
                    e.preventDefault()
                    audio.panic()
                    break
                case 'm':
                    e.preventDefault()
                    if (focusedInstrument) {
                        const channelMap: Record<string, 'drums' | 'bass' | 'lead' | 'pads' | 'harm'> = {
                            drums: 'drums', bass: 'bass', harmony: 'harm', pads: 'pads'
                        }
                        const chan = channelMap[focusedInstrument]
                        if (chan) audio.toggleMute(chan)
                    }
                    break

                case 'w':
                case 'arrowup':
                    e.preventDefault()
                    if (focusedInstrument === 'bass') {
                        const next = Math.min(bass.cutoff + 500, 20000)
                        bass.setParams({ cutoff: next })
                        visual.setStatus(`BASS CUTOFF: ${Math.round(next)}Hz`)
                    }
                    if (focusedInstrument === 'pads') {
                        const next = Math.min(pads.brightness + 0.1, 1)
                        pads.setParams({ brightness: next })
                        visual.setStatus(`PADS BRIGHTNESS: ${Math.round(next * 100)}%`)
                    }
                    break
                case 's':
                case 'arrowdown':
                    e.preventDefault()
                    if (focusedInstrument === 'bass') {
                        const next = Math.max(bass.cutoff - 500, 40)
                        bass.setParams({ cutoff: next })
                        visual.setStatus(`BASS CUTOFF: ${Math.round(next)}Hz`)
                    }
                    if (focusedInstrument === 'pads') {
                        const next = Math.max(pads.brightness - 0.1, 0)
                        pads.setParams({ brightness: next })
                        visual.setStatus(`PADS BRIGHTNESS: ${Math.round(next * 100)}%`)
                    }
                    break
                case 'a':
                case 'arrowleft':
                    e.preventDefault()
                    if (focusedInstrument === 'bass') {
                        const next = Math.max(bass.resonance - 1, 1)
                        bass.setParams({ resonance: next })
                        visual.setStatus(`BASS RESONANCE: ${next.toFixed(1)}`)
                    }
                    if (focusedInstrument === 'pads') {
                        const next = Math.max(pads.complexity - 0.1, 0)
                        pads.setParams({ complexity: next })
                        visual.setStatus(`PADS COMPLEXITY: ${Math.round(next * 100)}%`)
                    }
                    break
                case 'd':
                case 'arrowright':
                    e.preventDefault()
                    if (focusedInstrument === 'bass') {
                        const next = Math.min(bass.resonance + 1, 20)
                        bass.setParams({ resonance: next })
                        visual.setStatus(`BASS RESONANCE: ${next.toFixed(1)}`)
                    }
                    if (focusedInstrument === 'pads') {
                        const next = Math.min(pads.complexity + 0.1, 1)
                        pads.setParams({ complexity: next })
                        visual.setStatus(`PADS COMPLEXITY: ${Math.round(next * 100)}%`)
                    }
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [audio, onToggleOverlay, onSelectInstrument, onToggleFAQ, focusedInstrument, bass, pads, drums])

    return null
}
