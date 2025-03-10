export default defineContentScript({
    matches: ['<all_urls>'],
    main() {
        const interactionData = {
            scrollDepth: 0,
            clickedElements: [] as Array<{ element: string, text: string }>,
            formInputs: [] as Array<{ name: string, value: string }>,
            activeDuration: 0
        };

        // Throttle function for performance
        const throttle = (fn: Function, delay: number) => {
            let lastCall = 0;
            return (...args: any[]) => {
                const now = Date.now();
                if (now - lastCall < delay) return;
                lastCall = now;
                fn(...args);
            };
        };

        // Track scrolling
        const handleScroll = throttle(() => {
            const scrollHeight = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
            );
            const currentScroll = window.scrollY + window.innerHeight;
            interactionData.scrollDepth = Math.round(
                (currentScroll / scrollHeight) * 100
            );
        }, 500);

        // Track clicks
        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            interactionData.clickedElements.push({
                element: target.tagName.toLowerCase(),
                text: target.textContent?.trim() || ''
            });
        };

        // Track form inputs
        const observeForms = () => {
            document.querySelectorAll('input, textarea, select').forEach(el => {
                el.addEventListener('input', throttle((event: Event) => {
                    const target = event.target as HTMLInputElement;
                    interactionData.formInputs.push({
                        name: target.name || target.id,
                        value: target.value
                    });
                }, 1000));
            });
        };

        // Track active time
        let lastActive = Date.now();
        document.addEventListener('mousemove', throttle(() => {
            const now = Date.now();
            interactionData.activeDuration += now - lastActive;
            lastActive = now;
        }, 1000));

        // Capture dynamic content
        const observer = new MutationObserver(throttle((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    observeForms();
                }
            });
        }, 1000));

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });

        // Start tracking
        window.addEventListener('scroll', handleScroll);
        document.addEventListener('click', handleClick);
        observeForms();

        // Send data on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                browser.runtime.sendMessage({
                    action: 'saveInteractionData',
                    data: {
                        ...interactionData,
                        ...collectPageContent()
                    }
                });
            }
        });

        function collectPageContent() {
            return {
                title: document.title,
                url: location.href,
                textContent: sanitizeContent(document.body.textContent || ''),
                metadata: {
                    scripts: Array.from(document.scripts).map(s => s.src),
                    images: Array.from(document.images).map(img => img.src)
                }
            };
        }

        // Sanitize sensitive data
        function sanitizeContent(text: string) {
            return text
                .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
                .replace(/\b\d{16}\b/g, '[CREDIT_CARD]')
                .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
        }
    }
});
