import { useCallback } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../../store/audioStore'
import { useDrumStore } from '../../store/instrumentStore'
import { useVisualStore } from '../../store/visualStore'

export function useDrumSequencer() {
    return useCallback((time: number, step: number) => {
        const currentDrums = useDrumStore.getState()
        const { drumMachine } = useAudioStore.getState()
        const visual = useVisualStore.getState()

        if (currentDrums.isPlaying && drumMachine) {
            const patterns = currentDrums.activePatterns
            const stepIdx = step % 16

            if (patterns) {
                if (!currentDrums.kick?.muted && patterns.kick?.[stepIdx]) {
                    drumMachine.triggerDrum('kick', time)
                    Tone.Draw.schedule(() => visual.triggerPulse('kick'), time)
                }
                if (!currentDrums.snare?.muted && patterns.snare?.[stepIdx]) {
                    drumMachine.triggerDrum('snare', time)
                    Tone.Draw.schedule(() => visual.triggerPulse('snare'), time)
                }
                if (!currentDrums.hihat?.muted && patterns.hihat?.[stepIdx]) {
                    drumMachine.triggerDrum('hihat', time)
                    Tone.Draw.schedule(() => visual.triggerPulse('hihat'), time)
                }
                if (!currentDrums.hihatOpen?.muted && patterns.hihatOpen?.[stepIdx]) {
                    drumMachine.triggerDrum('hihatOpen', time)
                    Tone.Draw.schedule(() => visual.triggerPulse('hihat'), time)
                }
                if (!currentDrums.clap?.muted && patterns.clap?.[stepIdx]) {
                    drumMachine.triggerDrum('clap', time)
                    Tone.Draw.schedule(() => visual.triggerPulse('clap'), time)
                }
                if (!currentDrums.ride?.muted && patterns.ride?.[stepIdx]) {
                    drumMachine.triggerDrum('ride', time)
                    Tone.Draw.schedule(() => visual.triggerPulse('hihat'), time)
                }
            }
        }
    }, [])
}
