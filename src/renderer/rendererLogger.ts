// Renderer logger for UI/React logging, sends logs to main process via IPC
export function logInfo(message: string, meta?: any) {
    window.electronAPI?.send?.("log:info", { message, meta });
}
export function logWarn(message: string, meta?: any) {
    window.electronAPI?.send?.("log:warn", { message, meta });
}
export function logError(error: any, context?: string) {
    let msg = error instanceof Error ? error.stack || error.message : String(error);
    if (context) msg = `[${context}] ${msg}`;
    window.electronAPI?.send?.("log:error", { message: msg });
}
export function logDebug(message: string, meta?: any) {
    window.electronAPI?.send?.("log:debug", { message, meta });
}
