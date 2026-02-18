import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Registry to hold store references
const storeRegistry: Record<string, StoreApi<any>> = {};

export const registerStore = (name: string, store: StoreApi<any>) => {
    storeRegistry[name] = store;
    console.log(`[History] Registered store: ${name}`);
};

export interface HistoryAction {
    storeName: string;
    path: string[];
    previousValue: any;
    newValue: any;
}

export interface BatchAction {
    type: 'batch';
    actions: HistoryAction[];
}

export type HistoryItem = HistoryAction | BatchAction;

interface HistoryState {
    past: HistoryItem[];
    future: HistoryItem[];
    isTracking: boolean;
    isBatching: boolean;
    currentBatch: HistoryAction[];

    pushAction: (action: HistoryAction) => void;
    undo: () => void;
    redo: () => void;
    startTransaction: () => void;
    endTransaction: () => void;
    clear: () => void;
}

// Helper to set nested value deeply
const setNestedValue = (obj: any, path: string[], value: any) => {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) {
            current[path[i]] = {};
        }
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
};

// Helper to apply action
const applyAction = (action: HistoryAction, isUndo: boolean) => {
    const store = storeRegistry[action.storeName];
    if (!store) {
        console.warn(`[History] Store not found: ${action.storeName}`);
        return;
    }

    const valueToApply = isUndo ? action.previousValue : action.newValue;

    // We rely on simple setState merging.
    // Ideally, stores should be using Immer or we do a deep clone-merge here.
    // For the `instrumentStore` which uses simple spread, `setState` merges at top level.
    // Nested updates need care.

    store.setState((state: any) => {
        // Basic deep merge strategy for Undo/Redo
        // We clone the state to avoid mutation if strict mode is on
        // But since we are replacing a specific path, we can try to be smart.

        // Limitation: This assumes the store state is mutable-ish or we can reconstruct it.
        // A robust way without Immer in the store is hard.
        // However, if we assume the standard pattern:
        // We will use a recursive clone-and-update.

        const newState = { ...state };
        setNestedValue(newState, action.path, valueToApply);
        return newState;
    });
};

export const useHistoryStore = create<HistoryState>()(
    immer((set, get) => ({
        past: [],
        future: [],
        isTracking: true,
        isBatching: false,
        currentBatch: [],

        pushAction: (action) => {
            set((state) => {
                if (!state.isTracking) return;

                if (state.isBatching) {
                    state.currentBatch.push(action);
                    return;
                }

                state.past.push(action);
                state.future = [];

                // Limit stack size
                if (state.past.length > 50) {
                    state.past.shift();
                }
            });
        },

        startTransaction: () => {
            set((state) => {
                state.isBatching = true;
                state.currentBatch = [];
            });
        },

        endTransaction: () => {
            set((state) => {
                if (state.currentBatch.length > 0) {
                    state.past.push({
                        type: 'batch',
                        actions: state.currentBatch
                    });
                    state.future = [];
                    // Limit stack size
                    if (state.past.length > 50) {
                        state.past.shift();
                    }
                }
                state.isBatching = false;
                state.currentBatch = [];
            });
        },

        undo: () => {
            const { past } = get();
            if (past.length === 0) return;

            set((state) => {
                // We need to pop from past.
                // But we need to do the side effect (applyAction) OUTSIDE the producer if possible?
                // No, we can do it here, but we shouldn't trigger pushAction.
                // We disable tracking.
                state.isTracking = false;
            });

            // Get state again to be safe
            const currentState = get();
            const item = currentState.past[currentState.past.length - 1]; // Peek

            try {
                if ('type' in item && item.type === 'batch') {
                    // Undo batch in reverse order
                    [...item.actions].reverse().forEach(action => applyAction(action, true));
                } else {
                    applyAction(item as HistoryAction, true);
                }
            } catch (err) {
                console.error('[History] Undo failed', err);
            }

            set((state) => {
                state.isTracking = true;
                const popped = state.past.pop();
                if (popped) state.future.push(popped);
            });
        },

        redo: () => {
            const { future } = get();
            if (future.length === 0) return;

            set((state) => { state.isTracking = false; });

            const currentState = get();
            const item = currentState.future[currentState.future.length - 1];

            try {
                if ('type' in item && item.type === 'batch') {
                    item.actions.forEach(action => applyAction(action, false));
                } else {
                    applyAction(item as HistoryAction, false);
                }
            } catch (err) {
                console.error('[History] Redo failed', err);
            }

            set((state) => {
                state.isTracking = true;
                const popped = state.future.pop();
                if (popped) state.past.push(popped);
            });
        },

        clear: () => {
            set((state) => {
                state.past = [];
                state.future = [];
                state.currentBatch = [];
            });
        }
    }))
);
