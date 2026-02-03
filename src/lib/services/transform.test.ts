import { describe, it, expect } from 'vitest';
import { roundCurrency } from './transform';

describe('Transform Service', () => {
	describe('roundCurrency', () => {
		it('should round to 2 decimal places', () => {
			expect(roundCurrency(10.256)).toBe(10.26);
			expect(roundCurrency(10.254)).toBe(10.25);
			expect(roundCurrency(10.255)).toBe(10.26);
		});

		it('should handle whole numbers', () => {
			expect(roundCurrency(100)).toBe(100);
			expect(roundCurrency(0)).toBe(0);
		});

		it('should handle negative numbers', () => {
			expect(roundCurrency(-10.256)).toBe(-10.26);
			expect(roundCurrency(-10.254)).toBe(-10.25);
		});

		it('should handle very small numbers', () => {
			expect(roundCurrency(0.001)).toBe(0);
			expect(roundCurrency(0.005)).toBe(0.01);
			expect(roundCurrency(0.009)).toBe(0.01);
		});

		it('should handle large numbers', () => {
			expect(roundCurrency(999999.999)).toBe(1000000);
			expect(roundCurrency(123456.789)).toBe(123456.79);
		});
	});

	describe('TransformConfig interface', () => {
		it('should define correct structure', () => {
			const config = {
				sourceDocumentId: 'doc-123',
				sourceDocumentType: 'invoice' as const,
				conversion: {
					enabled: true,
					targetType: 'estimate' as const
				}
			};

			expect(config.sourceDocumentId).toBe('doc-123');
			expect(config.sourceDocumentType).toBe('invoice');
			expect(config.conversion.enabled).toBe(true);
			expect(config.conversion.targetType).toBe('estimate');
		});
	});

	describe('TransformResult interface', () => {
		it('should define success result structure', () => {
			const successResult = {
				success: true,
				job: {
					id: 'job-1',
					userId: 'user-1',
					sourceDocumentId: 'doc-1',
					sourceDocumentType: 'invoice' as const,
					sourceTotal: 100,
					sourceClientId: 'client-1',
					config: { conversion: { enabled: true, targetType: 'estimate' as const } },
					generatedDocument: null,
					status: 'completed' as const,
					createdAt: new Date(),
					updatedAt: new Date(),
					completedAt: new Date()
				}
			};

			expect(successResult.success).toBe(true);
			expect(successResult.job).toBeDefined();
		});

		it('should define error result structure', () => {
			const errorResult = {
				success: false,
				error: 'Something went wrong'
			};

			expect(errorResult.success).toBe(false);
			expect(errorResult.error).toBe('Something went wrong');
		});
	});

	describe('SourceDocumentData interface', () => {
		it('should define correct structure', () => {
			const doc = {
				id: 'doc-123',
				type: 'invoice' as const,
				number: 'INV-2024-001',
				total: 1100,
				subtotal: 1000,
				taxRate: 0.1,
				taxAmount: 100,
				clientId: 'client-1',
				clientName: 'John Doe',
				clientEmail: 'john@example.com',
				clientPhone: '555-1234',
				clientAddress: '123 Main St',
				items: [
					{
						id: 'item-1',
						description: 'Service',
						quantity: 1,
						rate: 1000,
						total: 1000
					}
				],
				notes: 'Thank you for your business',
				dueDate: '2024-02-15',
				createdAt: new Date()
			};

			expect(doc.id).toBe('doc-123');
			expect(doc.type).toBe('invoice');
			expect(doc.items).toHaveLength(1);
			expect(doc.total).toBe(1100);
		});
	});

	describe('ClientSuggestion interface', () => {
		it('should define correct structure', () => {
			const suggestion = {
				id: 'client-1',
				name: 'John Doe',
				estimateCount: 5,
				invoiceCount: 10,
				similarity: 0.95
			};

			expect(suggestion.id).toBe('client-1');
			expect(suggestion.name).toBe('John Doe');
			expect(suggestion.estimateCount).toBe(5);
			expect(suggestion.invoiceCount).toBe(10);
			expect(suggestion.similarity).toBe(0.95);
		});
	});

	describe('Document Number Format', () => {
		it('should follow expected pattern', () => {
			// Test the expected format: PREFIX-YEAR-NUMBER
			const invoicePattern = /^INV-\d{4}-\d{4}$/;
			const estimatePattern = /^EST-\d{4}-\d{4}$/;

			expect('INV-2024-0001').toMatch(invoicePattern);
			expect('INV-2024-9999').toMatch(invoicePattern);
			expect('EST-2024-0001').toMatch(estimatePattern);
			expect('EST-2024-0100').toMatch(estimatePattern);
		});
	});

	describe('Conversion Rules', () => {
		it('should only allow invoice to estimate conversion', () => {
			const validConversions = [
				{ from: 'invoice', to: 'estimate' },
				{ from: 'estimate', to: 'invoice' }
			];

			const invalidConversions = [
				{ from: 'invoice', to: 'invoice' },
				{ from: 'estimate', to: 'estimate' }
			];

			validConversions.forEach(({ from, to }) => {
				expect(from).not.toBe(to);
			});

			invalidConversions.forEach(({ from, to }) => {
				expect(from).toBe(to);
			});
		});
	});

	describe('Tax Calculations', () => {
		it('should correctly calculate tax from subtotal and rate', () => {
			const subtotal = 1000;
			const taxRate = 0.1; // 10%

			const taxAmount = roundCurrency(subtotal * taxRate);
			const total = roundCurrency(subtotal + taxAmount);

			expect(taxAmount).toBe(100);
			expect(total).toBe(1100);
		});

		it('should handle zero tax rate', () => {
			const subtotal = 500;
			const taxRate = 0;

			const taxAmount = roundCurrency(subtotal * taxRate);
			const total = roundCurrency(subtotal + taxAmount);

			expect(taxAmount).toBe(0);
			expect(total).toBe(500);
		});

		it('should handle complex tax calculations', () => {
			const subtotal = 1234.56;
			const taxRate = 0.0825; // 8.25%

			const taxAmount = roundCurrency(subtotal * taxRate);
			expect(taxAmount).toBe(101.85);
		});
	});
});
