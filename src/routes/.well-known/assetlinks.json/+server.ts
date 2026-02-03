import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const assetlinks = [
		{
			relation: ['delegate_permission/common.handle_all_urls'],
			target: {
				namespace: 'android_app',
				package_name: 'com.mrblu.app',
				sha256_cert_fingerprints: [
					// Add your SHA256 certificate fingerprint here
					'00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00'
				]
			}
		}
	];

	return json(assetlinks, {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
