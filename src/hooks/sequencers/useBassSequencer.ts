import { useCallback } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../../store/audioStore'
import { useBassStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export function useBassSequencer() {
    return useCallback((time: number, step: number) => {
        const currentBass = useBassStore.getState()
        const { bassSynth, fmBass } = useAudioStore.getState()

        const bassStep = currentBass.pattern?.[step]
        const prevBassStep = currentBass.pattern?.[(step + 15) % 16]

        if (currentBass.isPlaying && bassStep && bassStep.active) {
            const visual = useVisualStore.getState()
            const freq = Tone.Frequency(bassStep.note).toFrequency()
            Tone.Draw.schedule(() => {
                useBassStore.getState().setParams({ lastNoteFrequency: freq })
                visual.triggerPulse('bass')
            }, time)

            if (currentBass.activeInstrument === 'acid' && bassSynth) {
                const isContinuing = prevBassStep?.active && prevBassStep?.slide
                bassSynth.triggerNote(bassStep.note, '16n', time, bassStep.velocity, bassStep.slide, bassStep.accent, !!isContinuing)
            } else if (currentBass.activeInstrument === 'fm' && fmBass) {
                fmBass.triggerNote(bassStep.note, '16n', time, bassStep.velocity)
            }
        }
    }, [])
}
