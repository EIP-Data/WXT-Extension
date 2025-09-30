import i18n from "@/utils/i18n";

export default defineBackground(() => {
    // Store connections from popups
    const popupConnections = new Set();

    // Handle connections from popup
    browser.runtime.onConnect.addListener((port) => {
        if (port.name === 'popup') {
            popupConnections.add(port);
            port.onDisconnect.addListener(() => {
                popupConnections.delete(port);
            });
        }
    });

    browser.runtime.onMessage.addListener(
        async (message: { action: string; data: any }) => {
            if (message.action === 'saveInteractionData') {
                const record = {
                    ...message.data,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                };

                // Store in local storage for persistence
                await browser.storage.local.set({ interactionData: record });

                // Notify all connected popups
                popupConnections.forEach(port => {
                    port.postMessage({
                        type: 'interactionDataUpdated',
                        data: record
                    });
                });

                console.log('Received interaction data:', record);
                return { success: true };
            }

            // Handle request from popup to get the latest data
            if (message.action === 'getInteractionData') {
                const data = await browser.storage.local.get('interactionData');
                return { data: data.interactionData || null };
            }

            console.warn('Unknown message:', message);
        }
    );
});
