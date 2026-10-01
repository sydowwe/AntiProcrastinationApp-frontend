# C3 · Suggest a template by location — spend `suggestedLocation`

- **Scope:** `dayPlanner` (the template picker's *Suggested for you* section, and the template form)
- **Backend:** yes. The suggestions are computed server-side, and the server never reads `SuggestedLocation`.
- **Model / effort:** Sonnet 5, medium. The mechanism has a precedent (B27). The judgment is whether the feature does anything at all given how rarely a day
  has a location.
- **Depends on:** nothing. B27 (landed 2026-09-24) is the base it extends.

---

```
Every day template has a "Suggested location" field (Home, Office, …). The user fills it in on the
template form, and nothing ever reads it. The day planner's template picker suggests templates by
weekday and by day type (B27), but not by location — even though the day itself can carry a
location, in the same enum.

Line numbers below are as of commit 5e6c4ab7 (2026-09-27). Verify each before relying on it.

--- What exists today ---

Client:
  - TaskPlannerDayTemplate.suggestedLocation?: Location (dto/response/template/
    TaskPlannerDayTemplate.ts:21), edited in TaskPlannerDayTemplateDetailsForm.vue:49-51. Read by
    nothing else.
  - Calendar.location: Location | null (dto/response/Calendar.ts:27) — the day's location, set
    ONLY in the Edit Details dialog (component/normal/CalendarDetailsDialog.vue:46), and shown in
    DayDetailsPanel.vue and CalendarDayCellContent.vue.
  - The picker: component/normal/DayTemplatePicker.vue. It calls
    GET /task-planner-day-template/suggestions/{calendarId} (api/taskPlannerDayTemplateApi.ts:45)
    and maps TemplateSuggestionResponse.patternType 0|1|2|3 (dto/response/template/
    TemplateSuggestionResponse.ts:12) to a sentence via PATTERN_SENTENCE_KEYS (:264-282).

Server (C:\Users\jakub\RiderProjects\AdhdTimeOrganizer, read-only for you):
  - SuggestedLocation appears only in the entity, its EF configuration and the request/response
    DTOs (AdhdTimeOrganizer.Planning). The suggestion endpoint and the apply-template flow never
    read it. Verify with a search before you write anything.
  - B27's response (prompts/view-docs/backend/_done/B27-*.md, bottom) documents the current
    ordering: history entries (types 0/1) first, then settings entries (2 = scheduled weekday,
    3 = suggested day type), one entry per template, active templates only. B27 part 1 said
    location was "optional and out of scope unless it is free", because calendar.Location is
    usually null. The old client-side scorer weighted a location match at 2 (between weekday 3 and
    recency 1).

--- Step 1: decide whether this does anything ---

Before building, answer honestly: on a real day, is Calendar.location set at the moment the user
opens the template picker? The picker appears on the day view when the day has no plan yet, and the
only way to set a location is a separate dialog. If the answer is "almost never", a location-match
suggestion is inert and adding it is theatre.

Check the e2e seed (and, if you can, reason about the normal flow) and report what you found. Then
choose, and say why:

  (a) Add the location match as a suggestion signal only. Worth it only if days commonly have a
      location first.
  (b) Also make the data flow the other way: when a template with a suggestedLocation is applied to
      a day whose location is null, the day takes that location. Then the NEXT time that
      location is set — or a future feature reads it — it is there. This is the only way the field
      earns its keep on day one. It is a behaviour change on apply; it must never overwrite a
      location the user set.
  (c) Neither — and say so, with the reason, and recommend what to do with the field.

Do not build (b) without deciding (b) — it changes what apply does.

--- Step 2: the frontend half, whichever you chose ---

For (a): a new pattern type in the response (the backend chooses the number; B27's pattern was the
next integer), one sentence key per locale beside the existing ones ("Suggested for the office" /
SK equivalent — look at how planner.location.* is already translated and interpolate it, do not
hard-code the place names), the branch in DayTemplatePicker.vue, no "· N×" count (it would be 0).
Widen the patternType union in TemplateSuggestionResponse.ts.

For (b): the apply flow's own UI — the preview/confirm step — should say the day's location will be
set, so it is not a surprise. Find where apply is confirmed (the template picker and the calendar's
bulk apply both apply templates; check both).

Frontend-only fallback until the backend lands: none. Do not re-score suggestions client-side — the
client scorer was deleted on purpose (useTemplateSuggestion.ts, removed 2026-09-24) so there is one
ranking, the server's. Leave the UI ready, with a TODO(Bn).

--- Do NOT ---
  - bring back client-side template scoring;
  - add a location to anything that does not already have one;
  - change the ordering of history-backed suggestions — history stays first (B27 rule 3).

--- Verification ---

npm run type-check (baseline 0; check the exit code) and npm run lint.
Once the backend lands, playwright-cli -s=c3 (state-load → reload → state-save):
  - A day with location Office and a template suggestedLocation Office → it appears with the new
    sentence, in EN and SK, after any history/weekday/day-type entries, and never twice.
  - (b) only: apply that template to a day with no location → the day's details show Office; apply
    it to a day already set to Home → still Home.
  - A template switched inactive never appears.

--- After the frontend work is done: write the backend ask ---

Model it on B27 (prompts/view-docs/backend/_done/B27-*.md): same endpoint, same response shape, the
rule stated plainly —
  - where a location-only match ranks relative to types 2 and 3, and how a template that matches
    weekday AND location is reported (B27 answered the equivalent for weekday + day type: one entry,
    the more specific type);
  - that a null location on either side never matches;
  - for (b), the apply rule: set the day's location from the template only when the day's is null.
Write it to prompts/captured-data/backend/Bn-<slug>.md per prompts/captured-data/backend/README.md.
If you chose (c), write no ask.
```
