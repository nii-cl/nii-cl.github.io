-- papers.bib の書誌情報を管理する Supabase スキーマ
-- Supabase SQL Editor でこのファイルの内容をそのまま実行してください。

create table if not exists public.papers (
  id bigint generated always as identity primary key,
  citation_key text not null unique,
  entry_type text not null default 'article',
  title text not null,
  author text not null,
  year integer,
  month text,
  journal text,
  booktitle text,
  publisher text,
  volume text,
  number text,
  pages text,
  doi text,
  url text,
  abstract text,
  selected boolean not null default false,
  award text,
  award_name text,
  -- pdf/code/video/website/slides/poster/supp/arxiv/html/keywords/bibtex_show など
  -- al-folio 固有の疎らなフィールドをまとめて格納する
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists papers_year_idx on public.papers (year desc);
create index if not exists papers_selected_idx on public.papers (selected) where selected;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists papers_set_updated_at on public.papers;
create trigger papers_set_updated_at
  before update on public.papers
  for each row
  execute function public.set_updated_at();

-- RLS: 読み取りは誰でも可(サイトのビルド時取得用)、書き込みは service_role のみ
-- (service_role は RLS を自動的にバイパスするため、書き込みポリシーは不要)
alter table public.papers enable row level security;

drop policy if exists "Public read access" on public.papers;
create policy "Public read access"
  on public.papers
  for select
  using (true);
