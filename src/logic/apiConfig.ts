/**
 * Resolves the API URL for MIDI export based on environment variables.
 * @param env - The environment object (usually import.meta.env)
 * @returns The resolved API URL or an empty string if not configured in production.
 */
export function getApiUrl(env: any): string {
    // VITE_API_URL should be the primary source.
    // If it's not set, we allow a fallback to localhost ONLY in development mode.
    return env.VITE_API_URL || (env.DEV ? 'http://localhost:3001' : '');
}
