# N11 · English falls back to Slovak, because the framework ships no English

- **Scope:** new `src/_common/_locales/common.en.ts`, `src/locales/EN.ts`, `src/_common/SETUP.md`
- **Backend:** —
- **Model / effort:** Sonnet 5, low–medium
- **Depends on:** nothing — but run it AFTER any prompt that adds locale keys (N6, N7, N9, N12)
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Add a file under
src/_common/_locales/ in place. At the end, list the files under src/_common you touched or added.

src/_common/_locales/ contains exactly two files: common.sk.ts and vuetifyLocale.sk.ts. There is no
English file at all.

src/i18n.ts:16-18 sets locale 'SK' and fallbackLocale 'EN'. So when a user switches to English, every
framework string resolves to... nothing, and the fallback chain terminates. What the user actually
sees depends on whether the app's own EN aggregator happens to re-export the SK framework block — read
src/locales/EN.ts and src/locales/SK.ts and establish which it is BEFORE writing anything, because it
determines whether the current symptom is "Slovak text in an English UI" or "raw key paths on screen".
Note the aggregator spread is shallow (there is a comment about this at the top of SK.ts) — a
colliding top-level namespace is replaced wholesale, not merged.

Scope: this prompt owns the notifications module's keys. The framework's other namespaces
(authorization.*, controls.*, user.*, scheduler.*, reminders.*) have the same gap and it is much
bigger than this prompt.

Do this:

1. Establish the symptom, as above. Write one sentence in your final report saying what an English
   user sees today. If it turns out EN is already covered by some mechanism I did not find, stop and
   say so — do not create a redundant file.

2. Create src/_common/_locales/common.en.ts, structured to mirror common.sk.ts. Translate the
   `notifications.*` (line 271-291) and `reminderPreference.*` (line 292-329) blocks in full,
   including the keys N1 identified as currently unreferenced — they are reserved for N12 and
   translating them now is cheaper than remembering to later.
   Two things NOT to translate literally:
   - `reminderPreference.ownerModule.*` and `kindName.*` (line 321-328) are another application's
     domain vocabulary that does not belong in the framework at all. N9 removes them. If N9 has
     landed, they will be gone; if it has not, do NOT translate them — leave them out of the EN file
     and note it, so you are not creating a second copy of something scheduled for deletion.
   - `notifications.enableNotificationsInWindows` (line 290) names Windows menu paths that differ per
     locale of the OS, not per locale of the app. Translate the sentence, keep the menu names
     recognisable.
   Slovak plurals: src/i18n.ts:9-14 installs a three-form rule for SK only. Any SK message written
   `one | few | many` needs a two-form EN counterpart, not three. Check each count-bearing message.

3. Wire it up. Follow whatever pattern SK uses — src/locales/SK.ts spreads the framework's common
   block, so EN.ts must spread the new one in the same position relative to the app's own namespaces.
   Get the ORDER right: CLAUDE.md says the app's namespaces are spread after the framework's so they
   win, and the spread is shallow.

4. The rest of the framework's namespaces. Do not translate them in this prompt — that is a much
   larger job with a different reviewer. But now that common.en.ts exists, the remaining gap should
   be recorded rather than rediscovered: add an entry to migration-revision.md describing which
   namespaces are covered and which are not, and note it in SETUP.md where the locale registration is
   documented, so the next app mounting this framework knows English is partial.

Translation quality: these are user-facing settings strings, some of them long explanatory subtitles
(reminderPreference.intro, quietHours.subtitle). Translate the meaning, not the words. Where the
Slovak is explaining a behaviour — "reminders that would arrive in this window are held and delivered
afterwards, not discarded" — the English must carry the same reassurance, because that reassurance is
the reason the sentence exists.

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural: switch the app to English. Open the bell, open /nastavenia/pripomienky, trigger a
notification snackbar and an error snackbar. No Slovak, no raw key paths. Switch back to Slovak and
confirm nothing regressed — this is where a shallow-spread ordering mistake shows up.

Then diff the key sets programmatically rather than by eye: a small throwaway script that flattens
both objects and reports keys present in one and not the other. Report the count of any remaining
gaps in the two namespaces you own. Do not leave the script behind.
```
