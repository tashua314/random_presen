<script lang="ts">
	import { onDestroy, tick } from 'svelte';

	export let initialSeconds: number = 300; // 5 min default
	let remaining = initialSeconds;
	let running = false;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let timeInput = formatForInput(initialSeconds);
	let inputError = '';
	let showSettings = false;
	let timeInputElement: HTMLInputElement;

	// 文字列から秒数をパース（例: "1m", "1m30s", "90s", "5"）
	function parseTimeString(input: string): number | null {
		const trimmed = input.trim().toLowerCase();
		if (!trimmed) return null;

		// "1m30s", "1m", "30s", "90" などをパース
		const regex = /^(?:(\d+)m)?(?:(\d+)s?)?$/;
		const match = trimmed.match(regex);

		if (!match) return null;

		const minutes = match[1] ? parseInt(match[1], 10) : 0;
		const seconds = match[2] ? parseInt(match[2], 10) : 0;

		// どちらも0の場合は無効
		if (minutes === 0 && seconds === 0 && !match[1] && !match[2]) {
			// 数字のみの場合は分として扱う
			const numOnly = parseInt(trimmed, 10);
			if (!isNaN(numOnly) && numOnly > 0) {
				return numOnly * 60;
			}
			return null;
		}

		return minutes * 60 + seconds;
	}

	// 秒数を入力用フォーマットに変換
	function formatForInput(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		if (s === 0) return `${m}m`;
		return `${m}m${s}s`;
	}

	function applyTimeInput() {
		const seconds = parseTimeString(timeInput);
		if (seconds === null || seconds <= 0) {
			inputError = '無効な形式です（例: 5m, 1m30s, 90s）';
			return;
		}
		inputError = '';
		initialSeconds = seconds;
		remaining = seconds;
		timeInput = formatForInput(seconds);
		showSettings = false;
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			applyTimeInput();
		} else if (e.key === 'Escape') {
			showSettings = false;
		}
	}

	async function openSettings() {
		timeInput = formatForInput(initialSeconds);
		inputError = '';
		showSettings = true;
		// モーダルが描画された後にフォーカス
		await tick();
		timeInputElement?.focus();
	}

	export function start() {
		if (running) return;
		running = true;
		timerInterval = setInterval(() => {
			if (remaining > 0) {
				remaining--;
			} else {
				stop();
			}
		}, 1000);
	}

	export function stop() {
		running = false;
		if (timerInterval) clearInterval(timerInterval);
	}

	export function reset() {
		stop();
		remaining = initialSeconds;
	}

	function formatTime(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	onDestroy(() => {
		stop();
	});
</script>

<div class="relative flex flex-col items-center gap-2">
	<!-- 設定ボタン（右上） -->
	<button
		class="absolute -top-1 -right-1 p-1 text-slate-500 transition hover:text-slate-300"
		on:click={openSettings}
		aria-label="タイマー設定"
		disabled={running}
		class:opacity-50={running}
		class:cursor-not-allowed={running}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path
				d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
			/>
			<circle cx="12" cy="12" r="3" />
		</svg>
	</button>

	<div class={`text-4xl font-bold tabular-nums ${remaining < 60 ? 'text-rose-400' : 'text-white'}`}>
		{formatTime(remaining)}
	</div>

	<div class="flex gap-2">
		{#if !running}
			<button
				class="rounded bg-emerald-400 px-3 py-1 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
				on:click={start}
			>
				Start
			</button>
		{:else}
			<button
				class="rounded bg-rose-400 px-3 py-1 text-sm font-semibold text-rose-950 transition hover:bg-rose-300"
				on:click={stop}
			>
				Stop
			</button>
		{/if}
		<button
			class="rounded bg-slate-400 px-3 py-1 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
			on:click={reset}
		>
			Reset
		</button>
	</div>
</div>

<!-- 設定モーダル -->
{#if showSettings}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
		on:click={() => (showSettings = false)}
		on:keydown={(e) => e.key === 'Escape' && (showSettings = false)}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-72 rounded-xl bg-slate-800 p-6 shadow-2xl"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<h3 class="mb-4 text-lg font-semibold text-white">タイマー設定</h3>

			<div class="mb-4">
				<label for="time-input" class="mb-2 block text-sm text-slate-400">
					時間を入力（例: 5m, 1m30s, 90s）
				</label>
				<input
					id="time-input"
					type="text"
					bind:this={timeInputElement}
					bind:value={timeInput}
					on:keydown={handleInputKeydown}
					placeholder="5m"
					class="w-full rounded bg-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
				/>
				{#if inputError}
					<div class="mt-2 text-xs text-rose-400">{inputError}</div>
				{/if}
			</div>

			<div class="flex justify-end gap-2">
				<button
					class="rounded bg-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-500"
					on:click={() => (showSettings = false)}
				>
					キャンセル
				</button>
				<button
					class="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
					on:click={applyTimeInput}
				>
					設定
				</button>
			</div>
		</div>
	</div>
{/if}
