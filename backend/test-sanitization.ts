import { sanitizeFilename } from './utils.ts';

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
    // New test cases for Windows-style paths
    { input: 'C:\\Windows\\System32\\calc.exe', expected: 'calc.exe.mid' },
    { input: 'D:\\music\\projects\\loop.mid', expected: 'loop.mid' },
    { input: '\\\\server\\share\\file.mid', expected: 'file.mid' },
    // Null byte test
    { input: 'test\0.mid', expected: 'test_.mid' },
    // Extremely long filename
    { input: 'b'.repeat(200), expected: 'b'.repeat(60) + '.mid' },
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
