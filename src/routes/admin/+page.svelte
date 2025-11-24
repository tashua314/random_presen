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

<div class="admin-page">
	{#if !authenticated}
		<div class="login-container">
			<h1>Admin Login</h1>
			<input type="password" bind:value={password} placeholder="Password" />
			<button on:click={login}>Login</button>
			{#if error}<p class="error">{error}</p>{/if}
		</div>
	{:else}
		<header>
			<h1>Event Admin</h1>
			<div class="controls">
				{#if currentTalkId}
					<div class="slide-controls">
						<span class="page-info">Page {currentSlidePage}</span>
						<button class="btn-control" on:click={prevPage} disabled={currentSlidePage <= 1}
							>&lt;</button
						>
						<button class="btn-control" on:click={nextPage}>&gt;</button>
					</div>
					<button class="btn-stop" on:click={stopPresentation}>Stop</button>
				{/if}
				<a href={resolve('/screen')} target="_blank" rel="external" class="btn-link">Open Screen</a>
			</div>
		</header>

		<main>
			<section class="add-form">
				<h2>{editingId ? 'Edit Talk' : 'Add Talk'}</h2>
				<div class="form-row">
					<input bind:value={newName} placeholder="Name" />
					<input bind:value={newTitle} placeholder="Title" />
					<input bind:value={newUrl} placeholder="Slide URL (PDF)" />
					<button on:click={saveTalk}>{editingId ? 'Update' : 'Add'}</button>
					{#if editingId}
						<button class="btn-cancel" on:click={cancelEdit}>Cancel</button>
					{/if}
				</div>
			</section>

			<section class="list-area">
				<h2>Talks</h2>
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
			</section>
		</main>
	{/if}
</div>

<style>
	.admin-page {
		padding: 20px;
		max-width: 800px;
		margin: 0 auto;
		color: #e2e8f0;
	}
	.login-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 300px;
		margin: 100px auto;
	}
	input {
		padding: 8px;
		border-radius: 4px;
		border: 1px solid #475569;
		background: #1e293b;
		color: white;
	}
	button {
		padding: 8px 16px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	.error {
		color: #ef4444;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
	}
	.controls {
		display: flex;
		gap: 10px;
	}
	.btn-stop {
		background: #ef4444;
	}
	.btn-cancel {
		background: #64748b;
	}
	.btn-link {
		padding: 8px 16px;
		background: #64748b;
		color: white;
		text-decoration: none;
		border-radius: 4px;
	}
	.slide-controls {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #334155;
		padding: 4px 8px;
		border-radius: 4px;
		margin-right: 10px;
	}
	.page-info {
		font-size: 0.9rem;
		color: #cbd5e1;
		margin-right: 4px;
		min-width: 60px;
		text-align: center;
	}
	.btn-control {
		padding: 4px 12px;
		background: #475569;
		font-weight: bold;
	}
	.btn-control:hover {
		background: #64748b;
	}
	.btn-control:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.add-form {
		background: #1e293b;
		padding: 20px;
		border-radius: 8px;
		margin-bottom: 20px;
	}
	.form-row {
		display: flex;
		gap: 10px;
	}
	.form-row input {
		flex: 1;
	}
</style>
