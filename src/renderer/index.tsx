// index.tsx
// Entry point for the renderer process React application.

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";

// Suppress webpack development overlay warnings
if (process.env.NODE_ENV === "development") {
    const originalError = console.error;
    console.error = (...args) => {
        const message = args[0];
        if (
            typeof message === "string" &&
            (message.includes(
                "multiple modules with names that only differ in casing"
            ) ||
                message.includes("case-semantic"))
        ) {
            return; // Suppress these warnings
        }
        originalError.apply(console, args);
    };

    // Also suppress webpack overlay
    (window as any).__webpack_hot_middleware_reporter__ = {
        success: () => {
            /* no-op */
        },
        warnings: () => {
            /* no-op */
        },
        errors: () => {
            /* no-op */
        },
    };
}

const root = createRoot(document.body);

root.render(<App />);
