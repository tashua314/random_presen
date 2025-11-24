# データモデル & Realtime 設計

## 1. テーブル定義（Supabase / PostgreSQL）

### 1.1 events

イベントを表すテーブル。MVPでイベントが1つだけなら省略可。

```sql
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
```

### 1.2 talks

登壇者とLT情報を表すテーブル。

```sql
create table public.talks (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references public.events(id),
  order_index  int not null,
  name         text not null,
  title        text,
  slide_url    text, -- Google Drive direct URL
  created_at   timestamptz not null default now()
);

create index talks_event_order_idx on public.talks (event_id, order_index);
```

### 1.3 slide_states

各登壇者のスライド現在ページを保持するテーブル。

```sql
create table public.slide_states (
  id           uuid primary key default gen_random_uuid(),
  talk_id      uuid not null references public.talks(id),
  current_page int not null default 1,
  updated_at   timestamptz not null default now(),
  unique (talk_id)
);
```

### 1.4 comments

コメントを保持するテーブル。

```sql
create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  talk_id      uuid not null references public.talks(id),
  display_name text,
  message      text not null,
  created_at   timestamptz not null default now()
);

create index comments_talk_created_idx
  on public.comments (talk_id, created_at);
```

### 1.5 event_states（任意）

イベントごとの「現在の登壇順」を保持する状態テーブル。

```sql
create table public.event_states (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id),
  current_order int not null default 0,
  updated_at    timestamptz not null default now(),
  unique (event_id)
);
```

---

## 2. Realtime 設計

Supabase Realtime を利用し、以下の変更を購読する。

### 2.1 スライドページ同期

- チャンネル例: `realtime:slide_states`
- 対象テーブル: `public.slide_states`
- イベント: `UPDATE`

購読側（`/screen`）では、現在の登壇者 `talk_id` の変更のみを処理する。

擬似コード:

```ts
supabase
  .channel('realtime:slide_states')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'slide_states'
    },
    payload => {
      if (payload.new.talk_id === currentTalkId) {
        currentPage.set(payload.new.current_page);
      }
    }
  )
  .subscribe();
```

### 2.2 コメントタイムライン同期

- チャンネル例: `realtime:comments`
- 対象テーブル: `public.comments`
- イベント: `INSERT`

擬似コード:

```ts
supabase
  .channel('realtime:comments')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'comments'
    },
    payload => {
      if (payload.new.talk_id === currentTalkId) {
        comments.update(list => [...list, payload.new]);
      }
    }
  )
  .subscribe();
```

### 2.3 現在登壇者の同期（任意）

`event_states.current_order` を Realtime購読し、 `/screen` と `/admin` 間で現在登壇者を共有することもできる。

---

## 3. Google Drive PDF 取り扱い

### 3.1 URL形式

登壇者には、Google Drive 上でPDFを「リンクを知っている全員が閲覧可」に設定してもらい、  
以下の形式のURLを入力してもらう想定。

```text
https://drive.google.com/uc?export=download&id=FILE_ID
```

### 3.2 pdf.js での読み込み

- クライアント側で `pdfjsLib.getDocument(slideUrl)` を呼び出し、Documentオブジェクト取得
- `getPage(currentPage)` で対象ページを取得し、canvasに描画
- `currentPage` は `slide_states` の Realtime購読結果を反映

---

## 4. 今後の拡張メモ

- コメントにスタンプやリアクションを追加
- talkごとの「いいね」数集計
- コメントのモデレーション（削除フラグなど）
- イベント終了後にコメントログをエクスポート
