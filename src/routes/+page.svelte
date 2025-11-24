<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="landing-page">
	<header>
		<h1>🎤 LT Realtime Screen App</h1>
		<p class="subtitle">LT（Lightning Talk）イベント用のリアルタイム画面表示システム</p>
	</header>

	<main>
		<section class="intro">
			<h2>このアプリでできること</h2>
			<p>
				LT Realtime Screen
				Appは、ライトニングトークイベントをスムーズに進行するための総合システムです。
				スライド表示、コメント投稿、リモート操作など、イベント運営に必要な機能をすべて備えています。
			</p>
		</section>

		<section class="features">
			<div class="feature-card">
				<div class="icon">⚙️</div>
				<h3>管理画面</h3>
				<p>プレゼンテーション情報の登録・編集・順番管理を行います。</p>
				<ul>
					<li>発表者情報とスライドURLの登録</li>
					<li>発表順序のドラッグ&ドロップ変更</li>
					<li>リモート操作URLとコメントURLのコピー</li>
					<li>スライドの操作（Prev/Next）</li>
				</ul>
				<a href={resolve('/admin')} class="btn btn-primary">管理画面を開く</a>
			</div>

			<div class="feature-card">
				<div class="icon">📺</div>
				<h3>スクリーン画面</h3>
				<p>プロジェクターに映す画面です。リアルタイムでスライドとコメントが表示されます。</p>
				<ul>
					<li>PDFスライドの表示</li>
					<li>リアルタイムコメント表示</li>
					<li>発表者情報とタイマー</li>
					<li>キーボード/マウスでのスライド操作</li>
				</ul>
				<a href={resolve('/screen')} class="btn btn-secondary" target="_blank" rel="external"
					>スクリーン画面を開く</a
				>
			</div>

			<div class="feature-card">
				<div class="icon">🎮</div>
				<h3>リモート操作</h3>
				<p>発表者がスマホやタブレットからスライドを操作できます。</p>
				<ul>
					<li>大きなボタンでスライド送り</li>
					<li>現在のページ数表示</li>
					<li>リアルタイム同期</li>
				</ul>
				<p class="note">※ 管理画面で各発表のURLをコピーして発表者に共有してください</p>
			</div>

			<div class="feature-card">
				<div class="icon">💬</div>
				<h3>コメント投稿</h3>
				<p>聴衆がリアルタイムでコメントや質問を送信できます。</p>
				<ul>
					<li>ニックネーム付きでコメント投稿</li>
					<li>スクリーン画面にリアルタイム表示</li>
					<li>発表へのエンゲージメント向上</li>
				</ul>
				<p class="note">※ 管理画面で各発表のURLをコピーして聴衆に共有してください</p>
			</div>
		</section>

		<section class="getting-started">
			<h2>使い方</h2>
			<ol class="steps">
				<li>
					<strong>管理画面</strong>で発表者情報とスライドURL（Google Driveの共有リンク等）を登録
				</li>
				<li><strong>スクリーン画面</strong>をプロジェクターに表示</li>
				<li>各発表者に<strong>リモート操作URL</strong>を共有</li>
				<li>聴衆に<strong>コメント投稿URL</strong>を共有（QRコードなどで）</li>
				<li>管理画面で発表を開始（Play）して、イベントスタート！</li>
			</ol>
		</section>

		<section class="tech-stack">
			<h3>技術スタック</h3>
			<div class="tags">
				<span class="tag">SvelteKit</span>
				<span class="tag">TypeScript</span>
				<span class="tag">Neon PostgreSQL</span>
				<span class="tag">Drizzle ORM</span>
				<span class="tag">PDF.js</span>
				<span class="tag">Tailwind CSS</span>
			</div>
		</section>
	</main>

	<footer>
		<p>
			<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> •
			<a href={resolve('/admin')}>管理画面</a> •
			<a href={resolve('/screen')} target="_blank" rel="external">スクリーン</a>
		</p>
	</footer>
</div>

<style>
	.landing-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
		color: #e2e8f0;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 3rem;
		margin: 0;
		background: linear-gradient(135deg, #38bdf8, #3b82f6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		font-size: 1.2rem;
		color: #94a3b8;
		margin-top: 0.5rem;
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
	}

	section {
		margin-bottom: 3rem;
	}

	h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: #cbd5e1;
	}

	h3 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		color: #e2e8f0;
	}

	.intro p {
		font-size: 1.1rem;
		line-height: 1.8;
		color: #cbd5e1;
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s;
	}

	.feature-card:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.feature-card ul {
		margin: 1rem 0;
		padding-left: 1.5rem;
		color: #94a3b8;
		line-height: 1.8;
	}

	.feature-card li {
		margin-bottom: 0.5rem;
	}

	.note {
		font-size: 0.9rem;
		color: #64748b;
		font-style: italic;
		margin-top: 1rem;
	}

	.btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: bold;
		margin-top: 1rem;
		transition: all 0.2s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
	}

	.btn-primary:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.btn-secondary {
		background: #334155;
		color: #cbd5e1;
	}

	.btn-secondary:hover {
		background: #475569;
	}

	.getting-started {
		background: rgba(59, 130, 246, 0.1);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.steps {
		list-style: none;
		counter-reset: step-counter;
		padding: 0;
		max-width: 700px;
		margin: 1.5rem auto 0;
	}

	.steps li {
		counter-increment: step-counter;
		margin-bottom: 1rem;
		padding-left: 3rem;
		position: relative;
		line-height: 1.6;
	}

	.steps li::before {
		content: counter(step-counter);
		position: absolute;
		left: 0;
		top: 0;
		background: #3b82f6;
		color: white;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
	}

	.tech-stack {
		text-align: center;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
		margin-top: 1rem;
	}

	.tag {
		background: rgba(56, 189, 248, 0.2);
		color: #38bdf8;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.9rem;
		border: 1px solid rgba(56, 189, 248, 0.3);
	}

	footer {
		text-align: center;
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		color: #64748b;
	}

	footer a {
		color: #38bdf8;
		text-decoration: none;
	}

	footer a:hover {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
