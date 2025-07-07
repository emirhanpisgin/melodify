import Input from "../../../../ui/components/Input";

interface SecretsTabProps {
    config: any;
    onInput: (key: string, value: any) => void;
    validationErrors: { [key: string]: string };
}

const secretFields = [
    { key: "spotifyClientId", label: "Spotify Client ID" },
    { key: "spotifyClientSecret", label: "Spotify Client Secret" },
    { key: "kickClientId", label: "Kick Client ID" },
    { key: "kickClientSecret", label: "Kick Client Secret" },
];

export default function SecretsTab({ config, onInput, validationErrors }: SecretsTabProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="font-bold text-base mb-1 text-white">API Credentials</div>
            {secretFields.map((field) => (
                <Input
                    key={field.key}
                    label={field.label}
                    type={field.key.includes("Secret") ? "password" : "text"}
                    value={typeof config[field.key] === "string" ? config[field.key] as string : ""}
                    onChange={(e) => onInput(field.key, e.target.value)}
                    error={!!validationErrors[field.key]}
                    helperText={validationErrors[field.key]}
                    maxLength={field.key.includes("Secret") ? 200 : 100}
                />
            ))}
        </div>
    );
} 