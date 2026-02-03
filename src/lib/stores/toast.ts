import { writable } from 'svelte/store';

interface Toast {
	id: string;
	type: 'success' | 'error' | 'info';
	message: string;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function add(type: Toast['type'], message: string, duration = 5000) {
		const id = crypto.randomUUID();
		update((toasts) => [...toasts, { id, type, message }]);

		if (duration > 0) {
			setTimeout(() => dismiss(id), duration);
		}

		return id;
	}

	function dismiss(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		success: (message: string, duration?: number) => add('success', message, duration),
		error: (message: string, duration?: number) => add('error', message, duration),
		info: (message: string, duration?: number) => add('info', message, duration),
		dismiss
	};
}

export const toast = createToastStore();
