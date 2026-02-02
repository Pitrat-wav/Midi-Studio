# historyStore.ts Documentation

## 1. Overview
The `historyStore` is the central state management for the application's Undo/Redo system. It implements the **Memento** pattern combined with **Command** pattern principles, allowing the application to restore previous states across multiple independent Zustand stores.

Key features:
- **Centralized History**: Manages a single timeline of actions for all registered stores.
- **Deep Diffing**: Uses a middleware to calculate deep differences between state updates.
- **Transactions**: Supports grouping multiple state changes into a single atomic undo/redo action (batching).
- **Memory Optimization**: Limits history stack size (default: 50) and supports ignoring high-frequency paths.

## 2. Architecture

### Key Interfaces

#### `HistoryAction`
Represents a single atomic change in a specific store.
```typescript
interface HistoryAction {
    storeName: string;      // The unique identifier of the store
    path: string[];         // Path to the changed property (e.g., ['kick', 'volume'])
    previousValue: any;     // Value before the change
    newValue: any;          // Value after the change
}
```

#### `HistoryState`
The Zustand store interface.
```typescript
interface HistoryState {
    past: HistoryItem[];       // Stack of past actions (Undo stack)
    future: HistoryItem[];     // Stack of future actions (Redo stack)
    isTracking: boolean;       // Global switch to pause tracking (used during undo/redo)
    isBatching: boolean;       // Flag for transaction mode
    currentBatch: HistoryAction[]; // Temporary storage for active transaction
    // ... methods
}
```

## 3. Middleware: `withHistory`

The system relies on a custom middleware `withHistory` that wraps individual Zustand stores.

### Usage
```typescript
import { create } from 'zustand';
import { withHistory } from './middleware/withHistory';

const useMyStore = create(
    withHistory(
        (set) => ({ count: 0, ... }), 
        { 
            storeName: 'myStore', 
            ignorePaths: ['tempValue', 'visual.fps'] 
        }
    )
);
```

### Configuration Options
- **`storeName`** (Required): Unique string ID for the store. Used to route undo/redo actions back to the correct store.
- **`ignorePaths`** (Optional): Array of path strings (e.g., `'param'`, `'nested.param'`) to exclude from tracking. Critical for performance with high-frequency data like audio analyzers or visualizer frames.

## 4. API Reference

### `undo()`
Reverts the last action (or batch of actions) from the `past` stack.
- Moves the action to the `future` stack.
- Temporarily disables tracking to prevent the undo operation itself from being recorded.

### `redo()`
Reapplies the last undone action from the `future` stack.
- Moves the action back to the `past` stack.

### `startTransaction()` / `endTransaction()`
Used to group multiple state updates into a single "Undo" step.
**Example:** Loading a preset that updates 10 different parameters.

```typescript
const history = useHistoryStore.getState();
history.startTransaction();

// ... perform multiple updates ...
store.setFrequency(440);
store.setWaveform('sine');

history.endTransaction(); // These two updates are now one "Undo" step.
```

## 5. Implementation Details

### Store Registration
Stores are loosely coupled. The middleware automatically registers the store's `setState` API with the history system using `registerStore`. This allows `historyStore` to apply updates to any store without direct imports, preventing circular dependencies.

### Deep Diff Strategy
The middleware compares `oldState` and `newState` after every `set` call.
- It recursively traverses objects.
- It stops traversal if a path is in `ignorePaths`.
- It records a `HistoryAction` only if values are strictly different.
- Cloning is done via `JSON.parse(JSON.stringify(x))` to ensure immutable snapshots (note: this means functions and Symbols are not tracked, which is intentional for state persistence).

## 6. Best Practices

1.  **Ignore High-Frequency Data**: Always add analyzers, playback cursors, and animation frames to `ignorePaths`.
2.  **Use Transactions for Presets**: When applying a full preset, wrap it in a transaction to ensure the user can undo the whole preset load in one click.
3.  **Atomic Updates**: Prefer updating specific fields over replacing entire objects if possible, to keep diffs small and precise.
