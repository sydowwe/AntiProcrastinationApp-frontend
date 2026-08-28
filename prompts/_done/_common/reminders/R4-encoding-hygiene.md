# R4 · Encoding hygiene — four BOMs and one already-corrupted comment

- **Scope:** `src/_common/modules/reminders/view/{MyRemindersView,ReminderDefinitionsView,ReminderDispatchHistoryView,ReminderUpcomingView}.vue`
- **Backend:** —
- **Model / effort:** Sonnet 5, low
- **Depends on:** nothing
- **Unblocks:** R1, R5, R7, R8 — all of which edit these four files and would otherwise produce
  whole-file diffs the moment an editor strips the BOM

---

```
Small and mechanical, but read the whole prompt before touching a file — the failure mode this fixes is
the same one that can be caused BY fixing it carelessly.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place; leave the work in the submodule's working tree
and say so at the end. Commit and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common,
so no tooling will notice or fix any of this for you.

--- The hazard, stated up front ---

Your global CLAUDE.md has a rule about this exact class of bug: never round-trip a file's contents
through the shell. No `Get-Content x | Out-File x`, no `(Get-Content x) | Set-Content x`, no sed/awk
in-place rewrite. On this box, Windows PowerShell 5.1 reads a BOM-less UTF-8 file as cp1252 and writes it
back as UTF-8, double-encoding every non-ASCII character. It has already corrupted 26 files here once.

The files in this prompt are full of Slovak diacritics and em dashes. Use the Read tool to inspect and
the Write/Edit tools to change them. Reading in the shell (Select-String, Get-Content) is fine; writing
is not. If you find yourself composing a one-liner that both reads and writes a source file, stop.

--- What to fix ---

1. Four files begin with a UTF-8 BOM (U+FEFF, bytes EF BB BF), immediately before `<template>`:

     view/MyRemindersView.vue
     view/ReminderDefinitionsView.vue
     view/ReminderDispatchHistoryView.vue
     view/ReminderUpcomingView.vue

   The module's other 35 files have none, including the two views right next to these
   (ReminderOverviewView.vue, ReminderDefinitionDetailView.vue) and every .ts file. So this is drift, not
   a convention. It is harmless at runtime — Vite strips it — but it makes every future diff of these
   files hostage to whichever editor touches them next, and four of the other prompts in this directory
   edit exactly these four files.

   Remove the BOM. Confirm the file still starts with `<template>` and that nothing else changed.

2. view/ReminderDispatchHistoryView.vue:267 is already corrupted:

     // Deep-link support: ?reminderId=â€¦ pre-filters to one reminder's lineage (from upcoming/overview).

   `â€¦` is a U+2026 ellipsis that went through the cp1252 round-trip described above. Restore it to `…`
   (or rewrite the comment without the ellipsis — either is fine, the comment is the only thing affected).

   Note: if R1 has already run, this comment may have moved out of `onMounted`. Fix it wherever it is.

3. Before you finish, sweep the rest of the module for the same damage — the corruption tends to arrive
   in batches. Search modules/reminders/ for the telltale sequences: `â€`, `Ã`, `Å`, `Ä`. The locale files
   (_locales/*.sk.ts) are the highest-value place to check, because a mojibake string there ships to the
   user rather than sitting in a comment. Report what you found, including "nothing else".

--- Do not ---

- Reformat, reindent, or reorder anything. This prompt's entire diff should be four removed BOMs and one
  fixed character. If a file's diff shows more than that, you have used a tool that rewrote line endings
  or trailing whitespace — revert it and try again with a targeted edit.
- Add an .editorconfig, a lint rule, or a pre-commit hook. Tooling changes for the framework repo are a
  separate conversation with a different owner.
- Touch line endings. Leave CRLF/LF exactly as found.

--- Verification ---

Check the bytes, not the rendering — an editor will happily hide a BOM from you. In PowerShell, READ
ONLY:

    Get-Content <file> -AsByteStream -TotalCount 3

should come back 60 116 101 (`<te`), not 239 187 191.

Then: npm run type-check — baseline 72 errors, all app-side in src/core; any src/_common error is yours.
`npx vite build` should still bundle (a chunk-size warning over 500 kB is expected and is not an error).
Load /pripomienky/moje and /pripomienky/historia in the browser and confirm the Slovak strings render
with correct diacritics — that is the check that catches it if you corrupted something while fixing it.

Finally, `git -C src/_common diff --stat` should show four files with a handful of changed lines between
them. If it shows four files fully rewritten, stop and revert.
```
