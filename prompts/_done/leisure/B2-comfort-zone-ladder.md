# B2 · The comfort-zone ladder

- **Scope:** bucket list
- **Backend:** no
- **Model / effort:** Sonnet 5, medium effort — small view, the ordering logic is the substance
- **Research:** Bandura (1977) on self-efficacy — mastery experiences are the strongest source, and graded, incremental exposure is how they are built. A ladder climbed one rung at a time; not a list sorted by ambition.
- **Order:** best after B1, which supplies the "done" signal the ladder needs

---

```
ActivityBucketListProfile has comfortZoneStep (1–5) and the module treats it as a filter value and
a coloured chip. It is more than that: it is the one field in this app that describes how far
outside their comfort zone something sits for this specific user. Bandura's mastery-experience
finding is that the way to the scary thing is the next slightly-uncomfortable thing, done and
survived — not the scary thing itself.

Build a ladder view of the bucket list — a fifth tab-less surface is not needed; make it a toggle
between "table" and "ladder" on the existing /leisure/bucket-list route, with the mode in a URL
query param so it is bookmarkable (CLAUDE.md requires URL state for view mode).

THE LADDER: five rungs, one per comfortZoneStep, ascending. Items grouped under their rung. Rung 1
is "barely a stretch", rung 5 is "the thing I keep not doing". The visual should make the climb
legible at a glance — how much of rung 2 is done before rung 3 has anything in it at all.

THE ONE NUDGE: highlight the single lowest-numbered item the user has NOT yet experienced, framed
as the next rung rather than as a deficiency. Exactly one recommendation, not a ranked list. If
B1 has landed, "experienced" comes from its field; if it has not, this prompt still works —
the ladder itself is useful without the done state, so build it that way and let the highlight
appear when the data does.

TONE — the part worth spending judgment on. This surface is about things the user is avoiding,
which makes it very easy to write a screen that reads as an accusation. "You still haven't done
this" is the failure mode. It should read as an invitation to the smallest available step. Write
the SK strings first; SK is primary here and the register matters more than the literal
translation.

Reuse rather than reinvent: component/bucketList/ComfortZoneStepper.vue already renders the 1–5
scale and owns the colour ramp (which L3 extracts to a shared function — use it if it exists).
Vuetify props before utility classes before custom CSS; v-auto-animate for list transitions rather
than hand-written CSS.

Strings in _locales/leisure.{sk,en}.ts, SK primary. `npm run type-check` (baseline 72, do not add)
and `npm run lint` (0 errors).
```
