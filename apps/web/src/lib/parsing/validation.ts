import type { TemplateData, ValidationResult, ValidationErrors } from './types';

// Validation rules
export function validateTemplateData(data: Partial<TemplateData>): ValidationResult {
	const errors: ValidationErrors = {};
	const warnings: ValidationErrors = {};

	// Required: Document type
	if (!data.documentType) {
		errors.documentType = 'Document type is required';
	}

	// Required: Document number
	if (!data.documentNumber || data.documentNumber.trim() === '') {
		errors.documentNumber = 'Document number is required';
	}

	// Required: Client name
	if (!data.billTo?.name || data.billTo.name.trim() === '') {
		errors['billTo.name'] = 'Client name is required';
	}

	// Required: Business name
	if (!data.from?.businessName || data.from.businessName.trim() === '') {
		errors['from.businessName'] = 'Business name is required';
	}

	// Required: At least one item
	if (!data.items || data.items.length === 0) {
		errors.items = 'Add at least one line item';
	} else {
		// Validate each item
		data.items.forEach((item, index) => {
			if (!item.description || item.description.trim() === '') {
				errors[`items.${index}.description`] = 'Description is required';
			}
			if (item.total === undefined || item.total === null || item.total <= 0) {
				errors[`items.${index}.total`] = 'Total must be greater than 0';
			}
		});
	}

	// Warnings: Email for sending
	if (!data.billTo?.email) {
		warnings['billTo.email'] = 'Email needed to send document';
	} else if (!isValidEmail(data.billTo.email)) {
		errors['billTo.email'] = 'Invalid email format';
	}

	// Warnings: Large total
	if (data.total && data.total > 50000) {
		warnings.total = 'Large amount - please verify';
	}

	// Validate phone format if provided
	if (data.billTo?.phone && !isValidPhone(data.billTo.phone)) {
		warnings['billTo.phone'] = 'Phone format may be incorrect';
	}

	// Validate GST rate
	if (data.gstRate !== undefined && data.gstRate !== null) {
		if (data.gstRate < 0 || data.gstRate > 0.3) {
			errors.gstRate = 'GST rate must be between 0% and 30%';
		}
	}

	return {
		success: Object.keys(errors).length === 0,
		errors,
		warnings
	};
}

// Validate for sending (stricter requirements)
export function validateForSending(data: Partial<TemplateData>): ValidationResult {
	const baseResult = validateTemplateData(data);

	// Email is required for sending
	if (!data.billTo?.email) {
		baseResult.errors['billTo.email'] = 'Email is required to send document';
		baseResult.success = false;
	}

	return baseResult;
}

// Helper: Email validation
function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Helper: Phone validation (flexible for different formats)
function isValidPhone(phone: string): boolean {
	// Remove common separators and check if mostly digits
	const digitsOnly = phone.replace(/[\s\-().+]/g, '');
	return /^\d{10,15}$/.test(digitsOnly);
}

// Get list of missing required fields
export function getMissingRequiredFields(data: Partial<TemplateData>): string[] {
	const missing: string[] = [];

	if (!data.billTo?.name) missing.push('Client name');
	if (!data.from?.businessName) missing.push('Business name');
	if (!data.items || data.items.length === 0) missing.push('Line items');
	if (!data.documentNumber) missing.push('Document number');

	return missing;
}

// Check if document can be generated (minimum requirements)
export function canGenerate(data: Partial<TemplateData>): boolean {
	return !!(
		data.documentType &&
		data.documentNumber &&
		data.billTo?.name &&
		data.from?.businessName &&
		data.items &&
		data.items.length > 0 &&
		data.items.every((item) => item.description && item.total && item.total > 0)
	);
}

// Check if document can be sent
export function canSend(data: Partial<TemplateData>): boolean {
	return canGenerate(data) && !!data.billTo?.email && isValidEmail(data.billTo.email);
}
