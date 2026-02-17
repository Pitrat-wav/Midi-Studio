import { useRef, useCallback } from 'react'
import * as Tone from 'tone'
import { Scale } from '@tonaljs/tonal'
import { useAudioStore } from '../../store/audioStore'
import { useSequencerStore, useHarmonyStore } from '../../store/instrumentStore'
import { Scaler } from '../../logic/Scaler'
import { GridWalker } from '../../logic/GridWalker'
import { TuringMachine } from '../../logic/TuringMachine'

export function useLeadSequencer() {
    const stagePulseRef = useRef(0)
    const lastStagePlayedRef = useRef(true)
    const snakePathIndexRef = useRef(0)
    const turingRef = useRef<TuringMachine>(new TuringMachine())
    const loopCountRef = useRef(0)

    const triggerLeadNotes = useCallback((midi: number, dur: string, time: number, vel: number) => {
        const { leadSynth } = useAudioStore.getState()
        const currentSeq = useSequencerStore.getState()
        const currentHarmony = useHarmonyStore.getState()

        if (!leadSynth || isNaN(midi) || midi === undefined || midi === null) return
        try {
            if (currentSeq.smartChordEnabled) {
                const chord = Scaler.generateChord(midi, currentHarmony.root, currentHarmony.scale, currentSeq.smartChordType)
                const noteNames = chord
                    .filter(m => m !== undefined && m !== null && !isNaN(m))
                    .map(m => Tone.Frequency(m, 'midi').toNote())

                if (noteNames && noteNames.length > 0) {
                    leadSynth.triggerNote(noteNames, dur, time, vel)
                }

                Tone.Draw.schedule(() => {
                    useSequencerStore.getState().setLastChordNotes(chord)
                }, time)
            } else {
                leadSynth.triggerNote(Tone.Frequency(midi, 'midi').toNote(), dur, time, vel)
                Tone.Draw.schedule(() => {
                    useSequencerStore.getState().setLastChordNotes([midi])
                }, time)
            }
        } catch (e) {
            console.error('Lead trigger failed', e)
        }
    }, [])

    return useCallback((time: number, step: number) => {
        const currentSeq = useSequencerStore.getState()
        const currentHarmony = useHarmonyStore.getState()
        const { leadSynth } = useAudioStore.getState()

        // 3a. ML-185
        const stage = currentSeq.stages?.[currentSeq.currentStageIndex]
        if (currentSeq.isStagesPlaying && stage) {
            try {
                if (stagePulseRef.current === 0) {
                    let conditionMet = true
                    switch (stage.condition) {
                        case '1/2': conditionMet = (loopCountRef.current % 2 === 0); break
                        case '2/2': conditionMet = (loopCountRef.current % 2 === 1); break
                        case '1/4': conditionMet = (loopCountRef.current % 4 === 0); break
                        case '2/4': conditionMet = (loopCountRef.current % 4 === 1); break
                        case 'neighbor': conditionMet = lastStagePlayedRef.current; break
                        case 'not-neighbor': conditionMet = !lastStagePlayedRef.current; break
                    }
                    const shouldPlay = conditionMet && Math.random() < stage.probability
                    lastStagePlayedRef.current = shouldPlay
                    if (shouldPlay) {
                        if (stage.gateMode === 1 || stage.gateMode === 2) {
                            triggerLeadNotes(stage.pitch, '16n', time, stage.velocity)
                        } else if (stage.gateMode === 3) {
                            triggerLeadNotes(stage.pitch, '8n', time, stage.velocity)
                        }
                    }
                } else if (stage.gateMode === 2) {
                    const stageLength = stage.length || 1
                    const pulseStep = stagePulseRef.current % Math.max(1, stageLength)
                    if (pulseStep === 0 && Math.random() < (stage.probability ?? 1)) {
                        triggerLeadNotes(stage.pitch || 60, '32n', time, (stage.velocity || 0.8) * 0.8)
                    }
                }
            } catch (e) {
                console.warn('ML-185 tick failed', e)
            }
            stagePulseRef.current++
            const stageLength = stage.length || 1
            const stagePulses = stage.pulseCount || 1
            if (stagePulseRef.current >= stageLength * stagePulses) {
                stagePulseRef.current = 0
                useSequencerStore.getState().setCurrentStageIndex((currentSeq.currentStageIndex + 1) % 8)
            }
        }

        // 3b. Snake
        if (currentSeq.isSnakePlaying) {
            try {
                const path = GridWalker.getPatternPath(currentSeq.snakePattern)
                const start = currentSeq.snakeStartStep
                const end = currentSeq.snakeEndStep

                if (snakePathIndexRef.current < start || snakePathIndexRef.current > end) {
                    snakePathIndexRef.current = start
                } else {
                    snakePathIndexRef.current++
                    if (snakePathIndexRef.current > end) snakePathIndexRef.current = start
                }

                const nextIndex = path[snakePathIndexRef.current % 16]
                const cell = currentSeq.snakeGrid[nextIndex]

                if (cell && cell.active && Math.random() < cell.probability) {
                    triggerLeadNotes(cell.note, '16n', time, cell.velocity)
                }
                if (nextIndex !== undefined) {
                    useSequencerStore.getState().setCurrentSnakeIndex(nextIndex)
                    useSequencerStore.getState().setSnakeXY(nextIndex % 4, Math.floor(nextIndex / 4))
                }
            } catch (e) {
                console.warn('Snake tick failed', e)
            }
        }

        // 3c. Turing
        if (currentSeq.isTuringPlaying) {
            try {
                const reg = turingRef.current.step(currentSeq.turingProbability, currentSeq.turingIsLocked)
                const normValue = turingRef.current.getValue(currentSeq.turingBits)
                useSequencerStore.getState().setTuringParam({ turingRegister: reg })

                if (leadSynth) {
                    const scaleScale = Scale.get(`${currentHarmony.root} ${currentHarmony.scale}`)
                    const scaleNotes = scaleScale ? (scaleScale.notes as string[]) : []
                    if (scaleNotes && Array.isArray(scaleNotes) && scaleNotes.length > 0) {
                        const noteCount = scaleNotes.length * 3
                        const noteIdx = Math.floor(normValue * noteCount)
                        const octave = 3 + Math.floor(noteIdx / scaleNotes.length)
                        const noteName = scaleNotes[noteIdx % scaleNotes.length]
                        const midi = Tone.Frequency(`${noteName}${octave}`).toMidi()

                        if (!isNaN(midi)) {
                            triggerLeadNotes(midi, '16n', time, 0.8)
                        }
                    }
                }
            } catch (e) {
                console.warn('Turing Machine tick failed', e)
            }
        }

        if (step === 15) loopCountRef.current++
    }, [triggerLeadNotes])
}
