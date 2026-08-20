# A2 · Delete dead code (activity)

- **Scope:** `../../../src/core/activity`
- **Backend:** none
- **Model / effort:** Sonnet 5, low — mechanical, with a verification step per item.
- **Depends on:** nothing (runs in parallel with A1; they touch different lines)
- **Unblocks:** A3, A6 — both are easier over a smaller surface

---

```
Delete the following unused code from src/core/activity/. Every item below was found by grepping the
whole of src/ — but grep again before each deletion, because A1 may have landed first and moved
things. If a grep contradicts this list, trust the grep and say so in your summary rather than
deleting something that is live.

--- 1. EntityWithSelectOptions ---

composable/ActivitySelectsComposition.ts:9-14 exports an enum whose only appearance in the entire
repo is its own declaration. Delete it.

--- 2. QuickEditActivityRequest.fromJson ---

dto/request/QuickEditActivityRequest.ts:8-11. Never called, and broken if it were: it destructures
only `name` and `text` and then calls a three-argument constructor, silently defaulting `categoryId`
to null. Delete the method; keep the class and its constructor, which are used.

--- 3. getSelectedActivityId ---

composable/useActivitySelectionFormState.ts:60 and its re-export through
component/ActivitySelectionForm.vue's defineExpose (line 185). No consumer anywhere. It is also
subtly wrong — it reads `formData.value.activityId`, which in non-filter mode is not where the
selection lives (that is `selectedActivityId`), so anyone who did adopt it would get null. Delete
both the computed and the expose entry.

--- 4. ActivityFormRequest.createEmpty ---

dto/request/ActivityFormRequest.ts:14-16 — a static getter returning `new ActivityFormRequest()`,
which is exactly what the constructor's defaults already give you. No callers. Delete.

Do NOT delete the equivalent on QuickActivityToolsDto (`createEmpty`, dto/response/QuickActivityToolsDto.ts)
— that one has two live callers in ActivitySelectOrQuickEditFormField.vue.

--- 5. Commented-out icon fields ---

dto/request/RoleRequest.ts:8 and dto/request/CategoryRequest.ts:8 both carry
`// public icon: string | null = null,`. Both response DTOs (Role, Category) do have an `icon` field
and both implement INameTextColorIconResponse, so this is a real gap, not dead weight — but a comment
is not a plan. Either wire it up (add `icon` to the request, add an IconPicker to ActivityRoleForm and
ActivityCategoryForm next to the existing ColorPicker — '@/_common/component/inputs/IconPicker.vue'
exists and is used elsewhere) or delete the comments. **Wire it up** unless the backend rejects the
field — in which case delete the comments and write `prompts/activity/backend/A2-backend.md`: a short,
contract-only ask for `icon: string | null` on the activity-role and activity-category create/update
requests, stating that both response DTOs already carry it. Only write that file if you actually hit
the rejection.

--- 6. Check, then decide: ActivityFilterFormResponse ---

dto/response/ActivityFilterFormResponse.ts is imported by two activityTracking DTOs
(TrackerAndroidMappingResponse, TrackerDesktopMappingResponse). Confirm whether those imports are
type-only and whether the field is actually populated and read. If it is genuinely used, leave it and
say so. If the imports are vestigial, delete the class and clean the two importers.

This is the only judgement call in this prompt — do not guess. If you cannot establish it in a couple
of greps, leave it and report.

Verify after each deletion: `npm run type-check` (baseline 72 errors) and `npm run lint`. The count
must not go up. Report the final number.
```
