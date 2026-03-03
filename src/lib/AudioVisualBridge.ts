/**
 * AudioVisualBridge — Центральная система синхронизации аудио-событий с WebGL
 * 
 * Этот модуль является мостом между Tone.js аудио-системой и Three.js визуализацией.
 * Он обеспечивает frame-perfect синхронизацию MIDI-событий, FFT анализа и визуальных триггеров.
 * 
 * Архитектура:
 * - Event Bus для MIDI событий (Note On/Off, CC, Aftertouch)
 * - FFT Analyser для реакции на частотный спектр
 * - Tone.Draw интеграция для синхронизации с аудио-таймингом
 * - Centralized uniform management для всех WebGL компонентов
 */

import * as Tone from 'tone'
import { useVisualStore } from '../store/visualStore'

export interface MIDIEventData {
    type: 'noteOn' | 'noteOff' | 'cc' | 'aftertouch'
    note?: number
    velocity?: number
    ccNumber?: number
    ccValue?: number
    instrument: 'drums' | 'bass' | 'lead' | 'harm' | 'pads'
}

export interface AudioData {
    fftData: Float32Array
    waveformData: Float32Array
    rms: number // Root Mean Square (общая громкость)
    lowFreq: number // 0-200Hz average
    midFreq: number // 200-2000Hz average
    highFreq: number // 2000Hz+ average
}

export interface UniformData {
    uTime: number
    uAudioIntensity: number
    uLowFreq: number
    uMidFreq: number
    uHighFreq: number
    uBPM: number
    uBeat: number // Current beat (0-3 within a bar)
}

type VisualCallback = (data: AudioData) => void
type MIDICallback = (event: MIDIEventData) => void

class AudioVisualBridgeClass {
    private analyser: Tone.Analyser | null = null
    private waveformAnalyser: Tone.Analyser | null = null
    private micAnalyser: Tone.Analyser | null = null
    private mic: Tone.UserMedia | null = null
    private visualCallbacks: Map<string, VisualCallback> = new Map()
    private midiCallbacks: Map<string, MIDICallback> = new Map()
    private pulses: Record<string, number> = {
        kick: 0, snare: 0, hihat: 0, clap: 0, note: 0, bass: 0, lead: 0, pads: 0, harm: 0
    }
    private uniforms: UniformData
    private isInitialized = false
    private animationFrameId: number | null = null

    constructor() {
        this.uniforms = {
            uTime: 0,
            uAudioIntensity: 0,
            uLowFreq: 0,
            uMidFreq: 0,
            uHighFreq: 0,
            uBPM: 120,
            uBeat: 0
        }
    }

    /**
     * Trigger a visual pulse (non-reactive)
     */
    triggerPulse(id: string, intensity: number = 1.0) {
        if (this.pulses[id] !== undefined) {
            this.pulses[id] = intensity
        }
    }

    /**
     * Get current pulse value (0-1)
     */
    getPulse(id: string): number {
        return this.pulses[id] || 0
    }

    /**
     * Инициализация анализаторов
     * Должна быть вызвана после Tone.start() и создания аудио-контекста
     */
    async init() {
        if (this.isInitialized) {
            console.warn('AudioVisualBridge already initialized')
            return
        }

        try {
            // FFT analyser для частотного анализа (512 bins)
            this.analyser = new Tone.Analyser('fft', 512)

            // Waveform analyser для визуализации волны (256 samples)
            this.waveformAnalyser = new Tone.Analyser('waveform', 256)

            // Анализатор для микрофона
            this.micAnalyser = new Tone.Analyser('fft', 512)
            this.mic = new Tone.UserMedia()

            // Подключаем к главному выходу
            Tone.getDestination().connect(this.analyser)
            Tone.getDestination().connect(this.waveformAnalyser)
            this.mic.connect(this.micAnalyser)

            this.isInitialized = true
            this.startUpdateLoop()

            console.log('✅ AudioVisualBridge initialized')
        } catch (error) {
            console.error('Failed to initialize AudioVisualBridge:', error)
            throw error
        }
    }

    async toggleMic(enabled: boolean) {
        if (!this.mic) return
        if (enabled) {
            try {
                await this.mic.open()
                console.log('🎤 Microphone opened')
            } catch (e) {
                console.error('🎤 Mic access denied', e)
                useVisualStore.getState().toggleMic() // Reset store state if failed
            }
        } else {
            await this.mic.close()
            console.log('🎤 Microphone closed')
        }
    }

    /**
     * Основной цикл обновления (RAF)
     * Обновляет FFT данные и отправляет их всем подписчикам
     */
    private startUpdateLoop() {
        const update = () => {
            if (!this.analyser || !this.waveformAnalyser || !this.micAnalyser) return

            const micEnabled = useVisualStore.getState().micEnabled

            // Получаем FFT данные (либо с выхода, либо с микрофона)
            const fftData = micEnabled
                ? (this.micAnalyser.getValue() as Float32Array)
                : (this.analyser.getValue() as Float32Array)

            const waveformData = this.waveformAnalyser.getValue() as Float32Array

            if (!fftData || !waveformData) return

            // Вычисляем RMS (Root Mean Square) для общей громкости
            let sumSquares = 0
            for (let i = 0; i < waveformData.length; i++) {
                sumSquares += waveformData[i] * waveformData[i]
            }
            const rms = Math.sqrt(sumSquares / (waveformData.length || 1))

            // Разделяем частоты на диапазоны (приблизительно)
            // FFT bins распределены логарифмически от 0 до Nyquist (обычно 22050Hz)
            const totalBins = fftData.length
            const lowBins = Math.floor(totalBins * 0.1) // ~0-2kHz
            const midBins = Math.floor(totalBins * 0.4) // ~2-8kHz

            let lowSum = 0, midSum = 0, highSum = 0

            for (let i = 0; i < totalBins; i++) {
                // Tone.Analyser FFT returns values in decibels (usually -100 to 0)
                // Broader range: -110dB (silence) -> 0.0, -20dB (loud peak) -> 1.0
                const db = fftData[i]
                const val = Math.max(0, (db + 110) / 90) * 2.0 // 2x Gain boost

                if (i < lowBins) lowSum += val
                else if (i < midBins) midSum += val
                else highSum += val
            }

            const lowFreq = (lowSum / (lowBins || 1)) || 0
            const midFreq = (midSum / (midBins - lowBins || 1)) || 0
            const highFreq = (highSum / (totalBins - midBins || 1)) || 0

            // Обновляем uniforms
            this.uniforms.uTime = Tone.now()
            this.uniforms.uAudioIntensity = rms
            this.uniforms.uLowFreq = lowFreq
            this.uniforms.uMidFreq = midFreq
            this.uniforms.uHighFreq = highFreq

            // Decay pulses (60fps smooth)
            for (const id in this.pulses) {
                this.pulses[id] = Math.max(0, this.pulses[id] - 0.05)
            }

            // Отправляем данные всем подписчикам
            const audioData: AudioData = {
                fftData,
                waveformData,
                rms,
                lowFreq,
                midFreq,
                highFreq
            }

            this.visualCallbacks.forEach(callback => callback(audioData))

            this.animationFrameId = requestAnimationFrame(update)
        }

        update()
    }

    /**
     * Get the latest FFT data (frequency spectrum)
     */
    getFFTData(): Float32Array | null {
        if (!this.analyser) return null
        return this.analyser.getValue() as Float32Array
    }

    /**
     * Get the latest waveform data (time domain)
     */
    getWaveformData(): Float32Array | null {
        if (!this.waveformAnalyser) return null
        return this.waveformAnalyser.getValue() as Float32Array
    }

    /**
     * Регистрация визуального объекта для получения аудио-данных
     */
    register(id: string, callback: VisualCallback) {
        this.visualCallbacks.set(id, callback)
        console.log(`📊 Registered visual component: ${id}`)
    }

    /**
     * Отмена регистрации
     */
    unregister(id: string) {
        this.visualCallbacks.delete(id)
        console.log(`📊 Unregistered visual component: ${id}`)
    }

    /**
     * Регистрация MIDI callback
     */
    onMIDI(id: string, callback: MIDICallback) {
        this.midiCallbacks.set(id, callback)
    }

    /**
     * Отправка MIDI-события через Event Bus
     * Использует Tone.Draw для синхронизации с аудио-временем
     */
    triggerMIDI(event: MIDIEventData, time?: number) {
        const actualTime = time ?? Tone.now()

        // Планируем визуальный отклик через Tone.Draw
        Tone.Draw.schedule(() => {
            // Отправляем во все MIDI callbacks
            this.midiCallbacks.forEach(callback => callback(event))

            if (event.type === 'noteOn') {
                // Determine instrument type and trigger pulse
                switch (event.instrument) {
                    case 'drums':
                        if (event.note && event.note < 40) {
                            this.triggerPulse('kick', event.velocity ?? 1)
                        } else if (event.note && event.note < 60) {
                            this.triggerPulse('snare', event.velocity ?? 1)
                        } else {
                            this.triggerPulse('hihat', event.velocity ?? 1)
                        }
                        break
                    case 'bass':
                    case 'lead':
                    case 'harm':
                        this.triggerPulse('note', event.velocity ?? 1)
                        break
                }
            }
        }, actualTime)
    }

    /**
     * Получение текущих uniforms для использования в шейдерах
     */
    getUniforms(): UniformData {
        return { ...this.uniforms }
    }

    /**
     * Обновление BPM (вызывается из audioStore)
     */
    setBPM(bpm: number) {
        this.uniforms.uBPM = bpm
    }

    /**
     * Обновление текущего бита в такте (0-3)
     * Вызывается из SequencerLoop
     */
    setBeat(beat: number) {
        this.uniforms.uBeat = beat % 4
    }

    /**
     * Очистка ресурсов
     */
    dispose() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId)
        }

        this.analyser?.dispose()
        this.waveformAnalyser?.dispose()
        this.visualCallbacks.clear()
        this.midiCallbacks.clear()
        this.isInitialized = false

        console.log('🧹 AudioVisualBridge disposed')
    }
}

// Singleton instance
export const AudioVisualBridge = new AudioVisualBridgeClass()

// Hook для использования в React компонентах
export function useAudioVisualBridge() {
    return AudioVisualBridge
}
