# The Senior Founder's Supabase Field Manual
*A ground-zero knowledge base for Corevo Solutions — built for a multi-tenant kiosk/POS SaaS on Supabase Cloud (eu-north-1, Pro tier), with Swedish Skatteverket compliance in scope.*

---

## TL;DR

- **Your top three pain points are connected, not separate.** The `function_search_path_mutable` warnings, your 80+ `SECURITY DEFINER` RPCs exposed to `anon`, and the missing HIBP leak protection are all symptoms of the same root cause: Postgres role/grant hygiene was never explicitly tightened after migrating from self-hosted. Fix them together with a three-pass migration: (1) move definer RPCs out of `public` into a `private` schema, (2) `REVOKE EXECUTE … FROM anon, authenticated` and `GRANT` selectively, (3) `ALTER FUNCTION … SET search_path = ''` and fully qualify every reference inside the body. Supabase's Security Advisor lints `0011`, `0028`, and `0029` will then go green.
- **Most of your "performance optimization opportunities" come from two specific anti-patterns** the Supabase optimizer fingerprints directly: `auth.uid()` called per-row in RLS policies (lint `0003 auth_rls_initplan` — 10–100× regressions on large scans), and missing indexes on foreign-key columns (lint `0001 unindexed_foreign_keys`). Wrapping `auth.uid()` in `(select auth.uid())` and indexing every FK and RLS-referenced column gets you to "fast enough" before you ever touch compute size.
- **For Swedish fiscal compliance plus realtime kiosk traffic, lean hard on Postgres-native primitives, not Edge Functions.** Gapless receipt sequences belong in a `SECURITY DEFINER` RPC with an advisory lock, signed audit trails via `pgaudit` + an append-only audit table indexed with BRIN, Realtime restricted to **private channels with RLS-authorized broadcast** (not `postgres_changes` at scale), and `pg_cron` + `pg_net` for scheduled Skatteverket reports. Reserve Edge Functions for webhook receivers and outbound integrations where Deno's startup beats opening a new DB connection.

---

## Key Findings

Six findings frame everything below.

**1. The Postgres role model is the security model.** Supabase exposes five roles you must internalize: `anon` (unauthenticated requests via the publishable/anon key), `authenticated` (any user with a valid JWT, including anonymous sign-ins), `service_role` (server-side, **bypasses RLS**), `authenticator` (the role PostgREST uses before it `SET ROLE`s to one of the above per-request), and `postgres`/`supabase_admin` (you never touch from a client). Every grant, every policy, every function ownership decision boils down to choosing among these. The `service_role` key bypassing RLS is the single most dangerous primitive on the platform — it must never appear in any browser, kiosk firmware, or React bundle.

**2. RLS is the perimeter; `SECURITY DEFINER` is the breach in it.** RLS turns Postgres into a firewall: a policy is an implicit `WHERE` clause appended to every query. The moment you write `SECURITY DEFINER` on a function in `public`, you punch a hole that runs as the function's owner (typically `postgres`, which bypasses RLS) and is callable as `POST /rest/v1/rpc/<fn>` by whoever has `EXECUTE`. That's the literal failure mode the lint `0028_anon_security_definer_function_executable` catches, and it's likely what is firing on most of your 80+ RPCs.

**3. `search_path` mutability is a privilege-escalation vector, not a stylistic nit.** A `SECURITY DEFINER` function without a pinned `search_path` looks up unqualified names (`from orders`, not `from public.orders`) using the **caller's** `search_path`. An attacker who can create a function or table in any schema you precede in resolution — historically including `pg_temp` — can shadow your real objects and have the definer function execute their code with `postgres` privileges. The fix is `SET search_path = ''` plus fully-qualified references; this is what Splinter lint `0011` is telling you.

**4. The Supabase performance story is not "scale up compute" — it's "stop scanning rows you don't need."** Three concrete patterns recover most missing performance: wrap volatile functions in `(select …)` so Postgres caches the result per-statement via initPlan; index every column referenced in `USING` / `WITH CHECK`; switch from `OFFSET` to keyset pagination on any table you expect to grow past a few hundred thousand rows. None of these require a Team plan.

**5. Realtime has three modes with very different cost profiles.** `postgres_changes` (logical replication, single-threaded, easy but doesn't scale linearly), `broadcast` (cheap, requires you to push messages explicitly or via DB triggers calling `realtime.broadcast_changes()`), and `presence` (online/offline tracking, computationally heavy — use sparingly). For a kiosk fleet, broadcast on private channels with RLS authorization is almost always the right primitive.

**6. Hidden gems that pay back immediately: HypoPG, `pgmq`/Supabase Queues, partial unique indexes, database branching, asymmetric JWT signing keys.** These five aren't obscure — they're just under-marketed relative to their leverage. We'll cover each.

---

## Details

### Part 1 — Security: the things to fix this quarter

#### 1.1 The Postgres role and grant model on Supabase

Supabase ships with these Postgres roles, and you authorize against them via the `TO` clause in policies and `GRANT`/`REVOKE` on functions and tables:

| Role | Used by | RLS applies? | Notes |
|---|---|---|---|
| `anon` | Unauthenticated requests (publishable/anon key) | Yes | Default grants used to include this — Supabase is moving toward opt-in grants; verify on new tables |
| `authenticated` | Any user with valid JWT, including anonymous sign-ins | Yes | Anonymous users are still `authenticated` — differentiate via `auth.jwt() ->> 'is_anonymous'` |
| `service_role` | Server-side admin code (Edge Functions, cron) | **No — bypasses RLS** | Never embed in client; never use from the kiosk app |
| `authenticator` | PostgREST's pre-`SET ROLE` identity | n/a | You don't write policies against it |
| `postgres` / `supabase_admin` | Migrations, Studio SQL editor | No | The SQL editor runs as a superuser — a common pitfall for RLS testing (RLS is bypassed!) |

The single most important takeaway: **the SQL Editor bypasses RLS**. Your queries return rows there that an actual `authenticated` user would never see. Test policies via the client SDK or the Studio's RLS policy tester, not the SQL editor. The Designrevision RLS guide says it plainly: *"The SQL Editor runs as the postgres superuser, which bypasses all RLS. You test your queries there, see the expected results, deploy, and then real users see nothing."*

#### 1.2 `SECURITY DEFINER` vs `SECURITY INVOKER` — when each is right

`SECURITY INVOKER` (the default) runs the function with the caller's privileges, so RLS applies normally. `SECURITY DEFINER` runs with the **function owner's** privileges, which for a function you created via Studio is typically `postgres` — bypassing RLS, all grants, the works.

**Legitimate uses of `SECURITY DEFINER` on Supabase:**

- Activation/onboarding flows where an `anon` user needs to insert into a tenant they're being added to — but only via specific, narrow logic
- RLS helper functions like `auth.tenant_id()` that need to read from a join table you don't want to subject to its own RLS (the classic "user_teams join" RLS performance trick)
- Operations that legitimately need cross-tenant visibility, e.g. a Skatteverket regulatory report
- Calls that need controlled access to the `vault` schema

**The four rules you must apply to every `SECURITY DEFINER` function:**

1. **Pin `search_path` to empty**: `SET search_path = ''` and fully qualify every name. This neutralizes the search-path injection class entirely. The Supabase docs are explicit: *"We recommend pinning functions' search_path to an empty string, search_path = '', which forces all references within the function's body to be fully qualified."*
2. **Don't put it in an API-exposed schema** unless you absolutely mean to expose it as RPC. *"Security-definer functions should never be created in a schema in the 'Exposed schemas' inside your API settings."* (Supabase RLS docs.) Use a `private` schema; PostgREST can't reach it, but your RLS policies and your `service_role` Edge Functions still can.
3. **Be explicit about grants.** Don't rely on the public default. After creating a definer function, immediately:
   ```sql
   REVOKE EXECUTE ON FUNCTION public.my_fn(...) FROM PUBLIC, anon, authenticated;
   GRANT EXECUTE ON FUNCTION public.my_fn(...) TO service_role;
   ```
4. **Don't nest `SECURITY DEFINER` calls.** A definer function calling another definer function can lose `auth.uid()` context and create surprising privilege flows. If you see "function does not exist" errors only inside nested definer calls, you've hit this. Flatten the call tree or push the outer logic into an invoker function.

A concrete attack illustration for your kiosk system. Imagine a definer function `public.issue_receipt(order_id uuid)` without a pinned search_path. An attacker, even just an `authenticated` user with `CREATE` on some accessible schema, creates a function `pg_temp.now()` returning a forged timestamp. Your `issue_receipt` does `insert into receipts (issued_at, ...) values (now(), ...)`. Postgres resolves `now()` via search_path; if `pg_temp` precedes `pg_catalog`, the forged value lands in your gapless receipt sequence — a direct Skatteverket compliance violation. With `SET search_path = ''` and `pg_catalog.now()`, this attack is impossible.

#### 1.3 The lint codes that matter to you right now

The Supabase Security Advisor (Splinter) ships ~30 numbered lint codes. The ones you should treat as P0:

- **`0010 security_definer_view`** — Views created by `postgres` default to definer semantics in Postgres < 15. On Postgres 15+ (your project), fix with `ALTER VIEW … SET (security_invoker = true);` and the underlying RLS will be honored.
- **`0011 function_search_path_mutable`** — Discussed above. Adds `SET search_path = ''`.
- **`0013 rls_disabled_in_public`** — Any table in `public` without RLS enabled is a free buffet for whoever has your anon key.
- **`0015 rls_references_user_metadata`** — Critical: never read `user_metadata` in a policy. `user_metadata` is writable by the authenticated user via `supabase.auth.updateUser({ data: ... })`. They can grant themselves admin. Use `app_metadata` (server-set only) or, better, custom JWT claims via a hook.
- **`0028 anon_security_definer_function_executable`** and **`0029 authenticated_security_definer_function_executable`** — Per the Supabase Database Advisors page (https://supabase.com/docs/guides/database/database-advisors), these flag definer functions in PostgREST-exposed schemas with `EXECUTE` granted (directly or via default `PUBLIC`) to `anon` or `authenticated`. Remediation pattern (community-confirmed in discussion #36942): move to a non-exposed schema, then `REVOKE EXECUTE ON FUNCTION … FROM PUBLIC, anon, authenticated; GRANT EXECUTE … TO service_role;`. The lint definitions live in splinter.sql at https://github.com/supabase/splinter/blob/main/splinter.sql, and remediation URLs follow `https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable`.
- **`0001 unindexed_foreign_keys`** — Any FK without an index causes seq scans on join and cascading delete.
- **`0003 auth_rls_initplan`** — The classic `auth.uid()` per-row regression. Auto-fixable; covered in the performance section.

#### 1.4 `app_metadata` vs `user_metadata` vs `raw_user_meta_data`, and the custom claim hook

Three pieces of metadata travel with a Supabase user, and the difference is security-critical:

- **`user_metadata`** (mirror of `auth.users.raw_user_meta_data`) — **writable by the user via the SDK**. Treat as untrusted input. Good for "display name," "preferred theme." Never read in an RLS policy.
- **`app_metadata`** (mirror of `auth.users.raw_app_meta_data`) — **only writable from the server using `service_role`**. This is where `tenant_id`, `kiosk_ids[]`, and `role` belong. It rides in the JWT under the `app_metadata` claim.
- **JWT claims set via a Custom Access Token Hook** — the most flexible. A Postgres function runs at every token issuance and can add/remove top-level claims (`tenant_id`, role permissions array, etc.). This is how you do RBAC properly on Supabase.

The canonical multi-tenant RLS helper (Ryan O'Neill's pattern, widely used):

```sql
-- Stash tenant_id in app_metadata when provisioning a user from the server
-- supabase.auth.admin.updateUserById(user_id, { app_metadata: { tenant_id: '...' }})

create or replace function auth.tenant_id() returns uuid
language sql stable
set search_path = ''
as $$
  select nullif(
    ((current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata') ->> 'tenant_id'),
    ''
  )::uuid
$$;

-- Then every multi-tenant policy looks like:
create policy "tenant isolation on orders" on public.orders
  for all to authenticated
  using ( tenant_id = (select auth.tenant_id()) )
  with check ( tenant_id = (select auth.tenant_id()) );
```

A Custom Access Token Hook for a kiosk fleet might look like:

```sql
create or replace function public.add_tenant_to_jwt(event jsonb)
returns jsonb language plpgsql security definer
set search_path = ''
as $$
declare
  claims jsonb;
  v_tenant_id uuid;
  v_role text;
begin
  select tenant_id, role into v_tenant_id, v_role
  from public.tenant_members
  where user_id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
  claims := jsonb_set(claims, '{app_role}', to_jsonb(coalesce(v_role,'member')));
  event := jsonb_set(event, '{claims}', claims);
  return event;
end; $$;

-- Wire it under Authentication → Hooks → Custom Access Token in the dashboard
```

Two warnings:
- **JWT claims do not update immediately when you change `app_metadata`**. The user has to wait for the next token refresh (default 1 hour) or you must `supabase.auth.refreshSession()` from the client. For a kiosk that role-changes mid-shift, you may need to force-refresh.
- **JWT size matters.** OAuth providers can balloon claims; if you're using SSR, a Custom Access Token Hook is the right place to **strip** claims down to what you need, not just to add them.

#### 1.5 Asymmetric JWT signing keys — the 2025 default you should adopt

Supabase shipped JWT Signing Keys on 14 July 2025 (per the official blog post "Introducing JWT Signing Keys" at https://supabase.com/blog/jwt-signing-keys). Starting October 1, 2025 (revised from the originally planned May 1, 2025), all new projects use asymmetric JWTs by default with **ES256** (ECDSA on P-256). For Corevo, having migrated in April 2026, you may still be on HS256 — opt in.

Why this matters for your B2B SaaS:

- External systems (Skatteverket POS partners, third-party loyalty integrations, dashboard analytics vendors) can verify your JWTs by fetching `https://<project>.supabase.co/auth/v1/.well-known/jwks.json` — no shared secret to copy around. The Supabase JWT docs note this endpoint *"is also additionally cached by the Supabase Edge for 10 minutes, significantly speeding up access to this data regardless of where you're performing the verification."*
- Key rotation is zero-downtime: a key cycles Standby → In Use → Previously Used → Revoked, and you can roll back.
- The SDK gains `supabase.auth.getClaims()`, a faster alternative to `getUser()` that verifies the JWT client-side via Web Crypto when an asymmetric key is in play — useful inside middleware where round-tripping to GoTrue is wasteful.

Switch when you have a maintenance window. The legacy HS256 path still works, and the JWKS endpoint returns no keys until you've issued an asymmetric one.

#### 1.6 Leaked password protection (HIBP), MFA, CAPTCHA, rate limiting

The "missing leaked password protection" warning is one toggle in **Authentication → Providers → Email** — enable "Check passwords against HaveIBeenPwned." Costs nothing, prevents the most common credential stuffing vector.

**MFA**: TOTP is enabled on every Supabase project by default but **not enforced** — you have to build the gate yourself. Workflow on the client:

1. After sign-in, call `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`.
2. If `currentLevel === 'aal1'` and `nextLevel === 'aal2'`, the user has enrolled a factor but hasn't verified this session. Redirect to a challenge screen.
3. Use `mfa.challenge({ factorId })` → user enters TOTP code → `mfa.verify({ factorId, challengeId, code })`. Session is upgraded to AAL2.
4. To **require** AAL2 for sensitive operations (refunds, tenant settings, exports), gate them in RLS:

```sql
create policy "AAL2 required for refunds" on public.refunds
  for all to authenticated
  using ( (auth.jwt() ->> 'aal') = 'aal2' );
```

Per the Supabase JS Auth MFA API reference (supabase.com/docs/reference/javascript/auth-mfa-api): *"Recovery codes are not supported but users can enroll multiple factors, with an upper limit of 10."* The official recommendation is to enroll a second TOTP factor as your recovery mechanism.

**CAPTCHA**: hCaptcha or Cloudflare Turnstile under Authentication → Bot and Abuse Protection. Critical for two endpoints: anonymous sign-in (otherwise a botnet can bloat your `auth.users` table — there's an IP-based rate limit of 30 anonymous sign-ins per hour but it doesn't survive a distributed attack) and password reset.

**Rate limiting**: Supabase has per-endpoint Auth rate limits configurable from the dashboard. The defaults are reasonable; the one to look at hard is `GOTRUE_RATE_LIMIT_SMS_SENT` (30/hour) if you ever enable phone MFA.

#### 1.7 Storage RLS — separate from database RLS

Critical lift-and-shift trap: **Supabase Storage RLS lives on `storage.objects` and `storage.buckets`, not your `public` tables.** A perfect database RLS setup leaves your bucket wide open if you don't write storage policies. The default behavior: *"Storage does not allow any uploads to buckets without RLS policies."* Public buckets bypass all access control for reads.

For a kiosk SaaS, the rule of thumb from the DEV.to storage guide: **avatars and product images → public bucket** (CDN-cached, transformations); **invoices, signed receipts, kiosk firmware uploads → private bucket + signed URLs** with expiry. A multi-tenant policy on private uploads:

```sql
-- Buckets: kiosk-firmware
create policy "tenants upload their own firmware"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kiosk-firmware'
    and (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );

create policy "tenants read their own firmware"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kiosk-firmware'
    and (storage.foldername(name))[1] = (select auth.tenant_id())::text
  );
```

Signed URLs (`supabase.storage.from('invoices').createSignedUrl(path, 3600)`) generate a time-limited link that bypasses RLS for the lifetime of the token — use short expirations for sensitive files. Supabase Storage also has built-in image transformations (`width`, `height`, `quality`, `format`) cached at the edge, so resize avatars on the fly rather than uploading thumbnails.

#### 1.8 Supabase Vault and column-level encryption — the realistic recommendation

The official Supabase guidance shifted in late 2025: **Vault remains supported and recommended for secrets** (API keys for Klarna/Stripe/Swish, webhook signing secrets), but the broader **pgsodium Transparent Column Encryption is pending deprecation for cloud projects**. The Supabase docs (https://supabase.com/docs/guides/database/extensions/pgsodium) state directly: *"At this time, we do not recommend using either [Server Key Management or Transparent Column Encryption] on the Supabase platform due to their high level of operational complexity and misconfiguration risk."*

What this means practically for Corevo:

- **Use Vault for secrets.** Webhook signing keys, third-party API keys, anything you'd otherwise put in env vars. Insert via `vault.create_secret('value', 'name', 'description')`; read via `select decrypted_secret from vault.decrypted_secrets where name = '…'` from `SECURITY DEFINER` RPCs in a private schema.
- **Critical operational note**: *"When you insert secrets into the vault table with an INSERT statement, those statements get logged by default into the Supabase logs."* Always use `vault.create_secret()`, not raw `INSERT`, and consider disabling statement logging while writing secrets.
- **For sensitive customer PII** (Swedish personnummer if you ever store one — though don't if you can help it), use application-layer encryption with keys stored in Vault, not TCE on the column. Decryption inside an RPC means the plaintext never crosses the wire.

The Vault API surface is stable; the underlying implementation will migrate off pgsodium internally without changing your interface.

---

### Part 2 — Performance: making your existing schema fast

#### 2.1 The RLS performance trinity

Three patterns recover ~95% of RLS performance regressions on Supabase:

**Pattern 1: Wrap volatile functions in `(select …)` so Postgres runs them as initPlan once per statement, not once per row.**

```sql
-- ❌ Re-evaluates auth.uid() for every row scanned
create policy "old" on orders for select to authenticated
  using ( user_id = auth.uid() );

-- ✅ initPlan caches it; documented 10–100× faster on large tables
create policy "new" on orders for select to authenticated
  using ( user_id = (select auth.uid()) );
```

This is lint `0003 auth_rls_initplan`. The fix is mechanical — Continue's Supabase Performance Optimizer auto-applies it; you should write a one-off migration script and run it across all your policies.

**Pattern 2: Always specify `TO authenticated` (or another role), never the implicit default.** A policy with no role lists runs for `anon` too, which costs CPU even though `anon` has no matching rows. The Supabase docs: *"Never just use RLS involving auth.uid() or auth.jwt() as your way to rule out 'anon' role. Always add 'authenticated' to the approved roles."*

**Pattern 3: Push joins into `SECURITY DEFINER` helper functions so you only pay RLS cost on the outer table.** AntStack's case study saw queries go from seconds back to milliseconds after this single refactor. For your kiosk/tenant join:

```sql
-- Bad: tries to enforce RLS on tenant_members for every row in orders
create policy "members see orders" on orders for select to authenticated
  using ( tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()) );

-- Better: bypass tenant_members RLS via a definer fn in a private schema
create or replace function private.user_tenants() returns setof uuid
language sql stable security definer set search_path = ''
as $$ select tenant_id from public.tenant_members where user_id = (select auth.uid()) $$;
revoke execute on function private.user_tenants() from public, anon, authenticated;

create policy "members see orders v2" on orders for select to authenticated
  using ( tenant_id in (select private.user_tenants()) );
```

Even better when each user is in exactly one tenant: store `tenant_id` in `app_metadata` / JWT claim and skip the join entirely.

#### 2.2 Index strategy

The two-second rules:

- **Every column referenced in any RLS policy needs an index.** No exceptions. The Designrevision guide: *"A policy like user_id = auth.uid() triggers a sequential scan on the entire table if user_id is not indexed. On 10,000 rows, the query takes 50ms instead of 2ms. On 1,000,000 rows, it times out."*
- **Every foreign key needs an index.** Lint `0001` will tell you exactly which ones.

Choose the right index type:

| Type | Use for |
|---|---|
| **B-tree** (default) | Equality, range, ordering — your default for `tenant_id`, `created_at`, `kiosk_id` |
| **GIN** | Array contains (`@>`), JSONB key/value lookups, full-text search, trigram |
| **BRIN** | Append-only, sorted-by-physical-order data — perfect for your `audit_log` table on `ts` (orders of magnitude smaller than B-tree, fast on time-range scans) |
| **Partial** | When a column is queried with a constant predicate most of the time (`WHERE deleted_at IS NULL`, `WHERE status = 'pending'`) — discussed below |

A partial index for your soft-delete pattern:

```sql
-- Uniqueness only enforced for live receipts (allows re-issuing a number on void+reissue)
create unique index receipts_number_active_uniq
  on receipts (tenant_id, receipt_number) where voided_at is null;

-- Fast tenant-scoped queries of active orders only
create index orders_tenant_active
  on orders (tenant_id, created_at desc) where deleted_at is null;
```

A BRIN index for your audit log (per the "Postgres Auditing in 150 lines of SQL" pattern at https://supabase.com/blog/postgres-audit):

```sql
create index audit_log_ts_brin on audit_log using brin (ts);
-- A BRIN index on a 100M-row append-only table is typically a few MB,
-- versus hundreds of MB for a B-tree.
```

A GIN index for JSONB metadata search:

```sql
create index orders_metadata_gin on orders using gin (metadata jsonb_path_ops);
-- Then: select * from orders where metadata @> '{"discount_code":"BLACKFRIDAY"}'
```

#### 2.3 HypoPG — test indexes before you create them

HypoPG (hypothetical PostgreSQL indexes) is preinstalled on Supabase per the docs at https://supabase.com/docs/guides/database/extensions/hypopg. It lets you create a virtual index in memory, run `EXPLAIN` against it, and see whether the planner would use it — without paying the index build cost or the write amplification.

**Critical gotcha** from the Supabase docs (verbatim): *"Note that the virtual indexes created by HypoPG are only visible in the Postgres connection that they were created in. Supabase connects to Postgres through a connection pooler so the hypopg_create_index statement and the explain statement should be executed in a single query."* In other words: run both statements in the same SQL editor execution.

```sql
-- Run as one statement in the Supabase SQL editor
select * from hypopg_create_index('create index on orders (kiosk_id, status)');
explain select * from orders where kiosk_id = '…' and status = 'pending';
-- If the plan switches from Seq Scan → Index Scan, create the real index.
```

Pair with `index_advisor` (also bundled) to get suggestions automatically. This is the cheapest way to validate "should I add this index" without dragging down a 50M-row table during a build.

#### 2.4 Connection pooling — Supavisor and the truth about pool modes

You're on Supabase Cloud Pro, so you get Supavisor (Elixir-based, multi-tenant) by default and optionally a Dedicated PgBouncer pooler.

- **Port 5432** = Supavisor in **session mode** — one client connection holds one Postgres backend for its whole lifetime. Safe for everything (LISTEN/NOTIFY, prepared statements, advisory locks, `SET LOCAL`). Use for long-lived processes (your migration tool, a long-running analytics service).
- **Port 6543** = Supavisor in **transaction mode** — backend is released to the pool between transactions. Multiplexes many clients onto few backends. **Required** for serverless / Edge Functions. Caveats: no session-level features across transactions. Supabase **deprecated session mode on port 6543 on February 28, 2025** (per the nerdleveltech 2026 Production Postgres Pooling guide at https://nerdleveltech.com/production-postgres-pooling-pgbouncer-supabase-supavisor-tutorial — port 6543 is transaction-only now).
- **Direct connection** (Postgres' direct hostname) — IPv6-only by default; bypasses the pooler. Reserve for `pg_dump`, migrations, and the rare workload that legitimately can't tolerate transaction-mode constraints.

A practical rule for your React/Vite kiosk app + TanStack Query: you're using the supabase-js SDK over HTTP (PostgREST), so the pooler choice is invisible to that path. Where it matters is **Edge Functions** and **server-side processes** — always use port 6543 (transaction mode) for Edge Functions to avoid backend exhaustion.

**Pool sizing rule of thumb** (from Philip McClarence's 2026 PG pooling article on Medium at https://medium.com/@philmcc/postgresql-connection-pooling-pgbouncer-supavisor-built-in-a34d675db978): `optimal_pool_size = (CPU_cores * 2) + number_of_disks`. On a Supabase Small compute (2 vCPU), that's ~5 backend connections. Verify with `select count(*) filter (where state = 'active') from pg_stat_activity where backend_type = 'client backend'` — if that number rarely exceeds 15–20, a larger pool is pure waste.

#### 2.5 Pagination — never use OFFSET past page 100

The math is unforgiving: `LIMIT 100 OFFSET 99900` requires Postgres to scan and discard 99,900 rows. On a million-row table that's 5+ seconds; the SupaExplorer benchmarks (https://supaexplorer.com/best-practices/supabase-postgres/data-pagination/) document a 100× improvement switching to keyset pagination on deep pages. Use keyset (cursor) pagination:

```typescript
// First page
const { data: firstPage } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .order('id', { ascending: false }) // tiebreaker for non-unique created_at
  .limit(50)

// Next page — pass the last row's (created_at, id) as cursor
const last = firstPage[firstPage.length - 1]
const { data: nextPage } = await supabase
  .from('orders')
  .select('*')
  .or(`created_at.lt.${last.created_at},and(created_at.eq.${last.created_at},id.lt.${last.id})`)
  .order('created_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(50)
```

For the admin dashboard's "jump to page 5,000" use case, accept OFFSET but always use `count: 'estimated'` (not `'exact'`) — exact counts scan the whole table.

#### 2.6 Realtime — what it actually costs

`postgres_changes` works by listening to logical replication. Single-threaded per database; compute upgrades don't scale it linearly; database changes are processed on one thread to maintain ordering. The Supabase docs are unambiguous: *"If you are using Postgres Changes at scale, you should consider using separate 'public' table without RLS and filters. Alternatively, you can use Realtime server-side only and then re-stream the changes to your clients using a Realtime Broadcast."*

For your kiosk fleet, the right pattern is almost always **Broadcast on a private channel, fed by a Postgres trigger that calls `realtime.broadcast_changes()`**:

```sql
-- Trigger fires on every order change; broadcasts on topic 'kiosk:<id>'
create or replace function public.broadcast_kiosk_event() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'kiosk:' || coalesce(new.kiosk_id, old.kiosk_id)::text,
    tg_op, tg_op, tg_table_name, tg_table_schema, new, old
  );
  return coalesce(new, old);
end; $$;

create trigger kiosks_broadcast
  after insert or update or delete on public.orders
  for each row execute function public.broadcast_kiosk_event();

-- RLS on realtime.messages controls who can subscribe to which topic
create policy "kiosk subscribers" on realtime.messages
  for select to authenticated
  using (
    realtime.topic() like 'kiosk:%'
    and substring(realtime.topic() from 7)::uuid in (select private.user_kiosks())
  );
```

On the client:

```typescript
const channel = supabase.channel(`kiosk:${kioskId}`, { config: { private: true }})
  .on('broadcast', { event: 'INSERT' }, (payload) => { /* new order */ })
  .subscribe()
```

Disable **public** Realtime channels in your Settings — there have been public reports of channel-abuse vulnerabilities; private channels with RLS are the only safe production mode.

**When NOT to use Realtime at all:** anything cron-like (use `pg_cron`), any case where eventual consistency over a few seconds is fine (use polling with TanStack Query's `refetchInterval`), and anything multi-region where the kiosk could be far from your eu-north-1 region — a UDP broadcast may be slower than an HTTP poll.

---

### Part 3 — Platform features worth knowing

#### 3.1 Database Branching — Git for Postgres

Branching gives every PR a real, isolated Postgres instance copied from production schema (not data). The 2.0 release added **gitless branching**: create branches from the dashboard or CLI without a GitHub connection.

Workflow for Corevo:

1. `supabase branches create feat-new-receipts --persistent`
2. Apply migrations, test, populate seed data via `./supabase/seed.sql`.
3. Merge the PR → Supabase runs the migrations against production automatically.

Three things most teams miss:

- **Branches do not copy production data** by default. This is a feature, not a bug — you don't want production PII landing in a preview. Use `seed.sql` for realistic synthetic data.
- **Migration conflicts surface here.** If two branches both add a column to `orders`, the merge will fail. Resolve in the branch before merging.
- **Each branch has its own API keys.** The GitHub integration auto-populates them as Vercel env vars; if you use a different host, fetch via the Management API.

#### 3.2 Edge Functions — when, when not, and the limits

Edge Functions are Deno-based, deployed to many regions, isolate-per-request. Per the official Supabase Edge Functions Limits docs at https://supabase.com/docs/guides/functions/limits: Maximum CPU Time **2s** per request, Request idle timeout **150s** (a 504 is returned otherwise), Maximum Function Size **20MB** after CLI bundling. Background tasks via `EdgeRuntime.waitUntil()` extend the wall-clock duration to up to **400 seconds** on paid plans (150s on free).

**Use Edge Functions for:**
- Webhook receivers (Stripe, Klarna, Swish) where you need to validate a signature and forward to your DB
- Outbound API integrations (sending receipts to Skatteverket's reporting endpoint, calling an external loyalty platform)
- Open Graph image generation, low-latency global endpoints
- Scheduled jobs that need >1s of compute (called from `pg_cron` via `pg_net`)

**Don't use Edge Functions for:**
- CRUD operations that PostgREST + RLS already handles (you're adding a network hop)
- Anything stateful or that needs a long-lived DB connection
- Operations that need >400s of execution

**Cold start strategy:** the November 2024 update brought 97% faster cold starts via dedicated blocking pools for initial script evaluation (per https://supabase.com/blog/persistent-storage-for-faster-edge-functions). For chatty endpoints, combine many actions into one function with internal routing (Hono, Oak) — one warm isolate, many handlers.

#### 3.3 Foreign Data Wrappers — Stripe-as-tables

FDWs let you query Stripe, Firebase, ClickHouse, BigQuery, etc., as Postgres tables. For a kiosk SaaS, the obvious play is Stripe:

```sql
-- After enabling the wrappers extension and storing your key in Vault
create foreign table stripe.subscriptions (
  id text, customer text, status text, current_period_end timestamp, ...
) server stripe_server options ( object 'subscriptions' );

-- Now join Stripe to your tenants:
select t.name, s.status, s.current_period_end
from public.tenants t
join stripe.subscriptions s on s.customer = t.stripe_customer_id
where s.current_period_end < now() + interval '7 days';
```

Two production caveats:

- **FDWs do not provide RLS.** Per the Supabase Wrappers docs, *"Wrappers should always be stored in a private schema."* Wrap in `SECURITY DEFINER` RPCs if you need to expose any of this.
- **For high-volume Stripe queries, consider the Stripe Sync Engine instead**, which mirrors Stripe data into real Postgres tables, avoiding per-query API calls and rate limits.

#### 3.4 `pg_cron` + `pg_net` — Postgres-native scheduling

`pg_cron` schedules SQL or function calls; `pg_net` makes async HTTP calls from inside Postgres. Together they replace ~80% of why teams reach for external schedulers. Per the Supabase pg_cron debugging guide at https://supabase.com/docs/guides/troubleshooting/pgcron-debugging-guide-n1KTaz: *"pg_cron supports up to 32 concurrent jobs, each using a database connection. If too many jobs are running simultaneously, space them out to prevent connection overload and job failure."* The Supabase Cron docs (https://supabase.com/docs/guides/cron) also recommend *"no more than 8 Jobs run concurrently"* and *"each Job should run no more than 10 minutes."*

```sql
-- Nightly Skatteverket report at 02:00 UTC = 03:00 CET
select cron.schedule(
  'skatteverket-daily',
  '0 2 * * *',
  $$
  select net.http_post(
    url := 'https://<project>.functions.supabase.co/skatteverket-report',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'edge_fn_jwt')
    ),
    body := jsonb_build_object('date', current_date - 1)
  );
  $$
);

-- Track failures
select jobname, status, return_message, start_time
from cron.job_run_details
where status = 'failed' and start_time > now() - interval '7 days';
```

**Best practices:**
- Store the auth token in Vault, never inline.
- All `pg_cron` schedules run in **UTC** — convert.
- Schedule a self-cleaning job to purge `cron.job_run_details` older than 30 days.
- Guard long jobs with an advisory lock so a hung run doesn't get a second concurrent invocation:
  ```sql
  select cron.schedule('long-job', '*/5 * * * *', $$
    select case when pg_try_advisory_lock(hashtext('long-job'))
      then long_job_body() else null end;
    select pg_advisory_unlock(hashtext('long-job'));
  $$);
  ```

#### 3.5 Supabase Queues (`pgmq`) — durable messaging in Postgres

For your domain events / outbox pattern, `pgmq` is the right primitive — built into Supabase, exposed as a managed module. Per Supabase Queues docs at https://supabase.com/blog/supabase-queues: *"Exactly Once Message Delivery — A Message is delivered exactly once to a consumer within a customizable visibility window. Messages in Queues can be archived instead of deleted for future reference."* Visibility timeouts make at-least-once-with-deduplication trivial, and messages can be archived rather than deleted for audit.

```sql
-- Enable from dashboard, then:
select pgmq.create('receipt_queue');
select pgmq.send('receipt_queue', '{"order_id":"...","tenant_id":"..."}'::jsonb);

-- Consumer (run from an Edge Function on a cron schedule)
select * from pgmq.read('receipt_queue', vt := 30, qty := 10);
-- Process, then:
select pgmq.delete('receipt_queue', msg_id := <id>);
-- Or, for audit:
select pgmq.archive('receipt_queue', msg_id := <id>);
```

Pair with the cron+advisory-lock pattern above for a complete background worker. For an outbox: insert into your domain table and `pgmq.send` in the same transaction — atomicity guaranteed.

#### 3.6 PITR, read replicas, and tier choices

**PITR (Point-in-Time Recovery)** — per the official Supabase backups docs at https://supabase.com/docs/guides/platform/backups: *"Pro, Team and Enterprise Plan projects can enable PITR as an add-on"* with the requirement that *"Projects that want to use PITR must also use at least a Small compute add-on."* Granularity is per-second (verbatim in the docs: *"…the database can be restored to a state it was in mere seconds before trouble"*). Default retention from the official PITR blog post: *"Retention for backups used by PITR is set to up to 7 days by default but could be increased to up to 28 days via self-serve."* Mechanism: WAL-G ships base snapshots + continuous WAL segments to S3. Billing detail to watch: PITR add-on is **not covered by the Spend Cap** — set explicit caps. For a fiscal-compliance kiosk SaaS, **PITR is non-negotiable** — you must be able to restore to a known-good moment if a bad migration corrupts gapless receipt sequences.

**Read replicas** — available on **all paid plans** (Pro/Team/Enterprise) as self-serve per the Supabase Read Replicas blog at https://supabase.com/blog/introducing-read-replicas, deployable in any of 12 supported regions. Per Supabase GitHub Discussion #29434: *"The initial launch of Read Replicas allowed for up to two Read Replicas per project. The limit for projects on XL compute add-ons and larger has now been raised to 5 Read Replicas per project."* So: 2 replicas on standard compute, **5 on XL or larger**. Replication is asynchronous (streaming + file-based log shipping fallback via WAL-G). Routing changed on **April 4, 2025** from round-robin to **geo-routing** that directs requests to the closest available database. Limitations to plan for: only `GET` PostgREST requests hit replicas (for read-only RPC use `get: true`); Auth, Realtime, Storage, and Edge Functions still route to primary; custom domains bypass the load balancer (you must hit dedicated endpoints).

**Tier decisions for Corevo at your stage:**
- **Pro** ($25/project/mo + usage) — what you're on. Sufficient until you have ~100 active tenants or hit shared compute limits.
- **Team** ($599/org/mo) — adds SOC 2 + HIPAA add-ons, SSO, daily backups retained 14 days, additional Studio collaboration. Justified when you onboard your first enterprise client demanding contractual SOC 2.
- **Enterprise** — custom pricing, SLA, dedicated support, longer backup retention.

#### 3.7 Custom domains, network restrictions, SSL

For a B2B SaaS, the bare minimum:
- **Custom domain** (`api.corevo.se` → your Supabase project) — improves trust and lets you migrate providers without touching kiosk firmware.
- **SSL enforcement** — toggle in Database Settings. Always on.
- **Network restrictions** (IP allowlists) — useful for restricting **direct Postgres** access. Doesn't apply to PostgREST/API traffic (your kiosks need that open), but lock down direct DB access to your office/VPN IPs.
- **Management API** at `https://api.supabase.com/v1/...` with PAT auth (`Authorization: Bearer sbp_...`) — provision projects, manage branches, set Edge Function secrets, rotate API keys programmatically. Per the Supabase API docs at https://supabase.com/docs/reference/api/introduction: rate limit is 60 requests/minute/user, with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. PATs are created at https://supabase.com/dashboard/account/tokens and *"carry the same privileges as your user account, so be sure to keep it secret."*

---

### Part 4 — Architecture for Swedish fiscal compliance

#### 4.1 Gapless receipt sequences (Skatteverket)

Swedish cash register law requires every receipt to have a strictly monotonic, gapless sequence number per cash register unit. Postgres `SEQUENCE` won't do it — sequences skip on rollback. The right pattern:

```sql
create table receipt_counters (
  tenant_id uuid not null,
  kiosk_id uuid not null,
  next_number bigint not null default 1,
  primary key (tenant_id, kiosk_id)
);

create or replace function private.issue_receipt(
  p_tenant_id uuid, p_kiosk_id uuid, p_order_id uuid
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_number bigint;
begin
  -- Serialize per-kiosk; gapless even under concurrency
  perform pg_advisory_xact_lock(
    hashtext(p_tenant_id::text || ':' || p_kiosk_id::text)
  );

  update public.receipt_counters
  set next_number = next_number + 1
  where tenant_id = p_tenant_id and kiosk_id = p_kiosk_id
  returning next_number - 1 into v_number;

  insert into public.receipts (tenant_id, kiosk_id, order_id, receipt_number, issued_at)
  values (p_tenant_id, p_kiosk_id, p_order_id, v_number, pg_catalog.now());

  return v_number;
end; $$;

revoke execute on function private.issue_receipt(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function private.issue_receipt(uuid,uuid,uuid) to service_role;
```

Three things this gets right: transaction-scoped advisory lock (auto-released, no orphan locks), `pg_catalog.now()` to defeat search-path injection, private schema + service_role-only grant.

#### 4.2 Audit logging

Use Supabase's recommended pattern (see https://supabase.com/blog/postgres-audit): a single audit table with `record`, `old_record`, `op`, `ts`, and `table_oid`, indexed with BRIN on `ts`. Wire it via a generic trigger:

```sql
create table audit.log (
  id bigserial primary key,
  ts timestamptz not null default now(),
  table_oid oid not null,
  table_schema text not null,
  table_name text not null,
  op text not null check (op in ('I','U','D')),
  actor_id uuid,           -- from auth.uid()
  tenant_id uuid,
  record jsonb,
  old_record jsonb
);
create index audit_log_ts_brin on audit.log using brin (ts);
create index audit_log_tenant_ts on audit.log (tenant_id, ts desc);
```

For Skatteverket, add `pgaudit` on top for object-level logging of `auth.users` and `receipts`. Don't enable `pgaudit` on everything — log noise drowns signal.

#### 4.3 Multi-tenant model — row-level, not schema-per-tenant

Schema-per-tenant looks tempting until you have 500 tenants. Migration becomes O(n) per change, RLS doesn't help, PostgREST's schema cache gets unhappy. Stay with **row-level multi-tenancy + tenant_id in JWT** (Section 1.4 pattern). It scales to tens of thousands of tenants on a single Postgres instance.

#### 4.4 UUID v7 vs v4 for primary keys

Per the pg_uuidv7 README: *"As of Postgres 18, there is a built in uuidv7() function."* Supabase currently runs Postgres 15 and 17 (https://github.com/supabase/postgres: *"Currently supporting PostgreSQL 15, 17, and OrioleDB-17"*) and hasn't yet upgraded to PG18, so `uuidv7()` isn't natively available. The `pg_uuidv7` extension is **not pre-installed** on Supabase Cloud (open feature requests at https://github.com/orgs/supabase/discussions/22015 and https://github.com/orgs/supabase/discussions/22584), and the Rust-based `pg_idkit` is also unsupported.

**Why v7 matters when you can get it:** v7 encodes a 48-bit Unix millisecond timestamp in the high bits, so IDs are monotonically increasing. v4 is fully random, which causes random B-tree page splits, poor cache locality, and increased WAL on inserts. The pg_uuidv7 docs explain: *"They include a 48-bit Unix timestamp with millisecond accuracy… globally sortable and can be created in parallel"* and *"uuid_generate_v7() is as fast as the native gen_random_uuid() function."*

**Workaround available today on Supabase:** install the pure-SQL TLE via database.dev with `select dbdev.install('cem-uuidv7'); create extension "cem-uuidv7" schema extensions version '1.0.2';` then call `select extensions.uuid_generate_v7();`. The TLE description at https://database.dev/cem/uuidv7 is direct: *"It is recommended to use v7 UUIDs if you use UUIDs as a synthetic key column on a table, particularly if you use them as a clustering key. All UUID types in the uuid-ossp package… are not monotonically increasing, and therefore cause performance degradation."* Otherwise, stick with `gen_random_uuid()` (v4) until Supabase upgrades to PG18; the tradeoff is more index bloat over time but no extension dependency.

#### 4.5 Soft delete with partial unique indexes

For receipts that can be voided and reissued under the same number per Swedish rules:

```sql
alter table receipts add column voided_at timestamptz;
create unique index receipts_number_active
  on receipts (tenant_id, kiosk_id, receipt_number)
  where voided_at is null;
```

This is the partial-index pattern — uniqueness only enforced for active rows, allowing re-use after a void. Combine with RLS:

```sql
create policy "tenants see active receipts" on receipts for select to authenticated
  using ( tenant_id = (select auth.tenant_id()) and voided_at is null );
create policy "tenants see all their receipts" on receipts for select to authenticated
  using ( tenant_id = (select auth.tenant_id()) );
```

Multiple permissive policies OR together, so the second policy widens visibility to voided rows for the same tenant — which you want for audit but should restrict to admin-role users.

---

### Part 5 — Developer experience and tooling

#### 5.1 The supabase-js v2 patterns that matter

Three error-handling habits that distinguish senior code:

```typescript
// 1. Distinguish "expected zero rows" from "errored"
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .maybeSingle()  // returns null instead of erroring on no row

// 2. Catch PostgREST error codes for clean UX
if (error?.code === '23505') return showToast('Duplicate receipt number')
if (error?.code === '42501') return showToast('Permission denied')

// 3. Surface RPC custom error codes
// In SQL: raise exception 'kiosk_offline' using errcode = 'P0001';
// In TS: switch on error.message or use a custom code via raise … using detail
```

PostgREST gives you a full error object: `{ message, details, hint, code }`. Map common codes (`23505` unique violation, `23503` FK violation, `42501` insufficient privilege) to user-friendly messages.

#### 5.2 Type generation

```bash
supabase gen types typescript --project-id <ref> > src/types/supabase.ts
# Then: import { Database } from './types/supabase'
# const supabase = createClient<Database>(url, key)
```

Re-run this in CI on every migration merge. Commit the generated file — it's a contract.

#### 5.3 Realtime in React — the cleanup pattern

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`kiosk:${kioskId}`, { config: { private: true }})
    .on('broadcast', { event: 'order' }, (payload) => {
      queryClient.invalidateQueries({ queryKey: ['orders', kioskId] })
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [kioskId])
```

Always remove channels on unmount. Otherwise React strict mode + hot reload will leak channel subscriptions and eventually you'll hit the project's connection limit.

#### 5.4 Auth state

```typescript
useEffect(() => {
  const { data: { subscription }} = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') queryClient.clear()
    if (event === 'TOKEN_REFRESHED') { /* claims may have changed */ }
  })
  return () => subscription.unsubscribe()
}, [])
```

If you change a user's `app_metadata` server-side (e.g., add them to a new tenant), force a refresh client-side: `await supabase.auth.refreshSession()`. Otherwise the new tenant_id won't appear in the JWT until the token's natural expiry.

#### 5.5 Testing

For RLS testing, **pgTAP** in a CI Postgres instance gives you assertion-based policy tests:

```sql
-- Switch to authenticated role with specific JWT claims
set role authenticated;
set request.jwt.claims = '{"sub":"user-A","app_metadata":{"tenant_id":"tenant-1"}}';
-- Assert visibility
select results_eq(
  'select count(*) from orders',
  $$ values (3::bigint) $$,
  'user-A sees only their tenant''s 3 orders'
);
```

Run on a branch DB so production data is untouched.

---

### Part 6 — Production readiness checklist

Run through this list before onboarding your first paying tenant who matters.

**Security**
- [ ] All tables in `public` have RLS enabled (Splinter lint `0013` green)
- [ ] All RLS policies wrap `auth.uid()` / `auth.jwt()` in `(select …)` (lint `0003` green)
- [ ] All foreign keys are indexed (lint `0001` green)
- [ ] No `SECURITY DEFINER` views (lint `0010` green) or use `security_invoker=true`
- [ ] All `SECURITY DEFINER` functions have `SET search_path = ''` (lint `0011` green)
- [ ] No `SECURITY DEFINER` function in exposed schema has EXECUTE granted to anon/authenticated (lints `0028`/`0029` green) — definer functions live in `private`, explicit GRANT to specific roles only
- [ ] HIBP password leak protection enabled
- [ ] CAPTCHA enabled on sign-in, sign-up, password reset, anonymous sign-ins
- [ ] MFA enrollment offered; AAL2 required for sensitive operations
- [ ] Network restrictions in place for direct Postgres access
- [ ] Custom domain configured; SSL enforced
- [ ] Asymmetric JWT signing keys enabled (ES256)
- [ ] No `user_metadata` references in any policy (lint `0015` green)

**Reliability**
- [ ] PITR enabled with at least 7-day retention
- [ ] Spend cap configured (PITR is NOT covered — verify)
- [ ] Daily backup retention reviewed (Pro = 7 days)
- [ ] Read replica considered for analytical reads
- [ ] Database upgrade strategy documented (test on a branch first)

**Performance**
- [ ] `pg_stat_statements` reviewed — top 10 slowest queries indexed appropriately
- [ ] No `OFFSET` pagination on any table > 100K rows
- [ ] Cache hit ratio > 99% — `select sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0) from pg_statio_user_tables`
- [ ] Connection usage < 70% of max during peak — Database Connections report in Observability
- [ ] No idle-in-transaction connections lingering

**Operations**
- [ ] Vault used for all third-party secrets
- [ ] Statement logging considerations documented (Vault writes leak via logs)
- [ ] `pgaudit` configured for `auth.users` and receipts table object-level logging
- [ ] `pg_cron` jobs < 8 concurrent, < 10 min each
- [ ] Database webhooks or Edge Functions for side effects (not triggers calling external HTTP — `pg_net` is async and safer than `http`)

**Compliance**
- [ ] Gapless receipt sequences tested under concurrency (load test with N parallel orders, verify no gaps, no duplicates)
- [ ] Audit log retention policy aligned with Swedish fiscal requirements
- [ ] Data residency confirmed (your project is in eu-north-1 — good)
- [ ] Disaster recovery runbook with PITR restore drill done quarterly

---

### Part 7 — Hidden gems

A short list of things that aren't obscure but punch above their visibility.

**Most teams don't know: HypoPG**. Test indexes in seconds without building them; covered in 2.3.

**Most teams don't know: Supabase Queues / pgmq**. A durable message queue with exactly-once semantics inside your Postgres — no Redis, no SQS. Covered in 3.5.

**Most teams don't know: partial unique indexes for soft delete + re-registration**. The CAS-trap pattern where soft-deleted rows block re-use of a unique identifier is universally botched; the partial index is one line of SQL. Covered in 4.5.

**Most teams don't know: Database Branching without GitHub**. The 2.0 release made it possible to branch from the dashboard alone (per https://supabase.com/blog/branching-2-0). Use it to test risky migrations against production schema.

**Most teams don't know: Stripe Sync Engine**. One-click installs a managed sync of Stripe data into real Postgres tables (not FDW). For any SaaS doing billing analytics, this is dramatically faster than FDW queries.

**Most teams don't know: asymmetric JWT signing keys (`getClaims()`)**. The 2025 launch shifted Supabase off shared secrets onto ES256/RS256. The new `supabase.auth.getClaims()` is faster than `getUser()` in SSR middleware. Covered in 1.5.

**Most teams don't know: `realtime.broadcast_changes()` from triggers**. Lets you push DB-driven Realtime events without ever subscribing to `postgres_changes`. Scales better and uses RLS-authorized private channels. Covered in 2.6.

**Most teams don't know: PostgREST computed columns**. A function `full_name(profiles) returns text` becomes a virtual column you can `?select=*,full_name` over the REST API. Same trick lets you define computed relationships via `function dependents(employees) returns setof employees`.

**Most teams don't know: `pg_trgm` (already in your extensions)** turns LIKE/ILIKE queries from sequential scans into index scans via trigram GIN indexes. For a search box over product names: `create index products_name_trgm on products using gin (name gin_trgm_ops);` then `select * from products where name ilike '%kaffe%'` uses the index.

**Most teams don't know: advisory locks for cron-job concurrency control**. Covered in 3.4 and 4.1.

**Most teams don't know: `pg_graphql` is Relay-compliant and free**. If a partner integration prefers GraphQL, you have a `/graphql/v1` endpoint with cursor pagination, RLS-enforced. **Heads up on a recent platform change**: per Supabase Changelog (https://supabase.com/changelog/45329), *"On May 18, 2026, pg_graphql will not be enabled by default… On May 30, 2026 this setting becomes the default for all new projects."* On your existing project (migrated April 2026) it's likely still enabled, but verify in Dashboard → Database → Extensions before depending on it for a new integration. The pg_graphql docs (https://supabase.github.io/pg_graphql/api/) confirm Relay-spec pagination with forward `first/after`, backward `last/before`, and `pageInfo { endCursor, hasNextPage, hasPreviousPage }`; introspection is disabled by default in production.

**Most teams don't know: `pgvector` ships with HNSW indexes and `halfvec`**. If "Frida the AI smart fridge" ever needs embeddings, you have `vector(1536)` columns, HNSW indexing, and the right cosine operator (`<=>`) already on disk. The Supabase docs are clear: *"In general we recommend using HNSW because of its performance and robustness against changing data."* For OpenAI's `text-embedding-3-large` (3,072 dims, above the 2,000-dim limit for `vector`), use `halfvec` which supports up to 4,000 dims.

---

## Recommendations

**This week:**
1. Run Database Advisor and write down every active lint. Prioritize `0028`/`0029` (definer functions exposed to anon/authenticated), `0011` (search_path), `0013` (RLS disabled), `0015` (user_metadata in policies).
2. Enable HIBP leaked password protection. One toggle.
3. Audit your 80+ RPCs: which need `SECURITY DEFINER`? Move those into a `private` schema. Convert the rest to `SECURITY INVOKER`. For the remaining definer ones, apply the four-rule checklist (pinned search_path, private schema, REVOKE/GRANT explicit, no nesting).

**This month:**
4. Migrate one critical RLS-heavy table to use the `(select auth.uid())` wrap and tenant_id-in-JWT pattern. Benchmark before/after with `EXPLAIN (ANALYZE, BUFFERS)`. The expected improvement on tables with > 10K rows is 10–100×.
5. Set up a Custom Access Token Hook that injects `tenant_id` and `role` into the JWT from `app_metadata`. Refactor 5–10 of your policies to use the new claim helper.
6. Enable PITR with 14-day retention. Run a restore drill on a branch.
7. Switch all Realtime usage to **private channels with broadcast**, fed by `realtime.broadcast_changes()` triggers. Disable public channels in settings.

**This quarter:**
8. Convert your gapless receipt issuance to the advisory-lock + counter-table pattern in 4.1. Add a load test that fires 1,000 concurrent receipt requests and asserts gapless + unique.
9. Migrate to asymmetric JWT signing keys (ES256). Update any external integrations that verify JWTs to use the JWKS endpoint.
10. Partition `audit_log` and `orders` by month if you expect either to exceed ~10M rows in 12 months. Use the dynamic partitioning pattern from the Supabase blog (https://supabase.com/blog/postgres-dynamic-table-partitioning).
11. Stand up a CI pipeline that runs `supabase db lint` and pgTAP tests on every PR against a preview branch.

**Benchmarks that should trigger reconsideration:**
- Sustained connection usage > 70% of pool → upgrade compute or shrink application-side pool to 5–10 per app instance.
- p99 query latency > 200ms on any user-facing endpoint → run `pg_stat_statements`, add indexes (HypoPG first).
- Database size > 60% of disk → upgrade disk before WAL backups start failing.
- Receipts table > 50M rows → partition.
- More than 8 concurrent `pg_cron` jobs needed → move some to Edge Functions triggered by `pg_net`.
- First enterprise prospect demanding SOC 2 → upgrade to Team plan.
- More than one Skatteverket-relevant table requires audit → invest in `pgaudit` configured properly, don't roll your own.
- Need to scale read traffic past one primary → add read replicas. **Note:** standard compute caps you at 2 replicas; XL compute add-on and larger are raised to 5 (per Supabase Discussion #29434).

---

## Caveats

A few things in this report carry caveats:

- **The `0028`/`0029` lints exist but lint-code stability isn't perfectly documented.** Splinter is the open-source lint engine (https://github.com/supabase/splinter); the canonical list lives in `splinter.sql` in that repo. Confirm the exact lint codes against your project's Advisor output before scripting around them.
- **PG18's `uuidv7()` is not yet on Supabase.** Supabase currently runs Postgres 15 and 17. Plan for `gen_random_uuid()` today and migrate keys later if you need v7 properties; the database.dev TLE is a workable bridge.
- **`pgsodium` Transparent Column Encryption is pending deprecation on Supabase Cloud.** Vault remains supported; don't build new systems on raw pgsodium TCE for cloud deployments.
- **`pg_graphql` is moving to opt-in.** Per the changelog cited above, new projects after May 30, 2026 won't have it enabled by default. Existing projects retain their current state but verify before depending on it.
- **Realtime postgres_changes throughput is single-threaded.** Compute upgrades don't proportionally help — broadcast is the right scaling path. Run your own benchmark before assuming Realtime will keep up with your peak kiosk traffic.
- **Connection-pool sizing and "max_pooler_clients" caps shift with compute tier.** Check your Database Settings → Connection pooling tab for the exact numbers for your project.
- **Some referenced features (Stripe Sync Engine "one-click install," Branching 2.0 details) were rolled out 2024–2026; the exact UI may have shifted.** Treat URLs as canonical; treat exact button names as approximate.
- **Swedish Skatteverket compliance specifics** (receipt-number gaplessness, VAT decomposition, audit retention) are addressed at the data-model and locking level here, but the regulatory interpretation is your accountant's call. The technical patterns are sound; the legal mapping is not.