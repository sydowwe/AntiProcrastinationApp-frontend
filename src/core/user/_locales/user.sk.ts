const user = {
	user: {
		// Preferences
		preferences: `Predvoľby`,
		askBeforeDelete: `Pýtať sa pred vymazaním`,
		firstDayOfWeek: `Prvý deň týždňa`,
		// Export
		exportData: `Exportovať moje dáta`,
		exportDataDescription: `Stiahnuť úplnú zálohu dát účtu vo formáte JSON.`,
		exportSuccess: `Export úspešne stiahnutý`,
		exportFailed: `Export dát zlyhal`,
		// About
		about: `O aplikácii`,
		appVersion: `Verzia aplikácie`,
		termsOfService: `Podmienky používania`,
		privacyPolicy: `Zásady ochrany súkromia`,
		contactSupport: `Kontaktovať podporu`,
		contactSupportSubject: `Žiadosť o podporu (v{version})`,
		contactSupportBody: `Opíšte svoj problém tu:\n\n`,
		// Legal
		//
		// Both documents describe what this repo can actually be shown to do. Every claim below was
		// checked against code: the tracker DTOs (`activityTracking/dto/response/**`), the web
		// extension endpoints (`activityTrackingApi.ts` — `/activity-tracking/web-extension`), the
		// session fields (`SessionsSection.vue`), `axiosConfig.ts` (`withCredentials`, so cookies),
		// and the five `showRecaptchaBadge` routes. **If you change what the app collects, change
		// section 4, 5 or 9 here in the same commit** — a policy that has drifted from the code is
		// worse than no policy.
		//
		// Anything this repo cannot answer is left visibly unfinished and marked `OWNER: confirm`
		// rather than invented. Each marker sits directly above the section it belongs to.
		legal: {
			lastUpdatedLabel: `Posledná aktualizácia`,
			effectiveNotice: `Toto je aktuálne platné znenie.`,
			terms: {
				title: `Podmienky používania`,
				sections: [
					{
						heading: `1. Čo je táto služba`,
						body: `AntiProcrastinationApp je osobná aplikácia na plánovanie dňa, evidenciu aktivít a boj proti prokrastinácii. Službu tvorí webová aplikácia a voliteľné sledovače aktivity — program pre počítač, aplikácia pre Android a rozšírenie do prehliadača — ktoré posielajú údaje do vášho účtu.
Vytvorením účtu a používaním služby súhlasíte s týmito podmienkami. Ak s nimi nesúhlasíte, službu nepoužívajte.`,
					},
					// OWNER: confirm — the operating entity is named nowhere in this repo. A terms page
					// without an identifiable counterparty is not enforceable; fill this in first.
					{
						heading: `2. Kto službu prevádzkuje`,
						body: `Službu prevádzkuje jej vlastník. Obchodné meno, sídlo a identifikačné údaje prevádzkovateľa budú doplnené. Do ich doplnenia nás zastihnete na kontaktnej adrese podpory pod textom tejto stránky.`,
					},
					// OWNER: confirm — 16 is the Slovak GDPR age of digital consent; it differs by country.
					{
						heading: `3. Kto môže službu používať`,
						body: `Účet si môžete vytvoriť, ak máte aspoň 16 rokov a ste spôsobilí uzavrieť túto dohodu. Účet je osobný — patrí jednej osobe a prihlasovacie údaje k nemu nezdieľajte s nikým iným.`,
					},
					{
						heading: `4. Váš účet`,
						body: `Za zabezpečenie účtu zodpovedáte vy: zvoľte si silné heslo, zapnite si dvojfaktorové overenie a udržiavajte svoju e-mailovú adresu aktuálnu. Ak máte podozrenie, že sa do účtu dostal niekto iný, odhláste ostatné zariadenia v Nastaveniach (karta Aktívne sedenia) a zmeňte si heslo.`,
					},
					{
						heading: `5. Ako môžete službu používať`,
						body: `Službu používajte len na osobné a zákonné účely. Nesmiete:
— narúšať jej prevádzku, obchádzať zabezpečenie ani pristupovať k cudzím účtom;
— sledovať pomocou nej zariadenie inej osoby bez jej vedomia a súhlasu;
— hromadne alebo automatizovane sťahovať údaje nad rámec bežného používania.
Sledovače aktivity inštalujte len na zariadenia, ktoré používate vy. Zaznamenávajú citlivý obsah vrátane názvov okien a navštívených stránok — na cudzom zariadení by ste nimi sledovali inú osobu.`,
					},
					{
						heading: `6. Služba je poskytovaná „tak, ako je“`,
						body: `Službu poskytujeme tak, ako je, bez záruky nepretržitej dostupnosti, bezchybnosti alebo trvalého uchovania údajov. Jednotlivé funkcie môžeme meniť alebo zrušiť. Dôležité údaje si preto pravidelne exportujte (Nastavenia → Exportovať moje dáta).`,
					},
					// OWNER: confirm — whether a liability cap is wanted, and that the carve-out below
					// matches the law of the jurisdiction chosen in section 13.
					{
						heading: `7. Obmedzenie zodpovednosti`,
						body: `V rozsahu, ktorý pripúšťa právo, nezodpovedáme za nepriamu škodu, ušlý zisk ani za stratu alebo poškodenie údajov, ktoré vzniknú používaním služby alebo jej nedostupnosťou.
Nič v týchto podmienkach neobmedzuje zodpovednosť, ktorú obmedziť nemožno — najmä za úmyselné konanie a hrubú nedbanlivosť, za ujmu na zdraví a práva, ktoré vám ako spotrebiteľovi dáva zákon.`,
					},
					{
						heading: `8. Vaše údaje a obsah`,
						body: `Obsah, ktorý do aplikácie vložíte — úlohy, plány, záznamy aktivít — je váš. Aby sme vám mohli službu poskytovať, udeľujete nám obmedzené oprávnenie tento obsah ukladať, spracúvať a zobrazovať vám. Na nič iné ho nepoužívame a nepredávame ho.
Kedykoľvek si ho môžete stiahnuť (Nastavenia → Exportovať moje dáta). Ako s údajmi nakladáme, popisujú Zásady ochrany súkromia.`,
					},
					{
						heading: `9. Duševné vlastníctvo služby`,
						body: `Samotná aplikácia — jej kód, dizajn, názov a logo — patrí prevádzkovateľovi. Tieto podmienky vám nedávajú právo aplikáciu kopírovať, upravovať ani ďalej šíriť.`,
					},
					{
						heading: `10. Ukončenie`,
						body: `Účet aj so všetkými údajmi môžete kedykoľvek trvalo zmazať (Nastavenia → Bezpečnosť → Vymazať účet). My môžeme prístup k službe obmedziť alebo ukončiť, ak porušíte tieto podmienky alebo službu zneužívate; ak to okolnosti dovolia, upozorníme vás vopred. Po zmazaní účtu sa s údajmi naloží podľa Zásad ochrany súkromia.`,
					},
					// OWNER: confirm — how a material change gets announced. The app has no in-app notice
					// mechanism today, so nothing here may promise one.
					{
						heading: `11. Zmeny podmienok`,
						body: `Podmienky môžeme aktualizovať. Nové znenie zverejníme na tejto stránke a zmeníme dátum poslednej aktualizácie hore; platí vždy znenie zverejnené na tejto stránke. O podstatnej zmene vás upozorníme — konkrétny spôsob upozornenia bude doplnený.`,
					},
					{
						heading: `12. Ochrana osobných údajov`,
						body: `Aké údaje o vás spracúvame, prečo a komu ich sprístupňujeme, popisujú Zásady ochrany súkromia — odkaz na ne nájdete pod textom tejto stránky. Sú neoddeliteľnou súčasťou týchto podmienok.`,
					},
					// OWNER: confirm — governing law / jurisdiction is decided nowhere in this repo.
					{
						heading: `13. Rozhodné právo a riešenie sporov`,
						body: `Rozhodné právo a súd príslušný na riešenie sporov budú doplnené. Ak ste spotrebiteľ, zostávajú vám zachované práva, ktoré vám dáva právo štátu vášho bydliska.`,
					},
				],
			},
			privacy: {
				title: `Zásady ochrany súkromia`,
				sections: [
					// OWNER: confirm — the controller's identity is mandatory under GDPR art. 13 and is
					// named nowhere in this repo.
					{
						heading: `1. Kto spracúva vaše údaje`,
						body: `Prevádzkovateľom, ktorý o spracúvaní vašich osobných údajov rozhoduje, je vlastník tejto aplikácie. Jeho obchodné meno, sídlo a identifikačné údaje budú doplnené. Napísať mu môžete na kontaktnú adresu podpory pod textom tejto stránky.`,
					},
					{
						heading: `2. Údaje o účte`,
						body: `Pri registrácii ukladáme vašu e-mailovú adresu a heslo v podobe kryptografického odtlačku — samotné heslo nevidíme. Ďalej ukladáme, či máte zapnuté dvojfaktorové overenie, dátum vytvorenia účtu a posledného prihlásenia a vaše predvoľby: jazyk, tému, časové pásmo, prvý deň týždňa a či sa vás máme pýtať pred mazaním.`,
					},
					{
						heading: `3. Obsah, ktorý do aplikácie vložíte`,
						body: `Všetko, čo si do aplikácie zapíšete: aktivity a ich históriu, úlohy a zoznamy úloh, plány dňa a šablóny, voľnočasové položky, pripomienky a poznámky. Spracúvame ich preto, aby sme vám ich vedeli zobrazovať a počítať z nich vaše prehľady.`,
					},
					{
						heading: `4. Sledovanie aktivity na počítači a v telefóne — najcitlivejšie údaje v aplikácii`,
						body: `Ak si nainštalujete a zapnete sledovač aktivity, do vášho účtu sa ukladá:
— na počítači názov procesu, názov programu a NÁZOV OKNA;
— v telefóne názov aplikácie a názov jej balíka.
Názvy okien bežne obsahujú citlivý obsah — mená dokumentov, predmety e-mailov aj adresy webových stránok.
Konkrétny proces, program alebo vzor názvu okna môžete zo sledovania úplne vylúčiť: v nastaveniach sledovania (Nastavenia desktopu, resp. Nastavenia androidu) preň vytvorte mapovanie typu „Ignorované“. Sledovanie je dobrovoľné — ak sledovač nenainštalujete, tieto údaje vôbec nevznikajú.`,
					},
					{
						heading: `5. Sledovanie aktivity v prehliadači`,
						body: `Ak si nainštalujete rozšírenie do prehliadača, do vášho účtu sa ukladajú domény a konkrétne adresy (URL) stránok, ktoré ste mali otvorené, spolu s časom stráveným na nich — zvlášť aktívny čas a čas na pozadí. Je to v podstate história prehliadania viazaná na váš účet, preto ju zvážte rovnako starostlivo ako sledovanie na počítači. Rozšírenie môžete kedykoľvek vypnúť alebo odinštalovať.`,
					},
					{
						heading: `6. Prepojenie s Google Calendar`,
						body: `Ak si prepojíte Google Calendar, získame cez Google OAuth prístup k vášmu kalendáru, aby sme v ňom vedeli zobrazovať a vytvárať udalosti z vášho plánu dňa. Prepojenie môžete kedykoľvek zrušiť v Nastaveniach (karta Bezpečnosť) aj priamo vo svojom účte Google.`,
					},
					{
						heading: `7. Prihlásenia a relácie`,
						body: `Pri každom prihlásení ukladáme IP adresu, typ zariadenia a prehliadač. Slúži to na zabezpečenie účtu: v Nastaveniach (karta Aktívne sedenia) vidíte všetky prihlásenia a ktorékoľvek z nich viete na diaľku odhlásiť.`,
					},
					{
						heading: `8. Push notifikácie`,
						body: `Ak povolíte notifikácie, uložíme technický kľúč (push token) vášho zariadenia — bez neho vám pripomienky nevieme doručiť. Doručuje ich push služba vášho prehliadača alebo systému. Notifikácie viete kedykoľvek vypnúť v nastaveniach prehliadača alebo zariadenia.`,
					},
					{
						heading: `9. Cookies a lokálne úložisko`,
						body: `Prihlásenie držíme v cookies, ktoré sú na fungovanie služby nevyhnutné. V úložisku prehliadača si aplikácia pamätá aj drobnosti pre pohodlie — zvolenú tému a stav niektorých ovládacích prvkov. Reklamné ani analytické cookies nepoužívame. Vlastné cookies môže nastaviť Google reCAPTCHA, pozri nasledujúci bod.`,
					},
					{
						heading: `10. reCAPTCHA`,
						body: `Prihlásenie, registrácia, obnova zabudnutého hesla aj potvrdenie e-mailovej adresy používajú Google reCAPTCHA v3 na ochranu pred automatizovaným zneužitím. Google pri tom spracúva technické údaje o vašom zariadení a o správaní na stránke.`,
					},
					// OWNER: confirm — the mapping below is the honest reading of what the code does, but
					// which basis covers which processing is a decision for the operator, not for the app.
					{
						heading: `11. Právny základ spracúvania`,
						body: `Údaje o účte a obsah, ktorý do aplikácie vložíte, spracúvame preto, aby sme vám mohli poskytovať službu, o ktorú ste požiadali (plnenie zmluvy).
Sledovanie aktivity, prepojenie s kalendárom a push notifikácie spracúvame na základe vášho súhlasu — dávate ho tým, že si funkciu zapnete, a kedykoľvek ho môžete odvolať jej vypnutím. Odvolanie súhlasu nemá vplyv na spracúvanie pred odvolaním.
Údaje o prihláseniach a reCAPTCHA spracúvame pre oprávnený záujem na zabezpečení služby.
Automatizované rozhodovanie s právnym účinkom ani profilovanie na reklamné účely nevykonávame.`,
					},
					// OWNER: confirm — only Google is determinable from this repo. The hosting and e-mail
					// providers are not, and both are processors that must be named.
					{
						heading: `12. Komu údaje sprístupňujeme`,
						body: `Údaje nepredávame. Prístup k nim má prevádzkovateľ a služby, bez ktorých aplikácia nefunguje: Google (prepojenie s kalendárom, reCAPTCHA) a push služba vášho prehliadača. Úplný zoznam ďalších spracovateľov — najmä poskytovateľa hostingu a odosielania e-mailov — bude doplnený.`,
					},
					// OWNER: confirm — the safeguards for the Google transfer (adequacy decision, SCCs).
					{
						heading: `13. Prenos mimo Európskeho hospodárskeho priestoru`,
						body: `Google spracúva časť údajov aj mimo Európskeho hospodárskeho priestoru, najmä v USA. Záruky, na základe ktorých sa takýto prenos uskutočňuje, budú doplnené.`,
					},
					// OWNER: confirm — no retention period exists anywhere in this codebase. Activity
					// tracking records are the ones that matter: they accumulate indefinitely today.
					{
						heading: `14. Ako dlho údaje uchovávame`,
						body: `Údaje uchovávame, kým ich nezmažete vy alebo kým nezmažete účet. Zmazanie účtu je trvalé. Konkrétne doby uchovávania jednotlivých druhov údajov — najmä záznamov zo sledovania aktivity a záznamov o prihláseniach — budú doplnené.`,
					},
					// OWNER: confirm — hosting location / data residency is not determinable from this repo.
					{
						heading: `15. Kde sú údaje uložené`,
						body: `Poskytovateľ a krajina, v ktorej sú údaje uložené, budú doplnené.`,
					},
					{
						heading: `16. Ako údaje chránime`,
						body: `Komunikácia s aplikáciou prebieha šifrovane (HTTPS), heslá ukladáme len ako kryptografický odtlačok, k účtu si viete zapnúť dvojfaktorové overenie a podozrivé prihlásenia viete kedykoľvek odhlásiť. Žiadne opatrenie však nedokáže zaručiť absolútnu bezpečnosť.`,
					},
					// OWNER: confirm — the supervisory authority named below is the Slovak one; it depends
					// on where the operator is established and where you live.
					{
						heading: `17. Vaše práva`,
						body: `Máte právo na prístup k svojim údajom, na ich opravu a vymazanie, na obmedzenie spracúvania, namietať proti spracúvaniu, na prenosnosť údajov a odvolať udelený súhlas.
Dve z nich uplatníte priamo v aplikácii: úplnú kópiu údajov si stiahnete v Nastaveniach → Exportovať moje dáta a účet aj so všetkými údajmi trvalo zmažete v Nastaveniach → Bezpečnosť → Vymazať účet. So zvyškom sa obráťte na kontakt pod textom tejto stránky.
Ak si myslíte, že s vašimi údajmi nakladáme nesprávne, môžete podať sťažnosť dozornému orgánu — na Slovensku je ním Úrad na ochranu osobných údajov Slovenskej republiky.`,
					},
					{
						heading: `18. Deti`,
						body: `Aplikácia nie je určená deťom mladším ako 16 rokov a vedome od nich údaje nezbierame.`,
					},
					{
						heading: `19. Zmeny týchto zásad a kontakt`,
						body: `Zásady môžeme aktualizovať. Nové znenie zverejníme na tejto stránke a zmeníme dátum poslednej aktualizácie hore; o podstatnej zmene vás upozorníme. Otázky k ochrane súkromia posielajte na kontaktnú adresu podpory pod textom tejto stránky.`,
					},
				],
			},
		},
	},
}
export default user
