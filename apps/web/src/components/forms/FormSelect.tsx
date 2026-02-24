import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps {
  label?: string;
  name: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--gray-700)',
    lineHeight: 1.4,
  },
  requiredMark: {
    color: 'var(--data-red)',
    marginLeft: '2px',
  },
  selectContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    width: '100%',
    minHeight: 48,
    padding: '14px 44px 14px 18px',
    fontSize: 16,
    fontFamily: 'inherit',
    color: 'var(--gray-900)',
    backgroundColor: 'var(--white, #fff)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  selectFocused: {
    borderColor: 'var(--blu-primary)',
    boxShadow: '0 0 0 3px rgba(0,102,255,0.15)',
  },
  selectError: {
    borderColor: 'var(--data-red)',
  },
  selectErrorFocused: {
    borderColor: 'var(--data-red)',
    boxShadow: '0 0 0 3px rgba(239,68,68,0.15)',
  },
  selectDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: 'var(--gray-50, #f9fafb)',
  },
  selectPlaceholder: {
    color: 'var(--gray-400)',
  },
  chevronIcon: {
    position: 'absolute' as const,
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--gray-400)',
    pointerEvents: 'none' as const,
    transition: 'transform 0.2s ease',
  },
  chevronOpen: {
    transform: 'translateY(-50%) rotate(180deg)',
  },
  errorIcon: {
    position: 'absolute' as const,
    right: '40px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--data-red)',
    pointerEvents: 'none' as const,
  },
  message: {
    fontSize: 13,
    lineHeight: 1.4,
    paddingLeft: '2px',
  },
  errorMessage: {
    color: 'var(--data-red)',
  },
  hintMessage: {
    color: 'var(--gray-500)',
  },
};

export function FormSelect({
  label,
  name,
  options,
  value = '',
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  className,
  onChange,
}: FormSelectProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
    onChange?.(event.currentTarget.value);
  };

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  const buildSelectStyle = (): Record<string, string | number> => {
    const base: Record<string, string | number> = { ...styles.select };

    if (!value && placeholder) {
      Object.assign(base, styles.selectPlaceholder);
    }

    if (error) {
      base.paddingRight = '70px';
    }

    if (disabled) {
      Object.assign(base, styles.selectDisabled);
    }

    if (error) {
      Object.assign(base, styles.selectError);
      if (focused) {
        Object.assign(base, styles.selectErrorFocused);
      }
    } else if (focused) {
      Object.assign(base, styles.selectFocused);
    }

    return base;
  };

  return (
    <div style={styles.wrapper} class={className}>
      {label && (
        <label htmlFor={name} style={styles.label}>
          {label}
          {required && <span style={styles.requiredMark}>*</span>}
        </label>
      )}

      <div style={styles.selectContainer}>
        <select
          id={name}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          style={buildSelectStyle()}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <div
          style={{
            ...styles.chevronIcon,
            ...(focused ? styles.chevronOpen : {}),
          }}
        >
          <ChevronDown size={18} />
        </div>

        {error && (
          <div style={styles.errorIcon}>
            <AlertCircle size={18} />
          </div>
        )}
      </div>

      {error && (
        <span id={`${name}-error`} style={{ ...styles.message, ...styles.errorMessage }} role="alert">
          {error}
        </span>
      )}

      {!error && hint && (
        <span id={`${name}-hint`} style={{ ...styles.message, ...styles.hintMessage }}>
          {hint}
        </span>
      )}
    </div>
  );
}
