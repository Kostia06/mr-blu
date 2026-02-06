import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { goto } from '$app/navigation';
import { Capacitor } from '@capacitor/core';

let listenerHandle: PluginListenerHandle | null = null;

/**
 * Initialize deep link handling for Capacitor apps.
 * Handles both custom URL schemes (mrblu://) and Universal Links (https://mrblu.com).
 */
export function initDeepLinks(): void {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	App.addListener('appUrlOpen', ({ url }) => {
		try {
			const parsed = new URL(url);

			// Handle auth callbacks (magic link, OAuth)
			if (parsed.pathname.startsWith('/auth/callback')) {
				goto(`/auth/callback${parsed.search}`);
				return;
			}

			// Handle document view links
			if (parsed.pathname.startsWith('/view/')) {
				goto(parsed.pathname + parsed.search);
				return;
			}

			// Handle dashboard routes
			if (parsed.pathname.startsWith('/dashboard')) {
				goto(parsed.pathname + parsed.search);
				return;
			}

			// Default: navigate to the path
			goto(parsed.pathname + parsed.search);
		} catch (error) {
			console.error('[deepLink] Failed to parse URL:', url, error);
		}
	}).then((handle) => {
		listenerHandle = handle;
	});
}

/**
 * Clean up deep link listeners.
 */
export function destroyDeepLinks(): void {
	if (listenerHandle) {
		listenerHandle.remove();
		listenerHandle = null;
	}
}
