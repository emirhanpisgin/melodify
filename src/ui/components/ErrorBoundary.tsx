// ErrorBoundary.tsx
// React error boundary component to catch and handle JavaScript errors in the component tree.

import React from "react";
import { logError } from "../../renderer/rendererLogger";

/**
 * Props for the ErrorBoundary component.
 * @property children - React children to be wrapped by the error boundary.
 */
interface ErrorBoundaryProps {
    children: React.ReactNode;
}

/**
 * State for the ErrorBoundary component.
 * @property hasError - Whether an error has been caught.
 * @property error - The error that was caught.
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * ErrorBoundary component catches JavaScript errors anywhere in the child component tree.
 * Logs errors and displays a fallback UI when errors occur.
 */
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    /**
     * Called when an error is thrown in a descendant component.
     * Updates state to show fallback UI and logs the error.
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    /**
     * Called after an error has been thrown in a descendant component.
     * Logs the error for debugging purposes.
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logError(error, "ErrorBoundary");
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI when an error occurs
            return (
                <div className="flex items-center justify-center h-screen bg-zinc-900 text-white">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-zinc-400 mb-4">
                            An error occurred in the application.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                        >
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
