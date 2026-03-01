const SK = {
    $vuetify: {
        badge: 'Odznak',
        open: 'Otvoriť',
        close: 'Zavrieť',
        dismiss: 'Zrušiť',
        confirmEdit: {
            ok: 'OK',
            cancel: 'Zrušiť'
        },
        dataIterator: {
            noResultsText: 'Neboli nájdené žiadne záznamy',
            loadingText: 'Načítavam položky...'
        },
        dataTable: {
            itemsPerPageText: 'Počet riadkov na stránku:',
            ariaLabel: {
                sortDescending: 'Zoradené zostupne.',
                sortAscending: 'Zoradené vzostupne.',
                sortNone: 'Nezoradené.',
                activateNone: 'Aktivujte na zrušenie zoradenia.',
                activateDescending: 'Aktivujte na zoradenie zostupne.',
                activateAscending: 'Aktivujte na zoradenie vzostupne.'
            },
            sortBy: 'Zoradiť podľa'
        },
        dataFooter: {
            itemsPerPageText: 'Počet položiek na stránku:',
            itemsPerPageAll: 'Všetko',
            nextPage: 'Ďalšia stránka',
            prevPage: 'Predchádzajúca stránka',
            firstPage: 'Prvá stránka',
            lastPage: 'Posledná stránka',
            pageText: '{0}–{1} z {2}'
        },
        dateRangeInput: {
            divider: 'až'
        },
        datePicker: {
            itemsSelected: '{0} vybraných',
            range: {
                title: 'Vyberte rozsah dátumov',
                header: 'Zadajte rozsah dátumov'
            },
            title: 'Vyberte dátum',
            header: 'Zadajte dátum',
            input: {
                placeholder: 'Zadajte dátum'
            },
            ariaLabel: {
                previousMonth: 'Predchádzajúci mesiac',
                nextMonth: 'Ďalší mesiac',
                selectYear: 'Vyberte rok',
                previousYear: 'Predchádzajúci rok',
                nextYear: 'Nasledujúci rok',
                selectMonth: 'Vyberte mesiac',
                selectDate: '{0}',
                currentDate: 'Dnes, {0}'
            }
        },
        noDataText: 'Nie sú dostupné žiadne dáta',
        carousel: {
            prev: 'Predchádzajúci obrázok',
            next: 'Další obrázok',
            ariaLabel: {
                delimiter: 'Snímka {0} z {1}'
            }
        },
        calendar: {
            moreEvents: '{0} ďalších',
            today: 'Dnes'
        },
        input: {
            clear: 'Vymazať {0}',
            prependAction: 'Akcia pred {0}',
            appendAction: 'Akcia za {0}',
            otp: 'Prosím zadajte OTP znak {0}'
        },
        fileInput: {
            counter: '{0} súborov',
            counterSize: '{0} súborov ({1} celkom)'
        },
        fileUpload: {
            title: 'Sem presuňte súbory',
            divider: 'alebo',
            browse: 'Prehliadať súbory'
        },
        timePicker: {
            am: 'AM',
            pm: 'PM',
            title: 'Vyberte čas',
            hour: 'Hodina',
            minute: 'Minúty',
            second: 'Sekundy'
        },
        pagination: {
            ariaLabel: {
                root: 'Navigácia stránkovania',
                next: 'Ďalšia stránka',
                previous: 'Predchádzajúca stránka',
                page: 'Ísť na stránku {0}',
                currentPage: 'Aktuálna stránka, stránka {0}',
                first: 'Prvá stránka',
                last: 'Posledná stránka'
            }
        },
        stepper: {
            next: 'Ďalší',
            prev: 'Predchádzajúci'
        },
        rating: {
            ariaLabel: {
                item: 'Hodnotenie {0} z {1}'
            }
        },
        loading: 'Načítavam...',
        infiniteScroll: {
            loadMore: 'Načítať viac',
            empty: 'Žiadne ďalšie'
        },
        rules: {
            required: 'Toto pole je povinné',
            email: 'Zadajte platnú e-mailovú adresu',
            number: 'Toto pole môže obsahovať iba čísla',
            integer: 'Toto pole môže obsahovať iba celé čísla',
            capital: 'Toto pole môže obsahovať iba veľké písmená',
            maxLength: 'Musíte zadať maximálne {0} znakov',
            minLength: 'Musíte zadať minimálne {0} znakov',
            strictLength: 'Dĺžka zadaného poľa je neplatná',
            exclude: 'Znak {0} nie je povolený',
            notEmpty: 'Vyberte aspoň jednu hodnotu',
            pattern: 'Neplatný formát'
        },
        hotkey: {
            then: 'potom',
            ctrl: 'Ctrl',
            command: 'Command',
            shift: 'Shift',
            alt: 'Alt',
            option: 'Option',
            enter: 'Enter',
            escape: 'Escape',
            upArrow: 'Šípka hore',
            downArrow: 'Šípka dole',
            leftArrow: 'Šípka vľavo',
            rightArrow: 'Šípka vpravo',
            backspace: 'Backspace',
            space: 'Medzera',
            plus: 'plus',
            shortcut: 'Klávesová skratka: {0}',
            or: 'alebo'
        },
        video: {
            play: 'Prehrať',
            pause: 'Pozastaviť',
            seek: 'Vyhľadať',
            volume: 'Hlasitosť',
            showVolume: 'Zobraziť ovládanie hlasitosti',
            mute: 'Stlmiť',
            unmute: 'Zrušiť stlmenie',
            enterFullscreen: 'Celá obrazovka',
            exitFullscreen: 'Opustiť celú obrazovku'
        },
        colorPicker: {
            ariaLabel: {
                eyedropper: 'Vybrať farbu z obrazovky',
                hueSlider: 'Odtieň',
                alphaSlider: 'Alfa',
                redInput: 'Červená',
                greenInput: 'Zelená',
                blueInput: 'Modrá',
                alphaInput: 'Alfa',
                hueInput: 'Odtieň',
                saturationInput: 'Sýtosť',
                lightnessInput: 'Svetlosť',
                hexInput: 'HEX hodnota',
                hexaInput: 'HEX s alfa hodnotou',
                changeFormat: 'Zmeniť formát farby'
            }
        }
    },
    navigation: {
        home: `Domov`,
        toDoList: `To-do list`,
        routineToDoList: `Rutina`,
        createNewActivity: `Vytvoriť nový druh aktivity`,
        history: `História`,
        historySummary: `Súhrn`,
        historyCalendar: `Kalendár`,
        activityTracking: `Sledovanie aktivity`,
        recordActivity: `Zaznamenať aktivitu`,
        recordActivityManually: `Manuálne`,
        pomodoroTimer: `Pomodoro časovač`,
        stopwatch: `Stopky`,
        timer: `Časovač`,
        alarm: `Alarm`,
        taskPlanner: `Plánovač`,
        dayPlanner: `Plánovač dňa`,
        templateDayPlanner: `Plánovač dňa - template`
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
        new: `Nový`,
        update: `Aktualizovať`,
        optional: `Voliteľné`,
        search: `Hľadať`,
        uncategorized: `Bez kategórie`,
        all: `Všetky`,
    },
    dateTime: {
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
    alarm: {
        isActive: `Aktívny`,
    },
    controls: {
        start: `Štart`,
        pause: `Pauza`,
        stop: `Stop`,
        reset: `Reset`,
        resetToDefaults: `Reset na pôvodné`,
        presets: `Presets`,
        settings: `Nastavenia`,
        edit: `Upraviť`,
    },
    activities: {
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
        hint: ``,
        focusTime: `Čas pre sústredenie`,
        shortRestTime: `Čas pre krátky oddych`,
        longRestTime: `Čas pre dlhý oddych`,
        numberOfCycles: `Počet cyklov`,
        numberOfFocusIntervalsInCycle: `Počet intervalov sústredenia v cykle`,
        focus: `Koncentrácia`,
        shortRest: `Krátky oddych`,
        longRest: `Dlhý oddych`,
        settings: `Nastavenia`,
        presets: `Predvoľby`,
        autoStartBreaks: `Automaticky spustiť prestávky`,
        autoStartFocus: `Automaticky spustiť sústredenie`,
        soundEnabled: `Zvukové upozornenia povolené`,
        focusActivity: `Aktivita pre sústredenie`,
        restActivity: `Aktivita pre oddych`,
    },
    history: {
        recordActivityToHistory: `Zaznamenať aktivitu do histórie`,
        lengthNotSet: `Nebola zadaná dĺžka`,
        toHistory: `Do histórie`,
    },
    filter: {
        title: `Filter`,
        apply: `Použiť filter`,
    },
    authorization: {
        logOut: `Odhlásiť sa`,
        logIn: `Prihlásiť sa`,
        wrongEmailOrPassword: `Nesprávny email alebo heslo`,
        emailConfirmationNeeded: `Pred pokračovaním musíte potvrdiť e-mailovú adresu`,

        emailConfirmed: `Váš email bol úspešne potvrdený, môžete pokračovať`,
        errorConfirmingEmail: `Chyba pri potvrdení e-mailu, skúste to prosím znova`,
        resendConfirmationEmail: `Opätovne odoslať potvrdzovací email`,
        confirmationEmailResent: `Potvrdzovací email bol opätovne odoslaný na vašu emailovú adresu. Skontrolujte svoju schránku a kliknite na odkaz v emaile, aby ste potvrdili svoju adresu. Toto okno môžete zavrieť.`,

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
    toDoList: {
        add: 'Pridať',
        toDoList: 'To-do list',
        priority: `Priorita`,
        changeOrder: `Zmena poradia`,
        timePeriod: `Časový úsek`,
        saveTask: `Zaznamenať dokončenie úlohy`,
        quickCreateToDoListActivity: `Rýchle vytvorenie aktivity s roľou to-do úloha`,
        quickEditToDoListActivity: `Rýchla úprava aktivity`,
        namedList: {
            lists: `To-do zoznamy`,
            categories: `Kategórie`,
            add: `Nový zoznam`,
            icon: `Ikona`,
            description: `Popis`,
            category: `Kategória`,
            empty: `Žiadne zoznamy`,
            deleteConfirm: `Vymazať zoznam?`,
            selectCategory: `Vyberte kategóriu`,
        },
        category: {
            add: `Nová kategória`,
            deleteConfirm: `Vymazať kategóriu?`,
        },
    },
    routineTodoList: {
        routineTodoList: 'Routine to-do list',
        urgency: `Naliehavosť`,
        timePeriod: `Časový úsek`,
        saveTask: `Zaznamenať dokončenie úlohy`,
        quickCreateRoutineToDoListActivity: `Rýchle vytvorenie aktivity s roľou rutinná úloha`,
        quickEditToDoListActivity: `Rýchla úprava aktivity`,
    },
    user: {
        userSettings: `Uživateľské nastavenia`,
        changePassword: `Zmeniť heslo`,
        passwordChange: `Zmena hesla`,

        password: `Heslo`,
        confirmPassword: `Potvrďte heslo`,


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
        emailCantBeSame: `Emaily sa nemôžu zhodovať`,
        emailChangedSuccessfully: `Email bol úspešne zmenený`,
        signOutWarning: `Upozornenie: {subject} vás odhlási zo všetkých zariadení z bezpečnostných dôvodov`,
        enablingTwoFactorAuth: `Zapnutie 2FA`,
    },
    successFeedback: {
        added: `Pridané`,
        edited: `Upravené`,
        deleted: `Vymazané`,
    },
    planner: {
        task: `Aktivita`,
        quickCreatePlannerActivity: `Rýchle vytvorenie aktivity v plánovači`,
        quickEditPlannerActivity: `Rýchla úprava aktivity`,
        importance: `Dôležitosť`,
        ignore: `Ignorovať`,
        overwrite: `Prepísať`,
        mergeIgnore: `Zlúčiť a ignorovať`,
        mergeOverwrite: `Zlúčiť a prepísať`,
        status: {
            notStarted: `Nezačaté`,
            inProgress: `Prebieha`,
            onHold: `Pozastavené`,
            completed: `Dokončené`,
            cancelled: `Zrušené`,
        },
    }
}
export default SK;