import { test } from 'node:test';
import assert from 'node:assert';
import { getApiUrl } from './apiConfig.ts';

test('getApiUrl returns VITE_API_URL if present', () => {
    const env = { VITE_API_URL: 'https://api.example.com' };
    assert.strictEqual(getApiUrl(env), 'https://api.example.com');
});

test('getApiUrl returns localhost in dev if VITE_API_URL is missing', () => {
    const env = { DEV: true };
    assert.strictEqual(getApiUrl(env), 'http://localhost:3001');
});

test('getApiUrl returns empty string in prod if VITE_API_URL is missing', () => {
    const env = { DEV: false };
    assert.strictEqual(getApiUrl(env), '');
});

test('getApiUrl prioritizes VITE_API_URL over dev fallback', () => {
    const env = { VITE_API_URL: 'https://api.example.com', DEV: true };
    assert.strictEqual(getApiUrl(env), 'https://api.example.com');
});
