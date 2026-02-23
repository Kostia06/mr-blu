import type {
	ExtractedData,
	DocumentIntent,
	ClientData,
	LineItem,
	ActionIntent,
	ScheduleIntent
} from './types';

// Generate unique ID
function generateId(): string {
	return Math.random().toString(36).substring(2, 11);
}

// Parse document type and action from text
function parseDocumentIntents(text: string): DocumentIntent[] {
	const lowerText = text.toLowerCase();
	const documents: DocumentIntent[] = [];

	// Document type patterns
	const docTypes: Array<{ pattern: RegExp; type: DocumentIntent['type'] }> = [
		{ pattern: /\b(invoice|bill)\b/gi, type: 'invoice' },
		{ pattern: /\b(estimate|quote|bid)\b/gi, type: 'estimate' },
		{ pattern: /\breport\b/gi, type: 'report' }
	];

	// Find all document types mentioned
	for (const { pattern, type } of docTypes) {
		const matches = lowerText.match(pattern);
		if (matches) {
			// Determine action for this document type
			let action: DocumentIntent['action'] = 'create';

			// Check for specific action patterns around the document mention
			if (new RegExp(`send\\s+(the\\s+)?${type}`, 'i').test(lowerText)) {
				action = 'send';
			} else if (
				new RegExp(`(just\\s+)?keep\\s+(the\\s+)?${type}`, 'i').test(lowerText) ||
				new RegExp(`${type}.*just\\s+keep`, 'i').test(lowerText) ||
				new RegExp(`save\\s+(the\\s+)?${type}`, 'i').test(lowerText)
			) {
				action = 'keep';
			} else if (new RegExp(`draft\\s+(the\\s+)?${type}`, 'i').test(lowerText)) {
				action = 'draft';
			}

			// Check for "but just keep" pattern which modifies second document
			if (documents.length > 0 && /but\s+just\s+keep/i.test(lowerText)) {
				action = 'keep';
			}

			documents.push({
				type,
				action,
				priority: documents.length + 1
			});
		}
	}

	// Default to invoice if no document type detected
	if (documents.length === 0) {
		documents.push({
			type: 'invoice',
			action: 'create',
			priority: 1
		});
	}

	return documents;
}

// Parse client information
function parseClient(text: string): ClientData {
	const client: ClientData = {
		name: null,
		email: null,
		phone: null,
		address: null
	};

	// Name patterns: "for Mr Jack", "to Sarah", "bill ABC Corp"
	const namePatterns = [
		/(?:for|to|bill)\s+(?:Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
		/(?:Mr\.?|Mrs\.?|Ms\.?)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
		/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)'s\s+(?:invoice|estimate|quote|job|project)/i
	];

	for (const pattern of namePatterns) {
		const match = text.match(pattern);
		if (match) {
			client.name = match[1].trim();
			break;
		}
	}

	// Address pattern: "at 123 Main Street"
	const addressMatch = text.match(
		/at\s+(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct)\.?)/i
	);
	if (addressMatch) {
		client.address = addressMatch[1].trim();
	}

	// Email pattern
	const emailMatch = text.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/);
	if (emailMatch) {
		client.email = emailMatch[1];
	}

	// Phone pattern
	const phoneMatch = text.match(/\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/);
	if (phoneMatch) {
		client.phone = phoneMatch[1];
	}

	return client;
}

// Parse line items from text
function parseLineItems(text: string): LineItem[] {
	const items: LineItem[] = [];
	const lowerText = text.toLowerCase();

	// Pattern: "X hours/days at $Y" or "X hours/days @ $Y"
	const laborPattern =
		/(\d+(?:\.\d+)?)\s*(hours?|hrs?|days?)\s*(?:at|@)\s*\$?(\d+(?:\.\d+)?)\s*(?:per\s+(?:hour|hr|day))?/gi;
	let match;

	while ((match = laborPattern.exec(lowerText)) !== null) {
		const quantity = parseFloat(match[1]);
		const unitType = match[2].toLowerCase().startsWith('d') ? 'days' : 'hours';
		const rate = parseFloat(match[3]);

		items.push({
			id: generateId(),
			description: 'Labor',
			quantity,
			unit: unitType,
			rate,
			amount: quantity * rate,
			isEstimate: false,
			needsReview: false
		});
	}

	// Pattern: "$X for materials/parts/supplies" or "materials/parts about $X"
	const materialPatterns = [
		/\$?(\d+(?:\.\d+)?)\s*(?:for|in|of)\s*(materials?|parts?|supplies?|lumber|wood|hardware)/gi,
		/(materials?|parts?|supplies?|lumber|wood|hardware)\s*(?:about|around|roughly)?\s*\$?(\d+(?:\.\d+)?)/gi
	];

	for (const pattern of materialPatterns) {
		while ((match = pattern.exec(lowerText)) !== null) {
			const isFirstPattern = pattern.source.startsWith('\\$');
			const amount = parseFloat(isFirstPattern ? match[1] : match[2]);
			const description = (isFirstPattern ? match[2] : match[1])
				.replace(/s$/, '')
				.replace(/^./, (c) => c.toUpperCase());

			// Check if "about/around/roughly" indicates estimate
			const isEstimate = /(?:about|around|roughly)\s*\$?\d/i.test(
				text.slice(Math.max(0, match.index - 20), match.index + match[0].length + 10)
			);

			// Avoid duplicates
			if (!items.some((i) => i.description.toLowerCase() === description.toLowerCase())) {
				items.push({
					id: generateId(),
					description,
					quantity: 1,
					unit: 'item',
					rate: amount,
					amount,
					isEstimate,
					needsReview: isEstimate
				});
			}
		}
	}

	// Pattern: "X consulting/service at $Y per hour"
	const servicePattern =
		/(\d+(?:\.\d+)?)\s*(hours?|hrs?)\s*(?:of\s+)?(\w+(?:\s+\w+)?)\s*(?:at|@)\s*\$?(\d+(?:\.\d+)?)/gi;
	while ((match = servicePattern.exec(lowerText)) !== null) {
		const quantity = parseFloat(match[1]);
		const description = match[3].replace(/^./, (c) => c.toUpperCase());
		const rate = parseFloat(match[4]);

		if (!items.some((i) => i.description.toLowerCase() === description.toLowerCase())) {
			items.push({
				id: generateId(),
				description,
				quantity,
				unit: 'hours',
				rate,
				amount: quantity * rate,
				isEstimate: false,
				needsReview: false
			});
		}
	}

	// Pattern: generic "plus $X for description" or "$X description"
	const genericPattern =
		/(?:plus\s+)?\$(\d+(?:\.\d+)?)\s+(?:for\s+)?([a-z][a-z\s]{2,30}?)(?:\.|,|$)/gi;
	while ((match = genericPattern.exec(lowerText)) !== null) {
		const amount = parseFloat(match[1]);
		const description = match[2]
			.trim()
			.replace(/^./, (c) => c.toUpperCase())
			.replace(/\s+$/, '');

		// Skip if it's a tax/gst mention or already captured
		if (
			!/^(tax|gst|hst|pst)$/i.test(description) &&
			!items.some((i) => i.description.toLowerCase() === description.toLowerCase())
		) {
			items.push({
				id: generateId(),
				description,
				quantity: 1,
				unit: 'item',
				rate: amount,
				amount,
				isEstimate: false,
				needsReview: true
			});
		}
	}

	return items;
}

// Parse tax rate
function parseTaxRate(text: string): number | null {
	const lowerText = text.toLowerCase();

	// No tax patterns
	if (/\b(no\s+tax|tax\s*exempt|without\s+tax)\b/i.test(lowerText)) {
		return 0;
	}

	// Specific percentage: "13% tax" or "add 5% gst"
	const percentMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:tax|gst|hst)/i);
	if (percentMatch) {
		return parseFloat(percentMatch[1]) / 100;
	}

	// Generic GST/tax mention (default 5% for Canada)
	if (/\b(gst|add\s+tax|plus\s+tax|with\s+tax)\b/i.test(lowerText)) {
		return 0.05;
	}

	// HST mention (13% for Ontario)
	if (/\bhst\b/i.test(lowerText)) {
		return 0.13;
	}

	return null;
}

// Parse due date
function parseDueDate(text: string): string | null {
	const lowerText = text.toLowerCase();
	const today = new Date();

	// "due in X days/weeks"
	const dueInMatch = lowerText.match(/due\s+in\s+(\d+)\s*(days?|weeks?)/i);
	if (dueInMatch) {
		const num = parseInt(dueInMatch[1]);
		const unit = dueInMatch[2].toLowerCase();
		const date = new Date(today);
		if (unit.startsWith('week')) {
			date.setDate(date.getDate() + num * 7);
		} else {
			date.setDate(date.getDate() + num);
		}
		return date.toISOString().split('T')[0];
	}

	// "net X" (e.g., net 30)
	const netMatch = lowerText.match(/net\s*(\d+)/i);
	if (netMatch) {
		const days = parseInt(netMatch[1]);
		const date = new Date(today);
		date.setDate(date.getDate() + days);
		return date.toISOString().split('T')[0];
	}

	// "due on receipt"
	if (/due\s+on\s+receipt/i.test(lowerText)) {
		return today.toISOString().split('T')[0];
	}

	return null;
}

// Parse schedule intent
function parseSchedule(text: string): ScheduleIntent | null {
	const lowerText = text.toLowerCase();

	// Check for scheduling keywords
	const frequencyMatch = lowerText.match(/every\s+(day|week|two\s+weeks?|bi-?weekly|month)/i);
	if (!frequencyMatch) {
		return null;
	}

	let frequency: ScheduleIntent['frequency'] = 'once';
	const freqText = frequencyMatch[1].toLowerCase();
	if (freqText === 'day') frequency = 'daily';
	else if (freqText === 'week') frequency = 'weekly';
	else if (freqText.includes('two') || freqText.includes('bi')) frequency = 'biweekly';
	else if (freqText === 'month') frequency = 'monthly';

	const today = new Date();
	const startDate = today.toISOString().split('T')[0];

	// Parse end date: "until [date]"
	let endDate: string | null = null;
	const untilMatch = lowerText.match(/until\s+([a-z]+\s+\d+(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i);
	if (untilMatch) {
		try {
			const parsed = new Date(untilMatch[1]);
			if (!isNaN(parsed.getTime())) {
				endDate = parsed.toISOString().split('T')[0];
			} else {
				// Try parsing month day format
				const monthDayMatch = untilMatch[1].match(/([a-z]+)\s+(\d+)/i);
				if (monthDayMatch) {
					const monthNames = [
						'jan',
						'feb',
						'mar',
						'apr',
						'may',
						'jun',
						'jul',
						'aug',
						'sep',
						'oct',
						'nov',
						'dec'
					];
					const monthIndex = monthNames.findIndex((m) =>
						monthDayMatch[1].toLowerCase().startsWith(m)
					);
					if (monthIndex !== -1) {
						const year = today.getFullYear() + (monthIndex < today.getMonth() ? 1 : 0);
						endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(parseInt(monthDayMatch[2])).padStart(2, '0')}`;
					}
				}
			}
		} catch {
			// Invalid date, leave as null
		}
	}

	// Parse occurrence count: "for X weeks/months"
	let occurrences: number | null = null;
	const forMatch = lowerText.match(/for\s+(\d+)\s*(weeks?|months?)/i);
	if (forMatch) {
		occurrences = parseInt(forMatch[1]);
	}

	// Calculate next dates
	const nextDates = calculateScheduleDates(frequency, startDate, endDate, occurrences);

	return {
		frequency,
		startDate,
		endDate,
		repeatUntil: endDate,
		occurrences,
		nextDates
	};
}

// Calculate schedule dates for preview
function calculateScheduleDates(
	frequency: ScheduleIntent['frequency'],
	startDate: string,
	endDate: string | null,
	maxOccurrences: number | null
): string[] {
	const dates: string[] = [];
	const start = new Date(startDate);
	const end = endDate ? new Date(endDate) : null;
	const max = maxOccurrences || 12;

	const current = new Date(start);
	while (dates.length < max) {
		if (end && current > end) break;

		dates.push(current.toISOString().split('T')[0]);

		switch (frequency) {
			case 'daily':
				current.setDate(current.getDate() + 1);
				break;
			case 'weekly':
				current.setDate(current.getDate() + 7);
				break;
			case 'biweekly':
				current.setDate(current.getDate() + 14);
				break;
			case 'monthly':
				current.setMonth(current.getMonth() + 1);
				break;
			default:
				return dates;
		}
	}

	return dates;
}

// Parse action intents
function parseActions(text: string, documents: DocumentIntent[]): ActionIntent[] {
	const lowerText = text.toLowerCase();
	const actions: ActionIntent[] = [];

	for (const doc of documents) {
		if (doc.action === 'send') {
			actions.push({
				action: 'send',
				target: 'client',
				documentType: doc.type,
				condition: null
			});
		} else if (doc.action === 'keep' || doc.action === 'draft') {
			actions.push({
				action: 'save',
				target: 'self',
				documentType: doc.type,
				condition: null
			});
		}
	}

	// Check for scheduling action
	if (/every\s+(day|week|month)/i.test(lowerText)) {
		const scheduledDoc = documents.find((d) => d.action === 'send') || documents[0];
		actions.push({
			action: 'schedule',
			target: 'client',
			documentType: scheduledDoc.type,
			condition: null
		});
	}

	// Check for reminder
	if (/remind\s+me/i.test(lowerText)) {
		actions.push({
			action: 'remind',
			target: 'self',
			documentType: documents[0]?.type || 'invoice',
			condition: null
		});
	}

	return actions;
}

// Calculate confidence scores
function calculateConfidence(data: {
	hasClient: boolean;
	hasItems: boolean;
	itemsHaveTotals: boolean;
	hasDocType: boolean;
}): ExtractedData['confidence'] {
	let overall = 0;

	const clientScore = data.hasClient ? 1 : 0;
	const itemsScore = data.hasItems && data.itemsHaveTotals ? 1 : data.hasItems ? 0.5 : 0;
	const actionsScore = data.hasDocType ? 1 : 0.5;

	overall = clientScore * 0.3 + itemsScore * 0.5 + actionsScore * 0.2;

	return {
		overall,
		client: clientScore,
		items: itemsScore,
		actions: actionsScore
	};
}

// Main parsing function
export function parseTranscription(transcription: string): ExtractedData {
	const documents = parseDocumentIntents(transcription);
	const client = parseClient(transcription);
	const items = parseLineItems(transcription);
	const taxRate = parseTaxRate(transcription);
	const dueDate = parseDueDate(transcription);
	const schedule = parseSchedule(transcription);
	const actions = parseActions(transcription, documents);

	const confidence = calculateConfidence({
		hasClient: !!client.name,
		hasItems: items.length > 0,
		itemsHaveTotals: items.every((i) => i.amount !== null && i.amount > 0),
		hasDocType: documents.length > 0
	});

	return {
		documents,
		client,
		items,
		taxRate,
		discount: null,
		date: new Date().toISOString().split('T')[0],
		dueDate,
		actions,
		schedule,
		rawTranscription: transcription,
		confidence
	};
}

// Generate human-readable summary of parsed data
export function generateSummary(data: ExtractedData): string {
	const parts: string[] = [];

	// Documents
	const docDescriptions = data.documents.map((d) => {
		const action =
			d.action === 'send'
				? 'send'
				: d.action === 'keep'
					? 'save as draft'
					: d.action === 'draft'
						? 'create as draft'
						: 'create';
		return `${action} ${d.type}`;
	});

	if (docDescriptions.length === 1) {
		parts.push(docDescriptions[0].charAt(0).toUpperCase() + docDescriptions[0].slice(1));
	} else {
		parts.push(
			docDescriptions.slice(0, -1).join(', ') +
				' and ' +
				docDescriptions[docDescriptions.length - 1]
		);
	}

	// Client
	if (data.client.name) {
		parts.push(`for ${data.client.name}`);
	}

	// Items summary
	if (data.items.length > 0) {
		const total = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
		const itemCount = data.items.length;
		parts.push(`with ${itemCount} item${itemCount > 1 ? 's' : ''} totaling $${total.toFixed(2)}`);
	}

	// Tax
	if (data.taxRate && data.taxRate > 0) {
		parts.push(`plus ${(data.taxRate * 100).toFixed(0)}% GST`);
	}

	// Schedule
	if (data.schedule) {
		parts.push(
			`${data.schedule.frequency}${data.schedule.endDate ? ` until ${new Date(data.schedule.endDate).toLocaleDateString()}` : ''}`
		);
	}

	return parts.join(' ') + '.';
}
