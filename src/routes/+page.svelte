<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div
	class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-10 text-slate-100"
>
	<header class="mx-auto mb-12 flex max-w-5xl flex-col items-center gap-3 text-center">
		<h1
			class="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl"
		>
			🎤 LT Realtime Screen App
		</h1>
		<p class="text-lg text-slate-400 md:text-xl">
			LT（Lightning Talk）イベント用のリアルタイム画面表示システム
		</p>
	</header>

	<main class="mx-auto flex max-w-6xl flex-col gap-12">
		<section class="flex flex-col items-center gap-4 text-center">
			<h2 class="text-3xl font-semibold text-slate-200">このアプリでできること</h2>
			<p class="max-w-3xl text-lg leading-relaxed text-slate-300">
				LT Realtime Screen
				Appは、ライトニングトークイベントをスムーズに進行するための総合システムです。
				スライド表示、コメント投稿、リモート操作など、イベント運営に必要な機能をすべて備えています。
			</p>
		</section>

		<section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			<div
				class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur-lg transition duration-200 hover:-translate-y-1 hover:bg-white/10"
			>
				<div class="text-4xl">⚙️</div>
				<h3 class="text-xl font-semibold text-slate-100">管理画面</h3>
				<p class="text-slate-300">プレゼンテーション情報の登録・編集・順番管理を行います。</p>
				<ul class="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-400">
					<li>発表者情報とスライドURLの登録</li>
					<li>発表順序のドラッグ&ドロップ変更</li>
					<li>リモート操作URLとコメントURLのコピー</li>
					<li>スライドの操作（Prev/Next）</li>
				</ul>
				<a
					href={resolve('/admin')}
					class="mt-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:scale-105"
				>
					管理画面を開く
				</a>
			</div>

			<div
				class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur-lg transition duration-200 hover:-translate-y-1 hover:bg-white/10"
			>
				<div class="text-4xl">📺</div>
				<h3 class="text-xl font-semibold text-slate-100">スクリーン画面</h3>
				<p class="text-slate-300">
					プロジェクターに映す画面です。リアルタイムでスライドとコメントが表示されます。
				</p>
				<ul class="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-400">
					<li>PDFスライドの表示</li>
					<li>リアルタイムコメント表示</li>
					<li>発表者情報とタイマー</li>
					<li>キーボード/マウスでのスライド操作</li>
				</ul>
				<a
					href={resolve('/screen')}
					class="mt-2 inline-flex items-center justify-center rounded-lg border border-slate-600/70 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-700/60"
					target="_blank"
					rel="external"
				>
					スクリーン画面を開く
				</a>
			</div>

			<div
				class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur-lg transition duration-200 hover:-translate-y-1 hover:bg-white/10"
			>
				<div class="text-4xl">🎮</div>
				<h3 class="text-xl font-semibold text-slate-100">リモート操作</h3>
				<p class="text-slate-300">発表者がスマホやタブレットからスライドを操作できます。</p>
				<ul class="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-400">
					<li>大きなボタンでスライド送り</li>
					<li>現在のページ数表示</li>
					<li>リアルタイム同期</li>
				</ul>
				<p class="text-sm text-slate-500 italic">
					※ 管理画面で各発表のURLをコピーして発表者に共有してください
				</p>
			</div>

			<div
				class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30 backdrop-blur-lg transition duration-200 hover:-translate-y-1 hover:bg-white/10"
			>
				<div class="text-4xl">💬</div>
				<h3 class="text-xl font-semibold text-slate-100">コメント投稿</h3>
				<p class="text-slate-300">聴衆がリアルタイムでコメントや質問を送信できます。</p>
				<ul class="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-400">
					<li>ニックネーム付きでコメント投稿</li>
					<li>スクリーン画面にリアルタイム表示</li>
					<li>発表へのエンゲージメント向上</li>
				</ul>
				<p class="text-sm text-slate-500 italic">
					※ 管理画面で各発表のURLをコピーして聴衆に共有してください
				</p>
			</div>
		</section>

		<section class="rounded-xl border border-sky-500/30 bg-sky-500/10 p-6 backdrop-blur lg:p-8">
			<h2 class="text-2xl font-semibold text-slate-100">使い方</h2>
			<ol class="mt-4 space-y-4">
				<li>
					<div class="flex items-start gap-4">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-base font-bold text-white"
							>1</span
						>
						<p class="flex-1 leading-7 text-slate-200">
							<strong class="font-semibold text-white">管理画面</strong
							>で発表者情報とスライドURL（Google Driveの共有リンク等）を登録
						</p>
					</div>
				</li>
				<li>
					<div class="flex items-start gap-4">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-base font-bold text-white"
							>2</span
						>
						<p class="flex-1 leading-7 text-slate-200">
							<strong class="font-semibold text-white">スクリーン画面</strong>をプロジェクターに表示
						</p>
					</div>
				</li>
				<li>
					<div class="flex items-start gap-4">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-base font-bold text-white"
							>3</span
						>
						<p class="flex-1 leading-7 text-slate-200">
							各発表者に<strong class="font-semibold text-white">リモート操作URL</strong>を共有
						</p>
					</div>
				</li>
				<li>
					<div class="flex items-start gap-4">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-base font-bold text-white"
							>4</span
						>
						<p class="flex-1 leading-7 text-slate-200">
							聴衆に<strong class="font-semibold text-white">コメント投稿URL</strong
							>を共有（QRコードなどで）
						</p>
					</div>
				</li>
				<li>
					<div class="flex items-start gap-4">
						<span
							class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-base font-bold text-white"
							>5</span
						>
						<p class="flex-1 leading-7 text-slate-200">
							管理画面で発表を開始（Play）して、イベントスタート！
						</p>
					</div>
				</li>
			</ol>
		</section>

		<section class="text-center">
			<h3 class="text-xl font-semibold text-slate-200">技術スタック</h3>
			<div class="mt-3 flex flex-wrap justify-center gap-3">
				<span
					class="rounded-full border border-sky-400/50 bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-300"
					>SvelteKit</span
				>
				<span
					class="rounded-full border border-sky-400/50 bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-300"
					>TypeScript</span
				>
				<span
					class="rounded-full border border-sky-400/50 bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-300"
					>Neon PostgreSQL</span
				>
				<span
					class="rounded-full border border-sky-400/50 bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-300"
					>Drizzle ORM</span
				>
				<span
					class="rounded-full border border-sky-400/50 bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-300"
					>PDF.js</span
				>
				<span
					class="rounded-full border border-sky-400/50 bg-sky-400/15 px-3 py-1 text-sm font-semibold text-sky-300"
					>Tailwind CSS</span
				>
			</div>
		</section>
	</main>

	<footer
		class="mx-auto mt-14 max-w-5xl border-t border-white/10 pt-6 text-center text-sm text-slate-500"
	>
		<p class="space-x-3">
			<a
				class="text-sky-300 transition hover:text-sky-200"
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer">GitHub</a
			>
			<span class="text-white/30">•</span>
			<a class="text-sky-300 transition hover:text-sky-200" href={resolve('/admin')}>管理画面</a>
			<span class="text-white/30">•</span>
			<a
				class="text-sky-300 transition hover:text-sky-200"
				href={resolve('/screen')}
				target="_blank"
				rel="external">スクリーン</a
			>
		</p>
	</footer>
</div>
