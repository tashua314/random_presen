<script lang="ts">
	import { browser } from '$app/environment';
	import { shuffle } from '$lib';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	const STORAGE_KEY = 'random-presen-participants';
	const kanjiNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

	let input = '';
	let participants: string[] = [];
	let order: string[] = [];
	let revealedIndex = -1;
	let error = '';
	let isReadyToShuffle = false;
	let hasOrder = false;
	let isFinished = false;
	let shownCount = 0;
	let remaining = 0;
	let currentName = '';
	let nextLabel = '表示';

	const positionLabel = (position: number) => {
		const numeral = kanjiNumbers[position - 1] ?? `${position}`;
		return `${numeral}人目`;
	};

	const loadParticipants = () => {
		if (!browser) return;
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return;
		try {
			const parsed = JSON.parse(saved);
			if (Array.isArray(parsed)) {
				participants = parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
			}
		} catch (err) {
			console.error('Failed to parse saved participants', err);
		}
	};

	onMount(loadParticipants);

	$: if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
	}

	$: isReadyToShuffle = participants.length >= 2;
	$: hasOrder = order.length > 0;
	$: isFinished = hasOrder && revealedIndex >= order.length - 1 && order.length > 0;
	$: shownCount = revealedIndex + 1;
	$: remaining = hasOrder ? Math.max(order.length - shownCount, 0) : 0;
	$: currentName = revealedIndex >= 0 ? order[revealedIndex] : '';
	$: nextLabel = hasOrder && !isFinished ? positionLabel(revealedIndex + 2) : '表示';

	const addParticipant = () => {
		error = '';
		const name = input.trim();
		if (!name) {
			error = '名前を入力してください';
			return;
		}
		if (participants.includes(name)) {
			error = '同じ名前は登録できません';
			return;
		}
		participants = [...participants, name];
		input = '';
	};

	const removeParticipant = (name: string) => {
		if (hasOrder) return;
		participants = participants.filter((entry) => entry !== name);
	};

	const handleSubmit = (event: Event) => {
		event.preventDefault();
		addParticipant();
	};

	const doShuffle = () => {
		error = '';
		if (!isReadyToShuffle) {
			error = '2人以上登録してください';
			return;
		}
		order = shuffle(participants);
		revealedIndex = -1;
	};

	const revealNext = () => {
		error = '';
		if (!hasOrder) {
			error = '先にランダムに並べてください';
			return;
		}
		if (revealedIndex < order.length - 1) {
			revealedIndex += 1;
		}
	};

	const resetAll = () => {
		input = '';
		participants = [];
		order = [];
		revealedIndex = -1;
		error = '';
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	};
</script>

<svelte:head>
	<title>ランダム登壇順ジェネレーター</title>
</svelte:head>

<main class="page">
	<section class="hero">
		<div>
			<p class="eyebrow">プレゼン順決め</p>
			<h1>ランダムに順番決定、1人ずつ表示</h1>
			<p class="lede">
				登壇者を登録して「ランダムに並べる」を押したら、「一人目」ボタンから順に表示していきます。
				全員見終わったらリセットでやり直しできます。
			</p>
		</div>
	</section>

	<section class="card">
		<header>
			<h2>登壇者を登録</h2>
			<p class="muted">重複は登録不可。2名以上でシャッフルできます。</p>
		</header>

		<form class="input-row" on:submit|preventDefault={handleSubmit}>
			<label class="sr-only" for="name-input">登壇者名</label>
			<input
				id="name-input"
				name="name"
				placeholder="登壇者名を入力"
				bind:value={input}
				aria-label="登壇者名"
				disabled={hasOrder}
				autocomplete="off"
			/>
			<button type="submit" class="primary" disabled={!input.trim() || hasOrder}>追加</button>
		</form>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div class="chips" aria-live="polite">
			{#if participants.length === 0}
				<p class="placeholder">まだ登録がありません</p>
			{:else}
				{#each participants as name (name)}
					<span class="chip">
						{name}
						<button
							type="button"
							class="icon-button"
							on:click={() => removeParticipant(name)}
							aria-label={`${name} を削除`}
							disabled={hasOrder}
						>
							✕
						</button>
					</span>
				{/each}
			{/if}
		</div>
		<p class="count">登録人数: {participants.length} 人</p>
	</section>

	<section class="card actions">
		<div class="action-row">
			<div>
				<h2>順番をシャッフル</h2>
				<p class="muted">
					{#if hasOrder}
						順番が決まりました。リセットするまで変更できません。
					{:else}
						「ランダムに並べる」は 2 名以上で有効になります。
					{/if}
				</p>
			</div>
			<button
				class="primary"
				type="button"
				on:click={doShuffle}
				disabled={!isReadyToShuffle || hasOrder}
			>
				ランダムに並べる
			</button>
		</div>
	</section>

	{#if hasOrder}
		<section class="card reveal">
			<header class="reveal-head">
				<h2>順番を表示</h2>
				<div class="reveal-actions">
					<button class="primary" type="button" on:click={revealNext} disabled={isFinished}>
						{nextLabel}
					</button>
					<button class="ghost" type="button" on:click={resetAll}>リセット/もう一度</button>
				</div>
			</header>

			<div class="display" aria-live="polite">
				{#if currentName}
					{#key currentName}
						<div class="name" transition:fly={{ y: 12, duration: 220, opacity: 0.2 }}>
							{currentName}
						</div>
					{/key}
				{:else}
					<p class="placeholder">ボタンを押して表示を開始</p>
				{/if}
			</div>

			<div class="progress-row">
				{#if isFinished}
					<p class="complete">全員表示しました</p>
				{:else}
					<p class="muted">残り {remaining} 人</p>
				{/if}
				<p class="muted">
					表示済み: {Math.max(shownCount, 0)} / {order.length}
				</p>
			</div>
		</section>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Noto Sans JP', 'Hiragino Sans', 'Helvetica Neue', Arial, sans-serif;
		background: radial-gradient(circle at 20% 20%, #1b2a41 0%, #121420 40%, #0c0f17 100%);
		color: #f7f8fc;
		min-height: 100vh;
	}

	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	main.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 48px 24px 80px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.hero h1 {
		margin: 4px 0 12px;
		font-size: clamp(24px, 3vw, 32px);
	}

	.hero .lede {
		margin: 0;
		color: #c8d1e6;
		line-height: 1.6;
	}

	.eyebrow {
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8ba6f2;
		margin: 0;
	}

	.card {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 20px 24px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(4px);
	}

	header h2 {
		margin: 0;
	}

	header .muted {
		margin: 4px 0 0;
	}

	.input-row {
		display: flex;
		gap: 12px;
		margin-top: 12px;
	}

	input {
		flex: 1;
		padding: 12px 14px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
		color: #f7f8fc;
		font-size: 16px;
	}

	input:focus {
		outline: 2px solid #7fa8ff;
		outline-offset: 2px;
	}

	button {
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-size: 14px;
		padding: 12px 16px;
		transition: transform 120ms ease, opacity 120ms ease, background 200ms ease, border 200ms ease;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	button.primary {
		background: linear-gradient(135deg, #6fb5ff, #3a7bff);
		color: #0b1021;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	button.primary:not(:disabled):hover {
		transform: translateY(-1px);
	}

	button.ghost {
		background: transparent;
		color: #c8d1e6;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 14px;
		min-height: 28px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		font-size: 13px;
	}

	.icon-button {
		background: rgba(255, 255, 255, 0.08);
		color: #f7f8fc;
		padding: 4px 8px;
		border-radius: 8px;
	}

	.count {
		margin: 10px 0 0;
		color: #c8d1e6;
		font-size: 14px;
	}

	.actions .action-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.actions h2 {
		margin: 0 0 4px;
	}

	.reveal {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.reveal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.reveal-actions {
		display: flex;
		gap: 10px;
	}

	.display {
		min-height: 180px;
		display: grid;
		place-items: center;
		border-radius: 14px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 18px;
		text-align: center;
	}

	.display .name {
		font-size: clamp(28px, 5vw, 48px);
		font-weight: 800;
		letter-spacing: 0.02em;
		background: linear-gradient(120deg, #ffcf71, #ffd86f, #ff9f7b);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35));
		animation: pop 220ms ease, glow 1.6s ease;
	}

	.placeholder {
		color: #9daccc;
		margin: 0;
	}

	.progress-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}

	.complete {
		margin: 0;
		color: #9ce6c2;
		font-weight: 600;
	}

	.muted {
		color: #b7c3df;
		margin: 0;
	}

	.error {
		color: #ff9b9b;
		margin: 10px 0 0;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@keyframes pop {
		from {
			transform: scale(0.96);
		}
		to {
			transform: scale(1);
		}
	}

	@keyframes glow {
		0% {
			text-shadow: 0 0 0 rgba(255, 207, 113, 0.1);
		}
		50% {
			text-shadow: 0 0 18px rgba(255, 207, 113, 0.45);
		}
		100% {
			text-shadow: 0 0 0 rgba(255, 207, 113, 0.15);
		}
	}

	@media (max-width: 640px) {
		main.page {
			padding: 32px 16px 48px;
		}

		.input-row,
		.actions .action-row,
		.reveal-head,
		.reveal-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.reveal-actions button {
			width: 100%;
		}

		button.primary,
		button.ghost {
			width: 100%;
		}
	}
</style>
