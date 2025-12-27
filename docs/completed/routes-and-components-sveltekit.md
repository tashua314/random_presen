# SvelteKit ルーティング & コンポーネント設計

## 1. ルーティング構成（src/routes）

```text
src/
  routes/
    +layout.svelte              -- 共通レイアウト（必要なら）
    admin/
      +page.svelte              -- G01: 管理画面
      +page.server.ts           -- 登壇者一覧取得・更新API
    screen/
      +page.svelte              -- G02: スクリーン表示
    remote/
      [talkId]/
        +page.svelte            -- G03: 登壇者リモコン
    comment/
      [talkId]/
        +page.svelte            -- G04: コメント投稿
  lib/
    supabaseClient.ts           -- Supabaseクライアント初期化
    api/
      talks.ts                  -- talks 取得・更新ラッパ
      slideStates.ts            -- slide_states 操作
      comments.ts               -- comments 操作
  components/
    Admin/
      AdminTalkForm.svelte
      AdminTalkList.svelte
      AdminControls.svelte
    Screen/
      ScreenLayoutTop.svelte
      ScreenLayoutSide.svelte
      ScreenLayoutSideRight.svelte
      SlideViewer.svelte
      CommentTimeline.svelte
      TimerDisplay.svelte
    Remote/
      RemoteController.svelte
    Comment/
      CommentForm.svelte
```

---

## 2. 主要コンポーネントの役割

### 2.1 Admin 系

- `AdminTalkForm.svelte`
  - 登壇者の新規追加フォーム
  - 名前／タイトル／スライドURLを入力し、SupabaseにINSERT

- `AdminTalkList.svelte`
  - 登壇者一覧の表示
  - ドラッグ＆ドロップで `order_index` の並び替え
  - 編集・削除ボタン

- `AdminControls.svelte`
  - 現在の登壇者表示
  - 「前へ／次へ」ボタンで `event_states.current_order` を更新
  - タイマー操作（フロント側状態管理でOK）

### 2.2 Screen 系

- `ScreenLayoutTop.svelte`
  - 上部にヘッダー（イベント名・登壇者情報・タイマー）
  - 中央に `SlideViewer`
  - 下部に `CommentTimeline` と次の登壇者情報

- `ScreenLayoutSide.svelte`
  - 左側に情報＋コメントタイムライン
  - 右側に `SlideViewer`

- `ScreenLayoutSideRight.svelte`
  - 左側に `SlideViewer`
  - 右側に情報＋コメントタイムライン

- `SlideViewer.svelte`
  - pdf.js を使って PDF をレンダリング
  - `slideUrl` と `currentPage` を props で受け取る

- `CommentTimeline.svelte`
  - 現在登壇者の `comments` をリスト表示
  - Realtime購読で新規コメントを反映

- `TimerDisplay.svelte`
  - 残り時間を表示
  - `/admin` 側の状態をそのまま流す or `/screen` 側は read-only

### 2.3 Remote 系

- `RemoteController.svelte`
  - `talkId` に紐づく `slide_states.current_page` を取得
  - 「前へ」「次へ」ボタンでページ番号を更新（Supabase UPDATE）
  - 接続状態は Realtime購読のサブスク状態などから簡易表示

### 2.4 Comment 系

- `CommentForm.svelte`
  - 表示名（任意）＋コメント本文の入力
  - Supabase に INSERT
  - 成功後にフォームクリア

---

## 3. SvelteKit 特有のポイント

- データ取得は
  - サーバサイド必要な箇所 → `+page.server.ts` の `load` や `actions`
  - クライアント側リアルタイム購読 → `onMount` 内で Supabase client を使う
- Tailwind のセットアップ
  - `postcss.config.cjs` と `tailwind.config.cjs` を生成
  - `src/app.css` に `@tailwind base; @tailwind components; @tailwind utilities;`
  - `+layout.svelte` や `app.html` で app.css を読み込む

---

## 4. 最低限の実装順

1. Tailwind と基本レイアウト（背景・フォント）を整える
2. `/admin` の CRUD と並び替えを実装
3. `/screen` で現在登壇者情報の表示（静的データ→DB接続）
4. `SlideViewer` を実装し、固定のPDFを表示
5. Supabase Realtime を入れて
   - `slide_states` と `/remote` の同期
   - `comments` と `/comment`・`/screen` の同期
6. `layout` クエリで `ScreenLayoutTop/Side/SideRight` を出し分け
