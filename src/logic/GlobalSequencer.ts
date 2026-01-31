import * as Tone from 'tone'
import { useAudioStore } from '../store/audioStore'
import { useDrumStore, useBassStore, usePadStore, useHarmStore, useHarmonyStore, useSequencerStore } from '../store/instrumentStore'
import { generatePadProgression } from './PadGenerator'

// VERSION: v2.0 - без Scaler, прямой вызов MIDI нот

let loopInstance: Tone.Loop | null = null
let stepCounter = 0
let stagePulse = 0

export function startSequencerLoop() {
    if (loopInstance) {
        console.warn('⚠️ Loop already running!')
        return
    }

    console.log('🚀 STARTING GLOBAL SEQUENCER LOOP v2.0 (NO SCALER)')

    loopInstance = new Tone.Loop((time) => {
        const step = stepCounter % 16
        const totalStep = stepCounter

        // Лог раз в такт
        if (step === 0) {
            const bar = Math.floor(totalStep / 16)
            console.log(`🎹 Bar ${bar}, Transport: ${Tone.Transport.state}`)
        }

        // Получаем синтезаторы
        const { drumMachine, bassSynth, fmBass, leadSynth, padSynth, harmSynth } = useAudioStore.getState()

        // Получаем состояния
        const drums = useDrumStore.getState()
        const bass = useBassStore.getState()
        const pads = usePadStore.getState()
        const harm = useHarmStore.getState()
        const harmony = useHarmonyStore.getState()
        const seq = useSequencerStore.getState()

        // 1. DRUMS
        if (drums.isPlaying && drumMachine) {
            const patterns = drums.activePatterns

            if (patterns.kick[step] && !drums.kick.muted) {
                drumMachine.triggerDrum('kick', time)
            }
            if (patterns.snare[step] && !drums.snare.muted) {
                drumMachine.triggerDrum('snare', time)
            }
            if (patterns.hihat[step] && !drums.hihat.muted) {
                drumMachine.triggerDrum('hihat', time)
            }
            if (patterns.hihatOpen[step] && !drums.hihatOpen.muted) {
                drumMachine.triggerDrum('hihatOpen', time)
            }
            if (patterns.clap[step] && !drums.clap.muted) {
                drumMachine.triggerDrum('clap', time)
            }
            if (patterns.ride[step] && !drums.ride.muted) {
                drumMachine.triggerDrum('ride', time)
            }
        }

        // 2. BASS
        if (bass.isPlaying) {
            const bassStep = bass.pattern[step]
            const prevBassStep = bass.pattern[(step + 15) % 16]

            if (bassStep && bassStep.active) {
                if (bass.activeInstrument === 'acid' && bassSynth) {
                    const isContinuing = prevBassStep?.active && prevBassStep?.slide
                    bassSynth.triggerNote(
                        bassStep.note,
                        '16n',
                        time,
                        bassStep.velocity,
                        bassStep.slide,
                        bassStep.accent,
                        !!isContinuing
                    )
                } else if (bass.activeInstrument === 'fm' && fmBass) {
                    fmBass.triggerNote(bassStep.note, '16n', time, bassStep.velocity)
                }
            }
        }


        // 3. LEAD (Stages Sequencer) - УПРОЩЕННАЯ ВЕРСИЯ С ОТЛАДКОЙ
        if (leadSynth) {
            // Логирование состояния каждый такт
            if (step === 0) {
                console.log(`  🎸 LEAD: isStagesPlaying=${seq.isStagesPlaying}, isSnakePlaying=${seq.isSnakePlaying}, isTuringPlaying=${seq.isTuringPlaying}`)
            }

            if (seq.isStagesPlaying) {
                try {
                    const stageIndex = seq.currentStageIndex || 0
                    const stage = seq.stages[stageIndex]

                    if (!stage) {
                        if (step === 0) console.log(`    ⚠️ No stage at index ${stageIndex}`)
                    } else {
                        // Логируем stage info
                        if (step === 0) {
                            console.log(`    Stage ${stageIndex}: pitch=${stage.pitch}, velocity=${stage.velocity}, pulseCount=${stage.pulseCount}, pulse=${stagePulse}`)
                        }

                        // Триггер на начале каждого pulse
                        if (stagePulse === 0) {
                            const midiNote = stage.pitch || 60
                            const noteName = Tone.Frequency(midiNote, 'midi').toNote()

                            leadSynth.triggerNote(noteName, '16n', time, stage.velocity || 0.8)
                            console.log(`    ✅ LEAD note: ${noteName} (${midiNote})`)
                        }

                        // Продвигаем pulse
                        stagePulse = (stagePulse + 1) % (stage.pulseCount || 4)
                    }
                } catch (e) {
                    console.error('  ❌ Lead error:', e)
                }
            }
        }

        // 4. PADS (каждые 32 шага = 2 такта)
        if (pads.active && padSynth && totalStep % 32 === 0) {
            try {
                const progression = generatePadProgression(
                    harmony.root,
                    harmony.scale,
                    pads.complexity
                )
                const chordIdx = Math.floor((totalStep / 32) % progression.length)
                padSynth.triggerChord(progression[chordIdx], '2n', time)
                console.log('  🎹 PADS triggered')
            } catch (e) {
                console.error('Pads trigger failed:', e)
            }
        }


        // 5. HARM SYNTH (ВРЕМЕННО ОТКЛЮЧЕН - нужно исправить HarmState interface)
        // if (harm.active && harmSynth && totalStep % harm.loopLength === 0) {
        //     try {
        //         const rootNote = harmony.root + '2'
        //         const rootMidi = Tone.Frequency(rootNote).toMidi()
        //         harmSynth.triggerNote(rootMidi, '2n', time, 0.7)
        //         console.log('  🔮 HARM triggered')
        //     } catch (e) {
        //         console.error('Harm trigger failed:', e)
        //     }
        // }

        // Sync UI step counter
        Tone.Draw.schedule(() => {
            useAudioStore.getState().setCurrentStep(step)
        }, time)

        stepCounter++
    }, '16n')

    loopInstance.start(0)
    console.log('✅ LOOP STARTED')
    console.log('   Transport state:', Tone.Transport.state)
    console.log('   Transport BPM:', Tone.Transport.bpm.value)
}

export function stopSequencerLoop() {
    console.log('🛑 STOPPING SEQUENCER LOOP')
    if (loopInstance) {
        loopInstance.dispose()
        loopInstance = null
    }
    stepCounter = 0
    stagePulse = 0
}
