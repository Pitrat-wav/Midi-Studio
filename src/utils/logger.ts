/**
 * Logger utility to handle conditional logging based on environment.
 * In production builds, debug and info logs are suppressed.
 */

// Vite provides environment variables through import.meta.env
const isDev = import.meta.env.DEV;

export const logger = {
    /**
     * Use for high-frequency or verbose debug messages.
     * Only logs in development mode.
     */
    debug: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    /**
     * Use for general information messages (e.g., startup/stop).
     * Only logs in development mode.
     */
    info: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    /**
     * Use for warnings.
     * Always logs to console.
     */
    warn: (...args: any[]) => {
        console.warn(...args);
    },

    /**
     * Use for errors.
     * Always logs to console.
     */
    error: (...args: any[]) => {
        console.error(...args);
    }
};
