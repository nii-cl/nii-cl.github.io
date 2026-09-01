# papers テーブル API 仕様書

Supabase は `supabase/schema.sql` で定義したテーブルに対して、PostgREST による REST API を自動生成する。専用のサーバーコードは存在せず、以下のエンドポイントに HTTP リクエストを送るだけで読み書きできる。

- ベース URL: `https://xqaujekzikexfdalthga.supabase.co`
- 対象テーブル: `papers`
- エンドポイント: `{ベースURL}/rest/v1/papers`

## 認証キー

| キー | 用途 | 権限 |
| --- | --- | --- |
| `anon` key | 読み取り専用の用途(申請書作成時の論文リスト取得など) | `papers` テーブルの SELECT のみ(RLS ポリシーで許可) |
| `service_role` key | 追加・更新・削除を含む全操作 | RLS を完全にバイパスする強い権限 |

**`service_role` key は絶対にクライアントサイド(ブラウザ JS 等)や公開リポジトリに置かないこと。** サーバーサイドのスクリプトや CI の Secret としてのみ使う。`anon` key は公開されても大きな問題はない(読み取り専用でRLSにより保護されている)が、それでも `.env` 等で管理し、Git にはコミットしないこと。

キーの確認場所: Supabase ダッシュボード → Project Settings → API。

すべてのリクエストに以下の2つのヘッダーが必須:

```
apikey: <anon または service_role key>
Authorization: Bearer <同じキー>
```

## Read(読み取り)

`anon` key で GET リクエストするだけ。書き込み権限は無いので、鍵の管理を気にせず色々な場所から呼び出してよい。

### 全件取得

```bash
curl "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### 申請書用: これまで公開した論文の一覧(年・著者・タイトル・掲載誌のみ、新しい順)

```bash
curl "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?select=year,author,title,journal,booktitle,doi,url&order=year.desc" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### 特定の年だけ取得

```bash
curl "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?select=*&year=eq.2026" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### タイトルや著者名で検索(部分一致)

```bash
curl "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?select=*&title=ilike.*trust*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

curl "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?select=*&author=ilike.*Sugawara*" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

### よく使うクエリパラメータ

| パラメータ | 意味 | 例 |
| --- | --- | --- |
| `select` | 取得するカラムを指定 | `select=title,year,abstract` |
| `order` | 並び替え | `order=year.desc,month.desc` |
| `<column>=eq.<値>` | 完全一致フィルタ | `year=eq.2026` |
| `<column>=ilike.*<値>*` | 大文字小文字を無視した部分一致 | `title=ilike.*LLM*` |
| `limit` / `offset` | 件数制限・ページング | `limit=10&offset=20` |

## Write(書き込み)

`service_role` key が必須。

### 新しい論文を1件追加(INSERT)

```bash
curl -X POST "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "citation_key": "sugawara2027example",
    "entry_type": "inproceedings",
    "title": "An Example Paper Title",
    "author": "Sugawara, Saku and Example, Someone",
    "year": 2027,
    "month": "may",
    "booktitle": "Proceedings of Example Conference",
    "publisher": "Association for Computational Linguistics",
    "abstract": "This paper presents...",
    "url": "https://arxiv.org/abs/2705.00000",
    "extra": { "arxiv": "2705.00000" }
  }'
```

`citation_key` は一意制約があるため、既存の論文と重複するキーは使えない。`extra` には `pdf` / `code` / `video` / `website` / `slides` / `poster` / `supp` / `arxiv` / `html` / `keywords` / `bibtex_show` など、`supabase/schema.sql` の固定カラムに無いフィールドを JSON で自由に入れる(詳細はスキーマ定義のコメント参照)。

### 既存の論文を更新(UPDATE、例: abstract を後から追加)

```bash
curl -X PATCH "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?citation_key=eq.sugawara2027example" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "abstract": "Updated abstract text." }'
```

### 論文を削除(DELETE)

```bash
curl -X DELETE "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?citation_key=eq.sugawara2027example" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### 追加/更新をまとめて行う(UPSERT、複数件も可)

`on_conflict` で一意キーを指定し、`Prefer: resolution=merge-duplicates` を付けると「あれば更新、無ければ追加」になる。`.github/scripts/supabase/migrate-bib-to-supabase.mjs` はこの方式で papers.bib の内容を一括投入している。

```bash
curl -X POST "https://xqaujekzikexfdalthga.supabase.co/rest/v1/papers?on_conflict=citation_key" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '[{ "citation_key": "...", "entry_type": "article", "title": "...", "author": "..." }]'
```

## テーブル定義(フィールド一覧)

詳細は `supabase/schema.sql` を参照。主なカラム:

| カラム | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `citation_key` | text | ○(一意) | BibTeX キー |
| `entry_type` | text | ○ | `article` / `inproceedings` など |
| `title` | text | ○ | 論文タイトル |
| `author` | text | ○ | `Last, First and Last2, First2` 形式 |
| `year` / `month` | integer / text | - | 発表年・月 |
| `journal` / `booktitle` / `publisher` | text | - | 掲載誌・会議・出版社 |
| `doi` / `url` | text | - | DOI・リンク |
| `abstract` | text | - | アブストラクト全文 |
| `selected` | boolean | - | サイトでのハイライト表示用 |
| `award` / `award_name` | text | - | 受賞情報 |
| `extra` | jsonb | - | 上記以外の al-folio 固有フィールド(pdf, code, video, arxiv 等)をまとめて格納 |

## その他

- ブラウザからではなく Node スクリプトから叩きたい場合は、この仕様書のエンドポイント/ヘッダーをそのまま `fetch` に置き換えればよい(実装例: `.github/scripts/supabase/lib/bibtex.mjs` を使う `migrate-bib-to-supabase.mjs` / `generate-bib-from-supabase.mjs`)。
- 現時点で GitHub Actions によるサイトへの自動反映(`papers.bib` の自動生成)は無効化している。Supabase の内容をサイトに反映したい場合は、当面は手動で `_bibliography/papers.bib` を編集するか、`node .github/scripts/supabase/generate-bib-from-supabase.mjs` をローカルで実行して生成結果を確認・コミットすること。
