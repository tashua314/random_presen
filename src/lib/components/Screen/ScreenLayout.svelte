<script lang="ts">
	import SlideViewer from '$lib/components/SlideViewer.svelte';
	import CommentTimeline from './CommentTimeline.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import type { Talk, SlideState } from '$lib/services/types';
	import { dataService } from '$lib/services';
	import { onDestroy } from 'svelte';

	export let layout: 'top' | 'side' | 'side-right' = 'side';
	export let currentTalk: Talk | null = null;
	export let nextTalk: Talk | null = null;
	export let eventName: string = '';

	let slideState: SlideState = { talkId: '', currentPage: 1 };
	let unsubscribeSlide: () => void;

	$: if (currentTalk) {
		if (unsubscribeSlide) unsubscribeSlide();
		unsubscribeSlide = dataService.subscribeToSlideState(currentTalk.id, (state) => {
			slideState = state;
		});
	}

	onDestroy(() => {
		if (unsubscribeSlide) unsubscribeSlide();
	});

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

<div class="screen-container layout-{layout}">
	<!-- Header / Info Area -->
	<div class="info-area">
		<div class="event-title">{eventName}</div>
		{#if currentTalk}
			<div class="current-talk">
				<div class="label">Now Speaking</div>
				<div class="speaker-name">{currentTalk.name}</div>
				<div class="talk-title">{currentTalk.title}</div>
			</div>
		{:else}
			<div class="waiting">待機中...</div>
		{/if}

		<div class="timer-wrapper">
			<Timer />
		</div>

		{#if nextTalk}
			<div class="next-talk">
				<div class="label">Next</div>
				<div>{nextTalk.name}</div>
			</div>
		{/if}
	</div>

	<!-- Slide Area -->
	<div class="slide-area">
		{#if currentTalk && currentTalk.slideUrl}
			<SlideViewer url={currentTalk.slideUrl} page={slideState.currentPage} />
			<!-- Overlay Controls (Visible on hover) -->
			<div class="slide-controls-overlay">
				<button class="overlay-btn prev" on:click={prevPage} disabled={slideState.currentPage <= 1}
					>&lt;</button
				>
				<div class="page-indicator">{slideState.currentPage}</div>
				<button class="overlay-btn next" on:click={nextPage}>&gt;</button>
			</div>
		{:else}
			<div class="no-slide">
				<p>スライドが表示されます</p>
			</div>
		{/if}
	</div>

	<!-- Comment Area -->
	<div class="comment-area">
		{#if currentTalk}
			<CommentTimeline talkId={currentTalk.id} />
		{:else}
			<div class="comment-placeholder">コメントエリア</div>
		{/if}
	</div>
</div>

<style>
	.screen-container {
		width: 100vw;
		height: 100vh;
		background: #0f172a;
		color: white;
		display: grid;
		gap: 16px;
		padding: 16px;
		box-sizing: border-box;
	}

	/* Layout: Top */
	.layout-top {
		grid-template-areas:
			'info'
			'slide'
			'comment';
		grid-template-rows: auto 1fr 200px;
		grid-template-columns: 1fr;
	}
	.layout-top .info-area {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Layout: Side (Left Info) */
	.layout-side {
		grid-template-areas:
			'info slide'
			'comment slide';
		grid-template-columns: 350px 1fr;
		grid-template-rows: auto 1fr;
	}
	.layout-side .info-area {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* Layout: Side Right (Right Info) */
	.layout-side-right {
		grid-template-areas:
			'slide info'
			'slide comment';
		grid-template-columns: 1fr 350px;
		grid-template-rows: auto 1fr;
	}

	.info-area {
		grid-area: info;
		background: #1e293b;
		padding: 16px;
		border-radius: 12px;
	}
	.slide-area {
		grid-area: slide;
		background: #000;
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}
	.comment-area {
		grid-area: comment;
		background: #1e293b;
		border-radius: 12px;
		overflow: hidden;
	}

	.event-title {
		font-size: 1.2rem;
		color: #94a3b8;
		margin-bottom: 8px;
	}
	.label {
		font-size: 0.8rem;
		text-transform: uppercase;
		color: #64748b;
		letter-spacing: 0.05em;
	}
	.speaker-name {
		font-size: 2rem;
		font-weight: bold;
		color: #38bdf8;
	}
	.talk-title {
		font-size: 1.2rem;
		margin-bottom: 16px;
	}
	.next-talk {
		margin-top: 16px;
		border-top: 1px solid #334155;
		padding-top: 8px;
		color: #94a3b8;
	}

	.no-slide {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #475569;
	}
	.comment-placeholder {
		padding: 20px;
		text-align: center;
		color: #475569;
	}

	.slide-controls-overlay {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 16px;
		background: rgba(0, 0, 0, 0.5);
		padding: 8px 16px;
		border-radius: 24px;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.slide-area:hover .slide-controls-overlay {
		opacity: 1;
	}
	.overlay-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		font-size: 1.2rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}
	.overlay-btn:hover {
		background: rgba(255, 255, 255, 0.4);
	}
	.overlay-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.page-indicator {
		font-weight: bold;
		font-size: 1.2rem;
		min-width: 30px;
		text-align: center;
	}
</style>
