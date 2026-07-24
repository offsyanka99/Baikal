# Import performance — Phase 1 (test branch)

**Branch:** `perf/import-sqlite-tx`  
**Change:** Wrap portal calendar + contact imports in **chunked SQLite transactions** (commit every **200** objects).

## Why

Per-event `createCalendarObject` / `createCard` used SQLite autocommit (fsync per row). On TrueNAS/ZFS that dominated wall time (~6 min for ~2.7k events) despite low CPU/RAM.

Phase 1 keeps sabre create/update APIs unchanged; only wraps the loop in `BEGIN`/`COMMIT` chunks.

## Expected result

Same import counts; **much lower elapsed time** on NAS SQLite (often several× faster). Progress % UI unchanged.

## Install on TrueNAS for testing

Pushing this branch builds GHCR images (see `.github/workflows/docker.yml`):

| Tag | Meaning |
|-----|---------|
| `ghcr.io/offsyanka99/baikal:import-tx-test` | Stable name for this experiment |
| `ghcr.io/offsyanka99/baikal:perf-import-sqlite-tx` | Branch ref tag |
| `ghcr.io/offsyanka99/baikal:sha-…` | Exact commit |

Wait for [Actions → docker](https://github.com/offsyanka99/Baikal/actions/workflows/docker.yml) to finish, then in compose:

```yaml
services:
  baikal:
    image: ghcr.io/offsyanka99/baikal:import-tx-test
    # … rest same as docs/truenas-scale.compose.yaml …
```

**Pull + recreate** the app (not only restart). Keep `BAIKAL_SKIP_CHOWN: "1"` and `memory: 1G`.

Fallback if GHCR is not ready — build on the NAS (slow):

```yaml
    build:
      context: https://github.com/offsyanka99/Baikal.git#perf/import-sqlite-tx
    image: offsyanka99/baikal:import-tx-local
    pull_policy: build
```

After test, switch back to:

```yaml
image: ghcr.io/offsyanka99/baikal:0.11.1-fork.4
```

## How to measure

1. Export or re-use the same large `.ics` (~2.7k events).  
2. Import into an empty (or same) calendar; note modal elapsed time.  
3. Compare to ~6m baseline on `master` / `0.11.1-fork.4`.  
4. Confirm CalDAV clients still see events (synctoken / changes still written via sabre).

## Not in Phase 1

- Bulk SQL without double VObject parse (Phase 2)  
- Async job queue  
- Schema changes  
