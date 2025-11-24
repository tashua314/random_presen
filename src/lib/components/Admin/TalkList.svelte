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

<div class="flex flex-col gap-2">
	{#each talks as talk, index (talk.id)}
		<div
			class={`flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 ${talk.id === currentTalkId ? 'border-sky-400 bg-sky-500/10' : ''}`}
			draggable="true"
			role="listitem"
			on:dragstart={() => handleDragStart(index)}
			on:dragover={(e) => handleDragOver(e, index)}
			on:drop={handleDrop}
			animate:flip={{ duration: 200 }}
		>
			<div class="cursor-grab text-lg text-slate-500">⋮⋮</div>
			<div class="flex-1">
				<div class="font-semibold text-slate-100">{talk.name}</div>
				<div class="text-sm text-slate-400">{talk.title}</div>
			</div>
			<div class="flex items-center gap-2">
				{#if talk.id === currentTalkId}
					<span class="rounded bg-red-500 px-2 py-1 text-xs font-bold text-white">LIVE</span>
				{:else}
					<button
						class="rounded-md bg-sky-400 px-3 py-1 text-sm font-semibold text-slate-900 transition hover:bg-sky-300"
						on:click={() => handlePlay(talk.id)}
					>
						Play
					</button>
				{/if}
				<button
					class="rounded-md px-2 py-1 text-base text-slate-400 transition hover:bg-white/10 hover:text-sky-300"
					on:click={() => dispatch('edit', talk)}
					title="Edit">✎</button
				>
				<button
					class="rounded-md px-2 py-1 text-base text-slate-400 transition hover:bg-white/10 hover:text-sky-300"
					on:click={() => dispatch('copyRemote', talk.id)}
					title="Copy Remote URL">📱</button
				>
				<button
					class="rounded-md px-2 py-1 text-base text-slate-400 transition hover:bg-white/10 hover:text-sky-300"
					on:click={() => dispatch('copyComment', talk.id)}
					title="Copy Comment URL">💬</button
				>
				<button
					class="rounded-md px-2 py-1 text-base text-red-400 transition hover:bg-red-500/10"
					on:click={() => handleDelete(talk.id)}
				>
					🗑
				</button>
			</div>
		</div>
	{/each}
</div>
