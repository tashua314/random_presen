<script lang="ts">
	import { flip } from 'svelte/animate';
	import type { Talk } from '$lib/services/types';
	import { createEventDispatcher } from 'svelte';

	export let talks: Talk[] = [];
	export let currentTalkId: string | null = null;

	const dispatch = createEventDispatcher();

	let draggingIndex: number | null = null;

	function handleDragStart(index: number) {
		draggingIndex = index;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggingIndex === null || draggingIndex === index) return;

		// Reorder locally for visual feedback
		const newTalks = [...talks];
		const [removed] = newTalks.splice(draggingIndex, 1);
		newTalks.splice(index, 0, removed);
		talks = newTalks;
		draggingIndex = index;
	}

	function handleDrop() {
		if (draggingIndex !== null) {
			dispatch(
				'reorder',
				talks.map((t) => t.id)
			);
			draggingIndex = null;
		}
	}

	function handleDelete(id: string) {
		if (confirm('本当に削除しますか？')) {
			dispatch('delete', id);
		}
	}

	function handlePlay(id: string) {
		dispatch('play', id);
	}
</script>

<div class="talk-list">
	{#each talks as talk, index (talk.id)}
		<div
			class="talk-item"
			class:active={talk.id === currentTalkId}
			draggable="true"
			role="listitem"
			on:dragstart={() => handleDragStart(index)}
			on:dragover={(e) => handleDragOver(e, index)}
			on:drop={handleDrop}
			animate:flip={{ duration: 200 }}
		>
			<div class="drag-handle">⋮⋮</div>
			<div class="info">
				<div class="name">{talk.name}</div>
				<div class="title">{talk.title}</div>
			</div>
			<div class="actions">
				{#if talk.id === currentTalkId}
					<span class="badge-live">LIVE</span>
				{:else}
					<button class="btn-play" on:click={() => handlePlay(talk.id)}>Play</button>
				{/if}
				<button class="btn-icon" on:click={() => dispatch('edit', talk)} title="Edit">✎</button>
				<button
					class="btn-icon"
					on:click={() => dispatch('copyRemote', talk.id)}
					title="Copy Remote URL">📱</button
				>
				<button
					class="btn-icon"
					on:click={() => dispatch('copyComment', talk.id)}
					title="Copy Comment URL">💬</button
				>
				<button class="btn-delete" on:click={() => handleDelete(talk.id)}>🗑</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.talk-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.talk-item {
		display: flex;
		align-items: center;
		gap: 12px;
		background: rgba(255, 255, 255, 0.05);
		padding: 12px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: background 0.2s;
	}
	.talk-item.active {
		background: rgba(56, 189, 248, 0.1);
		border-color: #38bdf8;
	}
	.drag-handle {
		cursor: grab;
		color: #64748b;
		font-size: 1.2rem;
	}
	.info {
		flex: 1;
	}
	.name {
		font-weight: bold;
		color: #e2e8f0;
	}
	.title {
		font-size: 0.9rem;
		color: #94a3b8;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	button {
		padding: 6px 12px;
		border-radius: 6px;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.btn-play {
		background: #38bdf8;
		color: #0f172a;
		font-weight: bold;
	}
	.btn-delete {
		background: transparent;
		color: #ef4444;
		font-size: 1.1rem;
		padding: 4px 8px;
	}
	.btn-icon {
		background: transparent;
		color: #94a3b8;
		font-size: 1.1rem;
		padding: 4px 8px;
	}
	.btn-icon:hover {
		color: #38bdf8;
		background: rgba(255, 255, 255, 0.1);
	}
	.badge-live {
		background: #ef4444;
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: bold;
	}
</style>
