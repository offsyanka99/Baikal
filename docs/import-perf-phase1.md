# Import performance — Phase 1 (merged)

**Status:** Merged into `master` / release **`0.11.1-fork.4`**.

## Change

Portal calendar and contact imports wrap the write loop in **chunked SQLite transactions** (commit every **200** objects).

## Measured (TrueNAS SCALE, same Thunderbird `.ics`)

| | Before | After Phase 1 |
|--|--------|----------------|
| Objects | ~2671 new + 104 updated | same class of result |
| Time | ~**6m 6s** | ~**2s** |

## Production image

```yaml
image: ghcr.io/offsyanka99/baikal:0.11.1-fork.4
# or
image: ghcr.io/offsyanka99/baikal:latest
```

Pull + recreate after the Docker build for the merge/tag finishes.

## Not in Phase 1 (future)

- Bulk SQL path without double VObject parse (Phase 2)
- Async job queue
