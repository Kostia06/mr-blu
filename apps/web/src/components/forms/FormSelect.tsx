import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div class={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={name} class="text-[15px] font-medium text-[var(--gray-700)] leading-[1.4]">
          {label}
          {required && <span class="text-[var(--data-red)] ml-0.5">*</span>}
        </label>
      )}

      <div class="relative flex items-center">
        <select
          id={name}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          class={cn(
            'w-full min-h-12 py-3.5 pl-[18px] pr-11 text-base font-[inherit] text-[var(--gray-900)] bg-white/60 backdrop-blur-[8px] border border-white/50 rounded-[var(--radius-input,12px)] outline-none appearance-none cursor-pointer transition-[border-color,box-shadow] duration-200 ease-in-out',
            !value && placeholder && 'text-[var(--gray-400)]',
            error && 'pr-[70px]',
            disabled && 'opacity-50 cursor-not-allowed bg-[var(--gray-50,#f9fafb)]',
            error && 'border-[var(--data-red)]',
            error && focused && 'border-[var(--data-red)] shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
            !error && focused && 'border-[var(--blu-primary)] shadow-[0_0_0_3px_rgba(0,102,255,0.15)]',
          )}
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
          class={cn(
            'absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-[var(--gray-400)] pointer-events-none transition-transform duration-200 ease-in-out',
            focused && '-translate-y-1/2 rotate-180',
          )}
        >
          <ChevronDown size={18} />
        </div>

        {error && (
          <div class="absolute right-10 top-1/2 -translate-y-1/2 flex items-center text-[var(--data-red)] pointer-events-none">
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
        <span id={`${name}-hint`} class="text-[13px] leading-[1.4] pl-0.5 text-[var(--gray-500)]">
          {hint}
        </span>
      )}
    </div>
  );
}
