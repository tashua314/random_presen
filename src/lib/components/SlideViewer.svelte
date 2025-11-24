<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

	export let url: string;
	export let page: number = 1;

	let canvas: HTMLCanvasElement;
	let pdfjsLib: typeof import('pdfjs-dist') | null = null;
	let pdfDoc: unknown = null;
	let renderTask: unknown = null;
	let loading = false;
	let error = '';

	onMount(async () => {
		if (browser) {
			pdfjsLib = await import('pdfjs-dist');
			pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
			if (url) loadPdf(url);
		}
	});

	$: if (pdfjsLib && url) loadPdf(url);
	$: if (pdfDoc && page) renderPage(page);

	async function loadPdf(pdfUrl: string) {
		if (!pdfjsLib) return;
		try {
			loading = true;
			error = '';

			// Use local proxy to bypass CORS and handle Drive links
			const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(pdfUrl)}`;

			const loadingTask = pdfjsLib.getDocument({
				url: proxyUrl,
				cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
				cMapPacked: true
			});
			pdfDoc = await loadingTask.promise;
			loading = false;
			renderPage(page);
		} catch (e: unknown) {
			console.error('Error loading PDF:', e);
			const message = e instanceof Error ? e.message : String(e);
			error = 'PDFの読み込みに失敗しました: ' + message;
			loading = false;
		}
	}

	async function renderPage(num: number) {
		if (!pdfDoc || !canvas) return;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (renderTask && (renderTask as any).cancel) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await (renderTask as any).cancel();
		}

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pageProxy = await (pdfDoc as any).getPage(num);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const viewport = (pageProxy as any).getViewport({ scale: 1.5 });

			canvas.height = viewport.height;
			canvas.width = viewport.width;

			const context = canvas.getContext('2d');
			if (!context) return;

			const renderContext = {
				canvasContext: context,
				viewport: viewport
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			renderTask = (pageProxy as any).render(renderContext);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await (renderTask as any).promise;
		} catch (e: unknown) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((e as any).name !== 'RenderingCancelledException') {
				console.error('Error rendering page:', e);
			}
		}
	}
</script>

<div class="pdf-container">
	{#if loading}
		<div class="loading">Loading PDF...</div>
	{/if}
	{#if error}
		<div class="error">{error}</div>
	{/if}
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.pdf-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #000;
		overflow: auto;
	}
	canvas {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	.loading,
	.error {
		color: white;
		position: absolute;
	}
	.error {
		color: #ff6b6b;
	}
</style>
