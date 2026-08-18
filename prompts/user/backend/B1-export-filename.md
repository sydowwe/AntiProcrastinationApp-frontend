# B1 · Backend ask — `Content-Disposition` on the data export

**Contract only.** No storage, entity, or endpoint-implementation decisions implied below.

## The problem

`GET /user/data-export` (called from `useUserApi().exportData()`,
`src/_common/modules/user/api/userApi.ts:19-22`) returns a bare `Blob` with `responseType: 'blob'`.
Whether the server sends a `Content-Disposition` header on this response cannot be determined from
this repo — the .NET solution is not checked out here — and the frontend api function currently
discards response headers entirely, so even if the server does send one it never reaches the caller.
`src/core/user/component/settings/DataExportSection.vue` therefore always names the downloaded file
`antiprocrastination-export-<YYYY-MM-DD>.json` (today's date in the user's zone), regardless of what
the server would have suggested.

## The business rules

- Does `/user/data-export` set `Content-Disposition: attachment; filename=...` (or the RFC 5987
  `filename*=UTF-8''...` form) today? If not, should it?
- Is there a server-side notion of "the" export filename — e.g. one that encodes the export's
  generation timestamp in the account's stored timezone, or a request id — that would be more useful
  than a client-guessed date?
- What does the export actually contain (all user data? a subset?) — this also matters for the
  account-deletion warning copy (`A2`) and the privacy-policy copy (`U5`), so an answer here is reused
  there.

## The shape the frontend needs

If the endpoint sets a `Content-Disposition` header, no new field is needed — the frontend just needs
the header to survive the round trip. Concretely: `useUserApi().exportData()` would need to return
`{ blob, fileName }` instead of a bare `Blob`, reading the header the way
`_common/modules/reminders/api/ReminderDashboardApi.ts` already does for its own export, and using
`filenameFromContentDisposition()` from `_common/utils/fileDownload.ts`. This is a framework change
(`_common/modules/user/api/userApi.ts` is not app code), so it should be raised as a framework ask
once the contract question above is answered — not implemented against a guess.

## What changes on the frontend once this lands

`DataExportSection.vue`'s hardcoded `antiprocrastination-export-${isoDateInUserZone()}.json` becomes
a fallback only, passed as the second argument to `filenameFromContentDisposition()` /
`downloadBlob()`, matching the pattern already used elsewhere in the framework.
