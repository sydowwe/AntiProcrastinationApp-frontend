# `_common/api` — prompt set

Prompts for the framework's API composables (`src/_common/api/`). Same rules as every `_common` set:
the change lands **in the submodule**, `src/_common/docs/api.md` is updated in the same commit, and the
app-side pointer bump is a second commit in a second repo — in that order.

| Prompt | What it does | Status |
| --- | --- | --- |
| [`A1-request-key-for-sibling-fetch-helpers.md`](A1-request-key-for-sibling-fetch-helpers.md) | Extend the per-`requestKey` cancellation already shipped in `useFetchFiltered` to the three sibling helpers, and retire the four call-site workarounds it makes unnecessary | **Ready to run** |

## Background common to this set

Two related fixes landed on 2026-09-11 and are the premise for everything here:

1. **`useFetchFiltered` got per-`requestKey` cancellation.** It used to hold one `AbortController` per
   composable instance and abort the previous in-flight request on every call. Correct for latest-wins,
   fatal for a fan-out. Now a call aborts only the previous call *under the same key*; omitting the key
   reproduces the old behaviour exactly.
2. **The axios interceptor stopped logging deliberate cancellations.** `console.error('ERROR: ', error)`
   fired unconditionally, contradicting `useRequestState.run` directly beside it. `isRequestCanceled()`
   is now exported from `_common/axiosConfig.ts` for callers that run overlapping loads on purpose.

The second one removed the *symptom* across the whole app. The first one removed the *cause* in one of
four places. A1 is the rest.
