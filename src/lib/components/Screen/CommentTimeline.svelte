<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Comment } from '$lib/services/types';
	import { dataService } from '$lib/services';

	let { talkId }: { talkId: string } = $props();

	let comments: Comment[] = $state([]);
	let clearedAt: Date | null = $state(null);

	function clearComments() {
		clearedAt = new Date();
	}

	let visibleComments = $derived.by(() => {
		if (!clearedAt) return comments;
		return comments.filter((c) => new Date(c.createdAt) > clearedAt!);
	});

	let activeTalkId = '';
	$effect(() => {
		// Only reset clearedAt if the talkId ACTUALLY changes
		if (talkId !== activeTalkId) {
			clearedAt = null;
			activeTalkId = talkId;
		}

		const unsubscribe = dataService.subscribeToComments(talkId, (newComments) => {
			comments = newComments;
		});

		return () => {
			unsubscribe();
		};
	});
</script>

<div class="flex h-full flex-col overflow-hidden rounded-lg bg-black/20">
	<div class="flex items-center justify-between bg-white/10 px-3 py-2">
		<span class="text-sm font-semibold text-slate-200">コメント</span>
		<button
			class="rounded bg-slate-600 px-2 py-0.5 text-xs text-slate-300 transition hover:bg-slate-500"
			onclick={clearComments}
		>
			Clear
		</button>
	</div>
	<div class="flex flex-1 flex-col-reverse gap-2 overflow-y-auto p-3">
		{#if visibleComments.length === 0}
			<div class="mt-4 text-center text-sm text-slate-500">まだコメントはありません</div>
		{:else}
			{#each visibleComments as comment (comment.id)}
				<div
					class="rounded-md border-l-4 border-sky-400 bg-white/5 px-3 py-2"
					transition:fly={{ y: 20, duration: 300 }}
					animate:flip={{ duration: 300 }}
				>
					<div class="mb-1 flex items-center justify-between text-xs text-slate-400">
						<span class="font-semibold text-slate-200">{comment.displayName}</span>
						<span>
							{new Date(comment.createdAt).toLocaleString('ja-JP', {
								month: 'numeric',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</span>
					</div>
					<div class="text-sm leading-relaxed text-slate-100">{comment.message}</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
