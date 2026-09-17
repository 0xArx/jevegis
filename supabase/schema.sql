create extension if not exists pgcrypto;

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text unique not null,
  key_prefix text not null,
  owner_email text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);

create index if not exists idx_api_keys_owner_email on api_keys (owner_email);

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references api_keys(id) on delete cascade,
  product text not null default 'security' check (product in ('security', 'moderation')),
  direction text not null check (direction in ('input', 'output', 'document', 'content')),
  verdict text not null check (verdict in ('allow', 'review', 'block')),
  eval_id text,
  reasons jsonb,
  signals jsonb not null,
  latency_ms integer not null,
  input_tokens integer not null,
  output_tokens integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scans_api_key_created on scans (api_key_id, created_at desc);
create index if not exists idx_scans_api_key_product_created on scans (api_key_id, product, created_at desc);
