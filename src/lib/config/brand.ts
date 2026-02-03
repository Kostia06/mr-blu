// Centralized brand configuration for Mr. Blue

export const brand = {
	primary: '#0066FF',
	primaryDark: '#0052CC',
	primaryLight: '#3385FF',

	// Text colors
	text: '#1E293B',
	textMuted: '#64748B',
	textLight: '#94A3B8',

	// Border colors
	border: '#E2E8F0',
	borderLight: '#F1F5F9',

	// Background colors
	background: '#FFFFFF',
	backgroundAlt: '#F8FAFC',

	// PDF-specific
	pdfHeader: '#0066FF',
	pdfText: '#1E293B',
	pdfMuted: '#64748B',
	pdfBorder: '#E2E8F0',
	pdfBackground: '#DBE8F4'
} as const;

export type BrandColors = typeof brand;
