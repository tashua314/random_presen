<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { dataService } from "$lib/services";
    import { checkPassword } from "$lib/services/auth";
    import TalkList from "$lib/components/Admin/TalkList.svelte";
    import type { Talk } from "$lib/services/types";

    let authenticated = false;
    let password = "";
    let error = "";

    let talks: Talk[] = [];
    let currentTalkId: string | null = null;

    // Form inputs
    let newName = "";
    let newTitle = "";
    let newUrl = "";

    let unsubscribeTalk: () => void;

    onMount(async () => {
        // Simple session check (in memory for now, or local storage)
        if (sessionStorage.getItem("admin_auth") === "true") {
            authenticated = true;
            loadData();
        }
    });

    onDestroy(() => {
        if (unsubscribeTalk) unsubscribeTalk();
    });

    function login() {
        if (checkPassword(password)) {
            authenticated = true;
            sessionStorage.setItem("admin_auth", "true");
            loadData();
        } else {
            error = "パスワードが違います";
        }
    }

    async function loadData() {
        talks = await dataService.getTalks();
        currentTalkId = await dataService.getCurrentTalkId();

        // Subscribe to current talk changes
        unsubscribeTalk = dataService.subscribeToCurrentTalk((id) => {
            currentTalkId = id;
        });
    }

    async function addTalk() {
        if (!newName) return;
        await dataService.addTalk({
            name: newName,
            title: newTitle,
            slideUrl: newUrl,
        });
        newName = "";
        newTitle = "";
        newUrl = "";
        talks = await dataService.getTalks(); // Refresh
    }

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
            <input
                type="password"
                bind:value={password}
                placeholder="Password"
            />
            <button on:click={login}>Login</button>
            {#if error}<p class="error">{error}</p>{/if}
        </div>
    {:else}
        <header>
            <h1>Event Admin</h1>
            <div class="controls">
                <button class="btn-stop" on:click={stopPresentation}
                    >Stop Presentation</button
                >
                <a href="/screen" target="_blank" class="btn-link"
                    >Open Screen</a
                >
            </div>
        </header>

        <main>
            <section class="add-form">
                <h2>Add Talk</h2>
                <div class="form-row">
                    <input bind:value={newName} placeholder="Name" />
                    <input bind:value={newTitle} placeholder="Title" />
                    <input bind:value={newUrl} placeholder="Slide URL (PDF)" />
                    <button on:click={addTalk}>Add</button>
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
    .btn-link {
        padding: 8px 16px;
        background: #64748b;
        color: white;
        text-decoration: none;
        border-radius: 4px;
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
