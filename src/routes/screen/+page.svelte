<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import ScreenLayout from '$lib/components/Screen/ScreenLayout.svelte';
	import { dataService } from '$lib/services';
	import type { Talk, Event } from '$lib/services/types';

	let layout: 'top' | 'side' | 'side-right' = 'top';
	let event: Event | null = null;
	let currentTalk: Talk | null = null;
	let nextTalk: Talk | null = null;
	let talks: Talk[] = [];

	let unsubscribeTalk: () => void;

	$: layout = ($page.url.searchParams.get('layout') as 'top' | 'side' | 'side-right') || 'side';

	onMount(async () => {
		event = await dataService.getEvent();
		talks = await dataService.getTalks();
		const currentId = await dataService.getCurrentTalkId();
		updateTalks(currentId);

		unsubscribeTalk = dataService.subscribeToCurrentTalk(async (id) => {
			// When ID changes, we might need to refresh talks list if order changed,
			// but for now assume order is static during presentation or refresh manually.
			// Ideally we should subscribe to talks too.
			talks = await dataService.getTalks(); // Refresh to be safe
			updateTalks(id);
		});
	});

	function updateTalks(currentId: string | null) {
		if (!currentId) {
			currentTalk = null;
			nextTalk = null;
			return;
		}
		const idx = talks.findIndex((t) => t.id === currentId);
		if (idx !== -1) {
			currentTalk = talks[idx];
			nextTalk = talks[idx + 1] || null;
		} else {
			currentTalk = null;
		}
	}

	onDestroy(() => {
		if (unsubscribeTalk) unsubscribeTalk();
	});
</script>

{#if event}
	<ScreenLayout {layout} eventName={event.name} {currentTalk} {nextTalk} />
{:else}
	<div class="loading">Loading...</div>
{/if}

<style>
	.loading {
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background: #0f172a;
	}
</style>
