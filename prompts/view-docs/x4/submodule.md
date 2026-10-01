# X4 — framework units (16–19), one session

Run as **Sonnet 5, high effort, clean context.** Run once units 16–19 have finished their inventory passes (it
appends to their docs), and after `00-shell`. Twelve views in one session is fine, because this pass is lighter
than an inventory. If it runs long, split it after the reminders views, the same way as the planner group.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `framework` → playwright-cli sessions `-s=x4-fw` (primaryUser) and `-s=x4-fw-admin`
  (adminUser)
- Views, in this order:
    reminders-user     MyRemindersView               /pripomienky/moje            primaryUser
    notifications      NotificationsView             /notifikacie                 primaryUser
    notifications      ReminderPreferencesView       /nastavenia/pripomienky      primaryUser
    scheduler          SchedulerJobsView             /planovac/ulohy              primaryUser
    scheduler          SchedulerJobDetailView        /planovac/ulohy/<id>         primaryUser
    scheduler          SchedulerRunDetailView        /planovac/behy/<id>          primaryUser
    scheduler          SchedulerNeedsAttentionView   /planovac/pozornost          primaryUser
    reminders-admin    ReminderDefinitionsView       /pripomienky/register        adminUser
    reminders-admin    ReminderDefinitionDetailView  /pripomienky/register/<id>   adminUser
    reminders-admin    ReminderUpcomingView          /pripomienky/nadchadzajuce   adminUser
    reminders-admin    ReminderDispatchHistoryView   /pripomienky/historia        adminUser
    reminders-admin    ReminderOverviewView          /pripomienky/prehlad         adminUser
  Take ids from each unit's inventory.md (they name the seeded ids and which id space each route
  takes). /pripomienky/register/:id takes a reminderDefinitions id (23201–23205, 23301), NOT a
  portal id.
- EVERY finding in this group is [framework]. They live in src/_common/modules/.
- Accounts: the reminders-admin routes answer 403 for primaryUser, deliberately. Do the
  primaryUser views first in `-s=x4-fw`, then sign the adminUser in, in `-s=x4-fw-admin`.
  adminUser's credentials are in e2e/.state/seed.json. Use a state file only if one exists for
  adminUser and no other session holds it. Otherwise use the form, and mind the 5-per-minute
  /auth/login limit.

Group-specific traps:
- Read-only, strictly. Don't dispatch, replay, pause, cancel or bulk-act on a reminder or
  scheduler job. Those send real notifications or change schedules. Don't mark notifications
  read. Opening a dialog and cancelling is fine.
- The admin and scheduler views are server tables with filters in the URL. The question at
  390 px is whether the filter bar and the row actions are reachable, not whether the table
  scrolls sideways (it may, by design).
- ReminderOverviewView and the scheduler views may have charts (echarts on <canvas>). Judge them
  from the read-back screenshot.
- The notification list is the view most likely to be used on a phone, since it's where a push
  notification lands. Check that a notification's text is readable in full and that tapping it
  (reading only: check the link's href, don't follow it if that marks it read) goes somewhere.

Do only this group.
```
