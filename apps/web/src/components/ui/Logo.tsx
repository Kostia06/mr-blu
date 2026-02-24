interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

const SIZE_MAP = {
  sm: 20,
  md: 28,
  lg: 36,
};

const COLOR_MAP = {
  default: 'var(--blu-primary, #0066ff)',
  white: '#ffffff',
};

export function Logo({ size = 'md', variant = 'default' }: LogoProps) {
  return (
    <span style={{
      fontSize: SIZE_MAP[size],
      fontWeight: 800,
      color: COLOR_MAP[variant],
      letterSpacing: -0.5,
      lineHeight: 1,
    }}>
      mrblu
    </span>
  );
}
