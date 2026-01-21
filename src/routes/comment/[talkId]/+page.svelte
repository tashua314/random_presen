<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { dataService } from '$lib/services';
	import type { Talk } from '$lib/services/types';

	let talkId: string;
	let talk: Talk | null = null;
	let loading = true;
	let error = '';

	let displayName = '';
	let message = '';
	let sending = false;
	let successMsg = '';

	$: talkId = $page.params.talkId ?? '';

	onMount(async () => {
		try {
			const talks = await dataService.getTalks();
			talk = talks.find((t) => t.id === talkId) || null;
			if (!talk) error = '登壇者が見つかりません';
			loading = false;

			// Load saved name
			const savedName = localStorage.getItem('comment_name');
			if (savedName) displayName = savedName;
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			error = message;
			loading = false;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!message.trim()) return;
		sending = true;
		try {
			await dataService.addComment(talkId, message, displayName || 'Anonymous');

			// Save name
			if (displayName) localStorage.setItem('comment_name', displayName);

			message = '';
			successMsg = '送信しました！';
			setTimeout(() => (successMsg = ''), 3000);
		} catch (e) {
			console.error(e);
		} finally {
			sending = false;
		}
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
			<div class="text-xs tracking-[0.12em] text-slate-500 uppercase">Comment to</div>
			<h1 class="text-3xl font-bold text-sky-400">{talk.name}</h1>
			<p class="text-sm text-slate-400">{talk.title}</p>
		</header>

		<main class="flex w-full max-w-md flex-col gap-5">
			<div class="flex flex-col gap-2">
				<label class="text-sm font-semibold text-slate-200" for="name">ニックネーム (任意)</label>
				<input
					id="name"
					class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white ring-sky-500/40 transition outline-none focus:border-transparent focus:ring-2"
					bind:value={displayName}
					placeholder="名無しさん"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<label class="text-sm font-semibold text-slate-200" for="message">コメント</label>
				<textarea
					id="message"
					class="min-h-[120px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white ring-sky-500/40 transition outline-none focus:border-transparent focus:ring-2"
					bind:value={message}
					placeholder="応援コメントや質問を送ろう！"
					rows="4"
				></textarea>
			</div>

			<button
				class="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
				on:click={handleSubmit}
				disabled={!message.trim() || sending}
			>
				{sending ? '送信中...' : '送信する'}
			</button>

			{#if successMsg}
				<div
					class="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-center text-emerald-200"
				>
					{successMsg}
				</div>
			{/if}
		</main>

		<footer class="mt-12 flex w-full max-w-md flex-col gap-4 border-t border-slate-800 pt-8">
			<p class="text-center text-xs tracking-wider text-slate-500 uppercase">Stay Connected</p>
			<div class="grid grid-cols-2 gap-4">
				<a
					href="https://techguide-llc.notion.site/tg-profile?source=copy_link"
					target="_blank"
					rel="noopener noreferrer"
					class="group flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 py-4 transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800 hover:shadow-lg hover:shadow-sky-900/10"
				>
					<span class="font-bold text-slate-200 group-hover:text-sky-400">Profile</span>
					<span class="text-xs text-slate-500">活動実績・経歴</span>
				</a>
				<a
					href="https://x.com/tashua314"
					target="_blank"
					rel="noopener noreferrer"
					class="group flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 py-4 transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800 hover:shadow-lg hover:shadow-sky-900/10"
				>
					<span class="font-bold text-slate-200 group-hover:text-sky-400">X (Twitter)</span>
					<span class="text-xs text-slate-500">最新情報・発信</span>
				</a>
			</div>
		</footer>
	{/if}
</div>
