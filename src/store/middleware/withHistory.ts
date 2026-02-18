import { StateCreator, StoreMutatorIdentifier, StoreApi } from 'zustand';
import { useHistoryStore, registerStore, HistoryAction } from '../historyStore';

export interface WithHistoryOptions {
    storeName: string;
    ignorePaths?: string[]; // e.g., ['visual.energy', 'analyzer']
}

// Helper to deep clone or just return value
const clone = (obj: any) => {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch {
        return obj;
    }
}


const getDiff = (
    obj1: any,
    obj2: any,
    basePath: string[] = [],
    ignorePaths: string[] = []
): HistoryAction[] => {
    const changes: HistoryAction[] = [];

    const isIgnored = (path: string[]) => {
        const pathStr = path.join('.');
        return ignorePaths.some(ignore => pathStr === ignore || pathStr.startsWith(ignore + '.'));
    };

    const keys1 = Object.keys(obj1 || {});
    const keys2 = Object.keys(obj2 || {});
    const allKeys = Array.from(new Set([...keys1, ...keys2]));

    for (const key of allKeys) {
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        const currentPath = [...basePath, key];

        if (isIgnored(currentPath)) continue;

        // Strict equality check first
        if (val1 === val2) continue;

        const isVal1Obj = typeof val1 === 'object' && val1 !== null;
        const isVal2Obj = typeof val2 === 'object' && val2 !== null;

        // If both are objects (and not arrays), recurse
        if (isVal1Obj && isVal2Obj && !Array.isArray(val1) && !Array.isArray(val2)) {
            changes.push(...getDiff(val1, val2, currentPath, ignorePaths));
        } else {
            // One is primitive, or one is null, or it's an array change
            // JSON.stringify comparison is a quick dirty way to check content equality for complex types
            if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                changes.push({
                    storeName: '', // Filled later
                    path: currentPath,
                    previousValue: clone(val1), // important to capture value at that moment
                    newValue: clone(val2)
                });
            }
        }
    }
    return changes;
};

// Types for the middleware
type WithHistory = <T>(
    initializer: StateCreator<T, [], []>,
    options: WithHistoryOptions
) => StateCreator<T, [], []>;

export const withHistory: WithHistory = (initializer, options) => (set, get, api) => {
    const { storeName, ignorePaths = [] } = options;
    const historyStore = useHistoryStore.getState();

    // Register store for Undo/Redo access
    registerStore(storeName, api as StoreApi<any>);

    // Intercepting set
    const newSet: typeof set = (...args) => {
        const oldState = get();

        set(...args);

        const newState = get();

        if (oldState === newState) return;

        const changes = getDiff(oldState, newState, [], ignorePaths);

        if (changes.length > 0) {
            if (changes.length === 1) {
                historyStore.pushAction({ ...changes[0], storeName });
            } else {
                historyStore.startTransaction();
                changes.forEach(change => {
                    historyStore.pushAction({ ...change, storeName });
                });
                historyStore.endTransaction();
            }
        }
    };

    return initializer(newSet, get, api);
};
