<script lang="ts">
	import { resolve } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import { dataService } from '$lib/services';
	import { checkPassword } from '$lib/services/auth';
	import TalkList from '$lib/components/Admin/TalkList.svelte';
	import type { Talk } from '$lib/services/types';

	let authenticated = false;
	let password = '';
	let error = '';

	let talks: Talk[] = [];
	let currentTalkId: string | null = null;

	let editingId: string | null = null;
	let newName = '';
	let newTitle = '';
	let newUrl = '';

	let unsubscribeTalk: () => void;
	let unsubscribeSlide: () => void;
	let currentSlidePage = 1;

	onMount(async () => {
		if (sessionStorage.getItem('admin_auth') === 'true') {
			authenticated = true;
			loadData();
		}
	});

	onDestroy(() => {
		if (unsubscribeTalk) unsubscribeTalk();
		if (unsubscribeSlide) unsubscribeSlide();
	});

	function login() {
		if (checkPassword(password)) {
			authenticated = true;
			sessionStorage.setItem('admin_auth', 'true');
			loadData();
		} else {
			error = 'パスワードが違います';
		}
	}

	async function loadData() {
		talks = await dataService.getTalks();
		currentTalkId = await dataService.getCurrentTalkId();
		if (currentTalkId) subscribeToSlide(currentTalkId);

		// Subscribe to current talk changes
		unsubscribeTalk = dataService.subscribeToCurrentTalk((id) => {
			currentTalkId = id;
			if (id) {
				subscribeToSlide(id);
			} else {
				if (unsubscribeSlide) unsubscribeSlide();
				currentSlidePage = 1;
			}
		});
	}

	function subscribeToSlide(talkId: string) {
		if (unsubscribeSlide) unsubscribeSlide();
		unsubscribeSlide = dataService.subscribeToSlideState(talkId, (state) => {
			currentSlidePage = state.currentPage;
		});
	}

	async function changePage(delta: number) {
		if (!currentTalkId) return;
		const next = currentSlidePage + delta;
		if (next < 1) return;
		await dataService.updateSlidePage(currentTalkId, next);
	}
	const prevPage = () => changePage(-1);
	const nextPage = () => changePage(1);

	async function saveTalk() {
		if (!newName) return;

		if (editingId) {
			await dataService.updateTalk(editingId, {
				name: newName,
				title: newTitle,
				slideUrl: newUrl
			});
			editingId = null;
		} else {
			await dataService.addTalk({
				name: newName,
				title: newTitle,
				slideUrl: newUrl
			});
		}

		resetForm();
		talks = await dataService.getTalks();
	}

	function handleEdit(e: CustomEvent<Talk>) {
		const talk = e.detail;
		editingId = talk.id;
		newName = talk.name;
		newTitle = talk.title;
		newUrl = talk.slideUrl;

		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function resetForm() {
		editingId = null;
		newName = '';
		newTitle = '';
		newUrl = '';
	}

	const cancelEdit = () => resetForm();

	function copyLink(path: string) {
		navigator.clipboard
			.writeText(`${window.location.origin}${path}`)
			.then(() => alert(`Copied: ${path}`))
			.catch((err) => console.error('Failed to copy: ', err));
	}

	const handleCopyRemote = (e: CustomEvent<string>) => copyLink(`/remote/${e.detail}`);
	const handleCopyComment = (e: CustomEvent<string>) => copyLink(`/comment/${e.detail}`);

	async function handleReorder(e: CustomEvent<string[]>) {
		await dataService.updateTalkOrder(e.detail);
		talks = await dataService.getTalks();
	}

	async function handleDelete(e: CustomEvent<string>) {
		await dataService.deleteTalk(e.detail);
		talks = await dataService.getTalks();
	}

	async function handlePlay(e: CustomEvent<string>) {
		await dataService.setCurrentTalkId(e.detail);
	}

	async function stopPresentation() {
		await dataService.setCurrentTalkId(null);
	}
</script>

<div class="mx-auto max-w-5xl px-5 py-8 text-slate-100">
	{#if !authenticated}
		<div class="mx-auto mt-20 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-slate-700 bg-slate-800/70 p-10 text-center shadow-2xl shadow-black/30">
			<div class="text-5xl">🔐</div>
			<h1 class="text-2xl font-bold">管理画面</h1>
			<p class="text-sm text-slate-400">パスワードを入力してログインしてください</p>
			<input
				class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none ring-sky-500/40 transition focus:border-transparent focus:ring-2"
				type="password"
				bind:value={password}
				placeholder="Password"
			/>
			<button
				class="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:scale-[1.01]"
				on:click={login}
			>
				ログイン
			</button>
			{#if error}<p class="text-sm text-red-400">{error}</p>{/if}
		</div>
	{:else}
		<header class="mb-8 flex flex-col gap-4 border-b border-slate-700 pb-6 md:flex-row md:items-start md:justify-between">
			<div class="space-y-2">
				<h1 class="text-2xl font-bold">⚙️ イベント管理画面</h1>
				{#if currentTalkId}
					<div class="flex items-center gap-3">
						<span class="rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-emerald-950">🎤 発表中</span>
						<span class="text-sm text-slate-300">スライド操作が可能です</span>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<span class="rounded-full bg-slate-600 px-3 py-1 text-sm font-bold text-slate-900">⏸️ 待機中</span>
						<span class="text-sm text-slate-300">発表を開始してください</span>
					</div>
				{/if}
			</div>
			<div class="flex flex-wrap items-center gap-3">
				{#if currentTalkId}
					<div class="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 shadow-inner shadow-black/30">
						<span class="min-w-[70px] text-center text-sm text-slate-300">Page {currentSlidePage}</span>
						<button
							class="rounded-md bg-slate-700 px-3 py-1 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
							on:click={prevPage}
							disabled={currentSlidePage <= 1}
							title="前のページ">&lt;</button
						>
						<button
							class="rounded-md bg-slate-700 px-3 py-1 text-sm font-semibold text-slate-100 transition hover:bg-slate-600"
							on:click={nextPage}
							title="次のページ">&gt;</button
						>
					</div>
					<button
						class="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white shadow-md shadow-red-500/30 transition hover:bg-red-600"
						on:click={stopPresentation}
					>
						⏹ Stop
					</button>
				{/if}
				<a
					href={resolve('/screen')}
					target="_blank"
					rel="external"
					class="inline-flex items-center justify-center rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white transition hover:bg-slate-600"
				>
					📺 Screen
				</a>
			</div>
		</header>

		<main class="flex flex-col gap-8">
			<section class="rounded-xl border border-slate-700 bg-slate-800/70 p-6 shadow-lg shadow-black/30">
				<div class="mb-6 space-y-1">
					<h2 class="text-xl font-semibold">{editingId ? '✏️ 発表情報を編集' : '➕ 新しい発表を追加'}</h2>
					<p class="text-sm text-slate-400">
						{editingId ? '発表情報を更新します' : '発表者名、タイトル、PDFのURLを入力してください'}
					</p>
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="flex flex-col gap-2">
						<label class="text-sm font-semibold text-slate-200" for="speaker-name">発表者名</label>
						<input
							id="speaker-name"
							class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none ring-sky-500/40 transition focus:border-transparent focus:ring-2"
							bind:value={newName}
							placeholder="山田 太郎"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label class="text-sm font-semibold text-slate-200" for="talk-title">発表タイトル</label>
						<input
							id="talk-title"
							class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none ring-sky-500/40 transition focus:border-transparent focus:ring-2"
							bind:value={newTitle}
							placeholder="私の素晴らしいアイデア"
						/>
					</div>
					<div class="flex flex-col gap-2 md:col-span-2">
						<label class="text-sm font-semibold text-slate-200" for="slide-url">スライドURL (PDF)</label>
						<input
							id="slide-url"
							class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none ring-sky-500/40 transition focus:border-transparent focus:ring-2"
							bind:value={newUrl}
							placeholder="https://drive.google.com/file/d/..."
						/>
					</div>
					<div class="flex gap-3 md:col-span-2">
						<button
							class="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:scale-[1.01]"
							on:click={saveTalk}
						>
							{editingId ? '✓ 更新' : '➕ 追加'}
						</button>
						{#if editingId}
							<button
								class="rounded-lg bg-slate-600 px-4 py-3 font-semibold text-white transition hover:bg-slate-500"
								on:click={cancelEdit}
							>
								✕ キャンセル
							</button>
						{/if}
					</div>
				</div>
			</section>

			<section class="rounded-xl border border-slate-700 bg-slate-800/70 p-6 shadow-lg shadow-black/30">
				<div class="mb-6 space-y-1">
					<h2 class="text-xl font-semibold">📋 発表リスト {talks.length > 0 ? `(${talks.length}件)` : ''}</h2>
					<p class="text-sm text-slate-400">
						ドラッグ&ドロップで順序変更 • 各種URLをコピーして共有できます
					</p>
				</div>
				{#if talks.length === 0}
					<div class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-600/70 bg-slate-900/60 px-6 py-10 text-center text-slate-400">
						<div class="text-4xl">📝</div>
						<p class="text-lg font-semibold text-slate-200">まだ発表が登録されていません</p>
						<p class="text-sm text-slate-400">上のフォームから最初の発表を追加しましょう</p>
					</div>
				{:else}
					<TalkList
						{talks}
						{currentTalkId}
						on:reorder={handleReorder}
						on:delete={handleDelete}
						on:play={handlePlay}
						on:edit={handleEdit}
						on:copyRemote={handleCopyRemote}
						on:copyComment={handleCopyComment}
					/>
				{/if}
			</section>
		</main>
	{/if}
</div>
