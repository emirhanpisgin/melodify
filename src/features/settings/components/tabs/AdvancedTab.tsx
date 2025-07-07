import Input from "../../../../ui/components/Input";
import Toggle from "../../../../ui/components/Toggle";

interface AdvancedTabProps {
    config: any;
    onInput: (key: string, value: any) => void;
    validationErrors: { [key: string]: string };
}

export default function AdvancedTab({ config, onInput, validationErrors }: AdvancedTabProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Advanced Settings</h2>

                <div className="space-y-6">
                    {/* OAuth Configuration Section */}
                    <div>
                        <h3 className="text-md font-medium text-white mb-3">OAuth Configuration</h3>
                        <div className="space-y-4">
                            <Input
                                label="Kick Redirect URI"
                                value={config.kickRedirectUri || "http://localhost:8889/callback"}
                                onChange={e => onInput("kickRedirectUri", e.target.value)}
                                helperText="Only change this if you understand OAuth redirect URIs."
                                error={!!validationErrors.kickRedirectUri}
                                maxLength={200}
                            />
                            <Input
                                label="Spotify Redirect URI"
                                value={config.spotifyRedirectUri || "http://127.0.0.1:8888/callback"}
                                onChange={e => onInput("spotifyRedirectUri", e.target.value)}
                                helperText="Only change this if you understand OAuth redirect URIs."
                                error={!!validationErrors.spotifyRedirectUri}
                                maxLength={200}
                            />
                        </div>
                    </div>

                    {/* File Output Section */}
                    <div>
                        <h3 className="text-md font-medium text-white mb-3">File Output</h3>
                        <div className="space-y-4">
                            <div>
                                <Toggle
                                    checked={config.saveCurrentSongToFile ?? false}
                                    variant="success"
                                    onChange={(checked) => onInput("saveCurrentSongToFile", checked)}
                                    label="Save current song to file"
                                    labelClassName="text-white font-medium"
                                />
                                <p className="text-sm text-zinc-400 mt-1">
                                    Save the currently playing song to a text file
                                </p>
                            </div>

                            {config.saveCurrentSongToFile && (
                                <div className="space-y-4 pl-4 border-l-2 border-zinc-700">
                                    <div>
                                        <Input
                                            label="File Path"
                                            value={config.currentSongFilePath || ""}
                                            onChange={(e) => onInput("currentSongFilePath", e.target.value)}
                                            placeholder="C:\path\to\current-song.txt"
                                            error={!!validationErrors.currentSongFilePath}
                                            helperText={validationErrors.currentSongFilePath || "Path where the current song will be saved"}
                                        />
                                        <button
                                            onClick={async () => {
                                                const path = await window.electronAPI.selectSongFilePath();
                                                if (path) {
                                                    onInput("currentSongFilePath", path);
                                                }
                                            }}
                                            className="mt-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition-colors"
                                        >
                                            Browse...
                                        </button>
                                    </div>

                                    <div>
                                        <Input
                                            label="Song Format"
                                            value={config.currentSongFormat || "{title} - {artist}"}
                                            onChange={(e) => onInput("currentSongFormat", e.target.value)}
                                            placeholder="{title} - {artist}"
                                            helperText="Format for the song text. Use {title} and {artist} as placeholders."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 