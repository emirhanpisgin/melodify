import { XIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Input from "./Input";

interface MultipleInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    label?: string;
    maxItems?: number;
    minLength?: number;
    maxLength?: number;
    allowDuplicates?: boolean;
    validateItem?: (item: string, allValues: string[]) => string | null;
    allExistingValues?: string[]; // For cross-command alias validation
}

export default function MultipleInput({ 
    values, 
    onChange, 
    placeholder = "Add item and press Enter", 
    label,
    maxItems = 50,
    minLength = 1,
    maxLength = 100,
    allowDuplicates = false,
    validateItem,
    allExistingValues = []
}: MultipleInputProps) {
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const validateInput = (value: string): string | null => {
        if (!value.trim()) {
            return "Item cannot be empty";
        }
        if (value.trim().length < minLength) {
            return `Item must be at least ${minLength} character${minLength > 1 ? 's' : ''}`;
        }
        if (value.trim().length > maxLength) {
            return `Item must be no more than ${maxLength} characters`;
        }
        if (!allowDuplicates && values.includes(value.trim())) {
            return "This item already exists";
        }
        if (!allowDuplicates && allExistingValues.includes(value.trim())) {
            return "This item already exists in another command";
        }
        if (values.length >= maxItems) {
            return `Maximum ${maxItems} items allowed`;
        }
        if (validateItem) {
            return validateItem(value.trim(), values);
        }
        return null;
    };

    // Real-time validation on input change
    useEffect(() => {
        if (input.trim()) {
            const validationError = validateInput(input.trim());
            setError(validationError || "");
        } else {
            setError("");
        }
    }, [input, values, allExistingValues]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && input.trim()) {
            const validationError = validateInput(input.trim());
            if (validationError) {
                setError(validationError);
                return;
            }
            
            onChange([...values, input.trim()]);
            setInput("");
            e.preventDefault();
        } else if (e.key === "Backspace" && !input && values.length > 0) {
            onChange(values.slice(0, -1));
        }
    };

    const handleRemove = (item: string) => {
        onChange(values.filter(a => a !== item));
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <Input
                ref={inputRef}
                label={label}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setInput(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                error={!!error}
                helperText={error || `${values.length}/${maxItems} items`}
            />
            <div className="flex flex-wrap items-center gap-2">
                {values.map((item, idx) => (
                    <span key={`${item}-${idx}`} className="flex items-center bg-white/10 px-2 py-0.5 text-white text-sm rounded border border-zinc-600">
                        {item}
                        <button
                            type="button"
                            className="ml-1 text-zinc-400 hover:text-red-400 focus:outline-none transition-colors"
                            onClick={() => handleRemove(item)}
                            tabIndex={-1}
                        >
                            <XIcon className="size-4" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
} 