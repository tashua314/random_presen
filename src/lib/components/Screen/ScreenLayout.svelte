<script lang="ts">
    import SlideViewer from "$lib/components/SlideViewer.svelte";
    import CommentTimeline from "./CommentTimeline.svelte";
    import Timer from "$lib/components/Timer.svelte";
    import type { Talk, SlideState } from "$lib/services/types";
    import { dataService } from "$lib/services";
    import { onDestroy } from "svelte";

    export let layout: "top" | "side" | "side-right" = "top";
    export let currentTalk: Talk | null = null;
    export let nextTalk: Talk | null = null;
    export let eventName: string = "";

    let slideState: SlideState = { talkId: "", currentPage: 1 };
    let unsubscribeSlide: () => void;

    $: if (currentTalk) {
        if (unsubscribeSlide) unsubscribeSlide();
        unsubscribeSlide = dataService.subscribeToSlideState(
            currentTalk.id,
            (state) => {
                slideState = state;
            },
        );
    }

    onDestroy(() => {
        if (unsubscribeSlide) unsubscribeSlide();
    });
</script>

<div class="screen-container layout-{layout}">
    <!-- Header / Info Area -->
    <div class="info-area">
        <div class="event-title">{eventName}</div>
        {#if currentTalk}
            <div class="current-talk">
                <div class="label">Now Speaking</div>
                <div class="speaker-name">{currentTalk.name}</div>
                <div class="talk-title">{currentTalk.title}</div>
            </div>
        {:else}
            <div class="waiting">待機中...</div>
        {/if}

        <div class="timer-wrapper">
            <Timer />
        </div>

        {#if nextTalk}
            <div class="next-talk">
                <div class="label">Next</div>
                <div>{nextTalk.name}</div>
            </div>
        {/if}
    </div>

    <!-- Slide Area -->
    <div class="slide-area">
        {#if currentTalk && currentTalk.slideUrl}
            <SlideViewer
                url={currentTalk.slideUrl}
                page={slideState.currentPage}
            />
        {:else}
            <div class="no-slide">
                <p>スライドが表示されます</p>
            </div>
        {/if}
    </div>

    <!-- Comment Area -->
    <div class="comment-area">
        {#if currentTalk}
            <CommentTimeline talkId={currentTalk.id} />
        {:else}
            <div class="comment-placeholder">コメントエリア</div>
        {/if}
    </div>
</div>

<style>
    .screen-container {
        width: 100vw;
        height: 100vh;
        background: #0f172a;
        color: white;
        display: grid;
        gap: 16px;
        padding: 16px;
        box-sizing: border-box;
    }

    /* Layout: Top */
    .layout-top {
        grid-template-areas:
            "info"
            "slide"
            "comment";
        grid-template-rows: auto 1fr 200px;
        grid-template-columns: 1fr;
    }
    .layout-top .info-area {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    /* Layout: Side (Left Info) */
    .layout-side {
        grid-template-areas:
            "info slide"
            "comment slide";
        grid-template-columns: 350px 1fr;
        grid-template-rows: auto 1fr;
    }

    /* Layout: Side Right (Right Info) */
    .layout-side-right {
        grid-template-areas:
            "slide info"
            "slide comment";
        grid-template-columns: 1fr 350px;
        grid-template-rows: auto 1fr;
    }

    .info-area {
        grid-area: info;
        background: #1e293b;
        padding: 16px;
        border-radius: 12px;
    }
    .slide-area {
        grid-area: slide;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
    }
    .comment-area {
        grid-area: comment;
        background: #1e293b;
        border-radius: 12px;
        overflow: hidden;
    }

    .event-title {
        font-size: 1.2rem;
        color: #94a3b8;
        margin-bottom: 8px;
    }
    .label {
        font-size: 0.8rem;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 0.05em;
    }
    .speaker-name {
        font-size: 2rem;
        font-weight: bold;
        color: #38bdf8;
    }
    .talk-title {
        font-size: 1.2rem;
        margin-bottom: 16px;
    }
    .next-talk {
        margin-top: 16px;
        border-top: 1px solid #334155;
        padding-top: 8px;
        color: #94a3b8;
    }

    .no-slide {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #475569;
    }
    .comment-placeholder {
        padding: 20px;
        text-align: center;
        color: #475569;
    }
</style>
