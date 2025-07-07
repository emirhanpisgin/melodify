// MultipleInput.tsx
// Component for managing multiple input values with add/remove functionality and validation.

import { XIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Input from "./Input";

/**
 * Props for the MultipleInput component.
 * @property values - Array of current input values.
 * @property onChange - Function called when values change.
 * @property placeholder - Placeholder text for the input field.
 * @property label - Label text for the component.
 * @property maxItems - Maximum number of items allowed.
 * @property minLength - Minimum length for each item.
 * @property maxLength - Maximum length for each item.
 * @property allowDuplicates - Whether duplicate values are allowed.
 * @property allExistingValues - Array of all existing values for duplicate checking.
 * @property validateItem - Function to validate individual items.
 * @property className - Additional CSS classes.
 */
interface MultipleInputProps {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    label?: string;
    maxItems?: number;
    minLength?: number;
    maxLength?: number;
    allowDuplicates?: boolean;
    allExistingValues?: string[];
    validateItem?: (item: string, currentItems: string[]) => string | null;
    className?: string;
}

/**
 * MultipleInput component for managing a list of string values.
 * Supports adding, removing, and validating individual items.
 */
export default function MultipleInput({
    values,
    onChange,
    placeholder = "Type and press Enter",
    label,
    maxItems = 10,
    minLength = 1,
    maxLength = 50,
    allowDuplicates = true,
    allExistingValues = [],
    validateItem,
    className,
}: MultipleInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * Validates a single item and returns an error message if invalid.
     */
    const validateSingleItem = (item: string): string | null => {
        // Check minimum length
        if (item.length < minLength) {
            return `Item must be at least ${minLength} character${minLength === 1 ? '' : 's'} long`;
        }

        // Check maximum length
        if (item.length > maxLength) {
            return `Item must be no more than ${maxLength} character${maxLength === 1 ? '' : 's'} long`;
        }

        // Check for duplicates if not allowed
        if (!allowDuplicates) {
            const allValues = [...values, ...allExistingValues];
            if (allValues.some(existing => existing.toLowerCase() === item.toLowerCase())) {
                return "This item already exists";
            }
        }

        // Custom validation if provided
        if (validateItem) {
            return validateItem(item, values);
        }

        return null;
    };

    /**
     * Adds a new item to the list if valid.
     */
    const addItem = () => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;

        // Validate the item
        const validationError = validateSingleItem(trimmedValue);
        if (validationError) {
            setError(validationError);
            return;
        }

        // Check if we've reached the maximum number of items
        if (values.length >= maxItems) {
            setError(`Maximum ${maxItems} items allowed`);
            return;
        }

        // Add the item and clear the input
        onChange([...values, trimmedValue]);
        setInputValue("");
        setError("");
    };

    /**
     * Removes an item from the list by index.
     */
    const removeItem = (index: number) => {
        const newValues = values.filter((_, i) => i !== index);
        onChange(newValues);
        setError("");
    };

    /**
     * Handles key press events in the input field.
     */
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem();
        }
    };

    /**
     * Handles input change events.
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (error) setError(""); // Clear error when user starts typing
    };

    // Focus input when component mounts
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className={className}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-white mb-2">
                    {label}
                </label>
            )}

            {/* Input field */}
            <div className="flex gap-2">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    error={!!error}
                    helperText={error}
                    maxLength={maxLength}
                    disabled={values.length >= maxItems}
                />
                <button
                    onClick={addItem}
                    disabled={!inputValue.trim() || values.length >= maxItems}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                    Add
                </button>
            </div>

            {/* Display current items */}
            {values.length > 0 && (
                <div className="mt-3 space-y-2">
                    {values.map((value, index) => (
                        <div
                            key={`${value}-${index}`}
                            className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded"
                        >
                            <span className="text-white">{value}</span>
                            <button
                                onClick={() => removeItem(index)}
                                className="text-zinc-400 hover:text-red-400 transition-colors"
                                title="Remove item"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Item count */}
            <div className="text-xs text-zinc-500 mt-2">
                {values.length} / {maxItems} items
            </div>
        </div>
    );
} 