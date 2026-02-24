import { useState } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { AlertCircle, Check } from 'lucide-react';

type InputType = 'text' | 'email' | 'tel' | 'number' | 'password' | 'date' | 'url';
type InputVariant = 'default' | 'floating';

interface FormInputProps {
  label?: string;
  name: string;
  type?: InputType;
  value?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  success?: boolean;
  variant?: InputVariant;
  icon?: ComponentChildren;
  className?: string;
  onInput?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  onBlur?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
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
  inputContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'absolute' as const,
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--gray-400)',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  statusIcon: {
    position: 'absolute' as const,
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  input: {
    width: '100%',
    minHeight: 48,
    padding: '14px 18px',
    fontSize: 16,
    fontFamily: 'inherit',
    color: 'var(--gray-900)',
    backgroundColor: 'var(--white, #fff)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  inputFocused: {
    borderColor: 'var(--blu-primary)',
    boxShadow: '0 0 0 3px rgba(0,102,255,0.15)',
  },
  inputError: {
    borderColor: 'var(--data-red)',
  },
  inputErrorFocused: {
    borderColor: 'var(--data-red)',
    boxShadow: '0 0 0 3px rgba(239,68,68,0.15)',
  },
  inputSuccess: {
    borderColor: 'var(--data-green, #22c55e)',
  },
  inputDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: 'var(--gray-50, #f9fafb)',
  },
  floatingLabel: {
    position: 'absolute' as const,
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 16,
    color: 'var(--gray-400)',
    pointerEvents: 'none' as const,
    transition: 'all 0.2s ease',
    transformOrigin: 'left center',
  },
  floatingLabelActive: {
    top: '8px',
    transform: 'translateY(0) scale(0.75)',
    color: 'var(--blu-primary)',
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

export function FormInput({
  label,
  name,
  type = 'text',
  value = '',
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  success = false,
  variant = 'default',
  icon,
  className,
  onInput,
  onChange,
  onBlur,
  onValueChange,
}: FormInputProps) {
  const [focused, setFocused] = useState(false);

  const hasValue = value.length > 0;
  const showFloatingLabel = variant === 'floating' && (focused || hasValue);
  const isFloating = variant === 'floating';

  const handleInput = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    onInput?.(event);
    onValueChange?.(event.currentTarget.value);
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  const buildInputStyle = (): Record<string, string | number> => {
    const base: Record<string, string | number> = { ...styles.input };

    if (icon) {
      base.paddingLeft = '44px';
    }

    if (success || error) {
      base.paddingRight = '44px';
    }

    if (isFloating && showFloatingLabel) {
      base.paddingTop = '22px';
      base.paddingBottom = '6px';
    }

    if (disabled) {
      Object.assign(base, styles.inputDisabled);
    }

    if (error) {
      Object.assign(base, styles.inputError);
      if (focused) {
        Object.assign(base, styles.inputErrorFocused);
      }
    } else if (success) {
      Object.assign(base, styles.inputSuccess);
    }

    if (focused && !error) {
      Object.assign(base, styles.inputFocused);
    }

    return base;
  };

  return (
    <div style={styles.wrapper} class={className}>
      {variant === 'default' && label && (
        <label htmlFor={name} style={styles.label}>
          {label}
          {required && <span style={styles.requiredMark}>*</span>}
        </label>
      )}

      <div style={styles.inputContainer}>
        {icon && <div style={styles.iconWrapper}>{icon}</div>}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={isFloating ? undefined : placeholder}
          disabled={disabled}
          required={required}
          style={buildInputStyle()}
          onInput={handleInput}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        />

        {isFloating && label && (
          <span
            style={{
              ...styles.floatingLabel,
              ...(showFloatingLabel ? styles.floatingLabelActive : {}),
              ...(icon ? { left: '44px' } : {}),
            }}
          >
            {label}
            {required && <span style={styles.requiredMark}>*</span>}
          </span>
        )}

        {success && !error && (
          <div style={{ ...styles.statusIcon, color: 'var(--data-green, #22c55e)' }}>
            <Check size={18} />
          </div>
        )}

        {error && (
          <div style={{ ...styles.statusIcon, color: 'var(--data-red)' }}>
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
