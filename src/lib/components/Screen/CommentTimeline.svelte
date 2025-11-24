<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Comment } from '$lib/services/types';
	import { dataService } from '$lib/services';

	export let talkId: string;

	let comments: Comment[] = [];
	let unsubscribe: () => void;

	// Subscribe to comments for the given talkId
	$: if (talkId) {
		if (unsubscribe) unsubscribe();
		unsubscribe = dataService.subscribeToComments(talkId, (newComments) => {
			// For mock, we just replace the list.
			// In a real app with "INSERT" events, we might append.
			// But here we get the full list.
			comments = newComments;
		});
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
</script>

<div class="flex h-full flex-col overflow-hidden rounded-lg bg-black/20">
	<div class="bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200">コメント</div>
	<div class="flex flex-1 flex-col-reverse gap-2 overflow-y-auto p-3">
		{#if comments.length === 0}
			<div class="mt-4 text-center text-sm text-slate-500">まだコメントはありません</div>
		{:else}
			{#each comments as comment (comment.id)}
				<div
					class="rounded-md border-l-4 border-sky-400 bg-white/5 px-3 py-2"
					transition:fly={{ y: 20, duration: 300 }}
					animate:flip={{ duration: 300 }}
				>
					<div class="mb-1 flex items-center justify-between text-xs text-slate-400">
						<span class="font-semibold text-slate-200">{comment.displayName}</span>
						<span>{new Date(comment.createdAt).toLocaleTimeString()}</span>
					</div>
					<div class="text-sm leading-relaxed text-slate-100">{comment.message}</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
