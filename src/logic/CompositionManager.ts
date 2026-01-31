/**
 * CompositionManager — Bridges Pyodide Worker with React Stores
 */

import { useEffect } from 'react'
import { useDeterministicEngine } from '../hooks/useDeterministicEngine'
import { useBassStore, useDrumStore } from '../store/instrumentStore'

export function useCompositionManager() {
    const { isReady, lastResult, generatePattern } = useDeterministicEngine()
    const bass = useBassStore()
    const drums = useDrumStore()

    useEffect(() => {
        if (lastResult) {
            console.log('CompositionManager: Applying new pattern', lastResult)

            // Apply Bass Pattern if present
            if (lastResult.bass) {
                // Convert simple 1/0 array to BassStep[]
                const newBassPattern = lastResult.bass.map((b: number, i: number) => ({
                    active: b === 1,
                    note: 'C1', // Future: get from result
                    velocity: 0.8,
                    slide: false,
                    accent: false
                }))
                bass.setPattern(newBassPattern)
            }

            // Trigger visual feedback
            if (lastResult.meta) {
                // Update status or HUD
            }
        }
    }, [lastResult, bass, drums])

    const requestNewComp = (scale = 'minor', root = 'C') => {
        generatePattern(scale, root)
    }

    return { isReady, requestNewComp }
}
