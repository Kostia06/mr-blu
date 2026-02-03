import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import BottomNav from './BottomNav.svelte';

// Mock the pageTransition store
vi.mock('$lib/stores/pageTransition', () => ({
	pageTransition: {
		navigate: vi.fn()
	}
}));

describe('BottomNav Component', () => {
	it('should render without errors', () => {
		expect(() => render(BottomNav)).not.toThrow();
	});

	it('should render nav element', () => {
		const { container } = render(BottomNav);
		const nav = container.querySelector('nav');
		expect(nav).toBeTruthy();
	});

	it('should render navigation links', () => {
		const { container } = render(BottomNav);
		const links = container.querySelectorAll('a');
		expect(links.length).toBe(3);
	});

	it('should have correct navigation hrefs', () => {
		const { container } = render(BottomNav);
		const links = container.querySelectorAll('a');
		const hrefs = Array.from(links).map((link) => link.getAttribute('href'));

		expect(hrefs).toContain('/dashboard/documents');
		expect(hrefs).toContain('/dashboard');
		expect(hrefs).toContain('/dashboard/settings');
	});

	it('should have tutorial data attributes', () => {
		const { container } = render(BottomNav);

		expect(container.querySelector('[data-tutorial="nav-documents"]')).toBeTruthy();
		expect(container.querySelector('[data-tutorial="nav-settings"]')).toBeTruthy();
	});

	it('should render indicator element', () => {
		const { container } = render(BottomNav);
		expect(container.querySelector('.indicator')).toBeTruthy();
	});
});
