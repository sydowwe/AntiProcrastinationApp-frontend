# L3 · Collapse the duplicated filter inputs and chip formatters

- **Scope:** module-wide — the four views' `#fields` slots and `chipFormatters`
- **Backend:** no
- **Model / effort:** Sonnet 5, low–medium effort — bounded extraction, no behaviour change
- **Order:** after L1, which rewrites the same four views

---

```
The four leisure views repeat the same three input patterns and the same four chip-formatter
shapes. Extract them. No behaviour change — the filter panels must look and act identically after.

1. LOOKUP MULTI-SELECT. This exact block appears six times across BacklogView.vue (locationType,
   weatherDependency, expectedCostTier) and BucketListView.vue (experienceType), with only the
   model, label and items differing:

     <VSelect :items itemValue="id" itemTitle="text" multiple chips clearable
              variant="outlined" density="compact" hideDetails />

   Two of those props (itemValue/itemTitle="id"/"text") are exactly what the VIdSelect alias
   already configures — check src/main.ts for the alias definitions before writing a new
   component, because VIdSelect + `multiple chips` may already be the whole answer. If a wrapper
   is still worth it, put it in src/core/leisure/component/LookupMultiSelect.vue taking
   `modelValue`, `label` and `items: LookupResponse[]`.

   The enum multi-selects (energyLevels, effortTypes, difficultyLevels, readinessStatuses) use
   itemValue="value" itemTitle="title" instead, because getEnumSelectOptions returns ValueTitleDto.
   That is a second, distinct shape — either a second small wrapper or one wrapper with a mode
   prop. Do not force one component to serve both by loosening its types to `any`.

2. CHIP FORMATTERS. All four views build a ChipFormatters<T> map by hand and three shapes recur
   verbatim:
   - text contains  →  `Label: value`
   - multi-select   →  `Label (n)`
   - tri-state bool →  `Label: ✓ / ✗`, null returns null
   Write typed helpers in src/core/leisure/composable/useLeisureFilterChips.ts —
   e.g. textChip(labelKey, icon), countChip(labelKey, icon), boolChip(labelKey, trueIcon,
   falseIcon) — each returning the formatter function. Keep them generic over the filter type so
   the maps stay type-checked. The two irregular ones stay hand-written: BucketListView's paired
   min/maxComfortZoneStep chip (it uses resetKeys to clear both at once) and BacklogView's
   `≤ value` duration chip.

   While you are there: the ✓/✗ glyphs are hardcoded. Leave them if they read fine in both SK and
   EN, but the label half must stay i18n'd as it is today.

3. THE 1/3/5 COLOUR RAMP is written twice, identically:
   component/bucketList/ComfortZoneStepper.vue activeColor() and
   component/bucketList/BucketListTable.vue stepColor() — both success / warning / errorDark at
   <=1 / <=3 / else. One exported function, used by both.

4. WHILE YOU ARE IN THE TABLES — ActivityInfo (dto/response/ActivityInfo.ts) carries `icon` and
   `color` alongside `name`, and every one of the four tables renders the bare name and throws
   both away. Render the activity icon in the `activity.name` cell of all four tables, tinted with
   its colour, falling back cleanly when either is null. It is free visual identity, the data is
   already on the wire, and it makes the four tables recognisably one module.

Any new strings go in src/core/leisure/_locales/leisure.{sk,en}.ts (SK is primary). Run
`npm run type-check` (baseline 72, do not add) and `npm run lint` (0 errors).
```
