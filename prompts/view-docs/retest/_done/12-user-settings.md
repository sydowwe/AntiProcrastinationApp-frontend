# Retest 12 — `user-settings` (6 findings)

Run the **retest round** for this one unit. First read `prompts/view-docs/RETEST-PROMPT.md` in full and follow its
§2–§4 and *Final report*. This file replaces its §1: the table below is your scope.

- **Unit:** `user-settings` → `docs/views/user-settings/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** `primaryUser` for B1, B2, A1 and P1; **`secondaryUser`** for B3 and B4 (see notes)
- **Routes:** `/user/settings`, `/google-calendar/callback`

## Findings to retest

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan
the order. If a summary and the `Verify:` block disagree, the block wins.

| id | sev | finding | pass condition, in short | mutates |
|---|---|---|---|---|
| B1 | bug | Google Calendar "Connect" leads to an OAuth error (`client_id` missing) | the browser reaches Google's real consent screen, not an error page | no: **do not authorize** |
| B2 | bug | The callback view gives no feedback on a failed or declined connection | `/google-calendar/callback?error=access_denied` shows a visible error before or during the redirect to `/user/settings` | no |
| B3 | bug | A step-up action right after page open can fail the concurrency check and report "Wrong password" | stepping up **immediately** after load (no waiting for network idle) returns 200 and opens *Enabling 2FA*; one `PUT /user/preferences` per session | see notes |
| B4 | bug | A wrong password in the identity dialog signed the user out | a wrong password gives 401 and "Wrong password", the dialog stays open, you stay on `/user/settings`, and the right password then works in the same dialog | see notes |
| A1 | a11y **[framework]** | The password-field visibility toggles have a meaningless name | "Show password" / "Hide password", not "…appended action" | no |
| P1 | polish **[framework]** | "Change password" and "Delete account" use the wrong elevated colours | `warningDark` and `errorDark` respectively, legible in the light **and** dark themes. **Screenshot both** | **theme**: switch it back |

## Unit notes

- **B3 and B4 run on `secondaryUser`, in their own sign-in, and stop at the QR code.** The step-up opens the
  *Enabling 2FA* dialog. **Never enter a TOTP code and never finish enrollment**, or 2FA ends up enabled on a
  fixture account and every later sign-in breaks. Cancel at the QR, then confirm that the settings page still
  shows 2FA **off**.
- **B3's `Verify:` block describes a spec edit** (removing a `waitForLoadState('networkidle')` line). Do not edit
  the spec. Reproduce the same timing by hand: navigate, then open the step-up straight away. If
  `two-factor.spec.ts` passed in the operator's pre-run e2e pass, you may record B4 against it with the e2e
  status form. B3 still needs the fast hand-driven check.
- **Sign-in budget:** `secondaryUser` needs a form sign-in (never `state-load` a file another session holds).
  `/auth/login` allows 5 hits a minute per IP, so do B3 and B4 in a single sign-in.
- **Do not change the password and do not confirm Delete account.** A1 only opens the Change-password dialog to
  read the toggles' names.
- **B1** may stop at an error page if the local API has no Google client configured. That is **blocked**, not
  reopened, unless the outgoing URL is missing `client_id`. Record the URL's query either way.
- `U2`–`U5` in this file still say `open`, but the queue says they closed on 2026-09-24. Do not touch them, and
  list them under *Status drift*.

## Also: `F90` — the toggle-group names in Slovak

There is no finding for this. Record the result as described in `RETEST-PROMPT.md` §4, *Batch checks*.
**This is one of only two F90 checks in the retest set** (the other is the weekday picker, in `01`). The
behaviour lives in the framework's `MyBtnToggle` and was driven live. What was never checked is the new SK
label keys.

Switch the account to **SK**, and do it once, at the end of the unit. On `/user/settings` (the page you are
already on), check that every `group "…"` name reads as Slovak and none is a raw key such as
`general.view`. Then **switch back to EN** and confirm the English names are back.
