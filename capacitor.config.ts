import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.mrblu.app',
	appName: 'mrblu',
	webDir: 'build',
	server: {
		url: 'https://mrblu.com',
		cleartext: true
	}
};

export default config;
