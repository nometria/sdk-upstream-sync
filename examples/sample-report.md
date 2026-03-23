# SDK Upstream Sync Report
**Date:** 2026-03-22T09:15:00Z
**Upstream:** `supabase/supabase-js` @ `v2.45.1` (sha: `a7f3c2d`)
**Local fork:** `myorg/supabase-js-fork` @ `v2.43.0` (sha: `b9e4f12`)

---

## Summary

| Metric | Value |
|--------|-------|
| Files changed upstream | 14 |
| Lines changed (LOC) | 387 |
| Breaking changes | 2 |
| Safe additions | 5 |
| Status | ⚠️ MANUAL REVIEW REQUIRED |

Auto-apply threshold: ≤20 files, ≤600 LOC, 0 breaking changes.
This sync has **2 breaking changes** — manual review required.

---

## Breaking changes (require manual action)

### 1. `SupabaseClient.from()` — method removed
- **Upstream:** Method removed in favor of `SupabaseClient.schema()`
- **Impact:** All callers using `supabase.from('table')` need migration to `supabase.schema('public').from('table')`
- **Files affected:** `src/lib/SupabaseClient.ts`

### 2. `GoTrueClient.signIn()` — signature changed
- **Upstream:** Parameter `email` renamed to `credentials.email`
- **Impact:** Breaking change for all auth callers
- **Files affected:** `src/lib/GoTrueClient.ts`

---

## Safe additions (auto-applied)

| Export | File | Action |
|--------|------|--------|
| `RealtimeChannel.subscribe()` timeout option | `src/lib/realtime-js/RealtimeChannel.ts` | Applied |
| `StorageClient.upload()` upsert option | `src/lib/storage/StorageClient.ts` | Applied |
| `PostgrestBuilder.abortSignal()` | `src/lib/postgrest-js/PostgrestBuilder.ts` | Applied |
| `SupabaseClient.VERSION` constant | `src/lib/SupabaseClient.ts` | Applied |
| `AuthError.status` property | `src/lib/GoTrueClient.ts` | Applied |

---

## Next steps

1. Review breaking changes above
2. Update all callers of `supabase.from()` to use `supabase.schema('public').from()`
3. Update auth callers to use `{ credentials: { email, password } }` format
4. Run your test suite: `npm test`
5. Merge: `git merge upstream/v2.45.1`
