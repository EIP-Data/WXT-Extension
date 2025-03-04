import i18n from "@/utils/i18n";

export default defineBackground(() => {
    browser.runtime.onMessage.addListener(
        async (message: { action: string; data: any }) => {
            if (message.action === 'saveInteractionData') {
                const record = {
                    ...message.data,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                };
                // Add storage/processing logic here
                console.log('Received interaction data:', record);
                return { success: true };
            }
            console.warn('Unknown message:', message);
        }
    );
});
