import { cn } from '@/lib/utils';

type ToggleSize = 'sm' | 'md';
type ToggleVariant = 'default' | 'card';

interface FormToggleProps {
  label?: string;
  description?: string;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  size?: ToggleSize;
  variant?: ToggleVariant;
  className?: string;
  onChange?: (checked: boolean) => void;
}

const TRACK_SIZES = {
  sm: { width: 40, height: 24 },
  md: { width: 48, height: 28 },
} as const;

const THUMB_SIZES = {
  sm: { size: 18, offset: 3 },
  md: { size: 22, offset: 3 },
} as const;

export function FormToggle({
  label,
  description,
  name,
  checked = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  className,
  onChange,
}: FormToggleProps) {
  const track = TRACK_SIZES[size];
  const thumb = THUMB_SIZES[size];
  const translateDistance = track.width - thumb.size - thumb.offset * 2;

  const handleClick = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onChange?.(!checked);
    }
  };

  const isCard = variant === 'card';

  return (
    <div
      class={cn(
        'flex items-start gap-3 cursor-pointer',
        isCard && 'p-4 rounded-[var(--radius-input,12px)] border border-white/50 bg-white/60 backdrop-blur-[8px] transition-[border-color,background-color] duration-200 ease-in-out',
        isCard && checked && 'border-[var(--blu-primary)] bg-[rgba(0,102,255,0.04)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {(label || description) && (
        <div class="flex-1 flex flex-col gap-0.5 min-w-0">
          {label && <span class="text-[15px] font-medium text-[var(--gray-900)] leading-[1.4]">{label}</span>}
          {description && <span class="text-[13px] text-[var(--gray-500)] leading-normal">{description}</span>}
        </div>
      )}

      <div
        class={cn(
          'relative shrink-0 rounded-full bg-[var(--gray-200)] transition-colors duration-200 ease-in-out cursor-pointer',
          checked && 'bg-[var(--blu-primary)]',
        )}
        style={{ width: track.width, height: track.height }}
      >
        <div
          class="absolute top-1/2 rounded-full bg-[var(--white,#fff)] shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-in-out"
          style={{
            width: thumb.size,
            height: thumb.size,
            left: thumb.offset,
            transform: checked
              ? `translateY(-50%) translateX(${translateDistance}px)`
              : 'translateY(-50%) translateX(0px)',
          }}
        />
      </div>

      {name && (
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          class="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
