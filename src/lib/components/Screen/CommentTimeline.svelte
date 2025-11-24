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

<div class="timeline">
	<div class="header">コメント</div>
	<div class="scroll-area">
		{#if comments.length === 0}
			<div class="empty">まだコメントはありません</div>
		{:else}
			{#each comments as comment (comment.id)}
				<div
					class="comment-card"
					transition:fly={{ y: 20, duration: 300 }}
					animate:flip={{ duration: 300 }}
				>
					<div class="meta">
						<span class="name">{comment.displayName}</span>
						<span class="time">{new Date(comment.createdAt).toLocaleTimeString()}</span>
					</div>
					<div class="message">{comment.message}</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.timeline {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		overflow: hidden;
	}
	.header {
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.1);
		font-weight: bold;
		font-size: 0.9rem;
		color: #cbd5e1;
	}
	.scroll-area {
		flex: 1;
		overflow-y: auto;
		padding: 12px;
		display: flex;
		flex-direction: column-reverse; /* Newest at bottom usually, but let's do standard top-down for timeline? Or bottom-up like chat? */
		/* Let's do standard top-down for now, but maybe reverse order in array if we want newest top */
		gap: 8px;
	}
	.comment-card {
		background: rgba(255, 255, 255, 0.05);
		padding: 8px 12px;
		border-radius: 6px;
		border-left: 3px solid #60a5fa;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: #94a3b8;
		margin-bottom: 4px;
	}
	.name {
		font-weight: bold;
		color: #e2e8f0;
	}
	.message {
		color: #f1f5f9;
		font-size: 0.95rem;
		line-height: 1.4;
		word-break: break-word;
	}
	.empty {
		color: #64748b;
		text-align: center;
		margin-top: 20px;
	}
</style>
