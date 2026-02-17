import { create } from 'zustand'

/**
 * DeterministicStore — Manages a single instance of the Pyodide Worker
 * and shares its state across the application.
 */

interface DeterministicState {
    isReady: boolean
    lastResult: any
    generatePattern: (scale: string, root: string) => void
}

let sharedWorker: Worker | null = null

export const useDeterministicStore = create<DeterministicState>((set) => {
    const initWorker = () => {
        if (typeof window === 'undefined' || sharedWorker) return

        sharedWorker = new Worker(
            new URL('../workers/DeterministicWorker.ts', import.meta.url),
            { type: 'module' }
        )

        sharedWorker.onmessage = (e) => {
            const { type, data } = e.data
            if (type === 'READY') {
                set({ isReady: true })
            }
            if (type === 'RESULT') {
                set({ lastResult: data })
            }
            if (type === 'ERROR') {
                console.error('Pyodide Error:', data)
            }
        }

        sharedWorker.postMessage({ type: 'INIT' })
    }

    // Initialize worker if in browser environment
    if (typeof window !== 'undefined') {
        initWorker()
    }

    return {
        isReady: false,
        lastResult: null,
        generatePattern: (scale: string, root: string) => {
            if (!sharedWorker) {
                initWorker()
            }

            sharedWorker?.postMessage({
                type: 'GENERATE',
                data: { scale, root }
            })
        }
    }
})
