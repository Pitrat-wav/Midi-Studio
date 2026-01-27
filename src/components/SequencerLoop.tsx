import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { Scale } from '@tonaljs/tonal'
import { Scaler } from '../logic/Scaler'
import { useAudioStore } from '../store/audioStore'
import { useDrumStore, useBassStore, useSequencerStore, useHarmStore } from '../store/instrumentStore'
import { bjorklund } from '../logic/bjorklund'
import { GridWalker } from '../logic/GridWalker'
import { useHarmonyStore, usePadStore, useLfoStore } from '../store/instrumentStore'
import { generatePadProgression } from '../logic/PadGenerator'
import { Modulator } from '../logic/Modulator'
import { TuringMachine } from '../logic/TuringMachine'

export function SequencerLoop() {
    const bassSynth = useAudioStore(s => s.bassSynth)
    const fmBass = useAudioStore(s => s.fmBass)
    const leadSynth = useAudioStore(s => s.leadSynth)
    const drumMachine = useAudioStore(s => s.drumMachine)
    const padSynth = useAudioStore(s => s.padSynth)
    const harmSynth = useAudioStore(s => s.harmSynth)
    const isInitialized = useAudioStore(s => s.isInitialized)

    const stepRef = useRef(0)
    const stagePulseRef = useRef(0)
    const snakeWalkerRef = useRef(new GridWalker())
    const metronomeSynthRef = useRef<Tone.MembraneSynth | null>(null)
    const modulatorRef = useRef(new Modulator())
    const loopCountRef = useRef(0)
    const lastStagePlayedRef = useRef(true)
    const snakePathIndexRef = useRef(0)
    const turingRef = useRef<TuringMachine>(new TuringMachine())

    useEffect(() => {
        if (!isInitialized || !bassSynth || !fmBass || !leadSynth || !drumMachine || !harmSynth) return

        // Initialize reusable metronome synth
        metronomeSynthRef.current = new Tone.MembraneSynth({
            pitchDecay: 0.008,
            octaves: 2,
            envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
        }).toDestination()
        metronomeSynthRef.current.volume.value = -10

        const loop = new Tone.Loop((time) => {
            const step = stepRef.current % 16
            const totalStep = stepRef.current

            // Access current state directly from store to avoid loop restarts
            const currentDrums = useDrumStore.getState()
            const currentBass = useBassStore.getState()
            const currentSeq = useSequencerStore.getState()
            const currentHarmony = useHarmonyStore.getState()
            const currentPads = usePadStore.getState()
            const currentHarm = useHarmStore.getState()
            const lfo = useLfoStore.getState()

            const triggerLeadNotes = (midi: number, dur: string, vel: number) => {
                if (!leadSynth || isNaN(midi) || midi === undefined || midi === null) return
                try {
                    if (currentSeq.smartChordEnabled) {
                        const chord = Scaler.generateChord(midi, currentHarmony.root, currentHarmony.scale, currentSeq.smartChordType)
                        const noteNames = chord
                            .filter(m => m !== undefined && m !== null && !isNaN(m))
                            .map(m => Tone.Frequency(m, 'midi').toNote())

                        if (noteNames.length > 0) {
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
            }

            // 0. Update LFO & Modulation
            if (lfo.enabled && lfo.target !== 'none') {
                const bpm = useAudioStore.getState().bpm
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
                    const baseVol = useAudioStore.getState().volumes.drums
                    const modulated = baseVol + (modAmount * 0.3)
                    drumMachine.setVolume(Tone.gainToDb(Math.min(1, Math.max(0, modulated))))
                }
            }

            // 1. Drums (Euclidean) - Using Pre-calculated Patterns
            if (currentDrums.isPlaying && drumMachine) {
                const patterns = currentDrums.activePatterns
                if (!currentDrums.kick.muted && patterns.kick[step]) drumMachine.triggerDrum('kick', time)
                if (!currentDrums.snare.muted && patterns.snare[step]) drumMachine.triggerDrum('snare', time)
                if (!currentDrums.hihat.muted && patterns.hihat[step]) drumMachine.triggerDrum('hihat', time)
                if (!currentDrums.hihatOpen.muted && patterns.hihatOpen[step]) drumMachine.triggerDrum('hihatOpen', time)
                if (!currentDrums.clap.muted && patterns.clap[step]) drumMachine.triggerDrum('clap', time)
                if (!currentDrums.ride.muted && patterns.ride[step]) drumMachine.triggerDrum('ride', time)
            }

            // Metronome
            if (currentHarmony.isMetronomeOn && step % 4 === 0) {
                metronomeSynthRef.current?.triggerAttackRelease('C6', '32n', time)
            }

            // 2. Bass
            const bassStep = currentBass.pattern[step]
            const prevBassStep = currentBass.pattern[(step + 15) % 16]
            if (currentBass.isPlaying && bassStep && bassStep.active) {
                if (currentBass.activeInstrument === 'acid' && bassSynth) {
                    const isContinuing = prevBassStep?.active && prevBassStep?.slide
                    bassSynth.triggerNote(bassStep.note, '16n', time, bassStep.velocity, bassStep.slide, bassStep.accent, !!isContinuing)
                } else if (currentBass.activeInstrument === 'fm' && fmBass) {
                    fmBass.triggerNote(bassStep.note, '16n', time, bassStep.velocity)
                }
            }

            // 3a. ML-185
            const stage = currentSeq.stages[currentSeq.currentStageIndex]
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
                                triggerLeadNotes(stage.pitch, '16n', stage.velocity)
                            } else if (stage.gateMode === 3) {
                                triggerLeadNotes(stage.pitch, '8n', stage.velocity)
                            }
                        }
                    } else if (stage.gateMode === 2) {
                        const pulseStep = stagePulseRef.current % Math.max(1, stage.length)
                        if (pulseStep === 0 && Math.random() < stage.probability) {
                            triggerLeadNotes(stage.pitch, '32n', stage.velocity * 0.8)
                        }
                    }
                } catch (e) {
                    console.warn('ML-185 tick failed', e)
                }
                stagePulseRef.current++
                if (stagePulseRef.current >= stage.length * stage.pulseCount) {
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
                        triggerLeadNotes(cell.note, '16n', cell.velocity)
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
                        const scaleNotes = scaleScale.notes
                        if (scaleNotes && scaleNotes.length > 0) {
                            const noteCount = scaleNotes.length * 3
                            const noteIdx = Math.floor(normValue * noteCount)
                            const octave = 3 + Math.floor(noteIdx / scaleNotes.length)
                            const noteName = scaleNotes[noteIdx % scaleNotes.length]
                            const midi = Tone.Frequency(`${noteName}${octave}`).toMidi()

                            if (!isNaN(midi)) {
                                triggerLeadNotes(midi, '16n', 0.8)
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Turing Machine tick failed', e)
                }
            }

            // 3d. Harm Sequencer
            if (harmSynth) {
                const triggerHarmNotes = (midi: number, vel: number, dur = '16n') => {
                    const notesToPlay = [midi, ...(currentHarm.chordOffsets.map(o => midi + o))]
                    notesToPlay.forEach(m => {
                        harmSynth.triggerNote(Tone.Frequency(m, 'midi').toNote(), dur, time, vel)
                    })
                }

                if (currentHarm.isSequencerEnabled && currentHarm.isPlaying) {
                    const step16 = totalStep % 16
                    const cell = currentHarm.grid[step16]
                    if (cell.active && Math.random() < cell.probability) {
                        triggerHarmNotes(cell.note, cell.velocity)
                    }
                    useHarmStore.getState().setParam({ currentStep: step16 })
                }

                if (currentHarm.isDroneEnabled && currentHarm.isPlaying) {
                    if (totalStep % 32 === 0) {
                        const droneStep = Math.floor(totalStep / 32) % currentHarm.droneGrid.length
                        const cell = currentHarm.droneGrid[droneStep]
                        if (cell.active) triggerHarmNotes(cell.note, cell.velocity * 0.7, '2n')
                        useHarmStore.getState().setParam({ currentDroneStep: droneStep })
                    }
                }
            }

            // 4. Pads
            if (currentPads.active && padSynth && totalStep % 32 === 0) {
                const progression = generatePadProgression(currentHarmony.root, currentHarmony.scale, currentPads.complexity)
                const chordIdx = Math.floor((totalStep / 32) % progression.length)
                padSynth.triggerChord(progression[chordIdx], '2n', time)
            }

            // Sync UI
            Tone.Draw.schedule(() => {
                useAudioStore.getState().setCurrentStep(step)
            }, time)

            if (step === 15) loopCountRef.current++
            stepRef.current++
        }, '16n')

        loop.start(0)

        return () => {
            loop.dispose()
            metronomeSynthRef.current?.dispose()
        }
    }, [isInitialized, bassSynth, fmBass, leadSynth, drumMachine, harmSynth, padSynth])

    return null
}
