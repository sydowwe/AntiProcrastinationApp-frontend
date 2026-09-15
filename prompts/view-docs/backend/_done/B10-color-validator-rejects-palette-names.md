# B10 · Backend ask — the colour validator demands hex; the palette on both sides is names

**Contract only.** How the accepted set is declared, where the length limit lives and how existing rows are handled are the backend's decisions — this ask says what
the field must accept and why.

> **Blocker.** Written 2026-09-15 from `docs/views/_fix-queue.md` escalation §11, observed four times
> (`activity-settings/X1` on Create and on a no-change Edit of a seeded role; `todo-lists/X1` three times on the
> *New category* dialog). Source read in `AdhdTimeOrganizer` on the same day.

---

## The problem

**Creating or editing any Activity Role, Activity Category or To-do-list Category is refused with a 400.**

`NameTextColorIconValidator.cs:16-20` is:

```csharp
RuleFor(x => x.Color)
    .NotEmpty()
    .MaximumLength(EntityFieldLengths.Color)          // = 7
    .Matches("^#(?:[0-9a-fA-F]{3}){1,2}$")
    .WithMessage("Color must be a valid hex color code (e.g. #FFFFFF or #FFF)");
```

Three validators derive from it — `ActivityRoleValidator`, `ActivityCategoryValidator`,
`TodoListCategoryValidator` — so three create routes and three update routes are closed.

Nothing on either side produces a hex string:

- The **client** `ColorPicker.vue:31` writes the swatch's `name` from `COLOR_PALETTE` — `"rose"`, `"emerald"`. Every renderer resolves that name to a theme-aware
  `{bg, text}` pair (`colorPalette.ts`,
  `color[currentTheme].bg`). A hex value would lose the light/dark pairing, which is why the picker was built on names.
- The **server's own framework** declares the same 29 names as constants —
  `framework/Sydowwe.Framework/domain/enum/ColorPalette.cs` (`Crimson = "crimson"` … `Slate = "slate"`). Diffed 2026-09-15: the client's `colorPalette.ts` and
  `ColorPalette.cs` carry the **same 29 names**, exactly.
- The **e2e seeder** writes them — `E2eFixtureSeeder.cs:409-417` (`ColorPalette.Blue`, `ColorPalette.Emerald`,
  `ColorPalette.Violet`…). So every seeded role fails its own validator on an unchanged round trip, which is exactly what unit 2 saw on *Health & Fitness*.
- `RoutineTimePeriodValidator` has no colour rule, so the routine-period form ships `"color":"blue"` and gets 201 (`todo-routine/B11`, verified). The three
  subclasses above are the only refusers.

The regex dates from **2026-05-16** (`a51309e`), before the palette existed on either side (`colorPalette.ts`
first appears 2026-06-22). It is the stale side.

**What the user sees today:** the dialog closes on submit, the request 400s, and the snackbar reads the generic *"One or more errors occurred!"* (the framework
interceptor prefers `message` over `errors` — app-side `FW19`). The typed name is lost with the dialog.

## The business rules

1. **`color` is a palette name, not a hex string.** The accepted set is `ColorPalette.*` — the 29 names the server already declares. Please confirm this is the
   intended contract; the client cannot move to hex without a `vue_framework` change that would still leave every stored name invalid on re-save.
2. **The longest accepted name is 8 characters** (`"burgundy"`). `EntityFieldLengths.Color = 7` cannot hold it, so relaxing the regex alone leaves one swatch
   unsaveable. Whatever the storage limit becomes, the contract is *every palette name round-trips*.
3. **Open question — `"default"`.** Unit 9's dialog submitted `"color":"default"` once; that is the
   `ColorPicker`'s empty-state value, not a palette name. Should the server accept it (and store it as "no colour"), or refuse it and let the client require a
   swatch? The client can do the latter today (`ColorPicker` has a `required` prop, framework `98b92d0`, already passed on the time-period form). Our preference:
   **refuse it**, and we'll pass `required` on the three forms — but say which.
4. **Is `color` required at all?** `NotEmpty()` says yes for all three entities. Confirm; the client renders a fallback swatch for `null` and would not object to
   optional.

## The shape the frontend needs

No new fields. The three request DTOs (`ActivityRoleRequest`, `ActivityCategoryRequest`,
`TodoListCategoryRequest` → `NameTextColorIconRequest`) keep `color: string`. On a rejected value, the existing 400 shape with `errors.color[]` and a message that
**names the accepted set** (or at least says
"palette name") — `FW19` will render it verbatim once it lands.

Please pin the contract with a test that posts a **palette name**; `NameTextColorIconValidationTests.cs`
currently posts `#abcdef` everywhere (`:46,68,88,93`), which is why the seeder and the validator could disagree for three months without a red test.

## What changes on the frontend once this lands

- Nothing in `ColorPicker` or `colorPalette.ts`.
- Two app-side follow-ups, both small and both already tracked: pass `required` on the three colour forms if rule 3 is "refuse", and stop closing the dialog before
  the request resolves (the close-then-call shape,
  `F53`(c)/`F70`) so a 400 does not lose the typed name.
- Unblocks the unit 2 and unit 9 **mutation passes**, which currently cannot create a role, a category or a to-do-list category through the UI.
