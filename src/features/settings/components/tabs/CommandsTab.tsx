import CommandConfig from "./CommandConfig";
import Input from "../../../../ui/components/Input";
import Toggle from "../../../../ui/components/Toggle";

interface CommandsTabProps {
    commands: any[];
    config: any;
    onInput: (key: string, value: any) => void;
    onToggleCommand: (name: string, enabled: boolean) => void;
    validationErrors: { [key: string]: string };
    aliasInputs: { [cmd: string]: string };
    setAliasInputs: (inputs: { [cmd: string]: string }) => void;
    autoSave: (newConfig: any) => void;
    setTab: (tab: string) => void;
}

export default function CommandsTab({ 
    commands, 
    config, 
    onInput, 
    onToggleCommand, 
    validationErrors, 
    aliasInputs, 
    setAliasInputs, 
    autoSave,
    setTab
}: CommandsTabProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Command Settings</h2>
                
                <div className="space-y-6">
                    <div>
                        <Input
                            label="Command Prefix"
                            value={config.prefix || "!"}
                            onChange={(e) => onInput("prefix", e.target.value)}
                            placeholder="!"
                            maxLength={10}
                            error={!!validationErrors.prefix}
                            helperText={validationErrors.prefix || "Character used to trigger commands (e.g., !sr song)"}
                        />
                    </div>

                    {/* Individual Commands Section */}
                    <div>
                        <h3 className="text-md font-medium text-white mb-3">Individual Commands</h3>
                        <div className="space-y-4">
                            {commands.length === 0 && <div className="text-zinc-500">No commands found.</div>}
                            {commands.map((cmd) => (
                                <CommandConfig
                                    key={cmd.name}
                                    cmd={cmd}
                                    config={config}
                                    onInput={onInput}
                                    onToggleCommand={onToggleCommand}
                                    validationErrors={validationErrors}
                                    aliasInputs={aliasInputs}
                                    setAliasInputs={setAliasInputs}
                                    autoSave={autoSave}
                                    setTab={setTab}
                                />
                            ))}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
} 