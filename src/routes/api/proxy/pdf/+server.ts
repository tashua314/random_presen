import { error } from '@sveltejs/kit';

export async function GET({ url }) {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		throw error(400, 'Missing url parameter');
	}

	let fetchUrl = targetUrl;

	// Handle Google Drive URLs
	// Convert https://drive.google.com/file/d/ID/view... to https://drive.google.com/uc?export=download&id=ID
	const driveRegex = /drive\.google\.com\/file\/d\/([-_\w]+)/;
	const match = targetUrl.match(driveRegex);
	if (match && match[1]) {
		fetchUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
	}

	try {
		const response = await fetch(fetchUrl);
		if (!response.ok) {
			throw error(response.status, 'Failed to fetch PDF');
		}

		const blob = await response.blob();

		return new Response(blob, {
			headers: {
				'Content-Type': 'application/pdf',
				'Access-Control-Allow-Origin': '*'
			}
		});
	} catch (e) {
		console.error('Proxy error:', e);
		throw error(500, 'Proxy failed');
	}
}
