import { test, describe, mock, before } from 'node:test';
import assert from 'node:assert';
import { parseCommand } from './CommandParser';
import { useAudioStore } from '../store/audioStore';
import { useBassStore, useDrumStore, useHarmonyStore, usePadStore } from '../store/instrumentStore';

describe('CommandParser', () => {
    // Mock store methods that call Tone or other browser APIs
    before(() => {
        const audioState = useAudioStore.getState();
        audioState.setBpm = (bpm: number) => {
            useAudioStore.setState({ bpm });
        };
        audioState.togglePlay = () => {
            useAudioStore.setState({ isPlaying: !useAudioStore.getState().isPlaying });
        };
    });

    test('empty input returns failure', () => {
        const result = parseCommand('');
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.message, '');
    });

    test('help command returns help message', () => {
        const result = parseCommand('help');
        assert.strictEqual(result.success, true);
        assert.ok(result.message.includes('Доступные команды'));
    });

    describe('BPM command', () => {
        test('bpm without args returns current bpm', () => {
            const currentBpm = useAudioStore.getState().bpm;
            const result = parseCommand('bpm');
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.message, `Текущий BPM: ${currentBpm}`);
        });

        test('bpm with valid arg sets bpm', () => {
            const result = parseCommand('bpm 140');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'BPM установлен на 140');
            assert.strictEqual(useAudioStore.getState().bpm, 140);
        });

        test('bpm with invalid arg returns error', () => {
            const result = parseCommand('bpm abc');
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.message, 'Ошибка: BPM должен быть числом');
        });
    });

    describe('Playback commands', () => {
        test('play command starts playback', () => {
            // Ensure it's not playing first
            useAudioStore.setState({ isPlaying: false });

            const result = parseCommand('play');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Воспроизведение запущено');
            assert.strictEqual(useAudioStore.getState().isPlaying, true);
        });

        test('stop command stops playback', () => {
            // Ensure it is playing first
            useAudioStore.setState({ isPlaying: true });

            const result = parseCommand('stop');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Воспроизведение остановлено');
            assert.strictEqual(useAudioStore.getState().isPlaying, false);
        });
    });

    describe('Instrument commands', () => {
        test('bass.cutoff sets cutoff', () => {
            const result = parseCommand('bass.cutoff 500');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Bass Cutoff: 500');
            assert.strictEqual(useBassStore.getState().cutoff, 500);
        });

        test('bass.res sets resonance', () => {
            const result = parseCommand('bass.res 0.5');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Bass Resonance: 0.5');
            assert.strictEqual(useBassStore.getState().resonance, 0.5);
        });

        test('drums.kick.pulses sets kick pulses', () => {
            const result = parseCommand('drums.kick.pulses 5');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Kick Pulses: 5');
            assert.strictEqual(useDrumStore.getState().kick.pulses, 5);
        });

        test('pads.bright sets brightness', () => {
            const result = parseCommand('pads.bright 0.8');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Pads Brightness: 0.8');
            assert.strictEqual(usePadStore.getState().brightness, 0.8);
        });

        test('harmony.root sets root', () => {
            const result = parseCommand('harmony.root f#');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Root: F#');
            assert.strictEqual(useHarmonyStore.getState().root, 'F#');
        });

        test('harmony.scale sets scale', () => {
            const result = parseCommand('harmony.scale dorian');
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.message, 'Scale: dorian');
            assert.strictEqual(useHarmonyStore.getState().scale, 'dorian');
        });
    });

    describe('Error handling', () => {
        test('unknown command returns failure', () => {
            const result = parseCommand('unknown_cmd_123');
            assert.strictEqual(result.success, false);
            assert.ok(result.message.includes('Неизвестная команда'));
        });

        test('catch block handles execution errors', () => {
            const originalGetState = useAudioStore.getState;
            // Mock getState to throw
            useAudioStore.getState = () => {
                throw new Error('Unexpected store error');
            };

            try {
                const result = parseCommand('bpm');
                assert.strictEqual(result.success, false);
                assert.ok(result.message.includes('Ошибка выполнения: Error: Unexpected store error'));
            } finally {
                // Restore original getState
                useAudioStore.getState = originalGetState;
            }
        });
    });
});
