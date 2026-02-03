/**
 * Shared Styles for Document Templates
 * Single source of truth for colors, typography, and dimensions
 * Used by both HTML templates and server-side PDF generation
 */

/**
 * Color palette - hex values
 */
export const colors = {
	// Primary brand color
	primary: '#0066FF',

	// Text colors
	text: '#1a1a1a',
	textSecondary: '#6b7280',
	textMuted: '#9ca3af',
	textDark: '#475569',
	textItem: '#334155',

	// Background colors
	bgDocument: '#DBE8F4',
	bgLight: '#f9fafb',
	bgWhite: '#ffffff',

	// Border colors
	border: '#e5e7eb'
} as const;

/**
 * Color palette - RGB tuples for jsPDF
 */
export const colorsRgb = {
	primary: [0, 102, 255] as const,
	text: [26, 26, 26] as const,
	textSecondary: [107, 114, 128] as const,
	textMuted: [156, 163, 175] as const,
	textDark: [71, 85, 105] as const,
	textItem: [51, 65, 85] as const,
	bgLight: [249, 250, 251] as const,
	border: [229, 231, 235] as const,
	white: [255, 255, 255] as const
} as const;

/**
 * Typography
 */
export const typography = {
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
} as const;

/**
 * Document dimensions (in inches for PDF)
 */
export const dimensions: {
	readonly pageWidth: number;
	readonly pageHeight: number;
	readonly margin: number;
	readonly contentWidth: number;
} = {
	pageWidth: 8.5,
	pageHeight: 11,
	margin: 0.75,
	get contentWidth() {
		return this.pageWidth - this.margin * 2;
	}
};

/**
 * Column widths (as percentages)
 */
export const tableColumns = {
	description: 50,
	quantity: 15,
	rate: 15,
	total: 20
} as const;

/**
 * Footer text
 */
export const footerText = 'Powered by Mr Blu';
