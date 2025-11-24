# Random Presen (LT リアルタイムアプリ)

LT（ライトニングトーク）イベントのためのリアルタイムスクリーンアプリです。
**SvelteKit**, **Tailwind CSS**, **Neon (PostgreSQL)** (実装予定) で構築されています。

## 機能

- **管理画面 (Admin Dashboard)**: 登壇者の管理、並び替え、プレゼンテーションの進行操作。
- **スクリーン表示 (Screen View)**: プロジェクター向けの表示。リアルタイムに情報が更新されます。
- **リモコン (Remote Controller)**: 登壇者が自分のデバイスからスライド操作を行えます。
- **コメントシステム**: 参加者が投稿したコメントがスクリーン上に流れます。
- **PDFスライド**: URL（Google Drive等）からPDFスライドを直接レンダリングします。

## 技術スタック

- **フレームワーク**: SvelteKit
- **スタイリング**: Tailwind CSS
- **PDFレンダリング**: pdf.js
- **データベース**: Neon (PostgreSQL) _[実装中]_
- **デプロイ**: Vercel

## 始め方 (Mockモード)

現在はインメモリデータを使用した **Mockモード** で動作します。

1. **依存関係のインストール**:

   ```bash
   pnpm install
   ```

2. **開発サーバーの起動**:

   ```bash
   pnpm dev
   ```

3. **アプリへのアクセス**:
   - **管理画面**: `http://localhost:5173/admin` (パスワード: `admin123`)
   - **スクリーン**: `http://localhost:5173/screen`
   - **リモコン**: `http://localhost:5173/remote/[talk-id]`
   - **コメント**: `http://localhost:5173/comment/[talk-id]`

## デプロイ (Vercel)

Vercelへのデプロイ用に設定済みです。

1. GitHubへプッシュします。
2. Vercelでプロジェクトをインポートします。
3. `@sveltejs/adapter-vercel` が自動的にビルドを処理します。

## ロードマップ

- [x] Mock実装 (UI/UX検証)
- [ ] **Neon DB 統合** (データ永続化)
- [ ] リアルタイム更新 (ポーリング または WebSocket)
- [ ] 認証機能の統合
