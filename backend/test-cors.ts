import assert from 'node:assert';
import { test } from 'node:test';

// Mocking the logic in server.ts
function getCorsOptions(allowedOriginsEnv: string | undefined) {
    const allowedOrigins = allowedOriginsEnv
        ? allowedOriginsEnv.split(',').map(o => o.trim())
        : ['http://localhost:3000'];

    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    };
}

test('CORS Policy Logic', async (t) => {
    await t.test('allows default origin when env is not set', () => {
        const corsOriginFn = getCorsOptions(undefined);
        let called = false;
        corsOriginFn('http://localhost:3000', (err, allow) => {
            assert.strictEqual(err, null);
            assert.strictEqual(allow, true);
            called = true;
        });
        assert.ok(called);
    });

    await t.test('disallows other origins when env is not set', () => {
        const corsOriginFn = getCorsOptions(undefined);
        let called = false;
        corsOriginFn('http://malicious.com', (err, allow) => {
            assert.ok(err instanceof Error);
            assert.strictEqual(err.message, 'Not allowed by CORS');
            called = true;
        });
        assert.ok(called);
    });

    await t.test('allows requests with no origin (e.g., curl)', () => {
        const corsOriginFn = getCorsOptions(undefined);
        let called = false;
        corsOriginFn(undefined, (err, allow) => {
            assert.strictEqual(err, null);
            assert.strictEqual(allow, true);
            called = true;
        });
        assert.ok(called);
    });

    await t.test('allows origins from ALLOWED_ORIGINS env', () => {
        const corsOriginFn = getCorsOptions('https://myapp.com, https://another.com');
        let called1 = false;
        corsOriginFn('https://myapp.com', (err, allow) => {
            assert.strictEqual(err, null);
            assert.strictEqual(allow, true);
            called1 = true;
        });
        assert.ok(called1);

        let called2 = false;
        corsOriginFn('https://another.com', (err, allow) => {
            assert.strictEqual(err, null);
            assert.strictEqual(allow, true);
            called2 = true;
        });
        assert.ok(called2);
    });

    await t.test('disallows default origin when ALLOWED_ORIGINS env is set to something else', () => {
        const corsOriginFn = getCorsOptions('https://myapp.com');
        let called = false;
        corsOriginFn('http://localhost:3000', (err, allow) => {
            assert.ok(err instanceof Error);
            assert.strictEqual(err.message, 'Not allowed by CORS');
            called = true;
        });
        assert.ok(called);
    });
});
