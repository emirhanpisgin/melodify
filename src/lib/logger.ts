// Enhanced logger with styled output and IPC integration
import { app, BrowserWindow, ipcMain } from "electron";
import chalk from "chalk";
import fs from "fs";
import path from "path";

// Log levels and their styles
const LEVELS = {
    info: { label: "INFO", color: chalk.cyan },
    warn: { label: "WARN", color: chalk.yellow },
    error: { label: "ERROR", color: chalk.red },
    debug: { label: "DEBUG", color: chalk.magenta },
};

export type LogLevel = keyof typeof LEVELS;

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    meta?: any;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

const LOG_DIR = app ? app.getPath("userData") : process.cwd();
const LOG_FILE = path.join(LOG_DIR, "songulfy.log");
const MAX_LOG_SIZE = 1024 * 1024; // 1MB
const MAX_LOG_FILES = 3;

function formatLog(entry: LogEntry) {
    const { level, message, timestamp } = entry;
    const time = new Date(timestamp).toLocaleTimeString();
    const style = LEVELS[level].color;
    return style(`[${LEVELS[level].label}] [${time}] ${message}`);
}

function sendLogToRenderers(entry: LogEntry) {
    if (!app || !BrowserWindow.getAllWindows) return;
    BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("log:entry", entry);
        console.log("Log sent to renderer:", entry);
    });
}

function rotateLogs() {
    if (!fs.existsSync(LOG_FILE)) return;
    const stats = fs.statSync(LOG_FILE);
    if (stats.size < MAX_LOG_SIZE) return;
    for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
        const src = `${LOG_FILE}.${i - 1}`;
        const dest = `${LOG_FILE}.${i}`;
        if (fs.existsSync(src)) fs.renameSync(src, dest);
    }
    fs.renameSync(LOG_FILE, `${LOG_FILE}.0`);
}

function appendLogToFile(entry: LogEntry) {
    try {
        rotateLogs();
        fs.appendFileSync(LOG_FILE, formatLog(entry) + "\n");
    } catch (e) {
        // Ignore file write errors
    }
}

function log(level: LogLevel, message: string, meta?: any) {
    const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now(),
        meta,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
    // Styled console output
    console.log(formatLog(entry));
    // Send to renderer
    sendLogToRenderers(entry);
    // Write to file
    appendLogToFile(entry);
}

export function logInfo(message: string, meta?: any) {
    log("info", message, meta);
}
export function logWarn(message: string, meta?: any) {
    log("warn", message, meta);
}
export function logError(error: any, context?: string) {
    let msg =
        error instanceof Error ? error.stack || error.message : String(error);
    if (context) msg = `[${context}] ${msg}`;
    log("error", msg);
}
export function logDebug(message: string, meta?: any) {
    log("debug", message, meta);
}

// IPC: Renderer requests all logs
if (ipcMain) {
    ipcMain.handle("log:getAll", () => logs);
}

export function getAllLogs() {
    return logs;
}

export function exportAllLogsAsString(): string {
    try {
        return fs.readFileSync(LOG_FILE, "utf-8");
    } catch {
        return logs.map(formatLog).join("\n");
    }
}
