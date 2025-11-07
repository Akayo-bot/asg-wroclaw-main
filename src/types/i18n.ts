export type Language = 'uk' | 'ru' | 'pl' | 'en';

export interface LanguageOption {
    code: Language;
    name: string;
    flag: string;
}

export interface NavigationItem {
    label: string;
    path: string;
}

export interface Translations {
    nav: {
        home: string;
        home_desc: string;
        games: string;
        team: string;
        gallery: string;
        articles: string;
        contacts: string;
        about: string;
        search: string;
        subscribe: string;
    };
    games: {
        title: string;
        subtitle: string;
        registration_closed: string;
        join_waitlist: string;
        register: string;
        no_upcoming: string;
        cta: {
            question: string;
            contact: string;
        };
        status: {
            cancelled: string;
            waitlist: string;
            full: string;
            open: string;
        };
    };
    admin: {
        title: string;
        dashboard: string;
        dashboardSubtitle: string;
        articles: string;
        gallery: string;
        events: string;
        team: string;
        users: string;
        statistics: string;
        settings: string;
        manageArticles: string;
        createArticle: string;
        editArticle: string;
        backToArticles: string;
        saveDraft: string;
        publish: string;
        published: string;
        drafts: string;
        allStatuses: string;
        allCategories: string;
        confirmDeleteArticle: string;
        articleDeleted: string;
        articleCreated: string;
        articleUpdated: string;
        errorFetchingArticles: string;
        errorFetchingArticle: string;
        errorDeletingArticle: string;
        errorSavingArticle: string;
        noArticlesFound: string;
        articleTitle: string;
        preview: string;
        content: string;
        category: string;
        mainImageUrl: string;
        articleSettings: string;
        articleTitlePlaceholder: string;
        articlePreviewPlaceholder: string;
        imageUrl: string;
        youtubeUrl: string;
        addImage: string;
        addVideo: string;
        totalArticles: string;
        totalUsers: string;
        totalEvents: string;
        totalRegistrations: string;
        galleryItems: string;
        teamMembers: string;
        admins: string;
        editors: string;
        upcoming: string;
        completed: string;
        eventRegistrations: string;
        photosAndVideos: string;
        activeMembers: string;
        quickActions: string;
        createEvent: string;
        systemInfo: string;
        databaseStatus: string;
        online: string;
        lastBackup: string;
        automated: string;
        save: string;
        cancel: string;
        unpublish: string;
        free: string;
        unlimited: string;
        registrationOpen: string;
        registrationClosed: string;
        waitlist: string;
        currency: string;
        noArticles: string;
        noGallery: string;
    };
    categories: {
        tactics: string;
        equipment: string;
        news: string;
        gameReports: string;
        rules: string;
    };
    common: {
        readMore: string;
        loadMore: string;
        loading: string;
        error: string;
        notFound: string;
        back: string;
        next: string;
        previous: string;
        home: string;
        register: string;
        subscribe: string;
        submit: string;
        cancel: string;
        save: string;
        edit: string;
        delete: string;
        view: string;
        share: string;
        download: string;
        success: string;
        continue: string;
        close: string;
        errorOccurred: string;
    };
    hero: {
        title: string;
        subtitle: string;
        cta: string;
        stats: {
            players: string;
            gamesPerYear: string;
            yearsExperience: string;
        };
    };
    auth: {
        login: string;
        register: string;
        logout: string;
        pleaseLogin: string;
        loginDescription: string;
        email: string;
        password: string;
        confirmPassword: string;
        displayName: string;
        resetPassword: string;
        forgotPassword: string;
        googleLogin: string;
        or: string;
        loginSuccess: string;
        registerSuccess: string;
        resetPasswordSuccess: string;
        emailPlaceholder: string;
        passwordPlaceholder: string;
        displayNamePlaceholder: string;
        confirmPasswordPlaceholder: string;
        passwordMismatch: string;
        error: string;
        success: string;
    };
    profile: {
        title: string;
        notLoggedIn: string;
        settings: string;
        displayName: string;
        bio: string;
        language: string;
        notifications: string;
        updateProfile: string;
        updateSuccess: string;
        updateError: string;
        memberSince: string;
        favoriteItems: string;
        testResults: string;
        gameHistory: string;
        noFavorites: string;
        noTestResults: string;
        noGameHistory: string;
        displayNamePlaceholder: string;
        bioPlaceholder: string;
        notificationsDescription: string;
        score: string;
        security: string;
        changePassword: string;
        newPassword: string;
        confirmPassword: string;
        changePasswordDescription: string;
        passwordChanged: string;
        email: {
            verified: string;
            notVerified: string;
            pleaseVerify: string;
            resend: string;
            change: string;
            changeTitle: string;
            passwordDesc: string;
            newEmailDesc: string;
            verificationDesc: string;
            currentPassword: string;
            enterPassword: string;
            current: string;
            new: string;
            enterNewEmail: string;
            sendVerification: string;
            verificationSent: string;
            checkInbox: string;
            afterVerification: string;
            verificationSentTitle: string;
            verificationSentDesc: string;
            changeSuccessTitle: string;
            changeSuccessDesc: string;
            wrongPassword: string;
            invalidEmail: string;
            sameEmail: string;
        };
        avatar: {
            title: string;
            description: string;
            uploadFile: string;
            uploadUrl: string;
            dropZone: string;
            maxSize: string;
            enterUrl: string;
            load: string;
            save: string;
            remove: string;
            cropTitle: string;
            scale: string;
            zoom: string;
            rotation: string;
            dragHint: string;
            circleHint: string;
            bucketError: string;
            initializingStorage: string;
            uploading: string;
            uploadSuccess: string;
            uploadError: string;
            removeSuccess: string;
            removeError: string;
            errorInvalidType: string;
            errorTooLarge: string;
            errorTooSmall: string;
            errorEmptyUrl: string;
            errorLoadUrl: string;
            selectImage: string;
            preview: string;
            change: string;
            noCroppedImage: string;
        };
        tabs: {
            profile: string;
            preferences: string;
            activity: string;
            security: string;
            info: string;
            favorites: string;
            tests: string;
            games: string;
        };
        saving: string;
        resetChanges: string;
        displayNameHint: string;
        bioHint: string;
        bioCharacters: string;
        displayNameTooShort: string;
        displayNameTooLong: string;
        displayNameInvalid: string;
        bioTooLong: string;
        saved: string;
        changesDetected: string;
        personalInfo: string;
        languageDescription: string;
        accountInfo: string;
        lastUpdate: string;
        role: string;
        savePreferences: string;
        preferences: string;
        roles: {
            admin: string;
            editor: string;
            user: string;
        };
        statuses: {
            pending: string;
            approved: string;
            rejected: string;
            cancelled: string;
        };
    };
    pages: {
        games: {
            title: string;
            subtitle: string;
            noGames: string;
            filters: {
                all: string;
                upcoming: string;
                past: string;
                registration: string;
            };
        };
        team: {
            title: string;
            subtitle: string;
            noMembers: string;
        };
        gallery: {
            title: string;
            subtitle: string;
            noMedia: string;
            filters: {
                all: string;
                photos: string;
                videos: string;
            };
        };
        articles: {
            title: string;
            subtitle: string;
            noArticles: string;
            featured: string;
            categories: {
                all: string;
                tactics: string;
                equipment: string;
                news: string;
                guides: string;
            };
        };
        contacts: {
            title: string;
            subtitle: string;
            form: {
                name: string;
                email: string;
                phone: string;
                message: string;
                submit: string;
                success: string;
                error: string;
            };
            info: {
                phone: string;
                email: string;
                location: string;
                hours: string;
            };
        };
        about: {
            title: string;
            subtitle: string;
            mission: string;
            history: string;
            goals: string;
        };
        search: {
            title: string;
            placeholder: string;
            noResults: string;
            results: string;
        };
        subscribe: {
            title: string;
            subtitle: string;
            email: string;
            submit: string;
            success: string;
            error: string;
        };
    };
    errors: {
        unauthorized: string;
        serverError: string;
        insufficientPermissions: string;
        adminAccessRequired: string;
        passwordMismatch: string;
        passwordTooShort: string;
        passwordChangeError: string;
    };
}