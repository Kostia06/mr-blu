import { useState } from 'preact/hooks';
import { cn } from './cn';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_STYLES: Record<AvatarSize, { width: string; height: string; fontSize: string }> = {
  xs: { width: 'var(--avatar-xs)', height: 'var(--avatar-xs)', fontSize: 'var(--text-xs)' },
  sm: { width: 'var(--avatar-sm)', height: 'var(--avatar-sm)', fontSize: 'var(--text-sm)' },
  md: { width: 'var(--avatar-md)', height: 'var(--avatar-md)', fontSize: 'var(--text-base)' },
  lg: { width: 'var(--avatar-lg)', height: 'var(--avatar-lg)', fontSize: 'var(--text-xl)' },
  xl: { width: 'var(--avatar-xl)', height: 'var(--avatar-xl)', fontSize: 'var(--text-2xl)' },
  '2xl': { width: 'var(--avatar-2xl)', height: 'var(--avatar-2xl)', fontSize: 'var(--text-3xl)' },
  '3xl': { width: 'var(--avatar-3xl)', height: 'var(--avatar-3xl)', fontSize: 'var(--text-4xl)' },
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getGradientIndex(name: string): number {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 6) + 1;
}

const CONTAINER_STYLE: Record<string, string> = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-full)',
  overflow: 'hidden',
  flexShrink: '0',
};

const FALLBACK_STYLE: Record<string, string> = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--glass-white-90)',
  letterSpacing: 'var(--tracking-wide)',
  textShadow: '0 1px 2px var(--glass-black-20)',
};

export function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = getInitials(name);
  const gradientIndex = getGradientIndex(name);
  const sizeStyle = SIZE_STYLES[size];

  const showImage = src && !imageError;

  return (
    <div class={cn(className)} style={{ ...CONTAINER_STYLE, ...sizeStyle }}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            ...FALLBACK_STYLE,
            background: `var(--avatar-gradient-${gradientIndex})`,
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
