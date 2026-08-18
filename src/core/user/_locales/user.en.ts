const user = {
	user: {
		// Preferences
		preferences: `Preferences`,
		askBeforeDelete: `Ask before deleting items`,
		firstDayOfWeek: `First day of week`,
		// Export
		exportData: `Export my data`,
		exportDataDescription: `Download a full JSON backup of your account data.`,
		exportSuccess: `Export downloaded successfully`,
		exportFailed: `Failed to export data`,
		// About
		about: `About`,
		appVersion: `App version`,
		termsOfService: `Terms of Service`,
		privacyPolicy: `Privacy Policy`,
		contactSupport: `Contact support`,
		contactSupportSubject: `Support request (v{version})`,
		contactSupportBody: `Describe your issue here:\n\n`,
		// Legal — the English mirror of `user.sk.ts`. SK is primary: change it there first, then here,
		// and keep the section count and numbering identical so a reader switching language lands on
		// the same clause. The `OWNER: confirm` markers are the same gaps, repeated so neither file
		// can be read as complete on its own.
		legal: {
			lastUpdatedLabel: `Last updated`,
			effectiveNotice: `This is the version currently in effect.`,
			terms: {
				title: `Terms of Service`,
				sections: [
					{
						heading: `1. What this service is`,
						body: `AntiProcrastinationApp is a personal app for day planning, activity logging and fighting procrastination. The service consists of the web app and the optional activity trackers — a desktop program, an Android app and a browser extension — which send data to your account.
By creating an account and using the service, you agree to these terms. If you do not agree to them, do not use the service.`,
					},
					// OWNER: confirm — the operating entity is named nowhere in this repo. A terms page
					// without an identifiable counterparty is not enforceable; fill this in first.
					{
						heading: `2. Who operates the service`,
						body: `The service is operated by its owner. The operator's legal name, registered address and company details will be added. Until they are, you can reach us at the support address below this page.`,
					},
					// OWNER: confirm — 16 is the Slovak GDPR age of digital consent; it differs by country.
					{
						heading: `3. Who may use it`,
						body: `You may create an account if you are at least 16 years old and able to enter into this agreement. An account is personal — it belongs to one person, and you should not share its credentials with anyone.`,
					},
					{
						heading: `4. Your account`,
						body: `Keeping your account secure is your responsibility: choose a strong password, turn on two-factor authentication and keep your e-mail address current. If you suspect someone else has got into your account, sign the other devices out in Settings (the Active sessions card) and change your password.`,
					},
					{
						heading: `5. How you may use the service`,
						body: `Use the service only for personal, lawful purposes. You must not:
— disrupt its operation, circumvent its security or access anyone else's account;
— use it to monitor another person's device without their knowledge and consent;
— bulk-download or scrape data beyond ordinary use.
Install the activity trackers only on devices you use yourself. They record sensitive content, including window titles and the pages you visit — on someone else's device you would be surveilling that person.`,
					},
					{
						heading: `6. The service is provided "as is"`,
						body: `The service is provided as is, with no guarantee of continuous availability, of being free of defects, or of durable data storage. We may change or discontinue individual features. Export your important data regularly (Settings → Export my data).`,
					},
					// OWNER: confirm — whether a liability cap is wanted, and that the carve-out below
					// matches the law of the jurisdiction chosen in section 13.
					{
						heading: `7. Limitation of liability`,
						body: `To the extent the law allows, we are not liable for indirect damage, lost profit, or loss of or damage to data arising from your use of the service or from its unavailability.
Nothing in these terms limits liability that cannot be limited — in particular for intent and gross negligence, for personal injury, and your statutory rights as a consumer.`,
					},
					{
						heading: `8. Your data and content`,
						body: `The content you put into the app — tasks, plans, activity records — is yours. So that we can provide the service, you grant us a limited permission to store, process and display that content back to you. We use it for nothing else and we do not sell it.
You can download it at any time (Settings → Export my data). How we handle your data is described in the Privacy Policy.`,
					},
					{
						heading: `9. Intellectual property in the service`,
						body: `The app itself — its code, design, name and logo — belongs to the operator. These terms do not give you the right to copy, modify or redistribute it.`,
					},
					{
						heading: `10. Termination`,
						body: `You can permanently delete your account together with all its data at any time (Settings → Security → Delete account). We may restrict or terminate access if you breach these terms or abuse the service; where circumstances allow, we will warn you first. After account deletion your data is handled as described in the Privacy Policy.`,
					},
					// OWNER: confirm — how a material change gets announced. The app has no in-app notice
					// mechanism today, so nothing here may promise one.
					{
						heading: `11. Changes to these terms`,
						body: `We may update these terms. The new version is published on this page and the "last updated" date at the top changes with it; the version on this page is the one in effect. We will let you know about a material change — the exact way we will do so will be added.`,
					},
					{
						heading: `12. Privacy`,
						body: `What data we process about you, why, and who we share it with is described in the Privacy Policy — linked below this page. It forms part of these terms.`,
					},
					// OWNER: confirm — governing law / jurisdiction is decided nowhere in this repo.
					{
						heading: `13. Governing law and disputes`,
						body: `The governing law and the courts competent to hear disputes will be added. If you are a consumer, you keep the rights the law of your country of residence gives you.`,
					},
				],
			},
			privacy: {
				title: `Privacy Policy`,
				sections: [
					// OWNER: confirm — the controller's identity is mandatory under GDPR art. 13 and is
					// named nowhere in this repo.
					{
						heading: `1. Who processes your data`,
						body: `The controller deciding how your personal data is processed is the owner of this app. Their legal name, registered address and company details will be added. You can write to them at the support address below this page.`,
					},
					{
						heading: `2. Account data`,
						body: `When you register we store your e-mail address and your password as a cryptographic hash — we never see the password itself. We also store whether two-factor authentication is on, the dates your account was created and last signed in to, and your preferences: language, theme, time zone, first day of the week, and whether we should ask before deleting things.`,
					},
					{
						heading: `3. The content you put into the app`,
						body: `Everything you record in the app: activities and their history, tasks and to-do lists, day plans and templates, leisure items, reminders and notes. We process it so we can show it back to you and calculate your overviews from it.`,
					},
					{
						heading: `4. Activity tracking on desktop and mobile — the most sensitive data in this app`,
						body: `If you install and enable an activity tracker, your account receives:
— on desktop: the process name, the product name and the WINDOW TITLE;
— on mobile: the app name and its package name.
Window titles routinely contain sensitive content — document names, e-mail subjects and web addresses.
You can exclude a specific process, product or window-title pattern from tracking entirely: create an "Ignored" mapping for it in the tracking settings (Desktop settings, or Android settings). Tracking is optional — if you do not install a tracker, this data never exists.`,
					},
					{
						heading: `5. Activity tracking in the browser`,
						body: `If you install the browser extension, your account receives the domains and the specific addresses (URLs) of the pages you had open, together with the time spent on them — active time and background time separately. This is effectively your browsing history tied to your account, so consider it as carefully as desktop tracking. You can disable or uninstall the extension at any time.`,
					},
					{
						heading: `6. Google Calendar connection`,
						body: `If you connect Google Calendar, we get access to your calendar through Google OAuth so we can show events and create them from your day plan. You can disconnect at any time in Settings (the Security card) and also directly in your Google account.`,
					},
					{
						heading: `7. Sign-ins and sessions`,
						body: `On every sign-in we store the IP address, device type and browser. This is for account security: Settings (the Active sessions card) shows every sign-in and lets you sign any of them out remotely.`,
					},
					{
						heading: `8. Push notifications`,
						body: `If you allow notifications, we store your device's technical push token — without it we cannot deliver reminders. Delivery goes through your browser's or system's push service. You can switch notifications off at any time in your browser or device settings.`,
					},
					{
						heading: `9. Cookies and local storage`,
						body: `Your sign-in is held in cookies that are strictly necessary for the service to work. The app also keeps small conveniences in your browser's storage — your chosen theme and the state of some controls. We use no advertising or analytics cookies. Google reCAPTCHA may set cookies of its own; see the next section.`,
					},
					{
						heading: `10. reCAPTCHA`,
						body: `Sign-in, registration, forgotten-password recovery and e-mail confirmation use Google reCAPTCHA v3 to guard against automated abuse. Google processes technical data about your device and your behaviour on the page in order to do so.`,
					},
					// OWNER: confirm — the mapping below is the honest reading of what the code does, but
					// which basis covers which processing is a decision for the operator, not for the app.
					{
						heading: `11. Legal basis for processing`,
						body: `We process your account data and the content you put into the app in order to provide the service you asked for (performance of a contract).
We process activity tracking, the calendar connection and push notifications on the basis of your consent — you give it by switching the feature on, and you can withdraw it at any time by switching it off. Withdrawing consent does not affect processing carried out before the withdrawal.
We process sign-in records and reCAPTCHA for our legitimate interest in keeping the service secure.
We carry out no automated decision-making with legal effect and no profiling for advertising.`,
					},
					// OWNER: confirm — only Google is determinable from this repo. The hosting and e-mail
					// providers are not, and both are processors that must be named.
					{
						heading: `12. Who we share your data with`,
						body: `We do not sell your data. It is accessible to the operator and to the services the app cannot run without: Google (calendar connection, reCAPTCHA) and your browser's push service. A full list of any other processors — in particular the hosting and e-mail providers — will be added.`,
					},
					// OWNER: confirm — the safeguards for the Google transfer (adequacy decision, SCCs).
					{
						heading: `13. Transfers outside the European Economic Area`,
						body: `Google processes some data outside the European Economic Area, in particular in the United States. The safeguards such a transfer relies on will be added.`,
					},
					// OWNER: confirm — no retention period exists anywhere in this codebase. Activity
					// tracking records are the ones that matter: they accumulate indefinitely today.
					{
						heading: `14. How long we keep data`,
						body: `We keep your data until you delete it or delete your account. Account deletion is permanent. Concrete retention periods for each kind of data — in particular activity tracking records and sign-in records — will be added.`,
					},
					// OWNER: confirm — hosting location / data residency is not determinable from this repo.
					{
						heading: `15. Where data is stored`,
						body: `The provider and the country your data is stored in will be added.`,
					},
					{
						heading: `16. How we protect your data`,
						body: `Traffic to the app is encrypted (HTTPS), passwords are stored only as a cryptographic hash, you can turn on two-factor authentication, and you can sign out any suspicious session at any time. No measure can guarantee absolute security.`,
					},
					// OWNER: confirm — the supervisory authority named below is the Slovak one; it depends
					// on where the operator is established and where you live.
					{
						heading: `17. Your rights`,
						body: `You have the right to access your data, to have it corrected or erased, to restrict processing, to object to processing, to data portability, and to withdraw a consent you gave.
Two of these you can exercise directly in the app: download a full copy in Settings → Export my data, and permanently delete your account with all its data in Settings → Security → Delete account. For the rest, use the contact below this page.
If you believe we are handling your data incorrectly, you can complain to a supervisory authority — in Slovakia this is the Office for Personal Data Protection of the Slovak Republic.`,
					},
					{
						heading: `18. Children`,
						body: `The app is not intended for children under 16 and we do not knowingly collect data from them.`,
					},
					{
						heading: `19. Changes to this policy, and contact`,
						body: `We may update this policy. The new version is published on this page and the "last updated" date at the top changes with it; we will let you know about a material change. Send privacy questions to the support address below this page.`,
					},
				],
			},
		},
	},
}
export default user
