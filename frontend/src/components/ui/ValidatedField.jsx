// Unit 1: a React Hook Form field wired to a Yup schema.
//
// The component owns the markup and the error display. The page owns the
// `useForm` call, so the same field works inside any form.

import { useState } from "react";
import { Controller } from "react-hook-form";
import { AureoSelect } from "./index";
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
    const [showPassword, setShowPassword] = useState(false);
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
                <AureoSelect
                    id={fieldId}
                    className="aureo-field-select"
                    value={field.value ?? ""}
                    options={options}
                    disabled={disabled}
                    ariaInvalid={hasError}
                    onChange={(event) => notify(event.target.value)}
                    onBlur={field.onBlur}
                />
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
                    onWheel={(e) => e.target.blur()}
                    onFocus={(e) => {
                        if (e.target.value === "0") {
                            e.target.select();
                        }
                    }}
                    onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                            notify("");
                            return;
                        }
                        const clean = raw.length > 1 && raw.startsWith("0") && !raw.startsWith("0.")
                            ? raw.replace(/^0+/, "")
                            : raw;
                        const num = Number(clean);
                        notify(isNaN(num) ? clean : num);
                    }}
                />
            );
        }

        if (type === "password") {
            return (
                <div className="aureo-field-input-wrapper">
                    <input
                        {...field}
                        {...sharedProps}
                        type={showPassword ? "text" : "password"}
                        placeholder={placeholder}
                        readOnly={readOnly}
                        autoComplete={autoComplete}
                        value={field.value ?? ""}
                        onChange={(event) => notify(event.target.value)}
                        className={`aureo-field-input aureo-field-input--password`}
                    />
                    <button
                        type="button"
                        className="aureo-field-password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>
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
