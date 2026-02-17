import { useState } from 'react'
import { useDrumStore, useBassStore, usePadStore, useHarmonyStore, useSequencerStore, useHarmStore } from '../store/instrumentStore'
/// <reference types="vite/client" />
import { useAudioStore } from '../store/audioStore'
import { exportToMidi } from '../logic/MidiExporter'
import { bjorklund } from '../logic/bjorklund'
import { getApiUrl } from '../logic/apiConfig'

export function useMidiExport() {
    const [isExporting, setIsExporting] = useState(false)
    const drums = useDrumStore()
    const bass = useBassStore()
    const seq = useSequencerStore()
    const harmony = useHarmonyStore()
    const pad = usePadStore()
    const harm = useHarmStore()
    const { bpm } = useAudioStore()

    const exportMidi = async (target: 'drums' | 'bass' | 'seq185' | 'snake' | 'pads' | 'harm' | 'turing') => {
        if (!window.Telegram?.WebApp) return
        setIsExporting(true)

        try {
            // Generate patterns with safety checks
            const patterns = {
                kick: drums.kick ? bjorklund(drums.kick.steps || 16, drums.kick.pulses || 0) : [],
                snare: drums.snare ? bjorklund(drums.snare.steps || 16, drums.snare.pulses || 0) : [],
                hihat: drums.hihat ? bjorklund(drums.hihat.steps || 16, drums.hihat.pulses || 0) : [],
                hihatOpen: drums.hihatOpen ? bjorklund(drums.hihatOpen.steps || 16, drums.hihatOpen.pulses || 0) : [],
                clap: drums.clap ? bjorklund(drums.clap.steps || 16, drums.clap.pulses || 0) : []
            }

            const midiData = exportToMidi(
                bpm,
                patterns,
                bass.pattern || [],
                seq.stages || [],
                seq.snakeGrid || [],
                seq.snakePattern,
                { notes: [harmony.root + '3'], active: pad.active },
                harm.grid || [],
                target,
                { enabled: seq.smartChordEnabled, type: seq.smartChordType },
                seq.turingRegister || 0,
                seq.turingBits || 8
            )
            const base64Midi = btoa(String.fromCharCode(...midiData))

            const API_URL = getApiUrl((import.meta as any).env)

            if (!API_URL) {
                throw new Error('MIDI Export API URL is not configured. Please set VITE_API_URL.')
            }

            const response = await fetch(`${API_URL}/upload-midi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initData: window.Telegram.WebApp.initData,
                    midiBase64: base64Midi,
                    filename: `midi_${target}_${Date.now()}.mid`
                })
            })

            if (response.ok) {
                window.Telegram.WebApp.showAlert('MIDI файл отправлен в чат! 🎹')
            } else {
                throw new Error('Server error')
            }
        } catch (err) {
            console.error(err)
            window.Telegram.WebApp.showAlert('Ошибка экспорта. Убедитесь, что сервер запущен.')
        } finally {
            setIsExporting(false)
        }
    }

    return { exportMidi, isExporting }
}
