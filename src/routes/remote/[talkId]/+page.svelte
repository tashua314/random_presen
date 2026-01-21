<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { dataService } from '$lib/services';
	import type { Talk, SlideState } from '$lib/services/types';

	let talkId: string;
	let talk: Talk | null = null;
	let slideState: SlideState = { talkId: '', currentPage: 1 };
	let loading = true;
	let error = '';

	let unsubscribeSlide: () => void;

	$: talkId = $page.params.talkId ?? '';

	onMount(async () => {
		try {
			const talks = await dataService.getTalks();
			talk = talks.find((t) => t.id === talkId) || null;

			if (!talk) {
				error = '登壇者が見つかりません';
				loading = false;
				return;
			}

			slideState = await dataService.getSlideState(talkId);
			unsubscribeSlide = dataService.subscribeToSlideState(talkId, (state) => {
				slideState = state;
			});
			loading = false;
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			error = message;
			loading = false;
		}
	});

	onDestroy(() => {
		if (unsubscribeSlide) unsubscribeSlide();
	});

	async function prevPage() {
		if (slideState.currentPage > 1) {
			const newPage = slideState.currentPage - 1;
			// 楽観的更新: 即座にUIを更新
			slideState = { ...slideState, currentPage: newPage };
			// バックグラウンドでDB更新
			dataService.updateSlidePage(talkId, newPage);
		}
	}

	async function nextPage() {
		const newPage = slideState.currentPage + 1;
		// 楽観的更新: 即座にUIを更新
		slideState = { ...slideState, currentPage: newPage };
		// バックグラウンドでDB更新
		dataService.updateSlidePage(talkId, newPage);
	}
</script>

<div class="flex min-h-screen flex-col items-center bg-slate-950 px-5 py-10 text-white">
	{#if loading}
		<div class="text-slate-400">Loading...</div>
	{:else if error}
		<div class="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
			{error}
		</div>
	{:else if talk}
		<header class="mb-10 flex flex-col items-center gap-2 text-center">
			<div class="text-xs tracking-[0.12em] text-slate-500 uppercase">Remote Controller</div>
			<h1 class="text-3xl font-bold text-sky-400">{talk.name}</h1>
			<p class="text-sm text-slate-400">{talk.title}</p>
		</header>

		<main class="flex w-full max-w-xl flex-col items-center gap-8">
			<div class="text-2xl font-semibold text-slate-200">
				Page <span class="ml-2 text-4xl font-extrabold text-white">{slideState.currentPage}</span>
			</div>

			<div class="flex w-full gap-4">
				<button
					class="flex-1 rounded-2xl bg-slate-800 px-6 py-7 text-lg font-bold text-slate-200 shadow-inner shadow-black/40 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
					on:click={prevPage}
					disabled={slideState.currentPage <= 1}
				>
					&lt; Prev
				</button>
				<button
					class="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-7 text-lg font-bold text-white shadow-lg shadow-sky-500/30 transition hover:scale-[1.01]"
					on:click={nextPage}
				>
					Next &gt;
				</button>
			</div>

			<div class="text-sm text-slate-500">※ 実際のスクリーン画面を見て操作してください</div>
		</main>
	{/if}
</div>
