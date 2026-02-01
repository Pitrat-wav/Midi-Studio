import * as Tone from 'tone'
import { useAudioStore } from '../store/audioStore'
import { useDrumStore, useBassStore, usePadStore, useHarmStore, useHarmonyStore, useSequencerStore } from '../store/instrumentStore'
import { useArrangementStore } from '../store/arrangementStore'
import { useVisualStore } from '../store/visualStore'
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

        // Лог раз в такт + Коммит снапшотов
        if (step === 0) {
            const bar = Math.floor(totalStep / 16)
            console.log(`🎹 Bar ${bar}, Transport: ${Tone.Transport.state}`)
            useAudioStore.getState().commitSnapshots()
        }

        // --- ARRANGEMENT PLAYBACK LOGIC ---
        const visual = useVisualStore.getState()
        const arrange = useArrangementStore.getState() // Get arrangement state

        if (visual.appView === 'ARRANGE') {
            const { clips } = arrange
            const startingClips = clips.filter(c => c.startTick === totalStep)

            if (startingClips.length > 0) {
                startingClips.forEach(clip => {
                    console.log(`⏱️ Arrangement: Triggering ${clip.trackId} snapshot ${clip.snapshotId}`)
                    useAudioStore.getState().triggerSnapshot(clip.trackId, clip.snapshotId)
                })
                // Commit arrangement clips immediately at their start step
                useAudioStore.getState().commitSnapshots()
            }
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

        // --- SOLO LOGIC ---
        const anySolo = Object.values(arrange.tracks).some(t => t.solo)
        const isTrackActive = (trackId: string) => {
            const settings = arrange.tracks[trackId] || { mute: false, solo: false, volume: 0.8 }
            if (anySolo) return settings.solo
            return !settings.mute
        }

        // 1. DRUMS
        const drumSettings = arrange.tracks?.drums || { mute: false, solo: false, volume: 0.8 }
        if (drums.isPlaying && drumMachine && isTrackActive('drums')) {
            const patterns = drums.activePatterns

            // Apply arrangement volume (linear to dB)
            if (drumMachine.output) {
                drumMachine.output.volume.value = Tone.gainToDb(drumSettings.volume)
            }

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
        const bassSettings = arrange.tracks?.bass || { mute: false, solo: false, volume: 0.8 }
        if (bass.isPlaying && isTrackActive('bass')) {
            const bassStep = bass.pattern[step]
            const prevBassStep = bass.pattern[(step + 15) % 16]

            if (bassStep && bassStep.active) {
                if (bass.activeInstrument === 'acid' && bassSynth) {
                    if (bassSynth.outputGain) {
                        bassSynth.outputGain.volume.value = Tone.gainToDb(bassSettings.volume)
                    }
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


        // 3. LEAD (Stages Sequencer)
        const leadSettings = arrange.tracks?.lead || { mute: false, solo: false, volume: 0.8 }
        if (leadSynth && isTrackActive('lead')) {
            // Apply volume
            if (leadSynth.outputGain) {
                leadSynth.outputGain.volume.value = Tone.gainToDb(leadSettings.volume)
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
        const padSettings = arrange.tracks?.pads || { mute: false, solo: false, volume: 0.8 }
        if (pads.active && padSynth && totalStep % 32 === 0 && isTrackActive('pads')) {
            try {
                if (padSynth.synth) {
                    padSynth.synth.volume.value = Tone.gainToDb(padSettings.volume)
                }
                const progression = generatePadProgression(
                    harmony.root,
                    harmony.scale,
                    pads.complexity
                )
                if (progression && progression.length > 0) {
                    const chordIdx = Math.floor((totalStep / 32) % progression.length)
                    padSynth.triggerChord(progression[chordIdx], '2n', time)
                    console.log('  🎹 PADS triggered')
                }
            } catch (e) {
                console.error('Pads trigger failed:', e)
            }
        }


        // 5. HARM SYNTH
        const harmSettings = arrange.tracks?.harm || { mute: false, solo: false, volume: 0.8 }
        if (harm.isPlaying && harmSynth && totalStep % 32 === 0 && isTrackActive('harm')) {
            try {
                if (harmSynth.outputGain) {
                    harmSynth.outputGain.volume.value = Tone.gainToDb(harmSettings.volume)
                }
                const rootNote = harmony.root + '2'
                const rootMidi = Tone.Frequency(rootNote).toMidi()
                harmSynth.triggerNote(rootNote, '2n', time, 0.7)
                console.log('  🔮 HARM triggered')
            } catch (e) {
                console.error('Harm trigger failed:', e)
            }
        }

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
