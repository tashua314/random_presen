# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LT Realtime Screen App - ライトニングトークイベント用のリアルタイム画面表示システム。

主要機能:

- **管理画面** (`/admin`): 発表者情報・スライドURL登録、発表順序管理
- **スクリーン画面** (`/screen`): プロジェクター表示用（PDFスライド + リアルタイムコメント）
- **リモート操作** (`/remote/[talkId]`): 発表者用スライド操作
- **コメント投稿** (`/comment/[talkId]`): 聴衆用リアルタイムコメント

## Tech Stack

SvelteKit + TypeScript / Neon PostgreSQL + Drizzle ORM / PDF.js / Tailwind CSS v4

## Commands

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm check        # svelte-check（型チェック）
pnpm lint         # Prettier + ESLint
pnpm format       # コード整形
pnpm check:all    # lint + size-check + check + build（フルチェック）
pnpm fix:all      # format + check:all
```

## Architecture

```
src/
├── routes/                    # SvelteKitファイルシステムルーティング
│   ├── admin/                 # 管理画面
│   ├── screen/                # スクリーン表示（?layout=top|side|side-right）
│   ├── remote/[talkId]/       # リモート操作（発表者別）
│   └── comment/[talkId]/      # コメント投稿（発表別）
├── lib/
│   ├── server/db/             # Drizzle ORMスキーマ・DB接続
│   │   └── schema.ts          # events, talks, slideStates, comments, eventStates
│   └── services/              # DataService抽象化層
│       ├── types.ts           # DataServiceインターフェース定義
│       ├── db-client.ts       # 本番用DB実装
│       └── mock.ts            # モック実装
docs/                          # 設計ドキュメント
├── lt-realtime-screen-app-design.md    # システム全体設計
├── data-model-and-realtime.md          # データモデル・リアルタイム設計
├── routes-and-components-sveltekit.md  # ルーティング・コンポーネント設計
└── ui-and-flows.md                     # UIモック・ユーザーフロー
```

**データモデル**: Event → Talks（順序付き） → SlideState / Comments

**スライド表示**: PDF.js でGoogle Drive PDF（`https://drive.google.com/uc?export=download&id=FILE_ID`）をレンダリング

## Coding Style

- TypeScript必須、関数は型付け
- Svelteコンポーネント: PascalCase、ルートファイル: `+page/+layout`
- インデント: タブ（既存ファイル準拠）
- インポート順: 標準ライブラリ → 外部 → ローカル
- スタイル: Svelteコンポーネント内でスコープ

## Testing

- `pnpm check` がプッシュ前の必須ゲート
- UI変更は `pnpm preview` で確認
