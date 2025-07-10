// Enhanced logger with styled output, session-based and date-based organization
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
    session: string;
    meta?: any;
}

export interface SongRequestEntry {
    title: string;
    artist: string;
    requestedBy: string;
    timestamp: number;
    session: string;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

// Generate session ID based on app start time
const SESSION_ID = `session_${Date.now()}`;
const LOG_DIR = app
    ? path.join(app.getPath("userData"), "logs")
    : path.join(process.cwd(), "logs");
const SONG_REQUESTS_DIR = app
    ? path.join(app.getPath("userData"), "song-requests")
    : path.join(process.cwd(), "song-requests");

// Ensure directories exist
function ensureDirectories() {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        if (!fs.existsSync(SONG_REQUESTS_DIR)) {
            fs.mkdirSync(SONG_REQUESTS_DIR, { recursive: true });
        }
    } catch (error) {
        console.error("Failed to create logging directories:", error);
    }
}

// Initialize directories
ensureDirectories();

// Generate file paths based on current date and session
function getLogFilePath() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return path.join(LOG_DIR, `${today}_${SESSION_ID}.log`);
}

function getSongRequestsFilePath() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return path.join(SONG_REQUESTS_DIR, `${today}_${SESSION_ID}.json`);
}

function getDailySongRequestsFilePath() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return path.join(SONG_REQUESTS_DIR, `${today}_daily.json`);
}

function formatLog(entry: LogEntry) {
    const { level, message, timestamp } = entry;
    const time = new Date(timestamp).toLocaleTimeString();
    const style = LEVELS[level].color;
    return style(`[${LEVELS[level].label}] [${time}] ${message}`);
}

function formatLogForFile(entry: LogEntry) {
    const { level, message, timestamp, session, meta } = entry;
    const time = new Date(timestamp).toISOString();
    const metaStr = meta ? ` | META: ${JSON.stringify(meta)}` : "";
    return `[${LEVELS[level].label}] [${time}] [${session}] ${message}${metaStr}`;
}

function sendLogToRenderers(entry: LogEntry) {
    if (!app || !BrowserWindow.getAllWindows) return;
    BrowserWindow.getAllWindows().forEach((win) => {
        try {
            win.webContents.send("log:entry", entry);
        } catch (error) {
            // Ignore if window is destroyed
        }
    });
}

// Clean up old log files (keep last 30 days)
function cleanupOldLogs() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const files = fs.readdirSync(LOG_DIR);
        files.forEach((file) => {
            const filePath = path.join(LOG_DIR, file);
            const stats = fs.statSync(filePath);
            if (stats.mtime < thirtyDaysAgo) {
                fs.unlinkSync(filePath);
            }
        });

        // Also clean up song requests
        const songFiles = fs.readdirSync(SONG_REQUESTS_DIR);
        songFiles.forEach((file) => {
            const filePath = path.join(SONG_REQUESTS_DIR, file);
            const stats = fs.statSync(filePath);
            if (stats.mtime < thirtyDaysAgo) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error("Failed to cleanup old logs:", error);
    }
}

// Initialize session log file with header
function initializeSessionLog() {
    try {
        const logFile = getLogFilePath();
        const header = `=== Melodify Session Started ===\nSession ID: ${SESSION_ID}\nStarted: ${new Date().toISOString()}\nPlatform: ${process.platform}\nNode Version: ${process.version}\n${"=".repeat(50)}\n\n`;
        fs.writeFileSync(logFile, header);
    } catch (error) {
        console.error("Failed to initialize session log:", error);
    }
}

function appendLogToFile(entry: LogEntry) {
    try {
        const logFile = getLogFilePath();
        fs.appendFileSync(logFile, formatLogForFile(entry) + "\n");
    } catch (error) {
        console.error("Failed to write to log file:", error);
    }
}

function log(level: LogLevel, message: string, meta?: any) {
    const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now(),
        session: SESSION_ID,
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

// Song request logging
export function logSongRequest(
    title: string,
    artist: string,
    requestedBy: string
) {
    const entry: SongRequestEntry = {
        title,
        artist,
        requestedBy,
        timestamp: Date.now(),
        session: SESSION_ID,
    };

    try {
        // Log to session file
        const sessionFile = getSongRequestsFilePath();
        let sessionData: SongRequestEntry[] = [];
        if (fs.existsSync(sessionFile)) {
            const content = fs.readFileSync(sessionFile, "utf8");
            sessionData = JSON.parse(content);
        }
        sessionData.push(entry);
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

        // Log to daily file
        const dailyFile = getDailySongRequestsFilePath();
        let dailyData: SongRequestEntry[] = [];
        if (fs.existsSync(dailyFile)) {
            const content = fs.readFileSync(dailyFile, "utf8");
            dailyData = JSON.parse(content);
        }
        dailyData.push(entry);
        fs.writeFileSync(dailyFile, JSON.stringify(dailyData, null, 2));

        // Also log as regular log entry
        logInfo(
            `Song requested: "${title}" by ${artist} (requested by ${requestedBy})`
        );
    } catch (error) {
        logError(error, "Failed to log song request");
    }
}

// Get song requests for a specific date
export function getSongRequestsForDate(date: string): SongRequestEntry[] {
    try {
        const dailyFile = path.join(SONG_REQUESTS_DIR, `${date}_daily.json`);
        if (fs.existsSync(dailyFile)) {
            const content = fs.readFileSync(dailyFile, "utf8");
            return JSON.parse(content);
        }
    } catch (error) {
        logError(error, `Failed to get song requests for date ${date}`);
    }
    return [];
}

// Get song requests for current session
export function getSongRequestsForSession(): SongRequestEntry[] {
    try {
        const sessionFile = getSongRequestsFilePath();
        if (fs.existsSync(sessionFile)) {
            const content = fs.readFileSync(sessionFile, "utf8");
            return JSON.parse(content);
        }
    } catch (error) {
        logError(error, "Failed to get song requests for current session");
    }
    return [];
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

// Initialize logging system
initializeSessionLog();
cleanupOldLogs();

// Log session start
logInfo("Logging system initialized", { sessionId: SESSION_ID });

// IPC: Renderer requests all logs
if (ipcMain) {
    ipcMain.handle("log:getAll", () => logs);
}
