<script lang="ts">
    import { onDestroy } from "svelte";

    export let initialSeconds: number = 300; // 5 min default
    let remaining = initialSeconds;
    let running = false;
    let interval: any;

    export function start() {
        if (running) return;
        running = true;
        interval = setInterval(() => {
            if (remaining > 0) {
                remaining--;
            } else {
                stop();
            }
        }, 1000);
    }

    export function stop() {
        running = false;
        if (interval) clearInterval(interval);
    }

    export function reset() {
        stop();
        remaining = initialSeconds;
    }

    function formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    onDestroy(() => {
        stop();
    });
</script>

<div class="timer" class:urgent={remaining < 60}>
    <div class="time">{formatTime(remaining)}</div>
    <div class="controls">
        {#if !running}
            <button on:click={start} class="btn-start">Start</button>
        {:else}
            <button on:click={stop} class="btn-stop">Stop</button>
        {/if}
        <button on:click={reset} class="btn-reset">Reset</button>
    </div>
</div>

<style>
    .timer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    .time {
        font-size: 3rem;
        font-weight: bold;
        font-variant-numeric: tabular-nums;
        color: #fff;
    }
    .urgent .time {
        color: #ff6b6b;
    }
    .controls {
        display: flex;
        gap: 0.5rem;
    }
    button {
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        border: none;
        cursor: pointer;
        font-weight: bold;
    }
    .btn-start {
        background: #4ade80;
        color: #064e3b;
    }
    .btn-stop {
        background: #f87171;
        color: #7f1d1d;
    }
    .btn-reset {
        background: #94a3b8;
        color: #0f172a;
    }
</style>
