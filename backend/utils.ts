import path from 'path'

/**
 * Sanitize filename to prevent path traversal and malicious naming
 */
export function sanitizeFilename(filename: string | undefined | null): string {
    if (!filename || typeof filename !== 'string') {
        return 'generative_loop.mid'
    }

    // Extract only the filename part, removing any path components.
    // Replace Windows-style backslashes with forward slashes first to ensure
    // path.basename works correctly on all platforms.
    const normalizedPath = filename.replace(/\\/g, '/')
    const base = path.basename(normalizedPath)

    // Remove characters that aren't alphanumeric, dots, underscores, or dashes
    let sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Ensure the filename is not empty and doesn't start with a dot (hidden file)
    if (!sanitized || sanitized.startsWith('.')) {
        sanitized = 'loop_' + sanitized.replace(/^\.+/, '')
    }

    // Final check for empty or just 'loop_'
    if (sanitized === 'loop_' || !sanitized) {
        sanitized = 'loop_unnamed'
    }

    // Ensure it has a .mid extension
    if (!sanitized.toLowerCase().endsWith('.mid')) {
        sanitized += '.mid'
    }

    // Limit length to a reasonable 64 characters, preserving the extension if possible
    if (sanitized.length > 64) {
        sanitized = sanitized.slice(-64)
    }

    return sanitized
}
