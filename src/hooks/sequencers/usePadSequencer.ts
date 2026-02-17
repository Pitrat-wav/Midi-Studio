import { useCallback } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../../store/audioStore'
import { usePadStore, useHarmonyStore } from '../../store/instrumentStore'
import { generatePadProgression } from '../../logic/PadGenerator'

export function usePadSequencer() {
    return useCallback((time: number, totalStep: number) => {
        const currentPads = usePadStore.getState()
        const currentHarmony = useHarmonyStore.getState()
        const { padSynth } = useAudioStore.getState()

        if (currentPads.active && padSynth && totalStep % 32 === 0) {
            const progression = generatePadProgression(currentHarmony.root, currentHarmony.scale, currentPads.complexity)
            if (progression && progression.length > 0) {
                const chordIdx = Math.floor((totalStep / 32) % progression.length)
                padSynth.triggerChord(progression[chordIdx], '2n', time)
            }
        }
    }, [])
}
