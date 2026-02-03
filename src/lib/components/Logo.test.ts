import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Logo from './Logo.svelte';

describe('Logo Component', () => {
	it('should render without errors', () => {
		expect(() => render(Logo)).not.toThrow();
	});

	it('should render container element', () => {
		const { container } = render(Logo);
		expect(container.querySelector('div')).toBeTruthy();
	});

	it('should render with different size props', () => {
		const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

		for (const size of sizes) {
			const { container } = render(Logo, { props: { size } });
			expect(container.querySelector('div')).toBeTruthy();
		}
	});

	it('should accept custom class prop', () => {
		const { container } = render(Logo, { props: { class: 'test-class' } });
		const wrapper = container.querySelector('div');
		expect(wrapper?.className).toContain('test-class');
	});
});
