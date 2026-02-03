// Tax System Types
// Multi-tax support with Canadian provincial presets

// =============================================
// TAX TYPE CODES
// =============================================

export type TaxTypeCode = 'GST' | 'PST' | 'HST' | 'QST' | 'CUSTOM';
export type TaxCalculationMode = 'exclusive' | 'inclusive';

export type CanadianProvince =
	| 'AB'
	| 'BC'
	| 'SK'
	| 'MB'
	| 'ON'
	| 'QC'
	| 'NB'
	| 'NS'
	| 'PE'
	| 'NL'
	| 'NT'
	| 'YT'
	| 'NU';

// =============================================
// TAX COMPONENT
// =============================================

export interface TaxComponent {
	type: TaxTypeCode;
	name?: string;
	rate: number; // Percentage (5 = 5%)
	isExempt?: boolean;
	exemptionReason?: string;
}

// =============================================
// REGIONAL PRESET
// =============================================

export interface RegionalTaxPreset {
	id: string;
	regionCode: CanadianProvince | string;
	regionName: string;
	countryCode: string;
	taxes: TaxComponent[];
	effectiveRate: number;
	isActive: boolean;
}

// =============================================
// USER TAX SETTINGS
// =============================================

export interface UserTaxSettings {
	defaultTaxRegion: CanadianProvince | string | null;
	defaultTaxConfig: TaxComponent[] | null;
	taxCalculationMode: TaxCalculationMode;
	taxRegistrationNumbers?: TaxRegistrationNumbers;
}

export interface TaxRegistrationNumbers {
	gst?: string;
	pst?: string;
	hst?: string;
	qst?: string;
	custom?: string;
}

// =============================================
// INVOICE TAX
// =============================================

export interface InvoiceTax {
	id: string;
	invoiceId: string;
	taxTypeCode: TaxTypeCode;
	taxName: string;
	rate: number;
	amount: number;
	isExempt: boolean;
	exemptionReason?: string;
	sequenceOrder: number;
}

// =============================================
// CALCULATION RESULTS
// =============================================

export interface TaxCalculationResult {
	subtotal: number;
	taxBreakdown: TaxBreakdownItem[];
	totalTax: number;
	grandTotal: number;
	mode: TaxCalculationMode;
}

export interface TaxBreakdownItem {
	type: TaxTypeCode;
	name: string;
	rate: number;
	amount: number;
	isExempt: boolean;
	exemptionReason?: string;
}

// =============================================
// TAX EXEMPTION
// =============================================

export type TaxExemptionReason =
	| 'first_nations'
	| 'export'
	| 'resale'
	| 'non_profit'
	| 'government'
	| 'diplomatic'
	| 'other';

export interface TaxExemption {
	type: 'invoice' | 'item';
	reason: TaxExemptionReason;
	description?: string;
	documentReference?: string;
}

// =============================================
// VOICE COMMAND TAX INTENT
// =============================================

export interface ParsedTaxIntent {
	hasTax: boolean;
	region?: CanadianProvince | string;
	taxes?: TaxComponent[];
	isExempt?: boolean;
	exemptionReason?: TaxExemptionReason;
	calculationMode?: TaxCalculationMode;
	customRate?: number;
}

// =============================================
// CANADIAN PROVINCIAL PRESETS (Static Reference)
// =============================================

export const CANADIAN_TAX_PRESETS: Record<CanadianProvince, TaxComponent[]> = {
	AB: [{ type: 'GST', name: 'GST', rate: 5 }],
	BC: [
		{ type: 'GST', name: 'GST', rate: 5 },
		{ type: 'PST', name: 'PST', rate: 7 }
	],
	SK: [
		{ type: 'GST', name: 'GST', rate: 5 },
		{ type: 'PST', name: 'PST', rate: 6 }
	],
	MB: [
		{ type: 'GST', name: 'GST', rate: 5 },
		{ type: 'PST', name: 'PST', rate: 7 }
	],
	ON: [{ type: 'HST', name: 'HST', rate: 13 }],
	QC: [
		{ type: 'GST', name: 'GST', rate: 5 },
		{ type: 'QST', name: 'QST', rate: 9.975 }
	],
	NB: [{ type: 'HST', name: 'HST', rate: 15 }],
	NS: [{ type: 'HST', name: 'HST', rate: 15 }],
	PE: [{ type: 'HST', name: 'HST', rate: 15 }],
	NL: [{ type: 'HST', name: 'HST', rate: 15 }],
	NT: [{ type: 'GST', name: 'GST', rate: 5 }],
	YT: [{ type: 'GST', name: 'GST', rate: 5 }],
	NU: [{ type: 'GST', name: 'GST', rate: 5 }]
};

export const CANADIAN_PROVINCE_NAMES: Record<CanadianProvince, string> = {
	AB: 'Alberta',
	BC: 'British Columbia',
	SK: 'Saskatchewan',
	MB: 'Manitoba',
	ON: 'Ontario',
	QC: 'Quebec',
	NB: 'New Brunswick',
	NS: 'Nova Scotia',
	PE: 'Prince Edward Island',
	NL: 'Newfoundland and Labrador',
	NT: 'Northwest Territories',
	YT: 'Yukon',
	NU: 'Nunavut'
};

// =============================================
// TAX CALCULATION FUNCTIONS
// =============================================

/**
 * Calculate taxes for a subtotal with multiple tax components
 */
export function calculateTaxes(
	subtotal: number,
	taxes: TaxComponent[],
	mode: TaxCalculationMode = 'exclusive'
): TaxCalculationResult {
	if (mode === 'inclusive') {
		return calculateTaxesInclusive(subtotal, taxes);
	}
	return calculateTaxesExclusive(subtotal, taxes);
}

/**
 * Calculate taxes when prices are exclusive of tax (add tax to price)
 */
function calculateTaxesExclusive(subtotal: number, taxes: TaxComponent[]): TaxCalculationResult {
	const taxBreakdown: TaxBreakdownItem[] = taxes.map((tax) => {
		const isExempt = tax.isExempt ?? false;
		const amount = isExempt ? 0 : roundCurrency(subtotal * (tax.rate / 100));

		return {
			type: tax.type,
			name: tax.name || tax.type,
			rate: tax.rate,
			amount,
			isExempt,
			exemptionReason: tax.exemptionReason
		};
	});

	const totalTax = taxBreakdown.reduce((sum, item) => sum + item.amount, 0);
	const grandTotal = roundCurrency(subtotal + totalTax);

	return {
		subtotal,
		taxBreakdown,
		totalTax,
		grandTotal,
		mode: 'exclusive'
	};
}

/**
 * Calculate taxes when prices include tax (back-calculate)
 */
function calculateTaxesInclusive(
	totalWithTax: number,
	taxes: TaxComponent[]
): TaxCalculationResult {
	// Calculate combined tax rate
	const combinedRate = taxes.reduce((sum, tax) => {
		if (tax.isExempt) return sum;
		return sum + tax.rate / 100;
	}, 0);

	// Back-calculate subtotal
	const subtotal = roundCurrency(totalWithTax / (1 + combinedRate));

	// Calculate individual tax amounts
	const taxBreakdown: TaxBreakdownItem[] = taxes.map((tax) => {
		const isExempt = tax.isExempt ?? false;
		const amount = isExempt ? 0 : roundCurrency(subtotal * (tax.rate / 100));

		return {
			type: tax.type,
			name: tax.name || tax.type,
			rate: tax.rate,
			amount,
			isExempt,
			exemptionReason: tax.exemptionReason
		};
	});

	const totalTax = taxBreakdown.reduce((sum, item) => sum + item.amount, 0);

	return {
		subtotal,
		taxBreakdown,
		totalTax,
		grandTotal: totalWithTax,
		mode: 'inclusive'
	};
}

/**
 * Get the effective combined tax rate for a set of tax components
 */
export function getEffectiveRate(taxes: TaxComponent[]): number {
	return taxes.reduce((sum, tax) => {
		if (tax.isExempt) return sum;
		return sum + tax.rate;
	}, 0);
}

/**
 * Get taxes for a Canadian province
 */
export function getTaxesForProvince(province: CanadianProvince): TaxComponent[] {
	return CANADIAN_TAX_PRESETS[province] || [];
}

/**
 * Get province from various input formats
 */
export function parseProvince(input: string): CanadianProvince | null {
	const normalized = input.trim().toUpperCase();

	// Direct province code match
	if (normalized in CANADIAN_TAX_PRESETS) {
		return normalized as CanadianProvince;
	}

	// Province name match
	for (const [code, name] of Object.entries(CANADIAN_PROVINCE_NAMES)) {
		if (name.toUpperCase() === normalized || name.toUpperCase().includes(normalized)) {
			return code as CanadianProvince;
		}
	}

	return null;
}

/**
 * Parse tax-related voice commands
 */
export function parseTaxIntent(transcription: string): ParsedTaxIntent {
	const text = transcription.toLowerCase();

	// Check for tax exemption
	if (
		text.includes('no tax') ||
		text.includes('tax free') ||
		text.includes('tax exempt') ||
		text.includes('exempt')
	) {
		const exemptionReason = detectExemptionReason(text);
		return {
			hasTax: false,
			isExempt: true,
			exemptionReason
		};
	}

	// Check for inclusive pricing
	const isInclusive =
		text.includes('includes tax') ||
		text.includes('price includes') ||
		text.includes('tax included') ||
		text.includes('with tax included');

	// Check for provincial references
	const province = detectProvince(text);
	if (province) {
		return {
			hasTax: true,
			region: province,
			taxes: getTaxesForProvince(province),
			calculationMode: isInclusive ? 'inclusive' : 'exclusive'
		};
	}

	// Check for specific tax types
	const taxes: TaxComponent[] = [];

	// HST
	if (text.includes('hst')) {
		const rate = detectTaxRate(text, 'hst') || 13;
		taxes.push({ type: 'HST', name: 'HST', rate });
	}

	// GST
	if (text.includes('gst') && !text.includes('hst')) {
		taxes.push({ type: 'GST', name: 'GST', rate: 5 });
	}

	// PST
	if (text.includes('pst')) {
		const rate = detectTaxRate(text, 'pst') || 7;
		taxes.push({ type: 'PST', name: 'PST', rate });
	}

	// QST
	if (text.includes('qst') || text.includes('tvq')) {
		taxes.push({ type: 'QST', name: 'QST', rate: 9.975 });
	}

	// Custom tax rate
	const customRate = detectCustomTaxRate(text);
	if (customRate && taxes.length === 0) {
		taxes.push({ type: 'CUSTOM', name: 'Tax', rate: customRate });
	}

	if (taxes.length > 0) {
		return {
			hasTax: true,
			taxes,
			calculationMode: isInclusive ? 'inclusive' : 'exclusive'
		};
	}

	// Default: no specific tax mentioned
	return { hasTax: false };
}

/**
 * Detect province from voice transcription
 */
function detectProvince(text: string): CanadianProvince | null {
	const provincePatterns: { pattern: RegExp; province: CanadianProvince }[] = [
		{ pattern: /\b(ontario|ont|on)\s*(tax|taxes)?/i, province: 'ON' },
		{ pattern: /\b(bc|british columbia)\s*(tax|taxes)?/i, province: 'BC' },
		{ pattern: /\b(alberta|ab)\s*(tax|taxes)?/i, province: 'AB' },
		{ pattern: /\b(quebec|qc|qu[ée]bec)\s*(tax|taxes)?/i, province: 'QC' },
		{ pattern: /\b(manitoba|mb)\s*(tax|taxes)?/i, province: 'MB' },
		{ pattern: /\b(saskatchewan|sask|sk)\s*(tax|taxes)?/i, province: 'SK' },
		{ pattern: /\b(nova scotia|ns)\s*(tax|taxes)?/i, province: 'NS' },
		{ pattern: /\b(new brunswick|nb)\s*(tax|taxes)?/i, province: 'NB' },
		{ pattern: /\b(newfoundland|nfld|nl)\s*(tax|taxes)?/i, province: 'NL' },
		{ pattern: /\b(pei|prince edward|pe)\s*(tax|taxes)?/i, province: 'PE' },
		{ pattern: /\b(yukon|yt)\s*(tax|taxes)?/i, province: 'YT' },
		{ pattern: /\b(nwt|northwest|nt)\s*(tax|taxes)?/i, province: 'NT' },
		{ pattern: /\b(nunavut|nu)\s*(tax|taxes)?/i, province: 'NU' }
	];

	for (const { pattern, province } of provincePatterns) {
		if (pattern.test(text)) {
			return province;
		}
	}

	return null;
}

/**
 * Detect tax rate from specific tax type mention
 */
function detectTaxRate(text: string, taxType: string): number | null {
	const pattern = new RegExp(
		`(\\d+(?:\\.\\d+)?)\\s*%?\\s*${taxType}|${taxType}\\s*(\\d+(?:\\.\\d+)?)\\s*%?`,
		'i'
	);
	const match = text.match(pattern);
	if (match) {
		const rate = parseFloat(match[1] || match[2]);
		if (!isNaN(rate) && rate > 0 && rate <= 100) {
			return rate;
		}
	}
	return null;
}

/**
 * Detect custom tax rate from transcription
 */
function detectCustomTaxRate(text: string): number | null {
	// Match patterns like "plus 8% tax" or "with 10 percent tax"
	const patterns = [
		/plus\s+(\d+(?:\.\d+)?)\s*%?\s*(tax|percent)/i,
		/with\s+(\d+(?:\.\d+)?)\s*%?\s*(tax|percent)/i,
		/(\d+(?:\.\d+)?)\s*%\s*tax/i,
		/(\d+(?:\.\d+)?)\s*percent\s*tax/i
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match) {
			const rate = parseFloat(match[1]);
			if (!isNaN(rate) && rate > 0 && rate <= 100) {
				return rate;
			}
		}
	}

	return null;
}

/**
 * Detect exemption reason from transcription
 */
function detectExemptionReason(text: string): TaxExemptionReason | undefined {
	if (text.includes('first nation') || text.includes('indigenous') || text.includes('native')) {
		return 'first_nations';
	}
	if (text.includes('export') || text.includes('international')) {
		return 'export';
	}
	if (text.includes('resale') || text.includes('reseller')) {
		return 'resale';
	}
	if (text.includes('non-profit') || text.includes('nonprofit') || text.includes('charity')) {
		return 'non_profit';
	}
	if (text.includes('government') || text.includes('federal') || text.includes('provincial')) {
		return 'government';
	}
	if (text.includes('diplomatic') || text.includes('embassy') || text.includes('consulate')) {
		return 'diplomatic';
	}
	return undefined;
}

/**
 * Round to currency precision (2 decimal places)
 */
function roundCurrency(amount: number): number {
	return Math.round(amount * 100) / 100;
}

/**
 * Format tax component for display
 */
export function formatTaxComponent(tax: TaxComponent): string {
	const name = tax.name || tax.type;
	return `${name} (${tax.rate}%)`;
}

/**
 * Format tax breakdown item for display
 */
export function formatTaxBreakdownItem(item: TaxBreakdownItem): string {
	if (item.isExempt) {
		return `${item.name}: Exempt${item.exemptionReason ? ` (${item.exemptionReason})` : ''}`;
	}
	return `${item.name} (${item.rate}%): $${item.amount.toFixed(2)}`;
}

/**
 * Convert database record to TaxComponent
 */
export function dbRecordToTaxComponent(record: {
	tax_type_code: string;
	tax_name: string;
	rate: number;
	is_exempt?: boolean;
	exemption_reason?: string;
}): TaxComponent {
	return {
		type: record.tax_type_code as TaxTypeCode,
		name: record.tax_name,
		rate: record.rate,
		isExempt: record.is_exempt,
		exemptionReason: record.exemption_reason
	};
}

/**
 * Convert TaxComponent to database record format
 */
export function taxComponentToDbRecord(tax: TaxComponent): {
	tax_type_code: string;
	tax_name: string;
	rate: number;
	is_exempt: boolean;
	exemption_reason: string | null;
} {
	return {
		tax_type_code: tax.type,
		tax_name: tax.name || tax.type,
		rate: tax.rate,
		is_exempt: tax.isExempt ?? false,
		exemption_reason: tax.exemptionReason ?? null
	};
}
