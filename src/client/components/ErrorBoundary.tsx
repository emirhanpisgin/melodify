import React from "react";

/**
 * Global error boundary for catching React rendering errors.
 * Usage: Wrap your app in <ErrorBoundary>...</ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<{
    children: React.ReactNode;
}, { hasError: boolean; error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, info: any) {
        // Optionally log error to a service
        // console.error(error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center text-red-500">
                    <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
                    <pre className="text-xs bg-zinc-900 p-2 rounded mt-2 overflow-x-auto">{String(this.state.error)}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}
