import type { LineItem } from '../types';

export function calculateLineItemAmount(quantity: number, rate: number): number {
  return quantity * rate;
}

export function calculateSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

export function calculateTotal(subtotal: number, taxAmount: number = 0): number {
  return subtotal + taxAmount;
}

export function generateInvoiceNumber(prefix = 'INV', sequence: number): string {
  return `${prefix}-${String(sequence).padStart(5, '0')}`;
}
