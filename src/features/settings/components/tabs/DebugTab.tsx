import Toggle from "../../../../ui/components/Toggle";
import { useState } from "react";

/**
 * DebugTab displays all UI components (like Toggle) in all sizes for visual inspection.
 * Only visible in development mode.
 */
export default function DebugTab() {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const sizes = ["sm"];

    return (
        <div className="space-y-8 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">
                Debug UI Components
            </h2>
            <div>
                <h3 className="text-md font-medium text-white mb-2">
                    Toggle Sizes
                </h3>
                <div className="flex gap-8 flex-wrap items-center">
                    {sizes.map((size) => {
                        const key = `toggle-${size}`;
                        return (
                            <div
                                key={key}
                                className="flex flex-col items-center gap-1"
                            >
                                <Toggle
                                    checked={!!checked[key]}
                                    onChange={(v) =>
                                        setChecked((prev) => ({
                                            ...prev,
                                            [key]: v,
                                        }))
                                    }
                                    label={`Toggle`}
                                />
                                <span className="text-xs text-zinc-400">
                                    {size}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
