# M1 · Memory anchors as a timeline, not a table ⭐

- **Scope:** memory anchors
- **Backend:** likely — an aggregate-by-period endpoint
- **Model / effort:** Opus 5, high effort — this is a visual design task with a data fetch attached, and a mediocre version is worse than the table it replaces
- **Research:** the savoring literature (Bryant & Veroff, 2007) — deliberately revisiting positive experiences raises wellbeing more reliably than acquiring new ones. Also the peak–end rule: what people believe about a period of their life is reconstructed from a few remembered moments, which is exactly what this table stores and never shows back.

---

```
A memory anchor is a month, an activity, a 1–10 rating and a highlight note. The app renders them
as a paginated table sorted by whatever column you clicked, ten rows at a time.

That is the wrong shape for this data. Nobody wants to page through their good memories. The
entire point of recording them is to look back at a year and see it — which is a thing this app
already knows how to do, because src/core/todoList/component/routine/RoutineGroupHeatmap.vue is a
year-grid heatmap in this exact codebase. Read it before designing anything; match its visual
language rather than inventing a second one.

BUILD a timeline view on /leisure/memory-anchors, toggling with the existing table (mode in a URL
query param — CLAUDE.md requires bookmarkable view state). The table stays: it is the right tool
for editing and deleting. The timeline is the right tool for looking.

THE SHAPE: a year at a time, twelve months. A month with anchors shows them; a month without is
visibly empty — that emptiness is honest and it is information. Rating drives intensity. The
highlight note is the payload: it should be readable in place, not behind a click, because a note
you have to click is a note you never re-read. Year navigation, defaulting to the current year.

DESIGN DECISIONS THAT ARE YOURS TO MAKE, and where the effort should go:
- What a month with four anchors looks like versus one with one, without the layout breaking.
- Whether the rating reads as colour intensity, size, or a mark — and whether a low rating should
  look bad. Consider that it should not: a 4/10 experience you chose to record is still a memory
  worth keeping, and a screen that shames your mediocre months defeats the purpose.
- How this looks with three anchors total. Most users will have very few for a long time. A
  year-grid designed only for a full year will look broken for the first eighteen months of use,
  and that is the state most sessions will be in.

MemoryAnchor already exposes a periodKey getter (anchorYear * 100 + anchorMonth) for grouping, and
ActivityInfo carries icon and colour that the table currently discards — use both. Intl month
formatting via the current locale, as MemoryAnchorTable already does.

DATA: MemoryAnchorFilter has year and month, so fetching one year is expressible today via the
existing filtered-table endpoint — but paginated, which is wrong here: a year must arrive in one
response, not in pages of ten. Check what the existing endpoint does with a large itemsPerPage
before concluding you need anything new. If a plain "all anchors for year N" read is not cleanly
expressible, build the timeline against the shape you want and write the backend ask to
prompts/leisure/backend/M1-backend.md.

CONTRACT ONLY: the endpoint the frontend calls (method, route, request shape) and the fields it
reads back, with types and nullability, in the JSON naming the frontend fromJson reads — plus, if
the year navigator needs it, which years have any anchors at all. Do NOT specify entities, EF or
migrations, indexes, or how the aggregation is performed. If the existing endpoint is sufficient,
do not create the file; say so.

Vuetify props before utility classes before custom CSS. Strings in _locales/leisure.{sk,en}.ts,
SK primary. `npm run type-check` (baseline 72, do not add) and `npm run lint` (0 errors).
```
