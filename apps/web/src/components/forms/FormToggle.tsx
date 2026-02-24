import type { ComponentChildren } from 'preact';

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

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
  },
  wrapperDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  cardWrapper: {
    padding: '16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--gray-200)',
    backgroundColor: 'var(--white, #fff)',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
  },
  cardWrapperChecked: {
    borderColor: 'var(--blu-primary)',
    backgroundColor: 'rgba(0,102,255,0.04)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    minWidth: 0,
  },
  label: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--gray-900)',
    lineHeight: 1.4,
  },
  description: {
    fontSize: 13,
    color: 'var(--gray-500)',
    lineHeight: 1.5,
  },
  track: {
    position: 'relative' as const,
    flexShrink: 0,
    borderRadius: '9999px',
    backgroundColor: 'var(--gray-200)',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
  },
  trackChecked: {
    backgroundColor: 'var(--blu-primary)',
  },
  thumb: {
    position: 'absolute' as const,
    top: '50%',
    borderRadius: '50%',
    backgroundColor: 'var(--white, #fff)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease',
  },
  hiddenInput: {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap' as const,
    borderWidth: 0,
  },
};

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

  const wrapperStyle: Record<string, string | number> = {
    ...styles.wrapper,
    ...(isCard ? styles.cardWrapper : {}),
    ...(isCard && checked ? styles.cardWrapperChecked : {}),
    ...(disabled ? styles.wrapperDisabled : {}),
  };

  const trackStyle: Record<string, string | number> = {
    ...styles.track,
    width: track.width,
    height: track.height,
    ...(checked ? styles.trackChecked : {}),
  };

  const thumbStyle: Record<string, string | number> = {
    ...styles.thumb,
    width: thumb.size,
    height: thumb.size,
    transform: checked
      ? `translateY(-50%) translateX(${translateDistance}px)`
      : 'translateY(-50%) translateX(0px)',
    left: thumb.offset,
  };

  return (
    <div
      style={wrapperStyle}
      class={className}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {(label || description) && (
        <div style={styles.content}>
          {label && <span style={styles.label}>{label}</span>}
          {description && <span style={styles.description}>{description}</span>}
        </div>
      )}

      <div style={trackStyle}>
        <div style={thumbStyle} />
      </div>

      {name && (
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          style={styles.hiddenInput}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
