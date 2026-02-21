import path from 'path';

// ============================================================================
// ТЕСТЫ САНИТИЗАЦИИ ИМЁН ФАЙЛОВ
// ============================================================================
// Полная копия функции из server.ts для тестирования
// ============================================================================

const WINDOWS_RESERVED = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
]);

function sanitizeFilename(filename: any): string {
    // Проверка на null/undefined
    if (filename == null || typeof filename !== 'string') {
        return 'generative_loop.mid'
    }

    // Проверка на пустую строку или только whitespace
    if (filename.trim() === '') {
        return 'generative_loop.mid'
    }

    // Проверка на null bytes (CWE-022)
    if (filename.includes('\0')) {
        return 'generative_loop.mid'
    }

    // Извлекаем только имя файла, удаляя пути
    const base = path.basename(filename)

    // Проверка на пустое имя
    if (!base || base === '' || base === '.') {
        return 'generative_loop.mid'
    }

    // Проверка на зарезервированные имена Windows
    const nameWithoutExt = path.parse(base).name.toUpperCase()
    if (WINDOWS_RESERVED.has(nameWithoutExt)) {
        return 'generative_loop.mid'
    }

    // Удаляем все символы кроме alphanumeric, точек, подчёркиваний, дефисов
    let sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Защита от скрытых файлов (начинающихся с точки)
    if (sanitized.startsWith('.')) {
        sanitized = 'file' + sanitized
    }

    // Проверка на пустое имя после санитизации
    if (!sanitized || sanitized === '' || sanitized === '_') {
        return 'generative_loop.mid'
    }

    // Принудительное расширение .mid
    if (!sanitized.toLowerCase().endsWith('.mid')) {
        sanitized = sanitized.replace(/\.[^.]+$/, '') + '.mid'
    }

    // Ограничение длины (64 символа)
    const maxLength = 64
    if (sanitized.length > maxLength) {
        const ext = '.mid'
        const maxNameLength = maxLength - ext.length
        sanitized = sanitized.slice(0, maxNameLength) + ext
    }

    // Финальная проверка
    if (!sanitized || sanitized.length === 0) {
        return 'generative_loop.mid'
    }

    return sanitized
}

// ============================================================================
// ТЕСТОВЫЕ КЕЙСЫ
// ============================================================================

const testCases = [
    // Базовые тесты
    { input: 'standard.mid', expected: 'standard.mid', description: 'Standard MIDI filename' },
    { input: 'no-extension', expected: 'no-extension.mid', description: 'No extension' },
    { input: 'test.MID', expected: 'test.MID', description: 'Uppercase extension' },
    { input: 'test.MiD', expected: 'test.MiD', description: 'Mixed case extension (already has .mid-like)' },
    
    // Path traversal атаки
    { input: '../../../etc/passwd', expected: 'passwd.mid', description: 'Path traversal (Unix)' },
    { input: '..\\..\\..\\Windows\\System32', expected: 'file.._.._..mid', description: 'Path traversal (Windows)' },
    { input: '..', expected: 'file...mid', description: 'Just dots' },
    { input: './test.mid', expected: 'test.mid', description: 'Current directory' },
    
    // Null byte атаки (CWE-022)
    { input: 'file\0.mid', expected: 'generative_loop.mid', description: 'Null byte injection' },
    { input: 'test.mid\0.exe', expected: 'generative_loop.mid', description: 'Null byte with fake extension' },
    { input: 'a\0b\0c.mid', expected: 'generative_loop.mid', description: 'Multiple null bytes' },
    
    // Windows reserved names
    { input: 'CON.mid', expected: 'generative_loop.mid', description: 'Windows reserved: CON' },
    { input: 'PRN.mid', expected: 'generative_loop.mid', description: 'Windows reserved: PRN' },
    { input: 'AUX.mid', expected: 'generative_loop.mid', description: 'Windows reserved: AUX' },
    { input: 'NUL.mid', expected: 'generative_loop.mid', description: 'Windows reserved: NUL' },
    { input: 'COM1.mid', expected: 'generative_loop.mid', description: 'Windows reserved: COM1' },
    { input: 'COM9.mid', expected: 'generative_loop.mid', description: 'Windows reserved: COM9' },
    { input: 'LPT1.mid', expected: 'generative_loop.mid', description: 'Windows reserved: LPT1' },
    { input: 'LPT9.mid', expected: 'generative_loop.mid', description: 'Windows reserved: LPT9' },
    { input: 'con.mid', expected: 'generative_loop.mid', description: 'Windows reserved: con (lowercase)' },
    { input: 'CoN.mid', expected: 'generative_loop.mid', description: 'Windows reserved: CoN (mixed case)' },
    
    // Скрытые файлы
    { input: '.hidden', expected: 'file.mid', description: 'Hidden file (dot prefix) - becomes file.mid after extension fix' },
    { input: '.env', expected: 'file.mid', description: 'Hidden .env file - becomes file.mid after extension fix' },
    { input: '.gitignore', expected: 'file.mid', description: 'Hidden .gitignore - becomes file.mid after extension fix' },
    { input: '...', expected: 'file....mid', description: 'Multiple dots' },
    
    // Специальные символы
    { input: '  space test  .mid', expected: '__space_test__.mid', description: 'Spaces in filename' },
    { input: 'weird!@#$%^&*().mid', expected: 'weird__________.mid', description: 'Special characters' },
    { input: 'file<script>.mid', expected: 'file_script_.mid', description: 'Script injection attempt' },
    { input: 'file|pipe.mid', expected: 'file_pipe.mid', description: 'Pipe character' },
    { input: 'file>redirect.mid', expected: 'file_redirect.mid', description: 'Redirect character' },
    
    // Windows пути
    { input: 'C:\\Windows\\System32\\calc.exe', expected: 'C__Windows_System32_calc.mid', description: 'Windows full path' },
    { input: 'C:\\CON\\file.mid', expected: 'C__CON_file.mid', description: 'Windows path with reserved name in path' },
    
    // Длинные имена
    { input: 'a'.repeat(100) + '.mid', expected: 'a'.repeat(60) + '.mid', description: 'Very long filename' },
    { input: 'a'.repeat(200) + '.txt', expected: 'a'.repeat(60) + '.mid', description: 'Very long with wrong extension' },
    
    // Null/undefined/неверный тип
    { input: null, expected: 'generative_loop.mid', description: 'Null input' },
    { input: undefined, expected: 'generative_loop.mid', description: 'Undefined input' },
    { input: 123, expected: 'generative_loop.mid', description: 'Number input' },
    { input: {}, expected: 'generative_loop.mid', description: 'Object input' },
    { input: [], expected: 'generative_loop.mid', description: 'Array input' },
    { input: '', expected: 'generative_loop.mid', description: 'Empty string' },
    
    // Edge cases
    { input: '   ', expected: 'generative_loop.mid', description: 'Whitespace only - should be rejected' },
    { input: '_.mid', expected: '_.mid', description: 'Underscore only' },
    { input: '-.mid', expected: '-.mid', description: 'Dash only' },
    { input: '._.mid', expected: 'file._.mid', description: 'Dot underscore - becomes file._.mid' },
    { input: 'file..mid', expected: 'file..mid', description: 'Double dot in name' },
    { input: 'file.mid.mid', expected: 'file.mid.mid', description: 'Double extension' },
];

// ============================================================================
// ЗАПУСК ТЕСТОВ
// ============================================================================

let passed = 0;
let failed = 0;

console.log('🧪 Running sanitization tests...\n');

testCases.forEach(({ input, expected, description }, index) => {
    const result = sanitizeFilename(input);
    if (result !== expected) {
        console.error(`❌ Test ${index + 1} FAILED: ${description}`);
        console.error(`   Input:    ${JSON.stringify(input)}`);
        console.error(`   Expected: ${expected}`);
        console.error(`   Got:      ${result}`);
        failed++;
    } else {
        console.log(`✅ Test ${index + 1} passed: ${description}`);
        passed++;
    }
});

// ============================================================================
// ИТОГИ
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
    console.log('🎉 All sanitization tests passed!');
    process.exit(0);
} else {
    console.error(`⚠️  ${failed} test(s) failed.`);
    process.exit(1);
}
