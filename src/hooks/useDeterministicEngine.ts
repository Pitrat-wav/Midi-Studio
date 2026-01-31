/**
 * useDeterministicEngine — React interface for Pyodide Worker
 */

import { useEffect, useRef, useState } from 'react'

export function useDeterministicEngine() {
    const workerRef = useRef<Worker | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [lastResult, setLastResult] = useState<any>(null)

    useEffect(() => {
        // Initialize Worker
        workerRef.current = new Worker(
            new URL('../workers/DeterministicWorker.ts', import.meta.url),
            { type: 'module' }
        )

        workerRef.current.onmessage = (e) => {
            const { type, data } = e.data
            if (type === 'READY') setIsReady(true)
            if (type === 'RESULT') setLastResult(data)
            if (type === 'ERROR') console.error('Pyodide Error:', data)
        }

        workerRef.current.postMessage({ type: 'INIT' })

        return () => {
            workerRef.current?.terminate()
        }
    }, [])

    const generatePattern = (scale: string, root: string) => {
        if (!isReady) return
        workerRef.current?.postMessage({
            type: 'GENERATE',
            data: { scale, root }
        })
    }

    return { isReady, lastResult, generatePattern }
}
