<script lang="ts">
	import SlideViewer from '$lib/components/SlideViewer.svelte';
	import CommentTimeline from './CommentTimeline.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import QRCode from '$lib/components/QRCode.svelte';
	import type { Talk, SlideState } from '$lib/services/types';
	import { dataService } from '$lib/services';
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';

	type LayoutOption = 'top' | 'side' | 'side-right';

	export let layout: LayoutOption = 'side';
	export let currentTalk: Talk | null = null;
	export let nextTalk: Talk | null = null;
	export let eventName: string = '';

	let slideState: SlideState = { talkId: '', currentPage: 1 };
	let unsubscribeSlide: () => void;

	const layoutClasses: Record<
		LayoutOption,
		{ container: string; info: string; slide: string; comment: string }
	> = {
		top: {
			container: 'grid-cols-1 grid-rows-[auto_1fr_220px]',
			info: 'col-span-1 row-start-1',
			slide: 'col-span-1 row-start-2',
			comment: 'col-span-1 row-start-3'
		},
		side: {
			container:
				'grid-cols-1 grid-rows-[auto_1fr_220px] md:grid-cols-[340px_1fr] md:grid-rows-[auto_1fr]',
			info: 'col-span-1 row-start-1 md:col-start-1 md:row-start-1',
			slide: 'col-span-1 row-start-2 md:col-start-2 md:row-span-2 md:row-start-1',
			comment: 'col-span-1 row-start-3 md:col-start-1 md:row-start-2'
		},
		'side-right': {
			container:
				'grid-cols-1 grid-rows-[auto_1fr_220px] md:grid-cols-[1fr_340px] md:grid-rows-[auto_1fr]',
			info: 'col-span-1 row-start-1 md:col-start-2 md:row-start-1',
			slide: 'col-span-1 row-start-2 md:col-start-1 md:row-span-2 md:row-start-1',
			comment: 'col-span-1 row-start-3 md:col-start-2 md:row-start-2'
		}
	};

	let layoutConfig = layoutClasses[layout];
	$: layoutConfig = layoutClasses[layout];

	$: if (currentTalk) {
		if (unsubscribeSlide) unsubscribeSlide();
		unsubscribeSlide = dataService.subscribeToSlideState(currentTalk.id, (state) => {
			slideState = state;
		});
	}

	onDestroy(() => {
		if (unsubscribeSlide) unsubscribeSlide();
	});

	$: commentUrl = currentTalk ? `${$page.url.origin}/comment/${currentTalk.id}` : '';

	async function prevPage() {
		if (currentTalk && slideState.currentPage > 1) {
			await dataService.updateSlidePage(currentTalk.id, slideState.currentPage - 1);
		}
	}

	async function nextPage() {
		if (currentTalk) {
			await dataService.updateSlidePage(currentTalk.id, slideState.currentPage + 1);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!currentTalk) return;
		if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			prevPage();
		} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
			nextPage();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class={`grid min-h-screen w-screen gap-4 bg-slate-950 p-4 text-white ${layoutConfig.container}`}
>
	<div class={`rounded-xl bg-slate-800/70 p-4 shadow-lg shadow-black/30 ${layoutConfig.info}`}>
		<div class="text-sm tracking-[0.1em] text-slate-400 uppercase">{eventName}</div>
		{#if currentTalk}
			<div class="mt-2 space-y-1">
				<div class="text-xs tracking-[0.1em] text-slate-500 uppercase">Now Speaking</div>
				<div class="text-2xl font-bold text-sky-400">{currentTalk.name}</div>
				<div class="text-base text-slate-200">{currentTalk.title}</div>
			</div>
		{:else}
			<div class="mt-4 text-slate-500">待機中...</div>
		{/if}

		<div class="mt-4 rounded-lg bg-slate-900/80 px-3 py-2">
			<Timer />
		</div>

		{#if nextTalk}
			<div class="mt-4 border-t border-slate-700 pt-3 text-slate-300">
				<div class="text-xs tracking-[0.1em] text-slate-500 uppercase">Next</div>
				<div class="text-sm">{nextTalk.name}</div>
			</div>
		{/if}

		{#if currentTalk && commentUrl}
			<div class="mt-4 border-t border-slate-700 pt-3">
				<div class="mb-2 text-sm tracking-[0.1em] text-slate-400 uppercase">コメント投稿</div>
				<div class="flex items-center gap-3">
					<QRCode url={commentUrl} size={120} />
					<div class="flex-1 text-sm leading-relaxed text-slate-300">
						スマホでスキャンして
						<br />
						コメントを投稿できます
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div
		class={`group relative overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/50 ${layoutConfig.slide}`}
	>
		{#if currentTalk && currentTalk.slideUrl}
			<SlideViewer url={currentTalk.slideUrl} page={slideState.currentPage} />
			<div
				class="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center gap-4 rounded-full bg-black/50 px-4 py-2 opacity-0 transition duration-200 group-hover:opacity-100"
			>
				<button
					class="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
					on:click={prevPage}
					disabled={slideState.currentPage <= 1}
					aria-label="前のページ"
				>
					&lt;
				</button>
				<div class="min-w-[44px] text-center text-lg font-semibold">{slideState.currentPage}</div>
				<button
					class="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-lg font-semibold text-white transition hover:bg-white/30"
					on:click={nextPage}
					aria-label="次のページ"
				>
					&gt;
				</button>
			</div>
		{:else}
			<div class="flex h-full items-center justify-center text-slate-500">
				<p>スライドが表示されます</p>
			</div>
		{/if}
	</div>

	<div
		class={`overflow-hidden rounded-xl bg-slate-800/70 shadow-lg shadow-black/30 ${layoutConfig.comment}`}
	>
		{#if currentTalk}
			<CommentTimeline talkId={currentTalk.id} />
		{:else}
			<div class="flex h-full items-center justify-center text-slate-500">コメントエリア</div>
		{/if}
	</div>
</div>
