# 設計書：コメント差分取得（Polling）＋登壇者操作（Pusher Channels）
対象：SvelteKit（Vercel） + Neon PostgreSQL  
更新日：2025-12-28（JST）

---

## 0. ゴール
- `/screen` で表示する **コメント取得を「全件取得」→「差分取得」**に変更し、転送量とDB負荷を抑える。
- **登壇者のスライド操作**（next/prev/goto 等）を **Pusher Channels** でリアルタイム配信し、スクリーン表示を即時同期する。
- Vercel（サーバレス）前提で、**常時接続のWebSocketサーバは自前で持たない**。
- 再接続・途中参加でも復元できるよう、**最新状態はDBに永続化**する。

---

## 1. 現状整理（抜粋）
### 1-1. コメント
- クライアントは `subscribeToComments()` で **1秒間隔ポーリング**（HTTP GET）している。
- API `GET /api/comments/[talkId]` は **全件取得**で返している。

### 1-2. 登壇者操作
- 現状は（コメント同様）ポーリングやHTTP経由で状態を取得している想定。
- 低遅延での同期が必要なため、Pusher移行する。

---

## 2. 方針（結論）
### 2-1. コメントは「差分取得Polling」
- 継続：1秒ポーリング自体は維持（実装コストと安定性が高い）
- 改善：GETに `after` を導入し、**最後に取得したID以降だけ**返す  
  - `after` は `createdAt` でも可能だが、同時刻衝突・時計ズレを避けるため **ID基準推奨**  
  - DBは `id` を単調増加 or ソート可能（UUIDv7 / ULID など）だと理想  
  - 既存がUUIDv4の場合は `createdAt + id` の複合で差分判定

### 2-2. 登壇者操作はPusher（WebSocket）
- `room:{eventId}:{talkId}` のような **チャンネル単位**で同期
- イベントは `slide.control`（goto/next/prev）をPublish
- **操作は登壇者のみ**送信可能にする（サーバ側で署名・認可）
- スクリーン側はSubscribeし、受信した操作を即時反映

### 2-3. 状態はDBに永続化（単一真実の源泉）
- スクリーンが再接続した場合でも `GET /api/talks/[talkId]/state` などで **最新ページを復元**
- Pusherは “配信” であり、永続はDB

---

## 3. データ設計
### 3-1. コメント（既存）
現在のスキーマ：
- `comments`
  - `id` (uuid)
  - `talk_id` (uuid)
  - `display_name` (text)
  - `message` (text)
  - `created_at` (timestamp)

**差分取得のためのインデックス**
- `INDEX (talk_id, created_at, id)` もしくは `INDEX (talk_id, id)`  
  - UUIDv4で `id > after` が使えない場合は created_at 併用する

### 3-2. スライド状態（既存）
現在のスキーマ：
- `slide_states`
  - `id` (uuid, PK)
  - `talk_id` (uuid, unique)
  - `current_page` (int)
  - `updated_at` (timestamp)

> Pusher導入時に `updated_by` カラム追加を検討

---

## 4. API設計（SvelteKit routes）
### 4-1. コメント差分取得
**GET** `/api/comments/[talkId]?after=<cursor>&limit=<n>`

- `after`: クライアントが最後に受け取ったコメントのカーソル
  - 推奨：`afterId`（id）または `afterCreatedAt`（ISO）＋ `afterId`
- `limit`: 既定 100（上限 500 など）

**レスポンス**
```json
{
  "comments": [/* 新規分 */],
  "nextCursor": {
    "lastId": "....",
    "lastCreatedAt": "2025-12-28T12:00:00.000Z"
  }
}
```

**互換性**
- `after` 未指定なら、初回は最新N件 or 全件（既存互換）  
  - 推奨：初回は「最新200件」などに上限を付けて安全に

---

### 4-2. コメント投稿
**POST** `/api/comments/[talkId]`

- DBにINSERT
- （任意）スクリーン側で差分ポーリングなのでPush不要  
  - 将来コメントもPusher化する場合、ここでPusher publish を追加可能

---

### 4-3. スライド状態取得（既存）
**GET** `/api/state/slide/[talkId]`

レスポンス：
```json
{ "talkId": "...", "currentPage": 12 }
```

### 4-4. スライド状態更新（既存 → Pusher対応に拡張）
**POST** `/api/state/slide/[talkId]`
- 認可：登壇者のみ
- body例：
```json
{ "type": "goto", "page": 12 }
```
- サーバ側で `current_page` 更新（整合性チェック）
- 成功後に **Pusher publish**（スクリーンに配信）

---

## 5. Pusher設計
### 5-1. チャンネル命名
- 視聴用（スクリーン側）：`private-screen.{eventId}.{talkId}`
- 操作用（登壇者→スクリーン）：同上に統一（イベント種別で分ける）

> 備考：Presenceが必要（参加者一覧など）なら `presence-` を検討。

### 5-2. イベント設計
- event: `slide.control`
- payload:
```json
{
  "talkId": "xxx",
  "action": "goto" | "next" | "prev",
  "page": 12,
  "issuedAt": "2025-12-28T12:00:00.000Z",
  "issuedBy": "userId"
}
```

### 5-3. 認可（Pusher private channel）
Vercel上で **認可エンドポイント**を用意して署名する。

**POST** `/api/pusher/auth`
- 入力：`socket_id`, `channel_name`
- セッションからユーザ識別
- ルール：
  - スクリーン端末：subscribe許可（必要なら会場用トークン）
  - 登壇者：subscribe許可＋操作APIの利用許可（別途）

---

## 6. フロント設計（Svelte components/services）
### 6-1. コメント差分購読（Polling）
- `src/lib/services/comments-subscriber.ts`（新規）
  - `subscribeToCommentsDelta(talkId, onNewComments)`
  - 内部に `cursor` を保持し、`GET ...?after=cursor` を定期呼び出し
  - 受信した `comments` をUIにappend
  - エラー時は指数バックオフ（1s→2s→5s→… 上限10s）推奨

### 6-2. スライド同期（Pusher）
- `src/lib/services/pusher-client.ts`（新規）
  - Pusher初期化（public key, cluster）
  - private channel subscribe（authEndpointを指定）
- `src/lib/services/slide-sync.ts`（新規）
  - `subscribeSlideControl(eventId, talkId, onControl)`
  - `onControl` で screen 側のPDFビューア状態を更新

### 6-3. 管理（登壇者）側の操作フロー
- admin UIで `next/prev/goto` を押す
- `POST /api/talks/[talkId]/state` を叩く（永続化＆Pusher publish）
- 成功レスポンスでローカルも更新（楽観 or サーバ確定）

---

## 7. 重要な仕様（整合性・再接続）
### 7-1. 再接続時
- スクリーンは起動時に
  1) `GET /api/state/slide/[talkId]` で currentPage を取得
  2) Pusher subscribe して以降の操作を反映
- コメントは
  1) 初回 `GET /api/comments/[talkId]?limit=200` など
  2) 以降は `after=cursor` で差分

### 7-2. 順序保証
- `issuedAt` と `page` をpayloadに含め、受信側は
  - すでに同一 or 新しい `issuedAt` のみ適用
  - 遅延到着を弾く
- さらにDB側 state 更新時に `updated_at` を更新し、サーバが正とする

---

## 8. env / 設定
### 8-1. Vercel環境変数（例）
`.env.example`
```bash
# Neon
DATABASE_URL=postgres://...

# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

# Public（ブラウザで使う）
PUBLIC_PUSHER_KEY=
PUBLIC_PUSHER_CLUSTER=
```

> `PUSHER_*`（secret含む）はサーバ側のみ。`PUBLIC_*` はクライアント用。

---

## 9. 実装ファイル一覧（提案）
### 9-1. 追加・変更
- `src/routes/api/comments/[talkId]/+server.ts`（GET差分対応に変更）
- `src/routes/api/state/slide/[talkId]/+server.ts`（POST時にPusher publish追加）
- `src/routes/api/pusher/auth/+server.ts`（Pusher private認可、新規）

- `src/lib/services/comments-subscriber.ts`（差分ポーリング）
- `src/lib/services/pusher-client.ts`（Pusher client wrapper）
- `src/lib/services/slide-sync.ts`（screen用購読）
- `src/lib/server/pusher.ts`（サーバ側 Pusher SDK 初期化）

- `src/lib/components/Screen/...`（screenに購読ロジック接続）
- `src/routes/admin/...`（登壇者操作UIがある場合、API呼び出しへ接続）

### 9-2. サーバ専用コードの置き場
- `src/lib/server/*` を使用（SvelteKitのserver-onlyを明確化）

---

## 10. 疑似シーケンス
### 10-1. コメント（差分ポーリング）
1. Screen: `GET /api/comments/:talkId?limit=200`（初回）
2. Screen: `GET /api/comments/:talkId?after=<cursor>`（1秒ごと）
3. API: DBから差分抽出 → JSON返却
4. Screen: 受信分をappend

### 10-2. 登壇者操作（Pusher）
1. Admin: ボタン押下 → `POST /api/state/slide/:talkId {action}`
2. API: 認可 → DB更新（slide_states） → Pusher `trigger(slide.control)`
3. Screen: Pusherで受信 → 画面更新
4. Screen（再接続）: `GET /api/state/slide/:talkId` で復元

---

## 11. 失敗パターンと対策
- **Pusherが一時的に落ちる/切れる**
  - Screenは定期的に `GET state`（例: 10秒に1回）で補正してもOK（保険）
- **コメントが急増**
  - limitを絞る・初回は最新N件にする・appendのみ（仮想スクロールも検討）
- **不正操作（視聴者が操作イベント送る）**
  - 操作イベントは「クライアントから直接Pusherへ送らない」
  - 必ず `POST state` 経由でサーバがpublish（署名鍵は漏らさない）

---

## 12. マイグレーション（例）
> `slide_states` は既存。Pusher対応で `updated_by` を追加する場合：

```sql
ALTER TABLE slide_states ADD COLUMN updated_by text;
```

または Drizzle migration で対応。

---

## 13. ロールアウト手順
1. 先にAPIを差分対応（後方互換維持）
2. Screen側のsubscriberを差分モードに切替
3. Pusher導入（auth endpoint含む）
4. 登壇者操作を `POST state` 経由に切替
5. ログ・計測（API回数/レスポンスサイズ）を確認

---

## 14. 受け入れ基準（Definition of Done）
- [ ] `GET /api/comments/:talkId` が `after` 指定で差分のみ返す
- [ ] Screenが差分ポーリングでコメントを追記し続ける
- [ ] 登壇者操作がPusher経由でスクリーンへ即時反映される
- [ ] スクリーン再読み込みで state から復元される
- [ ] 秘密鍵がクライアントに露出しない（Pusher secretはserver-only）

---

## 15. 実装メモ（カーソル設計の推奨）
- 可能ならコメントIDを **ULID / UUIDv7** に寄せると `id > after` が成立して差分が簡単
- 既存がUUIDv4なら、
  - `afterCreatedAt` + `afterId` を使い
  - `WHERE (created_at > t) OR (created_at = t AND id > afterId)` のように比較する

