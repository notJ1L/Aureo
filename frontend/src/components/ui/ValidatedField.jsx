// Unit 1: a React Hook Form field wired to a Yup schema.
//
// The component owns the markup and the error display. The page owns the
// `useForm` call, so the same field works inside any form.

import { Controller } from "react-hook-form";
import "./ui.css";

export function ValidatedField({
    control,
    name,
    label,
    type = "text",
    placeholder,
    error,
    hint,
    disabled = false,
    readOnly = false,
    options = null,
    rows = 4,
    autoComplete,
    onValueChange,
    className = ""
}) {
    const fieldId = `aureo-field-${name}`;
    const hasError = Boolean(error);

    const renderInput = ({ field }) => {
        const sharedProps = {
            id: fieldId,
            className: "aureo-field-input",
            disabled,
            "aria-invalid": hasError
        };

        // `onValueChange` lets a page react to a specific field changing,
        // for example locking the stock field when the condition becomes
        // "second-hand".
        const notify = (value) => {
            field.onChange(value);

            if (onValueChange) {
                onValueChange(value);
            }
        };

        if (options) {
            return (
                <select
                    {...field}
                    {...sharedProps}
                    value={field.value ?? ""}
                    onChange={(event) => notify(event.target.value)}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (type === "textarea") {
            return (
                <textarea
                    {...field}
                    {...sharedProps}
                    rows={rows}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    value={field.value ?? ""}
                    onChange={(event) => notify(event.target.value)}
                />
            );
        }

        if (type === "number") {
            return (
                <input
                    {...field}
                    {...sharedProps}
                    type="number"
                    placeholder={placeholder}
                    readOnly={readOnly}
                    value={field.value ?? ""}
                    onChange={(event) =>
                        notify(event.target.value === "" ? undefined : event.target.valueAsNumber)
                    }
                />
            );
        }

        return (
            <input
                {...field}
                {...sharedProps}
                type={type}
                placeholder={placeholder}
                readOnly={readOnly}
                autoComplete={autoComplete}
                value={field.value ?? ""}
                onChange={(event) => notify(event.target.value)}
            />
        );
    };

    return (
        <div className={`aureo-field ${className}`.trim()}>
            {label ? (
                <label className="aureo-field-label" htmlFor={fieldId}>
                    {label}
                </label>
            ) : null}

            <Controller name={name} control={control} render={renderInput} />

            {hasError ? (
                <span className="aureo-field-error" role="alert">
                    {error}
                </span>
            ) : hint ? (
                <span className="aureo-field-hint">{hint}</span>
            ) : null}
        </div>
    );
}

export default ValidatedField;
