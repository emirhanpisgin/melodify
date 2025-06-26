import fs from "fs";
import path from "path";
import { app } from "electron";

const logDir = app.getPath("userData");
const logFile = path.join(logDir, "error.log");

export function logError(error: unknown, context?: string) {
    const now = new Date().toISOString();
    let message = `[${now}]`;
    if (context) message += ` [${context}]`;
    if (error instanceof Error) {
        message += ` ${error.stack || error.message}`;
    } else {
        message += ` ${JSON.stringify(error)}`;
    }
    message += "\n";
    try {
        fs.appendFileSync(logFile, message, "utf-8");
    } catch (e) {
        // If logging fails, there's not much we can do
    }
}

export function getLogFilePath() {
    return logFile;
}
