const en = {
    $vuetify: {
        badge: `Badge`,
        open: `Open`,
        close: `Close`,
        dataIterator: {
            noResultsText: `No matching records found`,
            loadingText: `Loading items...`
        },
        dataTable: {
            itemsPerPageText: `Rows per page:`,
            ariaLabel: {
                sortDescending: `Sorted descending.`,
                sortAscending: `Sorted ascending.`,
                sortNone: `Not sorted.`,
                activateNone: `Activate to remove sorting.`,
                activateDescending: `Activate to sort descending.`,
                activateAscending: `Activate to sort ascending.`
            },
            sortBy: `Sort by`
        },
        dataFooter: {
            itemsPerPageText: `Items per page:`,
            itemsPerPageAll: `All`,
            nextPage: `Next page`,
            prevPage: `Previous page`,
            firstPage: `First page`,
            lastPage: `Last page`,
            pageText: `{0}-{1} of {2}`
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
        noDataText: `No data available`,
        carousel: {
            prev: `Previous visual`,
            next: `Next visual`,
            ariaLabel: {
                delimiter: `Carousel slide {0} of {1}`
            }
        },
        calendar: {
            moreEvents: `{0} more`
        },
        input: {
            clear: `Clear {0}`,
            prependAction: `{0} prepended action`,
            appendAction: `{0} appended action`,
            otp: `Please enter OTP character {0}`
        },
        fileInput: {
            counter: `{0} files`,
            counterSize: `{0} files ({1} in total)`
        },
        timePicker: {
            am: `AM`,
            pm: `PM`
        },
        pagination: {
            ariaLabel: {
                root: `Pagination Navigation`,
                next: `Next page`,
                previous: `Previous page`,
                page: `Go to page {0}`,
                currentPage: `Page {0}, Current page`,
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
                item: `Rating {0} of {1}`
            }
        },
        loading: `Loading...`,
        infiniteScroll: {
            loadMore: `Load more`,
            empty: `No more`
        }
    },   
    navigation:{
        home: `Home`,
        history: `History`,
        createNewActivity: `Create new kind of activity`,
        toDoList: `To-do list`,
        addActivityManually: `Add activity to history`,
        stopwatch: `Stopwatch`,
        timer: `Timer`,
        alarm: `Alarm`,
    },
    general: {
        or: `Or`,
        please: `Please`,
        close: `Close`,
        create: `Create`,
        filter: `Filter`,
        send: `Send`,
        save: `Save`,
        cancel: `Cancel`,
        edit: `Edit`,
        add: `Add`,
        iAgreeTo: 'I agree to the',
        name: `Name`,
        text: `Text`,
        continue: `Continue`,
        done: `Done`,

    },
    dateTime:{
        when: `When`,
        length: `Length`,
        date: `Date`,
        year: `Year`,
        month: `Month`,
        day: `Day`,
        hour: `Hour`,
        minute: `Minute`,
        second: `Second`,
        dateFrom: `Date from`,
        dateTo: `Date to`,
        howManyHoursBack: `How many hours back`,
        dateRange: `Date range`,
        hoursBack: `Hours back`,
    },    
    activities:{
        role: `Role`,
        category: `Category`,
        activity: `Activity`,
        activityDescription: `Activity description`,
        isActivityUnavoidable: `Is activity unavoidable`,
        placeOnToDoList: `Place on to-do list`,
        //===============================
        fromToDoList: `From to-do list`,
        createNewActivity: `Create new activity`,
        addActivityToHistory: `Add activity to history`,
        start: `Start`,
        pause: `Pause`,
        stop: `Stop`,
        saveActivity: `Save activity`,
        //=========
        enableNotificationsInWindows: `In windows, go to Settings > System > Notifications & Actions > In Get notification and actions from these sender section select Google chrome.`,
    },   
    authorization: {
        logOut: `Log out`,
        logIn: `Log in`,
        login: `Login`,
        goToLogin: `Go to login page`,
        register: `Register`,
        registration: `Registration`,
        password: `Password`,
        forgotPassword: `Forgot password?`,
        enterEmailToResetPassword: `Enter your email to which a temporary password will be sent`,
        resetPassword: `Reset password`,
        temporarryPasswordSent: `To your email, we've sent a temporary password which you can use to log in and then change to your desired one`,
        passwordReset: `Password reset`,

        email: `Email`,
        // username: `Username`,
        // usernameOrEmail: `@:authorization.username / @:authorization.email`,
        name: `Name`,
        surname: `Surname`,
        continueWithGoogle: `Continue with google`,
        dontHaveAccountYet: `Don't have an account yet`,

        // usernameOrEmailRequired: 'Username or Email is required',
        emailRequired: 'Email is required',
        invalidEmail: 'Invalid email format',
        emailNotFound: `The user with this email doesn't exist.`,
        // usernameRequired: 'Username is required',
        // invalidUsername: 'Username can only include letters, numbers, underscores(_), dots(.) or hyphens(-)',
        passwordRequired: 'Password is required',
        invalidPasswordLength: 'Password must be at least 8 characters long',
        invalidPassword: 'Password must contain at least 2 lowercase letters, 2 uppercase letters, 3 numbers and 1 special character',
        nameRequired: 'Name is required', 
        invalidName: 'Name can only contain letters or spaces',
        surnameRequired: 'Surname is required',
        invalidSurname: 'Surname can only contain letters or spaces',

        stayLoggedIn: 'Stay logged in?',
        termsAndConditions: 'Terms and conditions',
        termsAndConditionsRequired: `Must accept before proceeding`,
        use2FASetup: 'Do you want to use google 2 factor authentication?',
        scan2FAQrCode: `Scan the QR code in your authentication app (Google Authenticator)`,
        twoFA: `Two factor authentication`,
        code: `Code`,
        code2FA: `Code from your authenticator application (Google Authenticator)`,
        verifyYour2FA: `Verify your two factor authentication`,
    },
    toDoList:{
        add: 'Add',
        toDoList: 'To-do list',
        urgency: `Urgency`,
    },
    user: {
        userSettings: `User settings`,
        changePassword: `Change password`,
        deleteAccount: `Delete account`,
        newPassword: `New password`,
        confirmNewPassword: `Confirm new password`,
        passwordChange: `Password change`,
        use2FA: `Use two-factor authentication`,
        toContinueEnterPassword: `To continue enter your password`,
        show2FAQrCode: `Show 2FA qr code`,
    }
}
export default en