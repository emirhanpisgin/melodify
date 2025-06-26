/**
 * Navbar component. Displays the application title, branding, and settings button.
 */
import SettingsIcon from "./icons/SettingsIcon";

export default function Navbar({ onSettingsClick }: { onSettingsClick?: () => void }) {
    return (
        <div className="w-full border-b flex gap-3 p-2 relative">
            <div className="text-xl font-semibold flex-1 flex items-center justify-center">
                <span className="text-spotify-green">Song</span><span className="text-kick-green">ülfy</span>
            </div>
            {onSettingsClick && (
                <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded"
                    onClick={onSettingsClick}
                    aria-label="Open settings"
                >
                    <SettingsIcon className="w-6 h-6 text-zinc-400 hover:text-white" />
                </button>
            )}
        </div>
    );
}
