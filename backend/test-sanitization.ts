import path from 'path';

// Duplicate the function for testing since it's not exported
function sanitizeFilename(filename: any): string {
    if (!filename || typeof filename !== 'string') {
        return 'generative_loop.mid'
    }

    const base = path.basename(filename)
    let sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_')

    if (!sanitized || sanitized.startsWith('.')) {
        sanitized = 'loop_' + sanitized.replace(/^\.+/, '')
    }

    if (sanitized === 'loop_' || !sanitized) {
        sanitized = 'loop_unnamed'
    }

    if (!sanitized.toLowerCase().endsWith('.mid')) {
        sanitized += '.mid'
    }

    if (sanitized.length > 64) {
        sanitized = sanitized.slice(-64)
    }

    return sanitized
}

const testCases = [
    { input: 'standard.mid', expected: 'standard.mid' },
    { input: 'no-extension', expected: 'no-extension.mid' },
    { input: '../../../etc/passwd', expected: 'passwd.mid' },
    { input: '..', expected: 'loop_unnamed.mid' },
    { input: '  space test  .mid', expected: '__space_test__.mid' },
    { input: 'weird!@#$%^&*().mid', expected: 'weird__________.mid' },
    { input: 'hidden.file', expected: 'hidden.file.mid' },
    { input: '.hidden', expected: 'loop_hidden.mid' },
    { input: 'a'.repeat(100) + '.mid', expected: 'a'.repeat(60) + '.mid' },
    { input: null, expected: 'generative_loop.mid' },
    { input: undefined, expected: 'generative_loop.mid' },
    { input: 123, expected: 'generative_loop.mid' },
    { input: 'C:\\Windows\\System32\\calc.exe', expected: 'C__Windows_System32_calc.exe.mid' },
];

let failed = 0;
testCases.forEach(({ input, expected }, index) => {
    const result = sanitizeFilename(input);
    if (result !== expected) {
        console.error(`Test case ${index} failed: input=${JSON.stringify(input)}, expected=${expected}, got=${result}`);
        failed++;
    } else {
        console.log(`Test case ${index} passed: input=${JSON.stringify(input)} -> ${result}`);
    }
});

if (failed === 0) {
    console.log('All sanitization tests passed!');
    process.exit(0);
} else {
    console.error(`${failed} tests failed.`);
    process.exit(1);
}
