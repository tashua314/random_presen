<script lang="ts">
	import { onDestroy } from 'svelte';

	export let initialSeconds: number = 300; // 5 min default
	let remaining = initialSeconds;
	let running = false;
	let timerInterval: ReturnType<typeof setInterval> | null = null;

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

<div class="flex flex-col items-center gap-2">
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
