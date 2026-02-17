import { useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { useHarmonyStore } from '../../store/instrumentStore'

export function useMetronome() {
    const metronomeSynthRef = useRef<Tone.MembraneSynth | null>(null)

    useEffect(() => {
        metronomeSynthRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.008,
            octaves: 2,
            envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
        }).toDestination()
        metronomeSynthRef.current.volume.value = -10

        return () => {
            metronomeSynthRef.current?.dispose()
        }
    }, [])

    return useCallback((time: number, step: number) => {
        const currentHarmony = useHarmonyStore.getState()
        if (currentHarmony.isMetronomeOn && step % 4 === 0) {
            metronomeSynthRef.current?.triggerAttackRelease('C6', '32n', time)
        }
    }, [])
}
