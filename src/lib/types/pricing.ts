export type PriceCategory =
	| 'material'
	| 'labor'
	| 'service'
	| 'tools'
	| 'equipment'
	| 'rental'
	| 'permit'
	| 'disposal'
	| 'other';

export type PriceSource = 'manual' | 'voice' | 'import';

export interface PriceItem {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	category: PriceCategory;
	unit_price: number;
	unit: string;
	currency: string;
	min_price: number | null;
	max_price: number | null;
	times_used: number;
	last_used_at: string | null;
	source: PriceSource;
	created_at: string;
	updated_at: string;
}

export interface PriceMatch extends PriceItem {
	similarity: number;
	confidence: number;
}

export const PRICE_CATEGORIES: PriceCategory[] = [
	'material',
	'labor',
	'service',
	'tools',
	'equipment',
	'rental',
	'permit',
	'disposal',
	'other'
];

export function inferCategory(description: string): PriceCategory {
	const desc = description.toLowerCase();

	const patterns: Array<{ keywords: string[]; category: PriceCategory }> = [
		{
			keywords: [
				'wood',
				'lumber',
				'tile',
				'concrete',
				'drywall',
				'insulation',
				'carpet',
				'vinyl',
				'laminate',
				'hardwood',
				'redwood',
				'siding',
				'roofing',
				'shingle',
				'brick',
				'stone',
				'gravel',
				'sand',
				'mulch',
				'pipe',
				'wire',
				'panel',
				'board',
				'plywood',
				'stucco'
			],
			category: 'material'
		},
		{
			keywords: ['labor', 'work', 'hour', 'hourly', 'man-hour', 'crew', 'helper', 'assistant'],
			category: 'labor'
		},
		{
			keywords: [
				'install',
				'repair',
				'maintenance',
				'cleaning',
				'inspection',
				'consultation',
				'design',
				'demolition',
				'removal',
				'hauling',
				'delivery',
				'setup',
				'service',
				'painting',
				'staining',
				'sealing',
				'waterproofing',
				'landscaping',
				'plumbing',
				'electrical',
				'hvac',
				'flooring',
				'fencing',
				'deck',
				'trim'
			],
			category: 'service'
		},
		{ keywords: ['tool', 'blade', 'bit', 'saw', 'drill', 'sander'], category: 'tools' },
		{
			keywords: ['excavator', 'loader', 'crane', 'scaffold', 'lift', 'compressor', 'generator'],
			category: 'equipment'
		},
		{ keywords: ['rent', 'rental', 'lease'], category: 'rental' },
		{ keywords: ['permit', 'license', 'inspection fee', 'filing'], category: 'permit' },
		{ keywords: ['disposal', 'dump', 'waste', 'trash', 'debris'], category: 'disposal' }
	];

	for (const { keywords, category } of patterns) {
		if (keywords.some((kw) => desc.includes(kw))) {
			return category;
		}
	}

	return 'other';
}
