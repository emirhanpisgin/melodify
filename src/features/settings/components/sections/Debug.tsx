// Debug section - compact development tools

import {
    Bug,
    Monitor,
    Cpu,
    MemoryStick,
    Network,
    HardDrive,
} from "lucide-react";
import Toggle from "@/ui/components/Toggle";
import { Button } from "@/ui/components/Button";
import Input from "@/ui/components/Input";
import { useState, useEffect } from "react";

interface DebugProps {
    searchQuery?: string;
}

export default function Debug({ searchQuery }: DebugProps) {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [systemInfo, setSystemInfo] = useState<any>({});
    const [testInput, setTestInput] = useState("");

    useEffect(() => {
        // Set basic system info from browser APIs
        setSystemInfo({
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
        });
    }, []);

    const sizes = ["sm"];
    const buttonVariants = ["primary", "secondary", "danger"];

    return (
        <div className="space-y-4">
            <h3 className="text-base font-medium text-white mb-4">
                Development Tools
            </h3>

            <div className="bg-zinc-800/30 rounded-md border border-zinc-700/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
                        <Monitor className="w-3 h-3 text-blue-300" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            System Information
                        </h3>
                        <p className="text-xs text-zinc-400">
                            Runtime environment details
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-700/30 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                            <Cpu className="w-3 h-3 text-green-300" />
                            <span className="text-xs text-zinc-400">
                                Platform
                            </span>
                        </div>
                        <div className="text-xs font-mono text-white">
                            {systemInfo.platform ||
                                navigator.platform ||
                                "Unknown"}
                        </div>
                    </div>
                    <div className="bg-zinc-700/30 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                            <MemoryStick className="w-3 h-3 text-blue-300" />
                            <span className="text-xs text-zinc-400">Arch</span>
                        </div>
                        <div className="text-xs font-mono text-white">
                            {systemInfo.arch || "Unknown"}
                        </div>
                    </div>
                    <div className="bg-zinc-700/30 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                            <Network className="w-3 h-3 text-purple-300" />
                            <span className="text-xs text-zinc-400">
                                User Agent
                            </span>
                        </div>
                        <div className="text-xs font-mono text-white truncate">
                            {navigator.userAgent.split(" ")[0] || "Unknown"}
                        </div>
                    </div>
                    <div className="bg-zinc-700/30 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                            <HardDrive className="w-3 h-3 text-orange-300" />
                            <span className="text-xs text-zinc-400">
                                Memory
                            </span>
                        </div>
                        <div className="text-xs font-mono text-white">
                            {(navigator as any).deviceMemory
                                ? `${(navigator as any).deviceMemory}GB`
                                : "Unknown"}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-800/30 rounded-md border border-zinc-700/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center">
                        <Bug className="w-3 h-3 text-purple-300" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            UI Components
                        </h3>
                        <p className="text-xs text-zinc-400">
                            Test and preview all component states
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <h4 className="text-xs font-medium text-white mb-2">
                            Toggle States
                        </h4>
                        <div className="flex gap-4 flex-wrap">
                            {sizes.map((size) => {
                                const key = `toggle-${size}`;
                                return (
                                    <div
                                        key={key}
                                        className="flex items-center gap-2"
                                    >
                                        <Toggle
                                            checked={!!checked[key]}
                                            onChange={(v) =>
                                                setChecked((prev) => ({
                                                    ...prev,
                                                    [key]: v,
                                                }))
                                            }
                                        />
                                        <span className="text-xs text-zinc-400">
                                            {checked[key]
                                                ? "Enabled"
                                                : "Disabled"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-px bg-zinc-700/30"></div>

                    <div>
                        <h4 className="text-xs font-medium text-white mb-2">
                            Button Variants
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                            {buttonVariants.map((variant) => (
                                <Button
                                    key={variant}
                                    className={`text-xs px-2 py-1 h-auto ${
                                        variant === "danger"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : variant === "secondary"
                                              ? "bg-zinc-600 hover:bg-zinc-700"
                                              : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                    onClick={() =>
                                        console.log(`${variant} button clicked`)
                                    }
                                >
                                    {variant}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-zinc-700/30"></div>

                    <div>
                        <h4 className="text-xs font-medium text-white mb-2">
                            Input States
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                label="Normal Input"
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                placeholder="Type something..."
                                className="text-xs"
                            />
                            <Input
                                label="Error Input"
                                value=""
                                onChange={() => {}}
                                placeholder="Error state..."
                                error={true}
                                helperText="This is an error message"
                                className="text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-800/30 rounded-md border border-zinc-700/50 p-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Debug Actions
                        </h3>
                        <p className="text-xs text-zinc-400">
                            Development tools and utilities
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={() =>
                            console.log("Component states:", checked)
                        }
                        className="text-xs px-2 py-1 h-auto bg-green-600 hover:bg-green-700"
                    >
                        Log States
                    </Button>
                    <Button
                        onClick={() => setChecked({})}
                        className="text-xs px-2 py-1 h-auto bg-yellow-600 hover:bg-yellow-700"
                    >
                        Reset All
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        className="text-xs px-2 py-1 h-auto bg-red-600 hover:bg-red-700"
                    >
                        Reload App
                    </Button>
                    <Button
                        onClick={() => console.clear()}
                        className="text-xs px-2 py-1 h-auto bg-blue-600 hover:bg-blue-700"
                    >
                        Clear Console
                    </Button>
                </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                <p className="text-yellow-300 text-xs leading-relaxed">
                    🛠️ This tab is only available in development mode and
                    provides tools for testing UI components, system
                    information, and debugging utilities.
                </p>
            </div>
        </div>
    );
}
