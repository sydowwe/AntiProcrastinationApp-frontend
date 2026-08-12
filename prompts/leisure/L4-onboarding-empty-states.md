# L4 · The cold-start problem: empty states and inline activity creation

- **Scope:** module-wide — the four tables and the three profile forms
- **Backend:** maybe — an inline activity-create route may already exist in the activity module
- **Model / effort:** Sonnet 5, medium effort

---

```
Every leisure profile is keyed by an activity that must ALREADY exist in the activity module —
ActivityBacklogProfile.id returns activityId, and all three "New…Form" components open with a
required VIdAutocomplete of existing activities. So a brand-new user opening /leisure/backlog sees
an empty table, clicks add, and gets a dropdown with nothing in it. There is no path from here to a
populated module without leaving for the activity module and coming back. Fix that.

1. INLINE ACTIVITY CREATION. In component/backlog/NewBacklogProfileForm.vue,
   component/bucketList/NewBucketListProfileForm.vue and
   component/project/NewProjectProfileForm.vue, the activity VIdAutocomplete should let the user
   create an activity without leaving the dialog — a "create «typed text»" affordance in the
   no-results slot, which creates the activity and selects it.

   Read src/core/activity/api/ first to see what creating an activity actually requires (it may
   need a category, in which case the inline path needs one field, not zero). Cross-module import
   is allowed ONLY through activity's api/ or dto/ — never its component/, composable/ or store/.
   Note L2 is fixing three existing violations of exactly this rule in these same three files, so
   do not add a fourth.

   Dialogs nest (useDialog supports it), so opening activity creation as a nested dialog is
   legitimate if the inline field is not enough. What is NOT acceptable is sending the user away
   and losing the half-filled leisure form.

2. REAL EMPTY STATES. All four tables currently render an empty grid. Each should say what the
   surface is for and offer the one action that fills it. These are four genuinely different
   things and deserve four different sentences, not one shared "No data" — a backlog is "things I
   could do", a bucket list is "things I want to do once", projects are "things I'm building",
   memory anchors are "things I did and want to remember". Check whether BasicTable
   (src/_common/component/dataTable/BasicTable.vue) already exposes a no-data slot before adding
   markup around it.

3. MEMORY ANCHORS HAVE A SECOND, HARDER EMPTY STATE. Anchors can only be created for activities
   with a one-time backlog profile or a bucket list profile — see
   api/memoryAnchorApi.ts fetchAnchorEligibleActivities() and the
   leisure.memoryAnchorPlaceholder / leisure.errors.notEligible strings. So the anchor form can be
   empty-for-a-reason even when the user has plenty of activities. When the eligible list comes
   back empty, say why and link to the backlog/bucket list, rather than showing a blank picker
   whose emptiness looks like a bug.

All strings in _locales/leisure.{sk,en}.ts, SK primary. Run `npm run type-check` (baseline 72,
do not add) and `npm run lint` (0 errors).

FINALLY — if creating an activity turns out to need an endpoint or a request shape the activity
module does not expose, do everything that stands on its own (empty states, the eligible-list
message, the UI affordance) and write the backend ask to
prompts/leisure/backend/L4-backend.md.

CONTRACT ONLY: the endpoint the frontend calls (method, route, request body shape) and the fields
it consumes back, with types and nullability, in the JSON naming the frontend fromJson reads. No
entities, no EF or migrations, no FK or cascade decisions, no validation rules — those are the
backend agent's call. If nothing is missing, do not create the file; say so instead.
```
