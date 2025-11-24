<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { dataService } from "$lib/services";
    import type { Talk } from "$lib/services/types";

    let talkId: string;
    let talk: Talk | null = null;
    let loading = true;
    let error = "";

    let displayName = "";
    let message = "";
    let sending = false;
    let successMsg = "";

    $: talkId = $page.params.talkId ?? "";

    onMount(async () => {
        try {
            const talks = await dataService.getTalks();
            talk = talks.find((t) => t.id === talkId) || null;
            if (!talk) error = "登壇者が見つかりません";
            loading = false;

            // Load saved name
            const savedName = localStorage.getItem("comment_name");
            if (savedName) displayName = savedName;
        } catch (e: any) {
            error = e.message;
            loading = false;
        }
    });

    async function sendComment() {
        if (!message.trim()) return;
        sending = true;
        try {
            await dataService.addComment(
                talkId,
                message,
                displayName || "Anonymous",
            );

            // Save name
            if (displayName) localStorage.setItem("comment_name", displayName);

            message = "";
            successMsg = "送信しました！";
            setTimeout(() => (successMsg = ""), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            sending = false;
        }
    }
</script>

<div class="comment-page">
    {#if loading}
        <div class="loading">Loading...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else if talk}
        <header>
            <div class="label">Comment to</div>
            <h1>{talk.name}</h1>
            <p class="title">{talk.title}</p>
        </header>

        <main>
            <div class="form-group">
                <label for="name">ニックネーム (任意)</label>
                <input
                    id="name"
                    bind:value={displayName}
                    placeholder="名無しさん"
                />
            </div>

            <div class="form-group">
                <label for="message">コメント</label>
                <textarea
                    id="message"
                    bind:value={message}
                    placeholder="応援コメントや質問を送ろう！"
                    rows="4"
                ></textarea>
            </div>

            <button
                class="btn-send"
                on:click={sendComment}
                disabled={!message.trim() || sending}
            >
                {sending ? "送信中..." : "送信する"}
            </button>

            {#if successMsg}
                <div class="success">{successMsg}</div>
            {/if}
        </main>
    {/if}
</div>

<style>
    .comment-page {
        min-height: 100vh;
        background: #0f172a;
        color: white;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    header {
        text-align: center;
        margin-bottom: 30px;
    }
    .label {
        color: #64748b;
        font-size: 0.8rem;
    }
    h1 {
        margin: 5px 0;
        color: #38bdf8;
    }
    .title {
        color: #94a3b8;
        margin: 0;
        font-size: 0.9rem;
    }

    main {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    label {
        font-size: 0.9rem;
        color: #cbd5e1;
        font-weight: bold;
    }

    input,
    textarea {
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #334155;
        background: #1e293b;
        color: white;
        font-size: 1rem;
    }
    input:focus,
    textarea:focus {
        outline: 2px solid #3b82f6;
        border-color: transparent;
    }

    .btn-send {
        padding: 14px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        margin-top: 10px;
    }
    .btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .success {
        text-align: center;
        color: #4ade80;
        font-weight: bold;
        animation: fade 3s forwards;
    }
    @keyframes fade {
        0% {
            opacity: 1;
        }
        80% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
</style>
