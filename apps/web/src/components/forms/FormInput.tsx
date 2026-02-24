import { useState } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div class={cn('flex flex-col gap-1.5', className)}>
      {variant === 'default' && label && (
        <label htmlFor={name} class="text-[15px] font-medium text-gray-700 leading-[1.4]">
          {label}
          {required && <span class="text-[var(--data-red)] ml-0.5">*</span>}
        </label>
      )}

      <div class="relative flex items-center">
        {icon && (
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center text-gray-400 pointer-events-none z-[1]">
            {icon}
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={isFloating ? undefined : placeholder}
          disabled={disabled}
          required={required}
          class={cn(
            'w-full min-h-12 px-[18px] py-3.5 text-base font-[inherit] text-gray-900 bg-white border border-gray-200 rounded-[var(--radius-sm)] outline-none transition-[border-color,box-shadow] duration-200 ease-in-out',
            icon && 'pl-11',
            (success || error) && 'pr-11',
            isFloating && showFloatingLabel && 'pt-[22px] pb-1.5',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            error && 'border-[var(--data-red)]',
            error && focused && 'border-[var(--data-red)] shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
            !error && success && 'border-[var(--data-green,#22c55e)]',
            focused && !error && 'border-[var(--blu-primary)] shadow-[0_0_0_3px_rgba(0,102,255,0.15)]',
          )}
          onInput={handleInput}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        />

        {isFloating && label && (
          <span
            class={cn(
              'absolute left-[18px] top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none transition-all duration-200 ease-in-out origin-left',
              icon && 'left-11',
              showFloatingLabel && 'top-2 translate-y-0 scale-75 text-[var(--blu-primary)]',
            )}
          >
            {label}
            {required && <span class="text-[var(--data-red)] ml-0.5">*</span>}
          </span>
        )}

        {success && !error && (
          <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-[1] text-[var(--data-green,#22c55e)]">
            <Check size={18} />
          </div>
        )}

        {error && (
          <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-[1] text-[var(--data-red)]">
            <AlertCircle size={18} />
          </div>
        )}
      </div>

      {error && (
        <span id={`${name}-error`} class="text-[13px] leading-[1.4] pl-0.5 text-[var(--data-red)]" role="alert">
          {error}
        </span>
      )}

      {!error && hint && (
        <span id={`${name}-hint`} class="text-[13px] leading-[1.4] pl-0.5 text-gray-500">
          {hint}
        </span>
      )}
    </div>
  );
}
