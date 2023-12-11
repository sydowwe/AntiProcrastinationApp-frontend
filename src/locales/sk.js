const sk = {
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
        createNewActivity: `Vytvoriť nový druh aktivity`,
        history: `História`,
        addActivityManually: `Pridať aktivitu do histórie`,
        stopwatch: `Stopky`,
        timer: `Časovač`,
        alarm: `Alarm`,
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
    },
    dateTime:{
        when: `Kedy`,
        length: `Dĺžka`,
        date: `Dátum`,
        year: `Rok`,
        month: `Mesiac`,
        day: `Deň`,
        hour: `Hodina`,
        minute: `Minúta`,
        second: `Sekunda`,
        dateFrom: `Dátum od`,
        howManyHoursBack: `Koľko hodín späť`
    }, 
    activities:{
        role: `Role`,
        category: `Kategória`,
        activity: `Aktivita`,
        activityDescription: `Popis aktivity`,
        isActivityUnavoidable: `Je aktivita nevyhnutná`,
        placeOnToDoList: `Pridať na to-do list`,
        //===============================
        fromToDoList: `Je z to-do listu`,
        createNewActivity: `Vytvoriť novú aktivity`,
        addActivityToHistory: `Pridať aktivitu do histórie`,
        start: `Začať`,
        pause: `Pozastaviť`,
        stop: `Ukončiť`,
        //=========

    },
    authorization: {
        logOut: `Odhlásiť sa`,
        logIn: `Prihlásiť sa`,
        login: `Prihlásenie`,
        goToLogin: `Prejsť na prihlásenie`,
        register: `Registrovať sa`,
        registration: `Registrácia`,
        forgotPassword: `Zabudli ste heslo?`,
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
        use2FA: 'Prajete si pridať google dvojfaktorové overenie?',
        scan2FAQrCode: `Naskenujte QR kód vo vašej overovacej aplikácii (Google authenicator)`,
        twoFA: `Dvojfaktorové overenie`,
        code: `Kód`,
        code2FA: `Kód z vašej overovacej aplikácie (Google Authenticator)`,
    },
    toDoList:{
        add: 'Pridať',
        toDoList: 'To-do list',
        urgency: `Naliehavosť`,
    }
}
export default sk;