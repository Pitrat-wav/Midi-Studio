import { useCallback } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../../store/audioStore'
import { useHarmStore } from '../../store/instrumentStore'

export function useHarmSequencer() {
    return useCallback((time: number, totalStep: number) => {
        const { harmSynth } = useAudioStore.getState()
        const currentHarm = useHarmStore.getState()

        if (harmSynth) {
            const triggerHarmNotes = (midi: number, vel: number, dur = '16n') => {
                const offsets = currentHarm.chordOffsets || []
                const notesToPlay = [midi, ...(offsets.map(o => midi + o))]
                notesToPlay.forEach(m => {
                    harmSynth.triggerNote(Tone.Frequency(m, 'midi').toNote(), dur, time, vel)
                })
            }

            if (currentHarm.isSequencerEnabled && currentHarm.isPlaying && currentHarm.grid) {
                const step16 = totalStep % 16
                const cell = currentHarm.grid[step16]
                if (cell && cell.active && Math.random() < (cell.probability ?? 1)) {
                    triggerHarmNotes(cell.note, cell.velocity)
                }
                useHarmStore.getState().setParam({ currentStep: step16 })
            }

            if (currentHarm.isDroneEnabled && currentHarm.isPlaying && currentHarm.droneGrid && currentHarm.droneGrid.length > 0) {
                if (totalStep % 32 === 0) {
                    const droneStep = Math.floor(totalStep / 32) % currentHarm.droneGrid.length
                    const cell = currentHarm.droneGrid[droneStep]
                    if (cell && cell.active) triggerHarmNotes(cell.note, cell.velocity * 0.7, '2n')
                    useHarmStore.getState().setParam({ currentDroneStep: droneStep })
                }
            }
        }
    }, [])
}
