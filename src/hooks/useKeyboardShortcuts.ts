import { useEffect } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useVisualStore } from '../store/visualStore';

export const useKeyboardShortcuts = () => {
    const undo = useHistoryStore((state) => state.undo);
    const redo = useHistoryStore((state) => state.redo);
    const past = useHistoryStore((state) => state.past);
    const future = useHistoryStore((state) => state.future);
    const setStatus = useVisualStore((state) => state.setStatus);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Undo: Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (past.length > 0) {
                    undo();
                    setStatus('Undo performed');
                } else {
                    setStatus('Nothing to undo');
                }
            }

            // Redo: Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y
            if (
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
                ((e.ctrlKey || e.metaKey) && e.key === 'y')
            ) {
                e.preventDefault();
                if (future.length > 0) {
                    redo();
                    setStatus('Redo performed');
                } else {
                    setStatus('Nothing to redo');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, past.length, future.length, setStatus]);
};
