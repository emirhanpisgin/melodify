// rendererLogger.ts
// Logging utilities for the renderer process, providing console-based logging with IPC communication to main process.

/**
 * Log levels for the renderer logger.
 */
type LogLevel = "info" | "debug" | "warn" | "error";

/**
 * Logs a message with the specified level to both console and main process.
 * 
 * @param level - The log level (info, debug, warn, error).
 * @param message - The message to log.
 * @param context - Optional context for the log message.
 */
function logToMain(level: LogLevel, message: string, context?: string) {
    // Log to console for immediate feedback
    const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[consoleMethod](`[${level.toUpperCase()}] ${context ? `[${context}] ` : ""}${message}`);

    // Send to main process for persistent logging
    window.electronAPI?.send?.("log:renderer", { level, message, context });
}

/**
 * Logs an informational message.
 * 
 * @param message - The message to log.
 * @param context - Optional context for the log message.
 */
export function logInfo(message: string, context?: string) {
    logToMain("info", message, context);
}

/**
 * Logs a debug message.
 * 
 * @param message - The message to log.
 * @param context - Optional context for the log message.
 */
export function logDebug(message: string, context?: string) {
    logToMain("debug", message, context);
}

/**
 * Logs a warning message.
 * 
 * @param message - The message to log.
 * @param context - Optional context for the log message.
 */
export function logWarn(message: string, context?: string) {
    logToMain("warn", message, context);
}

/**
 * Logs an error message.
 * 
 * @param message - The message to log.
 * @param context - Optional context for the log message.
 */
export function logError(message: string | Error, context?: string) {
    const errorMessage = message instanceof Error ? message.message : message;
    logToMain("error", errorMessage, context);
}
