import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Input from "@/ui/components/Input";
import KickIcon from "@/features/kick/components/KickIcon";
import SpotifyIcon from "@/features/spotify/components/SpotifyIcon";
import { useTranslation } from "react-i18next";
import { validateField } from "../validation";

interface SecretsProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

const secretFields = [
    {
        key: "spotifyClientId",
        label: "Client ID",
        service: "Spotify",
        type: "text",
        placeholder: "1a2b3c4d5e6f...",
    },
    {
        key: "spotifyClientSecret",
        label: "Client Secret",
        service: "Spotify",
        type: "password",
        placeholder: "a1b2c3d4e5f6...",
    },
    {
        key: "kickClientId",
        label: "Client ID",
        service: "Kick",
        type: "text",
        placeholder: "kick_client_id_here",
    },
    {
        key: "kickClientSecret",
        label: "Client Secret",
        service: "Kick",
        type: "password",
        placeholder: "kick_client_secret_here",
    },
];

export default function Secrets({ config, onConfigChange }: SecretsProps) {
    const spotifyFields = secretFields.filter((f) => f.service === "Spotify");
    const kickFields = secretFields.filter((f) => f.service === "Kick");
    const { t } = useTranslation();
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string | null>
    >({});

    const handleInputChange = (key: string, value: string) => {
        // Validate the field
        const error = validateField(key, value);
        setValidationErrors((prev) => ({
            ...prev,
            [key]: error,
        }));

        // Update config
        onConfigChange(key, value);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-base font-medium text-white mb-4">
                {t("settings.secrets")}
            </h3>

            <div className="bg-zinc-800/30 rounded-md border border-zinc-700/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-spotify-green rounded flex items-center justify-center">
                        <SpotifyIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                        Spotify API
                    </h3>
                </div>

                <div className="space-y-2">
                    {spotifyFields.map((field, index) => (
                        <div key={field.key}>
                            <div className="relative">
                                <Input
                                    label={field.label}
                                    type="password"
                                    value={
                                        typeof config[field.key] === "string"
                                            ? (config[field.key] as string)
                                            : ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            field.key,
                                            e.target.value
                                        )
                                    }
                                    placeholder={field.placeholder}
                                    className="text-sm"
                                    error={!!validationErrors[field.key]}
                                    helperText={
                                        validationErrors[field.key] || undefined
                                    }
                                />
                            </div>
                            {index < spotifyFields.length - 1 && (
                                <div className="h-px bg-zinc-700/30 my-2"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-zinc-800/30 rounded-md border border-zinc-700/50 p-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-kick-green rounded flex items-center justify-center">
                        <KickIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                        Kick API
                    </h3>
                </div>

                <div className="space-y-2">
                    {kickFields.map((field, index) => (
                        <div key={field.key}>
                            <div className="relative">
                                <Input
                                    label={field.label}
                                    type="password"
                                    value={
                                        typeof config[field.key] === "string"
                                            ? (config[field.key] as string)
                                            : ""
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            field.key,
                                            e.target.value
                                        )
                                    }
                                    placeholder={field.placeholder}
                                    className="text-sm"
                                    error={!!validationErrors[field.key]}
                                    helperText={
                                        validationErrors[field.key] || undefined
                                    }
                                />
                            </div>
                            {index < kickFields.length - 1 && (
                                <div className="h-px bg-zinc-700/30 my-2"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
