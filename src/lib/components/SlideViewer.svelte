<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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

	// ページキャッシュ: ページ番号 → ImageBitmap
	const pageCache = new Map<number, ImageBitmap>();
	// レンダリング中のページを追跡（重複レンダリング防止）
	const renderingPages = new Set<number>();
	// キャッシュの最大サイズ
	const MAX_CACHE_SIZE = 20;
	// 先読みするページ数（前後）
	const PREFETCH_RANGE = 2;

	let totalPages = 0;
	let currentScale = 1.5;

	onMount(async () => {
		if (browser) {
			pdfjsLib = await import('pdfjs-dist');
			pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
			if (url) loadPdf(url);
		}
	});

	onDestroy(() => {
		// キャッシュをクリーンアップ
		for (const bitmap of pageCache.values()) {
			bitmap.close();
		}
		pageCache.clear();
	});

	$: if (pdfjsLib && url) loadPdf(url);
	$: if (pdfDoc && page) displayPage(page);

	async function loadPdf(pdfUrl: string) {
		if (!pdfjsLib) return;
		try {
			loading = true;
			error = '';

			// 前のPDFのキャッシュをクリア
			for (const bitmap of pageCache.values()) {
				bitmap.close();
			}
			pageCache.clear();

			// Use local proxy to bypass CORS and handle Drive links
			const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(pdfUrl)}`;

			const loadingTask = pdfjsLib.getDocument({
				url: proxyUrl,
				cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
				cMapPacked: true
			});
			pdfDoc = await loadingTask.promise;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			totalPages = (pdfDoc as any).numPages;
			loading = false;
			displayPage(page);
		} catch (e: unknown) {
			console.error('Error loading PDF:', e);
			const message = e instanceof Error ? e.message : String(e);
			error = 'PDFの読み込みに失敗しました: ' + message;
			loading = false;
		}
	}

	async function displayPage(num: number) {
		if (!pdfDoc || !canvas) return;

		// キャッシュにあれば即座に表示
		const cached = pageCache.get(num);
		if (cached) {
			drawBitmapToCanvas(cached);
			// 先読みをバックグラウンドで実行
			prefetchPages(num);
			return;
		}

		// キャッシュにない場合はレンダリング
		await renderAndCachePage(num, true);
		// 先読みをバックグラウンドで実行
		prefetchPages(num);
	}

	async function renderAndCachePage(num: number, displayImmediately: boolean) {
		if (!pdfDoc) return;

		// 既にレンダリング中なら待機しない
		if (renderingPages.has(num)) return;

		// ページ番号が範囲外
		if (num < 1 || num > totalPages) return;

		renderingPages.add(num);

		try {
			// 表示用のレンダリングはキャンセル可能にする
			if (displayImmediately && renderTask) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if ((renderTask as any).cancel) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await (renderTask as any).cancel();
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pageProxy = await (pdfDoc as any).getPage(num);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const viewport = (pageProxy as any).getViewport({ scale: currentScale });

			// オフスクリーンcanvasでレンダリング
			const offscreen = new OffscreenCanvas(viewport.width, viewport.height);
			const context = offscreen.getContext('2d');
			if (!context) {
				renderingPages.delete(num);
				return;
			}

			const renderContext = {
				canvasContext: context,
				viewport: viewport
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const task = (pageProxy as any).render(renderContext);
			if (displayImmediately) {
				renderTask = task;
			}

			await task.promise;

			// ImageBitmapを作成してキャッシュ
			const bitmap = await createImageBitmap(offscreen);

			// キャッシュサイズ制限
			if (pageCache.size >= MAX_CACHE_SIZE) {
				// 最も古いエントリを削除（現在のページから遠いものを優先）
				const currentPage = page;
				let farthestPage = -1;
				let farthestDistance = -1;
				for (const cachedPage of pageCache.keys()) {
					const distance = Math.abs(cachedPage - currentPage);
					if (distance > farthestDistance) {
						farthestDistance = distance;
						farthestPage = cachedPage;
					}
				}
				if (farthestPage !== -1) {
					const oldBitmap = pageCache.get(farthestPage);
					if (oldBitmap) oldBitmap.close();
					pageCache.delete(farthestPage);
				}
			}

			pageCache.set(num, bitmap);

			// 即座に表示する場合
			if (displayImmediately && page === num) {
				drawBitmapToCanvas(bitmap);
			}
		} catch (e: unknown) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((e as any).name !== 'RenderingCancelledException') {
				console.error('Error rendering page:', e);
			}
		} finally {
			renderingPages.delete(num);
		}
	}

	function drawBitmapToCanvas(bitmap: ImageBitmap) {
		if (!canvas) return;
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const context = canvas.getContext('2d');
		if (context) {
			context.drawImage(bitmap, 0, 0);
		}
	}

	function prefetchPages(currentPage: number) {
		// 前後のページを先読み
		for (let i = 1; i <= PREFETCH_RANGE; i++) {
			const nextPage = currentPage + i;
			const prevPage = currentPage - i;

			if (nextPage <= totalPages && !pageCache.has(nextPage)) {
				// 非同期で先読み（displayImmediately = false）
				renderAndCachePage(nextPage, false);
			}
			if (prevPage >= 1 && !pageCache.has(prevPage)) {
				renderAndCachePage(prevPage, false);
			}
		}
	}
</script>

<div class="relative flex h-full w-full items-center justify-center overflow-auto bg-black">
	{#if loading}
		<div class="absolute text-slate-200">Loading PDF...</div>
	{/if}
	{#if error}
		<div class="absolute text-sm text-rose-300">{error}</div>
	{/if}
	<canvas class="max-h-full max-w-full object-contain" bind:this={canvas}></canvas>
</div>
