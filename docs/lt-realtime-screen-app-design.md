# LT Realtime Screen App Design （SvelteKit版）

## 1. システム概要

### 1.1 目的

LTイベント向けに、以下を行える Web アプリケーションを提供する。

- LTの登壇順を管理・表示する
- スクリーン用画面に「現在の登壇者」「次の登壇者」「残り時間」を表示する
- スクリーン用画面に PDF スライドを表示する  
  - PDF は Google Drive 上に配置されたものを利用（direct download URL を使用）
- 登壇者がリモート（PC/スマホ）からスライドのページ送りを行える
- 参加者がスマホから投稿したコメントを、リアルタイムにスクリーンにタイムライン表示する

### 1.2 想定技術スタック

- フレームワーク: **SvelteKit**
- 言語: TypeScript
- UI: Svelte + Tailwind CSS
- データ・リアルタイム: Supabase (PostgreSQL + Realtime)
- スライド表示: pdf.js（ブラウザ側でレンダリング）
- デプロイ: Vercel / Netlify / Cloudflare Pages など（SvelteKit対応環境）

---

## 2. 要件定義

### 2.1 機能要件（必須）

1. **登壇者管理**
   - 登壇者の登録（名前・タイトル・スライドURL）
   - 登壇順の管理（手動並び替え＋ランダム並び替え）

2. **進行管理**
   - 現在の登壇者の選択（「前へ」「次へ」ボタン）
   - 残り時間タイマーの表示・管理（スタート／一時停止／リセット）

3. **スクリーン表示**
   - イベント名
   - 現在の登壇者名
   - LTタイトル
   - 次の登壇者情報
   - 残り時間
   - PDF スライド表示
   - コメントタイムライン表示
   - レイアウト切り替え（上部表示 / サイド表示 / サイド右）

4. **リモートスライド操作**
   - 登壇者用画面から「前のスライド」「次のスライド」操作
   - スクリーン側スライドの表示ページがリアルタイムに追従

5. **コメント投稿・タイムライン**
   - 参加者がスマホからコメント投稿
   - 任意の表示名（ニックネーム）設定
   - コメントは登壇者（talk）単位で紐付け
   - スクリーン側タイムラインにリアルタイム表示

### 2.2 非機能要件

- 小〜中規模LTイベント（数十人規模）での利用を想定
- コメント・スライド操作の反映は1〜2秒以内を目安
- 管理画面へのアクセスには簡易パスワード or IP制限などで保護
- イベントごとにデータを初期化できる（MVPではDB手動クリアでも可）

---

## 3. 画面設計（概要）

### 3.1 画面一覧

| 画面ID | パス                     | 用途                                       |
|--------|--------------------------|--------------------------------------------|
| G01    | `/admin`                 | イベント設定・登壇者管理・進行操作        |
| G02    | `/screen`                | スクリーン表示（スライド＋情報＋コメント） |
| G03    | `/remote/[talkId]`       | 登壇者用リモコン（スライドページ送り）     |
| G04    | `/comment/[talkId]`      | 参加者コメント投稿画面                     |

#### レイアウト切り替え

- `/screen?layout=top`
- `/screen?layout=side`
- `/screen?layout=side-right`

### 3.2 /admin 画面（G01）

- イベント名入力・保存
- 登壇者追加フォーム（名前／タイトル／スライドURL）
- 登壇者一覧（ドラッグ＆ドロップで順番変更）
- 登壇順ランダムシャッフル
- 現在の登壇者表示と「前へ／次へ」ボタン
- タイマー表示・操作

### 3.3 /screen 画面（G02）

共通表示:

- イベント名
- 現在の登壇者名
- LTタイトル
- 残り時間
- 次の登壇者
- スライド（PDFビューワ）
- コメントタイムライン

レイアウト:

- `layout=top` → 上部に情報、中央にスライド、下部にタイムライン
- `layout=side` → 左に情報＋タイムライン、右にスライド
- `layout=side-right` → 左にスライド、右に情報＋タイムライン

### 3.4 /remote/[talkId] 画面（G03）

- 対象登壇者名・タイトル表示
- 接続状態（Online / Offline）表示
- 現在ページ `X / Y` 表示（取得できる範囲で）
- 「前のスライド」「次のスライド」ボタン

### 3.5 /comment/[talkId] 画面（G04）

- 現在の登壇者名・タイトル表示
- 表示名（任意）入力欄
- コメント入力欄
- コメント送信ボタン

---

## 4. データ設計（概要）

詳細は `docs/data-model-and-realtime.md` を参照。ここでは要点のみ。

### 4.1 talks テーブル

- 登壇者＋LT情報を保持
- カラム例:
  - id (uuid)
  - event_id (uuid)
  - order_index (integer)
  - name (text)
  - title (text)
  - slide_url (text)
  - created_at (timestamptz)

### 4.2 slide_states テーブル

- 各登壇者の現在スライドページを保持
- カラム例:
  - id (uuid)
  - talk_id (uuid, unique)
  - current_page (integer, default 1)
  - updated_at (timestamptz)

### 4.3 comments テーブル

- コメントを保持
- カラム例:
  - id (uuid)
  - talk_id (uuid)
  - display_name (text)
  - message (text)
  - created_at (timestamptz)

### 4.4 event_states テーブル（任意）

- イベントごとの「現在の登壇順」を保持するための状態テーブル

---

## 5. アーキテクチャ（SvelteKit観点）

- `src/routes` 配下に各画面の `+page.svelte` / `+page.server.ts` を配置
- Supabase クライアントは `src/lib/supabaseClient.ts` などに切り出す
- PDF ビューアは `SlideViewer` コンポーネントとして分離
- コメントタイムライン・タイマーなどもコンポーネント単位で作成

詳細なルーティングとコンポーネント分割は  
`docs/routes-and-components-sveltekit.md` を参照。

---

## 6. MVP 実装優先度

1. データモデル（Supabase / schema）準備
2. `/admin` での登壇者登録・順番管理
3. `/screen` での「現在登壇者情報＋スライド静的表示」
4. `/remote/[talkId]` と `slide_states` の Realtime 同期（ページ送り）
5. `/comment/[talkId]` と `comments` の Realtime 同期（タイムライン）
6. `/screen` のレイアウト切り替え（layoutクエリ対応）
