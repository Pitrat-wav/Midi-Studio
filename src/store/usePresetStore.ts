import { create } from 'zustand'
import { GlobalSnapshot, PresetManager } from '../logic/PresetManager'
import { useVisualStore } from './visualStore'

interface Preset {
    id: string
    name: string
    data: GlobalSnapshot
}

interface PresetStore {
    presets: Preset[]
    currentPresetId: string | null
    saveCurrentAs: (name: string) => void
    loadPreset: (id: string) => void
    deletePreset: (id: string) => void
}

export const usePresetStore = create<PresetStore>((set, get) => ({
    presets: [],
    currentPresetId: null,

    saveCurrentAs: (name: string) => {
        const snapshot = PresetManager.capture()
        const newPreset: Preset = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            data: snapshot
        }
        set((state) => ({
            presets: [...state.presets, newPreset],
            currentPresetId: newPreset.id
        }))
        useVisualStore.getState().setStatus(`PRESET SAVED: ${name.toUpperCase()}`)
    },

    loadPreset: (id: string) => {
        const preset = get().presets.find(p => p.id === id)
        if (preset) {
            PresetManager.apply(preset.data)
            set({ currentPresetId: id })
            useVisualStore.getState().setStatus(`PRESET LOADED: ${preset.name.toUpperCase()}`)
        }
    },

    deletePreset: (id: string) => {
        set((state) => ({
            presets: state.presets.filter(p => p.id !== id),
            currentPresetId: state.currentPresetId === id ? null : state.currentPresetId
        }))
    }
}))
