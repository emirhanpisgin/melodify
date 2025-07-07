import Toggle from "../../../../ui/components/Toggle";
import Input from "../../../../ui/components/Input";
import MultipleInput from "../../../../ui/components/MultipleInput";

interface SongRequestsTabProps {
    config: any;
    onInput: (key: string, value: any) => void;
    validationErrors: { [key: string]: string };
}

export default function SongRequestsTab({ config, onInput, validationErrors }: SongRequestsTabProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Song Request Settings</h2>
                
                <div className="space-y-6">
                    {/* Permissions Section */}
                    <div>
                        <h3 className="text-md font-medium text-white mb-3">Permissions</h3>
                        <div className="space-y-4">
                            <div>
                                <Toggle
                                    checked={config.canAnyonePlaySong ?? false}
                                    onChange={(checked) => onInput("canAnyonePlaySong", checked)}
                                    label="Anyone can request songs"
                                    labelClassName="text-white font-medium"
                                    variant="success"
                                />
                                <p className="text-sm text-zinc-400 mt-1">
                                    Allow all users to request songs, not just subscribers/VIPs
                                </p>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-white mb-2">
                                    Allowed Badges for Song Requests
                                </div>
                                <div className="text-xs text-zinc-400 mb-3">
                                    When "Anyone can request songs" is disabled, only users with these badges can request songs (broadcaster and moderator can always request):
                                </div>
                                <div className="space-y-2">
                                    {["vip", "og", "subscriber"].map((badge) => {
                                        const currentBadges = config.allowedBadges || ["og", "vip", "subscriber"];
                                        const isEnabled = currentBadges.includes(badge);
                                        return (
                                            <Toggle
                                                key={badge}
                                                checked={isEnabled}
                                                onChange={(checked) => {
                                                    const newBadges = checked
                                                        ? [...currentBadges.filter((b: string) => b !== badge), badge]
                                                        : currentBadges.filter((b: string) => b !== badge);
                                                    onInput("allowedBadges", newBadges);
                                                }}
                                                label={badge.charAt(0).toUpperCase() + badge.slice(1)}
                                                labelClassName="text-white font-medium"
                                                variant="success"
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <Input
                                    label="Reward Title"
                                    value={config.rewardTitle || ""}
                                    onChange={(e) => onInput("rewardTitle", e.target.value)}
                                    placeholder="Song Request"
                                    helperText="Title of the channel reward for song requests (leave empty to disable)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cooldown Section */}
                    <div>
                        <h3 className="text-md font-medium text-white mb-3">Cooldown Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <Toggle
                                    checked={config.globalCooldownEnabled ?? false}
                                    onChange={(checked) => onInput("globalCooldownEnabled", checked)}
                                    label="Enable global cooldown"
                                    labelClassName="text-white font-medium"
                                    variant="success"
                                />
                                <p className="text-sm text-zinc-400 mt-1">
                                    Prevent song requests for a set time after any song is requested
                                </p>
                            </div>

                            {config.globalCooldownEnabled && (
                                <div className="pl-4 border-l-2 border-zinc-700">
                                    <div>
                                        <Input
                                            label="Global Cooldown (seconds)"
                                            value={config.globalCooldownSeconds || "30"}
                                            onChange={(e) => onInput("globalCooldownSeconds", e.target.value)}
                                            placeholder="30"
                                            type="number"
                                            min="1"
                                            max="3600"
                                            helperText="Time in seconds before another song can be requested by anyone"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <Toggle
                                    checked={config.perUserCooldownEnabled ?? false}
                                    onChange={(checked) => onInput("perUserCooldownEnabled", checked)}
                                    label="Enable per-user cooldown"
                                    labelClassName="text-white font-medium"
                                    variant="success"
                                />
                                <p className="text-sm text-zinc-400 mt-1">
                                    Prevent individual users from requesting songs too frequently
                                </p>
                            </div>

                            {config.perUserCooldownEnabled && (
                                <div className="pl-4 border-l-2 border-zinc-700">
                                    <div>
                                        <Input
                                            label="Per-User Cooldown (seconds)"
                                            value={config.perUserCooldownSeconds || "60"}
                                            onChange={(e) => onInput("perUserCooldownSeconds", e.target.value)}
                                            placeholder="60"
                                            type="number"
                                            min="1"
                                            max="3600"
                                            helperText="Time in seconds before a user can request another song"
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