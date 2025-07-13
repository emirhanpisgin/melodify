// MultipleInput.tsx
// Component for managing multiple input values with add/remove functionality and validation.

import { XIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
    placeholder,
    label,
    maxItems = 10,
    minLength = 1,
    maxLength = 50,
    allowDuplicates = true,
    allExistingValues = [],
    validateItem,
    className,
}: MultipleInputProps) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Use translation for default placeholder if none provided
    const effectivePlaceholder = placeholder || t("multipleInput.placeholder");

    /**
     * Validates a single item and returns an error message if invalid.
     */
    const validateSingleItem = (item: string): string | null => {
        // Check minimum length
        if (item.length < minLength) {
            return t("multipleInput.minLengthError", {
                count: minLength,
                count_other: minLength === 1 ? "" : "s",
            });
        }

        // Check maximum length
        if (item.length > maxLength) {
            return t("multipleInput.maxLengthError", {
                count: maxLength,
                count_other: maxLength === 1 ? "" : "s",
            });
        }

        // Check for duplicates if not allowed
        if (!allowDuplicates) {
            const allValues = [...values, ...allExistingValues];
            if (
                allValues.some(
                    (existing) => existing.toLowerCase() === item.toLowerCase()
                )
            ) {
                return t("multipleInput.duplicateError");
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
            setError(t("multipleInput.maxItemsError", { count: maxItems }));
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

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-white mb-2">
                    {label}
                </label>
            )}

            <div className="flex gap-2 w-full">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={effectivePlaceholder}
                    onKeyDown={handleKeyPress}
                    error={!!error}
                    helperText={error}
                    maxLength={maxLength}
                    disabled={values.length >= maxItems}
                    className="w-full"
                />
            </div>

            {values.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 w-full">
                    {values.map((value, index) => (
                        <span
                            key={`${value}-${index}`}
                            className="flex items-center bg-zinc-700 text-white text-sm rounded-md px-2 py-1"
                        >
                            {value}
                            <button
                                onClick={() => removeItem(index)}
                                className="text-zinc-400 hover:text-red-400 transition-colors ml-1"
                                title={t("multipleInput.removeItem")}
                                style={{ lineHeight: 0 }}
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="text-xs text-zinc-500 mt-2">
                {t("multipleInput.itemCount", {
                    count: values.length,
                    max: maxItems,
                })}
            </div>
        </div>
    );
}
