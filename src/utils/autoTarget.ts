// Auto-target utility for TargetCursor
export const autoTargetInteractiveElements = () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || !document) {
        console.log('autoTarget: Not in browser environment');
        return () => { }; // Return empty cleanup function
    }

    // Check if mobile device - don't run on mobile
    const isMobileDevice = () => {
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth < 768;
        const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const noHover = window.matchMedia('(hover: none)').matches;
        return hasTouch || isSmallScreen || isCoarsePointer || noHover;
    };

    if (isMobileDevice()) {
        console.log('autoTarget: Mobile device detected, skipping...');
        return () => { }; // Return empty cleanup function
    }

    console.log('autoTarget: Starting...');

    // Selectors for ONLY truly interactive elements (buttons, inputs, links)
    const interactiveSelectors = [
        // Buttons and button-like elements
        'button',
        'a[href]', // Only links with href
        '[role="button"]',

        // Interactive form inputs ONLY
        'input[type="button"]',
        'input[type="submit"]',
        'input[type="reset"]',
        'input[type="checkbox"]',
        'input[type="radio"]',
        'input[type="file"]',
        'input[type="range"]',
        'input[type="date"]',
        'input[type="time"]',
        'input[type="datetime-local"]',
        'input[type="color"]',
        'input[type="text"]',
        'input[type="email"]',
        'input[type="password"]',
        'input[type="search"]',
        'input[type="tel"]',
        'input[type="url"]',
        'input[type="number"]',
        'input:not([type])', // Default input type is text
        'select',
        'textarea',

        // Elements with explicit click handlers (but filter out cards/divs later)
        'button[onclick]',
        'a[onclick]',

        // Radix UI interactive TRIGGERS only (not content/items)
        'button[data-radix-popover-trigger]',
        'button[data-radix-dialog-trigger]',
        'button[data-radix-accordion-trigger]',
        'button[data-radix-tabs-trigger]',
        'button[data-radix-tooltip-trigger]',
        'button[data-radix-hover-card-trigger]',
        'button[data-radix-dropdown-menu-trigger]',
        'button[data-radix-context-menu-trigger]',
        'button[data-radix-menubar-trigger]',
        'button[data-radix-navigation-menu-trigger]',

        // Radix UI menu items (these are interactive)
        '[role="menuitem"]',
        '[data-radix-dropdown-menu-item]',
        '[data-radix-context-menu-item]',
        '[data-radix-menubar-item]',
        '[data-radix-select-item]',

        // Button-like classes (common naming patterns)
        '.btn',
        '.button',
        '[class*="btn-"]',
        '[class*="button-"]',

        // Only elements with tabindex that are actually buttons/links
        'button[tabindex]',
        'a[tabindex]',
        'input[tabindex]',
        'select[tabindex]',
        'textarea[tabindex]',
        '[role="button"][tabindex]',

        // Special selectors for logout/auth buttons
        '[data-logout-button]',
        '[data-auth-tab]',
        'button[aria-label*="logout"]',
        'button[aria-label*="signout"]',
        'a[aria-label*="logout"]',
        'a[aria-label*="signout"]'
    ];

    // Function to add cursor-target class
    const addCursorTargetClass = (element: Element) => {
        if (!element.classList.contains('cursor-target')) {
            element.classList.add('cursor-target');
        }
    };

    // Function to process elements
    const processElements = () => {
        interactiveSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(addCursorTargetClass);
            } catch (error) {
                console.warn('Invalid selector:', selector, error);
            }
        });

        // Special handling for logout buttons with text (only actual buttons and links)
        const allButtons = document.querySelectorAll('button, a[href]');
        allButtons.forEach(element => {
            const text = element.textContent?.toLowerCase() || '';
            if (text.includes('logout') || text.includes('sign out') || text.includes('выйти') || text.includes('выход')) {
                addCursorTargetClass(element);
            }
        });
    };

    // Initial processing
    processElements();

    // Set up MutationObserver to handle dynamically added elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;

                        // Check if the added element matches any selector
                        interactiveSelectors.forEach(selector => {
                            try {
                                if (element.matches && element.matches(selector)) {
                                    addCursorTargetClass(element);
                                }
                            } catch (error) {
                                // Игнорируем ошибки для недействительных селекторов
                            }
                        });

                        // Check children of added element
                        interactiveSelectors.forEach(selector => {
                            try {
                                const children = element.querySelectorAll(selector);
                                children.forEach(addCursorTargetClass);
                            } catch (error) {
                                // Игнорируем ошибки для недействительных селекторов
                            }
                        });

                        // Special handling for logout buttons (only buttons and links)
                        if ((element.tagName === 'BUTTON' || (element.tagName === 'A' && element.hasAttribute('href'))) && element.textContent) {
                            const text = element.textContent.toLowerCase();
                            if (text.includes('logout') || text.includes('sign out') ||
                                text.includes('выйти') || text.includes('выход')) {
                                addCursorTargetClass(element);
                            }
                        }
                    }
                });
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
    });

    console.log('autoTarget: Observer started');

    // Return cleanup function
    return () => {
        observer.disconnect();
        console.log('autoTarget: Observer disconnected');
    };
};

// Auto-initialize disabled - will be called manually from Layout
