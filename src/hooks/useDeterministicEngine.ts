/**
 * useDeterministicEngine — React interface for shared Pyodide Worker
 */

import { useDeterministicStore } from '../store/deterministicStore'

export function useDeterministicEngine() {
    const { isReady, lastResult, generatePattern } = useDeterministicStore()

    return { isReady, lastResult, generatePattern }
}
