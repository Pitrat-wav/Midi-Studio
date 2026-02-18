import { NodeData, useNodeStore } from '../store/nodeStore'

export interface DevicePreset {
    id: string
    name: string
    category: 'synth' | 'fx' | 'note'
    data: string // JSON string of the device
}

export const PRESETS: DevicePreset[] = [
    {
        id: 'poly-saw-1',
        name: 'Basic Saw Poly',
        category: 'synth',
        data: JSON.stringify({
            context: 'poly',
            nodes: [
                { id: '1', type: 'audio_osc', position: { x: 100, y: 100 }, data: { params: { type: 'sawtooth' } } },
                { id: '2', type: 'audio_env', position: { x: 300, y: 100 }, data: { params: { attack: 0.1 } } },
                { id: '3', type: 'audio_out', position: { x: 500, y: 100 }, data: {} }
            ],
            edges: [
                { id: 'e1', source: '1', sourceHandle: 'out', target: '2', targetHandle: 'gate' },
                { id: 'e2', source: '2', sourceHandle: 'out', target: '3', targetHandle: 'l' }
            ]
        })
    },
    {
        id: 'fx-delay',
        name: 'Simple Delay',
        category: 'fx',
        data: JSON.stringify({
            context: 'fx',
            nodes: [
                { id: '1', type: 'io_audio_in', position: { x: 50, y: 100 }, data: { params: {} } },
                { id: '2', type: 'audio_delay', position: { x: 250, y: 100 }, data: { params: { delayTime: 0.3, feedback: 0.4 } } },
                { id: '3', type: 'io_audio_out', position: { x: 500, y: 100 }, data: { params: {} } }
            ],
            edges: [
                { id: 'e1', source: '1', sourceHandle: 'l', target: '2', targetHandle: 'in' },
                { id: 'e2', source: '2', sourceHandle: 'out', target: '3', targetHandle: 'l' },
                { id: 'e3', source: '2', sourceHandle: 'out', target: '3', targetHandle: 'r' }
            ]
        })
    }
]

export class DeviceManager {
    static loadPreset(id: string) {
        const preset = PRESETS.find(p => p.id === id)
        if (preset) {
            useNodeStore.getState().loadDevice(preset.data)
            console.log(`Loaded preset: ${preset.name}`)
        }
    }

    static saveToLocal(name: string) {
        const json = useNodeStore.getState().saveDevice()
        localStorage.setItem(`device_${name}`, json)
        console.log(`Saved device: ${name}`)
    }
}
