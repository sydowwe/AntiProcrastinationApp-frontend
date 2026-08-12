# B1 · Close the loop: bucket list → memory anchor ⭐

- **Scope:** bucket list + memory anchors
- **Backend:** likely — the frontend cannot currently tell which bucket list items are done
- **Model / effort:** Opus 5, high effort — this is the missing spine of the module, and getting the "done" semantics right matters more than the UI
- **Research:** Kahneman's peak–end rule and the savoring literature (Bryant & Veroff) — the recorded, revisited memory is where the value of a one-time experience actually accrues

---

```
The leisure module has a hidden design already half-built into it, and nobody finished the wiring.

MemoryAnchor (dto/response/MemoryAnchor.ts) carries hasBacklog, backlogIsOneTime and hasBucketList.
api/memoryAnchorApi.ts exposes fetchAnchorEligibleActivities(), and leisure.errors.notEligible says
"Activity must have a one-time Backlog or Bucket List profile to be anchored." So the backend
already understands that a memory anchor is the COMPLETION of a one-time experience.

The frontend does nothing with that. A bucket list is a list of things you want to do once, and
this one has no notion of having done them. It only grows. There is no progress, no completion, no
moment of "I did this" — and the anchor, which is exactly that moment, has to be created by hand
from a separate page with no idea which bucket list entry it corresponds to.

Close the loop:

1. "I DID THIS" ACTION on every bucket list row (component/bucketList/BucketListTable.vue). It
   opens MemoryAnchorForm (component/memoryAnchor/MemoryAnchorForm.vue) pre-filled: the activity
   locked, the month/year defaulted to now. The user adds a rating and a highlight note. That is
   the whole interaction — two fields between doing a thing and having recorded it. Read
   MemoryAnchorForm and NewMemoryAnchorForm first; the lockActivity prop already exists for
   exactly this, and the dialog system nests (useDialog / useDialogApi).

2. DONE ITEMS MUST LOOK DONE. Once anchored, the bucket list row shows it — visibly settled,
   and by default sorted out of the way of the undone ones rather than deleted. The list's value
   is that it accumulates evidence, so nothing gets removed.

3. PROGRESS. "4 of 17 experienced" above the table, and the same for one-time backlog entries.
   This is the only completion metric the leisure module can honestly show, and right now it shows
   nothing at all.

4. THE ANCHORS SIDE gets the reciprocal link: MemoryAnchorTable.vue already renders source chips
   from hasBucketList / hasBacklog && backlogIsOneTime, so the relationship is visible in one
   direction. Make it navigable in the other.

THE BLOCKER, verify it first: ActivityBucketListProfile has no field saying whether it has been
anchored. The frontend could fetch memory anchors and intersect on activityId, but that means
pulling the whole anchor table to render one column, and it breaks under pagination — the anchors
for page 2's rows are not in the response you have. Do not do that, and do not simulate completion
in sessionStorage.

So do everything that stands on its own — the "I did this" action and its pre-filled dialog, the
reciprocal navigation, the locales, and the progress UI reading the field with `?? null` so it
degrades to hidden until the API carries it — then write the backend ask to
prompts/leisure/backend/B1-backend.md.

CONTRACT ONLY: which existing endpoints must carry the new field(s) (the bucket list filtered
table response the frontend already consumes, plus any counts the progress UI needs), and the
fields themselves with type and nullability in the JSON naming the frontend fromJson reads. Note
that the backend already computes hasBucketList on MemoryAnchor, so the inverse is information it
demonstrably has. Do NOT specify entities, EF or migrations, FK relationships, cascade behaviour,
or how "anchored" is derived — those are the backend agent's decisions. If the field already
exists, do not create the file; say so.

Strings in _locales/leisure.{sk,en}.ts, SK primary. `npm run type-check` (baseline 72, do not add)
and `npm run lint` (0 errors).
```
