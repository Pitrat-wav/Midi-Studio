import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
    console.log('Starting server...');
    const server = spawn('npx', ['tsx', '--env-file=.env', 'server.ts'], {
        cwd: __dirname,
        env: { ...process.env, PORT: '3002' }
    });

    server.stdout.on('data', (data) => console.log(`Server: ${data}`));
    server.stderr.on('data', (data) => console.error(`Server Error: ${data}`));

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        console.log('Testing missing initData...');
        const res1 = await fetch('http://localhost:3002/upload-midi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ midiBase64: 'abc', filename: 'test.mid' })
        });
        console.log(`Status (missing initData): ${res1.status}`);
        if (res1.status !== 403) {
            console.error('Security bypass! Expected 403 for missing initData');
            process.exit(1);
        }

        console.log('Testing invalid initData...');
        const res2 = await fetch('http://localhost:3002/upload-midi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: 'hash=invalid', midiBase64: 'abc', filename: 'test.mid' })
        });
        console.log(`Status (invalid initData): ${res2.status}`);
        if (res2.status !== 403) {
            console.error('Security bypass! Expected 403 for invalid initData');
            process.exit(1);
        }

        console.log('All security tests passed!');
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    } finally {
        server.kill();
        // Give it a moment to shut down
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.exit(0);
    }
}

test();
