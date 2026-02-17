import { useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../../store/audioStore'
import { useBassStore, usePadStore, useLfoStore } from '../../store/instrumentStore'
import { Modulator } from '../../logic/Modulator'

export function useLfoModulator() {
    const modulatorRef = useRef(new Modulator())

    return useCallback((time: number) => {
        const lfo = useLfoStore.getState()
        const currentBass = useBassStore.getState()
        const currentPads = usePadStore.getState()
        const { bassSynth, leadSynth, padSynth, drumMachine, bpm, volumes } = useAudioStore.getState()

        if (lfo.enabled && lfo.target !== 'none') {
            const delta = 60 / (bpm * 4) // seconds per 16th note
            const lfoValue = modulatorRef.current.getNextValue(lfo.shape, lfo.frequency, delta)
            useLfoStore.getState().updateValue(lfoValue)

            const modAmount = lfoValue * lfo.depth

            if (lfo.target === 'bassCutoff' && bassSynth) {
                const baseCutoff = currentBass.cutoff
                const modulated = baseCutoff * Math.pow(2, modAmount * 2)
                bassSynth.setCutoff(Math.min(10000, Math.max(20, modulated)))
            } else if (lfo.target === 'bassResonance' && bassSynth) {
                const baseRes = currentBass.resonance
                const modulated = baseRes + (modAmount * 10)
                bassSynth.setResonance(Math.min(20, Math.max(0.1, modulated)))
            } else if (lfo.target === 'leadCutoff' && leadSynth) {
                const baseCutoff = 1000
                const modulated = baseCutoff * Math.pow(2, modAmount * 2)
                leadSynth.setCutoff(Math.min(10000, Math.max(20, modulated)))
            } else if (lfo.target === 'leadResonance' && leadSynth) {
                const modulated = 1 + (modAmount * 5)
                leadSynth.setResonance(Math.min(20, Math.max(0.1, modulated)))
            } else if (lfo.target === 'padBrightness' && padSynth) {
                const baseBright = currentPads.brightness
                const modulated = baseBright + (modAmount * 0.4)
                padSynth.setParams(Math.min(1, Math.max(0, modulated)))
            } else if (lfo.target === 'drumVolume' && drumMachine) {
                const baseVol = volumes.drums
                const modulated = baseVol + (modAmount * 0.3)
                drumMachine.setVolume(Tone.gainToDb(Math.min(1, Math.max(0, modulated))))
            }
        }
    }, [])
}
