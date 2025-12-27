# データモデル & Realtime 設計

## 1. テーブル定義（Neon PostgreSQL / Drizzle ORM）

### 1.1 events

イベントを表すテーブル。

```typescript
// src/lib/server/db/schema.ts
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### 1.2 talks

登壇者とLT情報を表すテーブル。

```typescript
export const talks = pgTable('talks', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  slideUrl: text('slide_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### 1.3 slide_states

各登壇者のスライド現在ページを保持するテーブル。

```typescript
export const slideStates = pgTable('slide_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  talkId: uuid('talk_id').references(() => talks.id).notNull().unique(),
  currentPage: integer('current_page').default(1).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

### 1.4 comments

コメントを保持するテーブル。

```typescript
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  talkId: uuid('talk_id').references(() => talks.id).notNull(),
  displayName: text('display_name').default('Anonymous'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### 1.5 event_states

イベントごとの「現在の登壇者」を保持する状態テーブル。

```typescript
export const eventStates = pgTable('event_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull().unique(),
  currentTalkId: uuid('current_talk_id').references(() => talks.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

---

## 2. リアルタイム同期設計

HTTPポーリング方式で実装。`DataService` インターフェースで抽象化。

### 2.1 ポーリング実装

```typescript
// src/lib/services/db-client.ts
private readonly POLL_INTERVAL = 1000; // 1秒間隔

subscribeToComments(talkId: string, callback: (comments: Comment[]) => void): () => void {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const comments = await this.getComments(talkId);
      callback(comments);
    } catch (e) {
      console.error(e);
    }
    if (active) setTimeout(poll, this.POLL_INTERVAL);
  };
  poll();
  return () => { active = false; };
}
```

### 2.2 同期対象

| 対象 | メソッド | 用途 |
|------|---------|------|
| スライド状態 | `subscribeToSlideState` | リモート操作 → スクリーン表示 |
| コメント | `subscribeToComments` | コメント投稿 → タイムライン表示 |
| 現在の登壇者 | `subscribeToCurrentTalk` | 管理画面 → スクリーン切り替え |

---

## 3. Google Drive PDF 取り扱い

### 3.1 URL形式

登壇者には、Google Drive 上でPDFを「リンクを知っている全員が閲覧可」に設定してもらい、以下の形式のURLを入力してもらう想定。

```text
https://drive.google.com/uc?export=download&id=FILE_ID
```

### 3.2 pdf.js での読み込み

- クライアント側で `pdfjsLib.getDocument(slideUrl)` を呼び出し、Documentオブジェクト取得
- `getPage(currentPage)` で対象ページを取得し、canvasに描画
- `currentPage` はポーリングで取得した `slide_states` の値を反映
