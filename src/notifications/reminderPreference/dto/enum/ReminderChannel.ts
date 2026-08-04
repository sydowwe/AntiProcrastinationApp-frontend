// Advisory preferred-channel hint for a reminder kind. Soft preference only — channel routing
// stays with the notifications/channel settings, so this is never guaranteed to be honoured.
export enum ReminderChannel {
	InApp = 'InApp',
	WebPush = 'WebPush',
}

export const AllReminderChannelList = [ReminderChannel.InApp, ReminderChannel.WebPush]
