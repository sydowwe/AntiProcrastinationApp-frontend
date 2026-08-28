# N4 · The bell has one state; give it the four it needs

- **Scope:** `src/_common/modules/notifications/component/NotificationBell.vue`
- **Backend:** —
- **Model / effort:** Sonnet 5, medium
- **Depends on:** N1 (adds the `error` ref), N2 (adds `onreconnecting` / meaningful `isConnected`)
- **Unblocks:** —

---

```
IMPORTANT — read this before you start. CLAUDE.md says src/_common is a git submodule that must
never be edited. The repo owner has explicitly authorised editing it for this task. Edit
src/_common/modules/notifications/component/NotificationBell.vue in place. At the end, list the
files under src/_common you touched.

NotificationBell renders exactly two things: a list, or "Žiadne notifikácie" (line 73-77). The
composable already exports `isLoading` (useNotifications.ts:11) and `isConnected` (line 10) and the
component reads neither — NotificationBell.vue:104 destructures only notifications, unreadCount,
connect, disconnect, markRead, markAllRead. So:

- while the first load is in flight, the dropdown says the inbox is empty
- when the load fails, the dropdown says the inbox is empty
- when the hub is down, the dropdown looks completely normal and just never updates

Give it four distinguishable states: loading, error, disconnected-but-showing-cached, and normal.

1. Loading. Read isLoading. On the FIRST load show a skeleton or a VProgressLinear inside the menu
   card. On a refresh (reconnect, or the reload N2 added) do NOT tear the list down to a spinner —
   the list is still valid, so show a thin indeterminate bar above it and leave the items in place.
   Distinguish the two: `notifications.length === 0 && isLoading` is a first load.

2. Error. Read the `error` ref N1 added. Replace the empty state with an error row: the message, and
   a retry button calling loadNotifications(). If N1 has not landed and there is no error ref, add
   one to the composable yourself following N1's item 1 — do not fake it in the component.

3. Disconnected. When isConnected is false but there are notifications, the list is stale, not
   wrong. Show that: a small "reconnecting" line in the card header (not a full-card takeover), and
   nothing at all when connected. Do NOT show this on the login page or before the first connect
   attempt — after N2 the bell is not rendered signed out, but check the ordering anyway, because a
   bell that says "reconnecting" during its own initial handshake is worse than one that says
   nothing.

4. Accessibility, which is currently absent:
   - The VIconBtn has a :title (line 19) but the unread count in the VBadge is not announced. Give
     the activator an aria-label that includes the count, and keep it in sync with unreadCount.
   - The menu is a list of navigation targets rendered as VListItem with @click (line 54). Make sure
     each is keyboard-reachable and activates on Enter/Space. Vuetify gives VListItem the right role
     when it is interactive — verify it actually does here rather than assuming, and check the vuetify
     MCP for the current VList/VListItem API before adding roles by hand.
   - New notifications arriving while the menu is open change the list with no announcement. Add an
     aria-live="polite" region for the arrival. Keep it terse — one message, not the whole list.
   - The unread marker is colour-only (`bg-primary-container`, line 52). Add a non-colour cue: a dot,
     a bold weight difference beyond the existing font-weight-medium, or an sr-only "unread".

Styling: use Vuetify props and utility classes, per CLAUDE.md's styling priority. This card is
already 100% Vuetify — do not introduce a <style> block. Check the vuetify MCP for VSkeletonLoader's
API if you use it.

Do not: add paging or a "see all" link (N3/N6), change what a click does (N5), or touch the snackbar
behaviour (N7).

--- Verification ---

npm run type-check — baseline 72, all app-side in src/core; any src/_common error is a regression.
npm run lint — 0 errors.

Behavioural, all four states forced:
- throttle the network to slow-3G and reload: skeleton, then list — never a flash of "empty"
- stop the backend and reload: error row with a working retry
- stop only the hub (or block the /hubs/ request): list still renders, header shows reconnecting
- keyboard only: Tab to the bell, Enter to open, arrow/Tab through items, Enter to follow one
- a screen reader announces the unread count on the bell and announces an arriving notification once
```
