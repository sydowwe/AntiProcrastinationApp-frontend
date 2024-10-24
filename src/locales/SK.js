const SK = {
    $vuetify: {
        badge: `Odznak`,
        open: `Open`,
        close: `Zavrieť`,
        dataIterator: {
            noResultsText: `Neboli nájdené žiadne záznamy`,
            loadingText: `Načítavam položky...`
        },
        dataTable: {
            itemsPerPageText: `Počet riadkov na stránku:`,
            ariaLabel: {
                sortDescending: `Zoradené zostupne.`,
                sortAscending: `Zoradené vzostupne.`,
                sortNone: `Nezoradené.`,
                activateNone: `Aktivujte na zrušenie triedenia.`,
                activateDescending: `Aktivujte na zoradenie zostupne.`,
                activateAscending: `Aktivujte na zoradenie vzostupne.`
            },
            sortBy: `Zoradiť podľa`
        },
        dataFooter: {
            itemsPerPageText: `Počet položiek na stránku:`,
            itemsPerPageAll: `Všetko`,
            nextPage: `Ďalšia stránka`,
            prevPage: `Predchádzajúca stránka`,
            firstPage: `Prvá stránka`,
            lastPage: `Posledná stránka`,
            pageText: `{0}–{1} z {2}`
        },
        dateRangeInput: {
            divider: `to`
        },
        datePicker: {
            ok: `OK`,
            cancel: `Cancel`,
            range: {
                title: `Select dates`,
                header: `Enter dates`
            },
            title: `Select date`,
            header: `Enter date`,
            input: {
                placeholder: `Enter date`
            }
        },
        noDataText: `Nie sú dostupné žiadne dáta`,
        carousel: {
            prev: `Predchádzajúci obrázok`,
            next: `Další obrázok`,
            ariaLabel: {
                delimiter: `Snímka {0} z {1}`
            }
        },
        calendar: {
            moreEvents: `{0} ďalších`
        },
        input: {
            clear: `Clear {0}`,
            prependAction: `{0} prepended action`,
            appendAction: `{0} appended action`,
            otp: `Please enter OTP character {0}`
        },
        fileInput: {
            counter: `{0} súborov`,
            counterSize: `{0} súborov ({1} celkom)`
        },
        timePicker: {
            am: `AM`,
            pm: `PM`
        },
        pagination: {
            ariaLabel: {
                root: `Navigácia stránkovania`,
                next: `Ďalšia stránka`,
                previous: `Predchádzajúca stránka`,
                page: `Ísť na stránku {0}`,
                currentPage: `Aktuálna stránka, stránka {0}`,
                first: `First page`,
                last: `Last page`
            }
        },
        stepper: {
            next: `Next`,
            prev: `Previous`
        },
        rating: {
            ariaLabel: {
                item: `Hodnotenie {0} z {1}`
            }
        },
        loading: `Loading...`,
        infiniteScroll: {
            loadMore: `Load more`,
            empty: `No more`
        }
    },
    navigation:{
        home: `Domov`,
        toDoList: `To-do list`,
        routineToDoList: `Rutina`,
        createNewActivity: `Vytvoriť nový druh aktivity`,
        history: `História`,
        addActivityToHistory: `Pridať aktivitu do histórie`,
        addActivityManually: `Manuálne`,
        pomodoroTimer: `Pomodoro časovač`,
        stopwatch: `Stopky`,
        timer: `Časovač`,
        alarm: `Alarm`,
        taskPlanner: `Plánovač aktivít`,
    },
    general: {
        or: `Alebo`,
        please: `Prosím`,
        close: `Zavrieť`,
        create: `Vytvoriť`,
        filter: `Filtrovať`,
        send: `Odoslať`,
        save: `Uložiť`,
        cancel: `Zrušiť`,
        edit: `Upraviť`,
        add: `Pridať`,
        iAgreeTo: 'Súhlasím s',
        name: `Názov`,
        text: `Text`,
        continue: `Pokračovať`,
        done: `Hotovo`,
        error: `Chyba`,
        select: `Vybrať`,
        unselect: `Zrušiť výber`,
        delete: `Vymazať`,
        clear: `Vynulovať`,
        task: `Úloha`,
        hide: `Skryť`,
        show: `Zobraziť`,
        confirm: `Potvrdiť`,
    },
    dateTime:{
        when: `Kedy`,
        length: `Dĺžka`,
        date: `Dátum`,
        time: `Čas`,
        year: `Rok`,
        month: `Mesiac`,
        day: `Deň`,
        hour: `Hodina`,
        minute: `Minúta`,
        second: `Sekunda`,
        hours: `Hodiny`,
        minutes: `Minúty`,
        seconds: `Sekundy`,
        dateFrom: `Dátum od`,
        dateTo: `Dátum do`,
        howManyHoursBack: `Koľko hodín späť`,
        dateRange: `Rozmedzie dátumov`,
        hoursBack: `Hodín späť`,
        today: `Dnes`,

    },
    controls:{
        start: `Štart`,
        pause: `Pauza`,
        stop: `Stop`,
        reset: `Reset`,
        resetToDefaults: `Reset na pôvodné`,
        presets: `Presets`,
        settings: `Nastavenia`,
        edit: `Upraviť`,
    },
    activities:{
        role: `Roľa`,
        category: `Kategória`,
        activity: `Aktivita`,
        activityDescription: `Popis aktivity`,
        isActivityUnavoidable: `Je aktivita nevyhnutná`,
        placeOnToDoList: `Pridať na to-do list`,
        //===============================
        fromToDoList: `Je z to-do listu`,
        createNewActivity: `Vytvoriť novú aktivity`,
       
        start: `Začať`,
        pause: `Pozastaviť`,
        stop: `Ukončiť`,
        saveActivity: `Uložit aktivitu`,

        //=========
        enableNotificationsInWindows: `V systéme Windows prejdite na Nastavenia > Systém > Oznámenia a akcie > V sekcii Získať oznámenia a akcie od týchto odosielateľov vyberte Google Chrome.`,
    },
    pomodoroTimer: {
        hint:``,
        focusTime:`Čas pre sústredenie`,
        shortRestTime:`Čas pre krátky oddych`,
        longRestTime:`Čas pre dlhý oddych`,
        numberOfCycles:`Počet cyklov`,
        numberOfFocusIntervalsInCycle:`Počet intervalov sústredenia v cykle`,
        focus:`Koncentrácia`,
        shortRest:`Krátky oddych`,
        longRest:`Dlhý oddych`,
    },
    history:{
        addActivityToHistory: `Pridať aktivitu do histórie`,
        lengthNotSet: `Nebola zadaná dĺžka`,
        toHistory: `Do histórie`,
    },
    authorization: {
        logOut: `Odhlásiť sa`,
        logIn: `Prihlásiť sa`,
        wrongEmailOrPassword: `Nesprávny email alebo heslo`,
        emailConfirmationNeeded: `Pred pokračovaním musíte potvrdiť e-mailovú adresu`,

        emailConfirmed: `Váš email bol úspešne potvrdený, môžete pokračovať`,
        errorConfirmingEmail: `Chyba pri potvrdení e-mailu, skúste to prosím znova`,
        resendConfirmationEmail:`Opätovne odoslať potvrdzovací email`,
        confirmationEmailResent:`Potvrdzovací email bol opätovne odoslaný na vašu emailovú adresu. Skontrolujte svoju schránku a kliknite na odkaz v emaile, aby ste potvrdili svoju adresu. Toto okno môžete zavrieť.`,

        userDoesntExist: `Používateľ s emailom: '{email}' neexistuje`,
        wrongPassword: `Nesprávne heslo`,
        login: `Prihlásenie`,
        goToLogin: `Prejsť na prihlásenie`,
        register: `Registrovať sa`,
        registration: `Registrácia`,

        forgotPassword: `Zabudli ste heslo?`,
        enterEmailToResetPassword: `Zadajte svoj email, na ktorý vám bude zaslaný odkaz pre zmenu hesla`,
        resetPassword: `Obnoviť heslo`,
        passwordResetEmailSentInstructions: "Skontrolujte svoju emailovú schránku a postupujte podľa pokynov v emaile. Túto stránku môžete teraz zavrieť",
        passwordResetEmailSent: "Email pre obnovenu hesla bol odoslaný",

        password: `Heslo`,
        email: `Email`,
        // username: `Používateľské meno`, 
        // usernameOrEmail: `@:authorization.username / @:authorization.email`,
        name: `Meno`,
        surname: `Priezvisko`,
        continueWithGoogle: `Pokračujte pomocou Google`,
        dontHaveAccountYet: `Nemáte ešte účet`,

        // usernameOrEmailRequired: 'Používateľské meno alebo email je povinné',
        emailRequired: 'Email je povinný',
        invalidEmail: 'Neplatný formát emailu',
        emailNotFound: 'Užívateľ so zadaným emailom neexistuje',
        // usernameRequired: 'Používateľské meno je povinné',
        // invalidUsername: 'Používateľské meno môže obsahovať len písmená, čísla, podtržník(_), bodku(.) alebo pomlčku(-)',
        passwordRequired: 'Heslo je povinné',
        invalidPasswordLength: 'Heslo musí obsahovať aspoň 8 znakov',
        invalidPassword: 'Heslo musí obsahovať aspoň 2 malé písmená, 2 veľké písmená, 3 číslice a 1 špeciálny znak', 
        nameRequired: 'Meno je povinné',
        invalidName: 'Meno môže obsahovať len písmená alebo medzery',
        surnameRequired: 'Priezvisko je povinné',
        invalidSurname: 'Priezvisko môže obsahovať len písmená alebo medzery',

        stayLoggedIn: 'Zostať prihlásený?',
        termsAndConditions: 'Všeobecnými obchodnými podmienkami',
        termsAndConditionsRequired: `Pred pokračovaním musíte súhlasiť`,
        use2FASetup: 'Prajete si pridať google dvojfaktorové overenie?',
        scan2FAQrCode: `Naskenujte QR kód vo vašej overovacej aplikácii (Google authenicator)`,
        twoFA: `Dvojfaktorové overenie`,
        code: `Kód`,
        code2FA: `Kód z vašej overovacej aplikácie (Google Authenticator)`,
        verifyYour2FA: `Potvrďte svoje dvojfaktorové overenie`,

    },
    toDoList:{
        add: 'Pridať',
        toDoList: 'To-do list',
        urgency: `Naliehavosť`,
        timePeriod: `Časový úsek`,
        saveTask: `Zaznamenať dokončenie úlohy`,
        quickCreateToDoListActivity: `Rýchle vytvorenie aktivity s kategóriou to-do list`,
        quickEditToDoListActivity: `Rýchla úprava aktivity`,
    },
    user: {
        userSettings: `Uživateľské nastavenia`,
        changePassword: `Zmeniť heslo`,
        passwordChange: `Zmena hesla`,

        emailChange: `Zmena emailu`,
        deleteAccount: `Vymazať účet`,
        newPassword: `Nové heslo`,
        confirmNewPassword: `Potvrďte nové heslo`,
        use2FA: `Použiť dvojfaktorové overenie`,
        toContinueEnterPassword: `Pre pokračovanie zadajte heslo`,
        show2FAQrCode: `Zobraziť 2FA QR kód`,
        newScratchCodes: `Vygenerovať nové záložné kódy`,
        passwordChangedSuccessfully: `Heslo bolo úspešne zmenené`,
        identityVerification: `Overenie identity`,
        emailCantBeSame:`Emaily sa nemôžu zhodovať`,
        emailChangedSuccessfully: `Email bol úspešne zmenený`,
        signOutWarning: `Upozornenie: {subject} vás odhlási zo všetkých zariadení z bezpečnostných dôvodov`,
        enablingTwoFactorAuth: `Zapnutie 2FA`,
    },
    planner: {
        task: `Aktivita`,
        quickCreatePlannerActivity: `Rýchle vytvorenie aktivity v plánovači`,
        quickEditPlannerActivity: `Rýchla úprava aktivity`,
    }
}
export default SK;