import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { toast } from './toast';

describe('toast store', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Clear any existing toasts by dismissing them
		const toasts = get(toast);
		toasts.forEach((t) => toast.dismiss(t.id));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('success', () => {
		it('should add a success toast', () => {
			toast.success('Operation completed');

			const toasts = get(toast);
			expect(toasts.length).toBe(1);
			expect(toasts[0].type).toBe('success');
			expect(toasts[0].message).toBe('Operation completed');
		});

		it('should auto-dismiss after default duration', () => {
			toast.success('Test message');

			let toasts = get(toast);
			expect(toasts.length).toBe(1);

			vi.advanceTimersByTime(5000);

			toasts = get(toast);
			expect(toasts.length).toBe(0);
		});

		it('should respect custom duration', () => {
			toast.success('Test message', 1000);

			vi.advanceTimersByTime(500);
			let toasts = get(toast);
			expect(toasts.length).toBe(1);

			vi.advanceTimersByTime(600);
			toasts = get(toast);
			expect(toasts.length).toBe(0);
		});

		it('should return toast id', () => {
			const id = toast.success('Test');
			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
		});
	});

	describe('error', () => {
		it('should add an error toast', () => {
			toast.error('Something went wrong');

			const toasts = get(toast);
			expect(toasts.length).toBe(1);
			expect(toasts[0].type).toBe('error');
			expect(toasts[0].message).toBe('Something went wrong');
		});

		it('should auto-dismiss after default duration', () => {
			toast.error('Error message');

			vi.advanceTimersByTime(5000);

			const toasts = get(toast);
			expect(toasts.length).toBe(0);
		});
	});

	describe('info', () => {
		it('should add an info toast', () => {
			toast.info('Information message');

			const toasts = get(toast);
			expect(toasts.length).toBe(1);
			expect(toasts[0].type).toBe('info');
			expect(toasts[0].message).toBe('Information message');
		});
	});

	describe('dismiss', () => {
		it('should remove a specific toast by id', () => {
			const id1 = toast.success('First');
			const id2 = toast.success('Second');

			let toasts = get(toast);
			expect(toasts.length).toBe(2);

			toast.dismiss(id1);

			toasts = get(toast);
			expect(toasts.length).toBe(1);
			expect(toasts[0].id).toBe(id2);
		});

		it('should not throw when dismissing non-existent id', () => {
			expect(() => toast.dismiss('non-existent-id')).not.toThrow();
		});
	});

	describe('multiple toasts', () => {
		it('should handle multiple toasts', () => {
			toast.success('Success');
			toast.error('Error');
			toast.info('Info');

			const toasts = get(toast);
			expect(toasts.length).toBe(3);
			expect(toasts.map((t) => t.type)).toEqual(['success', 'error', 'info']);
		});

		it('should dismiss toasts independently', () => {
			toast.success('First', 1000);
			toast.success('Second', 2000);

			vi.advanceTimersByTime(1500);

			const toasts = get(toast);
			expect(toasts.length).toBe(1);
			expect(toasts[0].message).toBe('Second');
		});
	});

	describe('persistent toast', () => {
		it('should not auto-dismiss when duration is 0', () => {
			toast.success('Persistent', 0);

			vi.advanceTimersByTime(10000);

			const toasts = get(toast);
			expect(toasts.length).toBe(1);
		});
	});
});
