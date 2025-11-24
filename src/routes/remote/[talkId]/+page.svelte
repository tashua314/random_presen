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
			await dataService.updateSlidePage(talkId, slideState.currentPage - 1);
		}
	}

	async function nextPage() {
		// In a real app, we'd know max pages from PDF metadata.
		// For mock, just increment.
		await dataService.updateSlidePage(talkId, slideState.currentPage + 1);
	}
</script>

<div class="remote-page">
	{#if loading}
		<div class="loading">Loading...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if talk}
		<header>
			<div class="label">Remote Controller</div>
			<h1>{talk.name}</h1>
			<p class="title">{talk.title}</p>
		</header>

		<main>
			<div class="current-page">
				Page <span class="num">{slideState.currentPage}</span>
			</div>

			<div class="controls">
				<button class="btn-prev" on:click={prevPage} disabled={slideState.currentPage <= 1}>
					&lt; Prev
				</button>
				<button class="btn-next" on:click={nextPage}> Next &gt; </button>
			</div>

			<div class="note">※ 実際のスクリーン画面を見て操作してください</div>
		</main>
	{/if}
</div>

<style>
	.remote-page {
		min-height: 100vh;
		background: #0f172a;
		color: white;
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	header {
		margin-bottom: 40px;
	}
	.label {
		color: #64748b;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	h1 {
		margin: 10px 0;
		font-size: 2rem;
		color: #38bdf8;
	}
	.title {
		color: #94a3b8;
		margin: 0;
	}

	.current-page {
		font-size: 1.5rem;
		margin-bottom: 30px;
		color: #cbd5e1;
	}
	.num {
		font-weight: bold;
		color: white;
		font-size: 2rem;
	}

	.controls {
		display: flex;
		gap: 20px;
		width: 100%;
		max-width: 400px;
	}
	button {
		flex: 1;
		padding: 30px 0;
		border-radius: 16px;
		border: none;
		font-size: 1.5rem;
		font-weight: bold;
		cursor: pointer;
		touch-action: manipulation;
		transition: transform 0.1s;
	}
	button:active {
		transform: scale(0.98);
	}
	.btn-prev {
		background: #334155;
		color: #cbd5e1;
	}
	.btn-next {
		background: #3b82f6;
		color: white;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.note {
		margin-top: 40px;
		color: #475569;
		font-size: 0.9rem;
	}
</style>
